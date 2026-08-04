"""
normalize.py — pure, dependency-free helpers that turn the messy strings found
in a Key Facts Statement into the clean, typed values the schema demands.

WHY THIS EXISTS
---------------
A KFS is written for humans: "AED 1,000", "3.25% per month", "up to 48.07% p.a.",
"non-AED transactions 2.99%". The value engine wants floats: 1000.0, 3.25, 48.07,
2.99. Every extractor funnels its raw captures through the same handful of parsers
here so that (a) "AED 1,000" and "1,000 AED" and "Dhs 1000/-" all collapse to the
same number and (b) the schema contract is enforced in exactly one place
(`coerce_record`). Keeping this module free of regex-heavy field *finding* (that
lives in generic_kfs.py) and free of any I/O makes it trivially unit-testable.

CONVENTIONS (mirroring kfs/data/schema.json):
  * money  -> float AED (currency symbols/codes stripped; thousands separators ok)
  * rates  -> float PERCENT, never a fraction (5.0 == 5%, never 0.05)
  * unknown-> None (never guess; a missing field is honest, a wrong field is not)
"""

from __future__ import annotations

import re
from typing import Optional

# --------------------------------------------------------------------------- #
# Money
# --------------------------------------------------------------------------- #
# Matches an amount possibly wrapped in currency noise: "AED 1,000.50", "Dhs 99/-",
# "1,000 AED", "د.إ 300". We deliberately do NOT match a bare "%number" so that a
# stray percentage never gets read as money.
_AMOUNT_RE = re.compile(
    r"""
    (?<![%\d.])                 # not immediately after a digit/percent/dot
    (?P<num>\d{1,3}(?:,\d{3})+(?:\.\d+)?   # 1,000  or 1,000.50  (grouped)
            |\d+(?:\.\d+)?)                 # or plain 1000 / 1000.50
    (?!\s*%)                    # NOT a percentage (so "3%" is not read as money)
    (?!\s*per\s*cent)
    """,
    re.VERBOSE,
)

# Currency tokens we tolerate around a number (case-insensitive).
_CURRENCY_TOKENS = ("aed", "dhs", "dh", "د.إ", "dirham", "dirhams")


def parse_aed(text: Optional[str]) -> Optional[float]:
    """'AED 1,000' -> 1000.0 ; 'Dhs 99/-' -> 99.0 ; 'free' -> 0.0 ; junk -> None.

    Returns the FIRST monetary amount found. 'free'/'nil'/'no charge'/'waived'
    map to 0.0 because a KFS uses those words for a zeroed fee.
    """
    if text is None:
        return None
    s = str(text).strip()
    if not s:
        return None
    low = s.lower()
    if any(w in low for w in ("free for life", "free", "nil", "no charge",
                              "no fee", "waived", "zero")):
        # Only treat as 0 when there isn't ALSO a concrete number to prefer.
        m = _AMOUNT_RE.search(s)
        if not m:
            return 0.0
    m = _AMOUNT_RE.search(s)
    if not m:
        return None
    try:
        return float(m.group("num").replace(",", ""))
    except ValueError:
        return None


def parse_pct(text: Optional[str]) -> Optional[float]:
    """Pull a percentage as a float in PERCENT units.

    'APR 39.5%'          -> 39.5
    '3.25% per month'    -> 3.25
    'up to 48.07% p.a.'  -> 48.07
    '2.99 per cent'      -> 2.99
    '0.0525'             -> 5.25   (a bare fraction <=1 is treated as a ratio)
    junk                 -> None

    A trailing '%' (or 'per cent'/'pct'/'p.a.'/'p.m.') is the strong signal. If a
    number is given as a bare ratio in [0,1] with no '%', we up-convert (0.05->5).
    """
    if text is None:
        return None
    s = str(text).strip().lower()
    if not s:
        return None
    # number directly followed by a percent marker
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:%|per\s*cent|percent|pct|p\.?\s*a\.?|p\.?\s*m\.?)", s)
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            return None
    # no percent marker: take the first number; up-convert a [0,1] ratio
    m = re.search(r"(\d+(?:\.\d+)?)", s)
    if not m:
        return None
    try:
        val = float(m.group(1))
    except ValueError:
        return None
    if 0.0 < val <= 1.0:
        return round(val * 100.0, 6)
    return val


