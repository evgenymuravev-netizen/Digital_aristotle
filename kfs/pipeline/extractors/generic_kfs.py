"""
generic_kfs.py — the heuristic, label-driven KFS field parser. THE IMPORTANT ONE.

WHAT IT DOES
------------
Given the PLAIN TEXT of a Key Facts Statement, it pulls out the standardized fields
the CBUAE mandates every bank disclose, and the reward/cashback structure, into a
partial normalized record (kfs/data/schema.json shape) plus a `confidence` and
`provenance_notes`.

It does NOT fetch, does NOT know PDF vs HTML, and depends only on the stdlib +
normalize.py. That isolation is what makes it testable against fixtures.

HOW IT WORKS (and why it's heuristic, not a parser)
---------------------------------------------------
A KFS is semi-structured prose, not a machine format. Two ideas carry the load:

  1. LABEL PROXIMITY. Each field has a set of label patterns ("Annual Fee",
     "Membership Fee", "Profit Rate", "Interest Rate (Monthly)", "Foreign Currency
     Transaction Fee", ...). We find the label, then read the VALUE that sits on
     the same line (or, failing that, the next non-empty line) and run it through
     normalize.parse_aed / parse_pct. The CBUAE late-fee cap (AED 230) and
     over-limit cap (AED 273.50) double as sanity anchors.

  2. CASHBACK LINE MINING. Reward lines look like
        "5% cashback on supermarket spends (up to AED 200 per month)"
        "3% on dining"  /  "1% on non-AED transactions"
        "Minimum spend AED 3,000"
     We scan for "<n>% ... <category-word> ... [up to AED <cap>]" and map the
     category word to a canonical key via normalize.map_category. A standalone
     "minimum spend AED X" sets the reward earn-gate; "non-AED" / "foreign"
     becomes the schema's pseudo-category 'international'.

Because both ideas are best-effort, every record is stamped with a `confidence`
(high/medium/low) derived from how many core fields were actually recovered, and
`provenance_notes` listing what was found vs defaulted. THIS OUTPUT IS A DRAFT FOR
A HUMAN TO VERIFY — see README "Known limitations".

LIMITS (documented honestly)
----------------------------
  * Multi-card consolidated PDFs (e.g. FAB) flatten to one text blob; this parser
    extracts ONE record (the dominant/first card) unless a bank adapter splits the
    text into per-card chunks first. `split_cards()` offers a crude splitter.
  * Tables that rely on column geometry lose their row/column association once
    flattened to text; numbers can attach to the wrong label. Per-bank adapters
    exist precisely to add layout hints for these cases.
  * "Up to X%" ranges are captured as X (the headline), which can overstate the
    typical earned rate — flagged in provenance.
"""

from __future__ import annotations

import os
import re
import sys
from typing import Optional

# Allow running both as a package module and as a loose script.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import normalize  # noqa: E402
from base import BaseExtractor, register  # noqa: E402

# --------------------------------------------------------------------------- #
# Field label tables.  Each entry: (compiled label regex, parser, dotted-path).
# The label regex matches the LABEL; we then read the value near it.
# --------------------------------------------------------------------------- #
_AED = normalize.parse_aed
_PCT = normalize.parse_pct


def _rx(pattern: str) -> re.Pattern:
    return re.compile(pattern, re.IGNORECASE)