# --------------------------------------------------------------------------- #
# Category mapping  (synonym words  ->  canonical key from data/categories.json)
# --------------------------------------------------------------------------- #
# The canonical keys are fixed by kfs/data/categories.json. KFS prose uses many
# surface words for the same bucket; this table is the single source of truth for
# the synonym -> key mapping and is shared by generic_kfs.py. 'international' is a
# pseudo-category (the non-AED bonus tier) per the schema, so we map FX wording to
# it too. Order does not matter; matching is by whole-word/substring (see below).
CATEGORY_SYNONYMS: dict[str, str] = {
    # groceries
    "supermarket": "groceries", "supermarkets": "groceries", "grocery": "groceries",
    "groceries": "groceries", "hypermarket": "groceries", "carrefour": "groceries",
    "lulu": "groceries", "spinneys": "groceries",
    # dining
    "dining": "dining", "restaurant": "dining", "restaurants": "dining",
    "food delivery": "dining", "cafes": "dining", "eating out": "dining",
    "talabat": "dining", "deliveroo": "dining",
    # fuel
    "fuel": "fuel", "petrol": "fuel", "gas station": "fuel", "filling station": "fuel",
    "enoc": "fuel", "adnoc": "fuel", "eppco": "fuel",
    # education
    "education": "education", "school": "education", "school fees": "education",
    "tuition": "education", "university": "education", "universities": "education",
    "nursery": "education", "nurseries": "education", "tuition fees": "education",
    # utilities
    "utility": "utilities", "utilities": "utilities", "dewa": "utilities",
    "sewa": "utilities", "fewa": "utilities", "aadc": "utilities",
    "bill payment": "utilities", "bill payments": "utilities", "water and electricity": "utilities",
    # telecom
    "telecom": "telecom", "telecommunication": "telecom", "etisalat": "telecom",
    "du": "telecom", "mobile bill": "telecom", "internet bill": "telecom",
    # transport
    "transport": "transport", "salik": "transport", "toll": "transport",
    "rta": "transport", "nol": "transport", "taxi": "transport", "taxis": "transport",
    "parking": "transport", "metro": "transport", "automobile": "transport",
    "car": "transport",
    # travel
    "travel": "travel", "airline": "travel", "airlines": "travel", "hotel": "travel",
    "hotels": "travel", "flights": "travel", "air travel": "travel",
    "travel agency": "travel", "travel agencies": "travel",
    # online
    "online": "online", "e-commerce": "online", "ecommerce": "online",
    "online shopping": "online", "amazon": "online", "noon": "online",
    "marketplace": "online",
    # entertainment
    "entertainment": "entertainment", "cinema": "entertainment", "movies": "entertainment",
    "streaming": "entertainment", "theme park": "entertainment", "events": "entertainment",
    # mobile wallet
    "mobile wallet": "mobile_wallet", "wallet": "mobile_wallet", "apple pay": "mobile_wallet",
    "google pay": "mobile_wallet", "samsung pay": "mobile_wallet", "tokenised": "mobile_wallet",
    "tokenized": "mobile_wallet", "contactless wallet": "mobile_wallet",
    # health
    "health": "health", "pharmacy": "health", "pharmacies": "health", "clinic": "health",
    "clinics": "health", "hospital": "health", "optician": "health", "medical": "health",
    # government
    "government": "government", "govt": "government", "charity": "government",
    "fines": "government", "fine": "government", "rta fines": "government",
    # the non-AED bonus tier (schema pseudo-category)
    "international": "international", "non-aed": "international", "non aed": "international",
    "foreign currency": "international", "overseas": "international", "abroad": "international",
    "foreign spend": "international", "international spend": "international",
    # explicit catch-all
    "other": "other", "all other": "other", "everything else": "other",
    "all spends": "other", "all other spends": "other", "any other": "other",
}

# Longest synonyms first so "school fees" wins over "school", "non-aed" over "aed".
_SYNONYMS_BY_LEN = sorted(CATEGORY_SYNONYMS.items(), key=lambda kv: -len(kv[0]))