# Scalar fee/eligibility fields: label -> (regex, parser, path-in-record).
# `path` uses dotted keys into the partial record we build.
_FIELD_LABELS: list[tuple[re.Pattern, object, str]] = [
    # --- eligibility ---
    (_rx(r"minimum\s+(?:monthly\s+)?(?:salary|income)"), _AED, "eligibility.min_monthly_income_aed"),
    (_rx(r"minimum\s+age"), _AED, "eligibility.min_age"),
    # --- annual fee ---
    (_rx(r"(?:annual|membership|primary\s+card)\s+(?:membership\s+)?fee"), _AED, "fees.annual_fee_aed"),
    (_rx(r"\bjoining\s+fee\b"), _AED, "fees.annual_fee_aed"),
    # --- interest / profit ---
    (_rx(r"(?:monthly\s+(?:interest|profit)\s+rate|interest\s+rate\s*\(?\s*monthly|profit\s+rate\s*\(?\s*monthly)"),
     _PCT, "fees.interest.monthly_rate_pct"),
    (_rx(r"\b(?:apr|annual\s+percentage\s+rate|effective\s+(?:annual\s+)?rate|annualised\s+(?:interest|profit)\s+rate)\b"),
     _PCT, "fees.interest.apr_pct"),
    # --- FX / non-AED markup ---
    (_rx(r"(?:foreign\s+currency|non[-\s]?aed|foreign\s+exchange|fx|international|overseas)\s+(?:transaction\s+)?(?:fee|mark[-\s]?up|markup|charge)"),
     _PCT, "fees.fx_markup_pct"),
    (_rx(r"mark[-\s]?up\s+(?:fee|on\s+(?:foreign|non[-\s]?aed))"), _PCT, "fees.fx_markup_pct"),
    # --- cash advance ---
    (_rx(r"cash\s+(?:advance|withdrawal)\s+(?:fee|charge)"), _AED, "fees.cash_advance_fee_pct"),
    # --- late payment (CBUAE cap AED 230) ---
    (_rx(r"late\s+payment\s+(?:fee|charge)"), _AED, "fees.late_payment_fee_aed"),
    # --- over limit (CBUAE cap AED 273.50) ---
    (_rx(r"over[-\s]?limit\s+(?:fee|charge)"), _AED, "fees.over_limit_fee_aed"),
    # --- minimum payment % ---
    (_rx(r"minimum\s+(?:amount\s+due|payment|monthly\s+payment)"), _PCT, "fees.min_payment_pct"),
]

# Cash-advance is usually a PERCENT ("3% or AED 99, whichever higher"); when the
# value near the label parses as a percent we also keep it. Handled specially below.

# Reward-line patterns -------------------------------------------------------- #
# "<rate>% [cashback] on/for <stuff> (up to AED <cap> [per month])"
_REWARD_LINE = _rx(
    r"(?P<rate>\d{1,2}(?:\.\d+)?)\s*%\s*"
    r"(?:cash\s*back|cashback|rewards?|back)?\s*"
    r"(?:on|for|across|in|—|-|:)?\s*"
    r"(?P<body>[^.\n;]*)"
)
# A cap appearing anywhere in a reward line: "up to AED 200", "capped at AED 200",
# "max AED 200", "AED 200 per month".
_CAP_RE = _rx(r"(?:up\s*to|capped\s*at|max(?:imum)?\.?|maximum\s+of)\s*(?:aed|dhs)?\s*([\d,]+(?:\.\d+)?)")
_CAP_PERMONTH_RE = _rx(r"(?:aed|dhs)\s*([\d,]+(?:\.\d+)?)\s*(?:/|per\s*)\s*month")

# Earn gate: "minimum spend AED 3,000", "spend at least AED 3,000 to earn".
_MIN_SPEND_RE = _rx(r"(?:minimum\s+(?:monthly\s+)?spend|spend\s+(?:of\s+)?at\s+least|min(?:imum)?\.?\s+spend)\s*(?:of\s*)?(?:aed|dhs)?\s*([\d,]+(?:\.\d+)?)")
# Overall monthly cashback ceiling: "maximum cashback AED 1,000 per month".
_OVERALL_CAP_RE = _rx(r"(?:total|maximum|overall)\s+cash\s*back[^.\n]*?(?:aed|dhs)\s*([\d,]+(?:\.\d+)?)")


def _read_value_near(lines: list[str], idx: int, label_match: re.Match, parser) -> Optional[float]:
    """Read+parse the value associated with a label found on line `idx`.

    Strategy: prefer the text AFTER the label on the same line; if that yields
    nothing, look at the next up-to-2 non-empty lines (covers label-on-its-own-row
    table layouts). `parser` is parse_aed or parse_pct.
    """
    line = lines[idx]
    after = line[label_match.end():]
    val = parser(after)
    if val is not None:
        return val
    # also try the whole line (covers "AED 300 Annual Fee" ordering)
    val = parser(line[:label_match.start()])
    if val is not None:
        return val
    for j in range(idx + 1, min(idx + 3, len(lines))):
        nxt = lines[j].strip()
        if not nxt:
            continue
        val = parser(nxt)
        if val is not None:
            return val
        break  # first non-empty line only, then give up
    return None