# Short/abbreviation synonyms that MUST match as whole words, never as substrings,
# or they produce false positives ("du" inside "due"/"product", "car" inside
# "card", "dh" inside "dhabi", "fine" inside "define"). Everything else may match
# as a substring (multi-word phrases are inherently low-collision).
_WORD_BOUNDARY_SYNONYMS = {
    "du", "car", "dh", "nol", "rta", "fine", "fines", "events",
    "abroad", "metro", "taxi", "taxis",
}
# Pre-compile a word-boundary regex for each such synonym (escaping any regex
# metachars, e.g. none here but defensive).
_WORD_RX = {syn: re.compile(r"\b" + re.escape(syn) + r"\b") for syn in _WORD_BOUNDARY_SYNONYMS}

# Canonical keys (incl. the pseudo-category) for validation elsewhere.
CANONICAL_CATEGORIES = {
    "groceries", "dining", "fuel", "education", "utilities", "telecom",
    "transport", "travel", "online", "entertainment", "mobile_wallet",
    "health", "government", "other", "international",
}


def map_category(word: str) -> Optional[str]:
    """Map a KFS surface word/phrase to a canonical category key, or None.

    Longest-synonym-first so multi-word synonyms ('school fees') beat their
    prefixes ('school') and 'non-aed' beats 'aed'. Most synonyms match as a
    substring; short/abbreviation synonyms (du, car, dh, ...) match only on word
    boundaries to avoid matching inside unrelated words. Already-canonical keys
    pass straight through.
    """
    if not word:
        return None
    w = word.strip().lower()
    if w in CANONICAL_CATEGORIES:
        return w
    for syn, key in _SYNONYMS_BY_LEN:
        if syn in _WORD_BOUNDARY_SYNONYMS:
            if _WORD_RX[syn].search(w):
                return key
        elif syn in w:
            return key
    return None


# --------------------------------------------------------------------------- #
# Record coercion: fill schema defaults, drop empties, make safe to serialize.
# --------------------------------------------------------------------------- #
def _num_or_none(v):
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    return None


def coerce_record(partial: dict) -> dict:
    """Take a best-effort partial record and return one that satisfies the
    schema's required top-level keys (card_id, bank, card_name, card_type, fees,
    rewards, source), filling sensible defaults and coercing types.

    This is the boundary between "heuristic extraction" (which may be sparse and
    noisy) and "the contract" (which must be well-formed). It NEVER invents reward
    rates or fees — missing numerics stay null — but it does materialise the
    nested objects and enums the schema requires so the result is serialisable and
    consumable by the value engine.
    """
    p = dict(partial or {})

    bank = dict(p.get("bank") or {})
    bank_id = bank.get("id") or "unknown"
    bank.setdefault("id", bank_id)
    bank.setdefault("name", bank.get("name") or bank_id)
    if bank.get("type") not in ("national", "foreign", "wholesale", "digital"):
        bank.pop("type", None)

    card_id = p.get("card_id") or f"{bank_id}-card"
    card_id = _slug(card_id)

    fees_in = dict(p.get("fees") or {})
    interest_in = dict(fees_in.get("interest") or {})
    fees = {
        "annual_fee_aed": _num_or_none(fees_in.get("annual_fee_aed")),
        "interest": {
            "monthly_rate_pct": _num_or_none(interest_in.get("monthly_rate_pct")),
            "apr_pct": _num_or_none(interest_in.get("apr_pct")),
            "basis": interest_in.get("basis", "conventional"),
        },
        "fx_markup_pct": _num_or_none(fees_in.get("fx_markup_pct")),
        "cash_advance_fee_pct": _num_or_none(fees_in.get("cash_advance_fee_pct")),
        "cash_advance_fee_min_aed": _num_or_none(fees_in.get("cash_advance_fee_min_aed")),
        "late_payment_fee_aed": _num_or_none(fees_in.get("late_payment_fee_aed")),
        "over_limit_fee_aed": _num_or_none(fees_in.get("over_limit_fee_aed")),
        "min_payment_pct": _num_or_none(fees_in.get("min_payment_pct")),
    }
    if fees_in.get("annual_fee_waiver"):
        fees["annual_fee_waiver"] = fees_in["annual_fee_waiver"]
    if fees["interest"]["basis"] not in ("conventional", "profit", "fee_based"):
        fees["interest"]["basis"] = "conventional"

    rewards_in = dict(p.get("rewards") or {})
    tiers = []
    for t in rewards_in.get("tiers", []) or []:
        cat = t.get("category")
        if cat not in CANONICAL_CATEGORIES:
            continue
        rate = _num_or_none(t.get("rate_pct"))
        if rate is None:
            continue
        tier = {"category": cat, "rate_pct": rate}
        if _num_or_none(t.get("monthly_cap_aed")) is not None:
            tier["monthly_cap_aed"] = _num_or_none(t.get("monthly_cap_aed"))
        if _num_or_none(t.get("min_monthly_spend_aed")) is not None:
            tier["min_monthly_spend_aed"] = _num_or_none(t.get("min_monthly_spend_aed"))
        if t.get("notes"):
            tier["notes"] = t["notes"]
        tiers.append(tier)

    rewards = {
        "kind": rewards_in.get("kind", "cashback"),
        "base_rate_pct": float(rewards_in.get("base_rate_pct", 0) or 0),
        "tiers": tiers,
    }
    if _num_or_none(rewards_in.get("min_spend_to_earn_aed")) is not None:
        rewards["min_spend_to_earn_aed"] = _num_or_none(rewards_in.get("min_spend_to_earn_aed"))
    if _num_or_none(rewards_in.get("monthly_cashback_cap_aed")) is not None:
        rewards["monthly_cashback_cap_aed"] = _num_or_none(rewards_in.get("monthly_cashback_cap_aed"))
    if rewards["kind"] not in ("cashback", "points", "miles", "hybrid", "none"):
        rewards["kind"] = "cashback"

    source_in = dict(p.get("source") or {})
    source = {
        "source_type": source_in.get("source_type", "fixture"),
        "as_of": source_in.get("as_of", ""),
        "confidence": source_in.get("confidence", "low"),
    }
    if source_in.get("kfs_url"):
        source["kfs_url"] = source_in["kfs_url"]
    if source_in.get("provenance_notes"):
        source["provenance_notes"] = source_in["provenance_notes"]
    if source["source_type"] not in (
        "kfs_pdf", "kfs_html", "bank_page", "aggregator", "research", "fixture"
    ):
        source["source_type"] = "fixture"
    if source["confidence"] not in ("high", "medium", "low"):
        source["confidence"] = "low"

    card_type = p.get("card_type", "cashback")
    if card_type not in (
        "cashback", "rewards", "travel", "lifestyle", "premium",
        "islamic", "secured", "business", "other"
    ):
        card_type = "cashback"

    rec = {
        "card_id": card_id,
        "bank": bank,
        "card_name": p.get("card_name") or bank.get("name") or "Unknown Card",
        "card_type": card_type,
        "fees": fees,
        "rewards": rewards,
        "source": source,
    }
    # carry through a few optional-but-useful top-level fields when present
    for opt in ("network", "islamic", "segment", "currency"):
        if opt in p and p[opt] is not None:
            rec[opt] = p[opt]
    if p.get("eligibility"):
        elig = {}
        e_in = p["eligibility"]
        if _num_or_none(e_in.get("min_monthly_income_aed")) is not None:
            elig["min_monthly_income_aed"] = _num_or_none(e_in.get("min_monthly_income_aed"))
        if _num_or_none(e_in.get("min_age")) is not None:
            elig["min_age"] = _num_or_none(e_in.get("min_age"))
        if e_in.get("notes"):
            elig["notes"] = e_in["notes"]
        if elig:
            rec["eligibility"] = elig
    return rec


def _slug(text: str) -> str:
    """Lower-case, hyphenate, strip to the schema's ^[a-z0-9-]+$ pattern."""
    s = re.sub(r"[^a-z0-9]+", "-", str(text).lower()).strip("-")
    return s or "card"