def _set_path(rec: dict, path: str, value) -> None:
    """Set a dotted path into a nested dict, creating intermediate dicts."""
    if value is None:
        return
    keys = path.split(".")
    d = rec
    for k in keys[:-1]:
        d = d.setdefault(k, {})
    # don't overwrite a value we already captured (first hit wins, usually the
    # primary-card column in a consolidated doc)
    if keys[-1] not in d or d[keys[-1]] is None:
        d[keys[-1]] = value


# --------------------------------------------------------------------------- #
# Reward extraction
# --------------------------------------------------------------------------- #
def extract_rewards(text: str) -> dict:
    """Mine cashback/reward tiers, the earn gate, and the overall cap from text.

    Returns a partial `rewards` dict: {kind, tiers[], min_spend_to_earn_aed?,
    monthly_cashback_cap_aed?}. Each tier is {category, rate_pct, monthly_cap_aed?}.
    De-duplicates by category, keeping the highest rate seen for that category.
    """
    tiers_by_cat: dict[str, dict] = {}
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if "%" not in line:
            continue
        # Skip lines that are clearly FEE/CHARGE disclosures, not reward lines —
        # otherwise an FX markup "non-AED markup: 2.99%" gets mis-read as a 2.99%
        # 'international' cashback tier, and a min-payment "5% of outstanding"
        # gets mis-read as a reward. A line is a reward line only if it talks
        # about earning/cashback/rewards.
        low = line.lower()
        is_fee_line = any(
            w in low for w in ("fee", "markup", "mark-up", "charge",
                               "outstanding", "minimum amount due",
                               "whichever is higher", "per annum", "p.a.")
        )
        is_reward_line = any(
            w in low for w in ("cashback", "cash back", "reward", "earn", "% back", "% on")
        )
        if is_fee_line and not is_reward_line:
            continue
        if not is_reward_line:
            continue
        for m in _REWARD_LINE.finditer(line):
            try:
                rate = float(m.group("rate"))
            except (TypeError, ValueError):
                continue
            if rate <= 0 or rate > 25:  # plausible cashback band; reject APRs etc.
                continue
            body = (m.group("body") or "").strip()
            # The category word may be before the rate too (e.g. "Dining: 3%").
            search_space = body + " " + line
            cat = normalize.map_category(search_space)
            if not cat:
                continue
            # cap: look in the body first, then the whole line
            cap = None
            cm = _CAP_RE.search(body) or _CAP_RE.search(line)
            if cm:
                cap = _AED(cm.group(1))
            else:
                pm = _CAP_PERMONTH_RE.search(line)
                if pm:
                    cap = _AED(pm.group(1))
            existing = tiers_by_cat.get(cat)
            if existing is None or rate > existing["rate_pct"]:
                tier = {"category": cat, "rate_pct": rate}
                if cap is not None:
                    tier["monthly_cap_aed"] = cap
                tiers_by_cat[cat] = tier
            elif cap is not None and "monthly_cap_aed" not in existing:
                existing["monthly_cap_aed"] = cap

    rewards: dict = {"kind": "cashback", "tiers": list(tiers_by_cat.values())}

    mins = _MIN_SPEND_RE.search(text)
    if mins:
        v = _AED(mins.group(1))
        if v is not None:
            rewards["min_spend_to_earn_aed"] = v
    ocap = _OVERALL_CAP_RE.search(text)
    if ocap:
        v = _AED(ocap.group(1))
        if v is not None:
            rewards["monthly_cashback_cap_aed"] = v

    # Points/miles hint flips `kind` (rates then mean points-per-AED downstream).
    low = text.lower()
    if ("miles" in low or "skywards" in low) and not tiers_by_cat:
        rewards["kind"] = "miles"
    elif "reward point" in low and not tiers_by_cat:
        rewards["kind"] = "points"
    return rewards


# --------------------------------------------------------------------------- #
# Scalar field extraction
# --------------------------------------------------------------------------- #
def extract_fields(text: str) -> dict:
    """Pull the scalar fee/eligibility fields via label proximity.

    Returns a partial record with nested `fees`/`eligibility`. Cash-advance is
    handled specially because it is typically a percent with an AED floor.
    """
    lines = text.splitlines()
    rec: dict = {}
    for idx, line in enumerate(lines):
        for label_rx, parser, path in _FIELD_LABELS:
            m = label_rx.search(line)
            if not m:
                continue
            if path == "fees.cash_advance_fee_pct":
                # Try percent first (the headline "3%"), then capture the AED floor.
                pct = _read_value_near(lines, idx, m, _PCT)
                if pct is not None:
                    _set_path(rec, "fees.cash_advance_fee_pct", pct)
                # The floor is the AED-PREFIXED amount ("...or AED 99, whichever
                # higher"); parse_aed alone would grab the leading "3" of "3%",
                # so require an explicit AED/Dhs token before the number. The
                # value may sit on the label's own line (PDF "Label: 3% or AED 99")
                # OR on the next line (HTML table, where label and value are
                # separate <td> cells) — search both.
                floor_rx = re.compile(r"(?:aed|dhs)\s*([\d,]+(?:\.\d+)?)", re.IGNORECASE)
                search_lines = [line[m.end():]]
                for j in range(idx + 1, min(idx + 3, len(lines))):
                    if lines[j].strip():
                        search_lines.append(lines[j])
                        break
                for sl in search_lines:
                    fm = floor_rx.search(sl)
                    if fm:
                        _set_path(rec, "fees.cash_advance_fee_min_aed", _AED(fm.group(1)))
                        break
                continue
            val = _read_value_near(lines, idx, m, parser)
            _set_path(rec, path, val)
    return rec


def _detect_basis_and_islamic(text: str) -> tuple[str, bool]:
    """Infer interest basis (conventional vs Islamic profit) from wording."""
    low = text.lower()
    islamic_markers = ("islamic", "shari", "profit rate", "murabaha", "ujrah", "ijarah")
    if any(mk in low for mk in islamic_markers):
        return "profit", True
    return "conventional", False


def _guess_card_name(text: str, bank: dict) -> Optional[str]:
    """Best-effort card name from a 'Product/Card Name:' line, else None."""
    m = re.search(r"(?:product|card)\s+name\s*[:\-]\s*(.+)", text, re.IGNORECASE)
    if m:
        name = m.group(1).strip().splitlines()[0].strip()
        if 0 < len(name) <= 80:
            return name
    return None


# --------------------------------------------------------------------------- #
# Confidence scoring
# --------------------------------------------------------------------------- #
def _score_confidence(rec: dict) -> tuple[str, list[str]]:
    """Heuristic confidence from how many CORE fields were recovered.

    Core = annual fee, an interest figure, FX markup, min income, >=1 reward tier.
    Returns (confidence, notes-about-what-was-found).
    """
    fees = rec.get("fees", {})
    interest = fees.get("interest", {})
    rewards = rec.get("rewards", {})
    elig = rec.get("eligibility", {})

    found, missing = [], []
    def check(ok: bool, label: str):
        (found if ok else missing).append(label)

    check(fees.get("annual_fee_aed") is not None, "annual_fee")
    check(interest.get("monthly_rate_pct") is not None or interest.get("apr_pct") is not None, "interest")
    check(fees.get("fx_markup_pct") is not None, "fx_markup")
    check(elig.get("min_monthly_income_aed") is not None, "min_income")
    check(bool(rewards.get("tiers")), "reward_tiers")

    n = len(found)
    confidence = "high" if n >= 4 else "medium" if n >= 2 else "low"
    notes = [f"recovered: {', '.join(found) or 'none'}"]
    if missing:
        notes.append(f"defaulted/missing: {', '.join(missing)}")
    return confidence, notes


# --------------------------------------------------------------------------- #
# Public entry points
# --------------------------------------------------------------------------- #
def parse_kfs_text(text: str, bank: dict, hints: Optional[dict] = None) -> dict:
    """Parse one KFS text blob (one card) into a normalized record.

    `hints` (from a bank adapter) may carry: card_name, card_id, card_type,
    network, segment, islamic, source_type, as_of, provenance_extra, plus
    `defaults` (a dict of dotted-path fee fallbacks applied ONLY where extraction
    found nothing — used sparingly, e.g. the CBUAE late/over-limit caps).
    """
    hints = dict(hints or {})
    rec: dict = extract_fields(text)
    rec["rewards"] = extract_rewards(text)

    basis, islamic = _detect_basis_and_islamic(text)
    rec.setdefault("fees", {}).setdefault("interest", {})
    if rec["fees"]["interest"].get("monthly_rate_pct") is not None or \
       rec["fees"]["interest"].get("apr_pct") is not None:
        rec["fees"]["interest"]["basis"] = basis

    # Bank identity + provenance
    rec["bank"] = BaseExtractor.bank_stub(bank)
    name = hints.get("card_name") or _guess_card_name(text, bank) or f"{bank.get('name', 'Card')} Credit Card"
    rec["card_name"] = name
    rec["card_id"] = hints.get("card_id") or f"{bank.get('id', 'bank')}-{normalize._slug(name.split('Credit Card')[0].strip() or 'card')}"
    rec["card_type"] = hints.get("card_type") or ("islamic" if islamic else "cashback")
    if islamic or hints.get("islamic"):
        rec["islamic"] = True
    for opt in ("network", "segment"):
        if hints.get(opt):
            rec[opt] = hints[opt]

    # Apply documented fee defaults (e.g. CBUAE caps) only where nothing was found.
    for path, val in (hints.get("defaults") or {}).items():
        cur = rec
        keys = path.split(".")
        for k in keys[:-1]:
            cur = cur.setdefault(k, {})
        if cur.get(keys[-1]) is None:
            cur[keys[-1]] = val

    confidence, notes = _score_confidence(rec)
    extra = hints.get("provenance_extra")
    if extra:
        notes.append(extra)
    rec["source"] = {
        "source_type": hints.get("source_type", "fixture"),
        "as_of": hints.get("as_of", ""),
        "confidence": confidence,
        "provenance_notes": "Heuristic KFS extraction (generic_kfs). " + "; ".join(notes)
        + ". DRAFT — human verification required before customer-facing use.",
    }
    if bank.get("kfs_url"):
        rec["source"]["kfs_url"] = bank["kfs_url"]

    return normalize.coerce_record(rec)


def split_cards(text: str) -> list[str]:
    """Crudely split a consolidated multi-card KFS into per-card chunks.

    Splits on lines that look like a card header ("=== ... ===", "Card Name:",
    or a run of capitalised words ending in 'Card'/'Credit Card'). Returns the
    whole text as a single chunk if no obvious boundaries are found. This is a
    best-effort aid for consolidated PDFs; bank adapters can override it.
    """
    # Prefer explicit fixture/doc separators.
    if re.search(r"^\s*={3,}", text, re.MULTILINE):
        parts = re.split(r"^\s*={3,}.*$", text, flags=re.MULTILINE)
        chunks = [p.strip() for p in parts if p.strip()]
        if len(chunks) >= 1:
            return chunks
    # Fall back to "Card Name:" headers.
    idxs = [m.start() for m in re.finditer(r"(?im)^\s*(?:product|card)\s+name\s*[:\-]", text)]
    if len(idxs) >= 2:
        idxs.append(len(text))
        return [text[idxs[i]:idxs[i + 1]].strip() for i in range(len(idxs) - 1)]
    return [text.strip()]


# --------------------------------------------------------------------------- #
# Extractor class
# --------------------------------------------------------------------------- #
@register("generic_kfs")
class GenericKfsExtractor(BaseExtractor):
    """Default extractor: treat raw as KFS plain text and parse it.

    If the text looks like a consolidated multi-card document, split it and emit
    one record per chunk; otherwise emit a single record. Bank adapters subclass
    this and supply `hints` / override `card_hints_for_chunk`.
    """

    name = "generic_kfs"
    hints: dict = {}

    def card_hints_for_chunk(self, chunk: str, bank: dict, index: int) -> dict:
        """Per-chunk hints. Base impl returns the class-level hints unchanged."""
        return dict(self.hints)

    def extract(self, raw, bank: dict) -> list[dict]:
        text = self._as_text(raw)
        records = []
        for i, chunk in enumerate(split_cards(text)):
            if not chunk.strip():
                continue
            hints = self.card_hints_for_chunk(chunk, bank, i)
            rec = parse_kfs_text(chunk, bank, hints)
            # Only keep chunks that actually yielded a reward tier OR a fee — a
            # boilerplate header chunk with nothing useful is dropped.
            has_signal = (
                rec["rewards"]["tiers"]
                or rec["fees"]["annual_fee_aed"] is not None
                or rec["fees"]["interest"]["apr_pct"] is not None
                or rec["fees"]["interest"]["monthly_rate_pct"] is not None
            )
            if has_signal:
                records.append(rec)
        return records
