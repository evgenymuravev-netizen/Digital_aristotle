"""
Zero-dependency tests for the KFS extraction pipeline. Runs under plain python3
OR pytest, mirroring kfs/engine/tests/test_value_engine.py.

    python3 kfs/pipeline/tests/test_pipeline.py     # self-runner, prints PASS/FAIL
    python3 -m pytest kfs/pipeline/tests/           # if pytest is installed

ALL TESTS RUN FULLY OFFLINE against the local fixtures (this sandbox blocks egress
to bank hosts). Coverage:
  * normalize parsers: parse_aed / parse_pct / map_category
  * generic_kfs extraction of the FAB fixture (annual fee 300, min income 5000,
    a 5% groceries tier capped at 200, min_spend 3000)
  * the ENBD HTML fixture (dining 5%, non-AED 1%, APR 48.07, fee 200) + link harvest
  * run.py --offline produces >=1 record whose shape matches schema.json's
    required fields (validated by a tiny stdlib checker, with optional jsonschema)
  * coerce_record always yields a schema-shaped, serialisable record
"""

import json
import os
import sys

# Make the pipeline package importable however this file is invoked.
_HERE = os.path.dirname(os.path.abspath(__file__))
_PIPELINE = os.path.dirname(_HERE)
for _p in (_PIPELINE, os.path.join(_PIPELINE, "extractors")):
    if _p not in sys.path:
        sys.path.insert(0, _p)

import normalize  # noqa: E402
import fetch as fetchmod  # noqa: E402
import run as runmod  # noqa: E402
import extractors  # noqa: E402  (registers adapters)
from extractors import build, generic_kfs, html_extractor  # noqa: E402

_DATA = os.path.normpath(os.path.join(_PIPELINE, "..", "data"))


def approx(a, b, tol=0.001):
    return a is not None and abs(a - b) <= tol


# --------------------------------------------------------------------------- #
# Fixtures helpers
# --------------------------------------------------------------------------- #
def _fab_text():
    with open(os.path.join(_PIPELINE, "fixtures", "fab_consolidated.txt"), encoding="utf-8") as f:
        return f.read()


def _enbd_text():
    with open(os.path.join(_PIPELINE, "fixtures", "enbd_cashback.txt"), encoding="utf-8") as f:
        return f.read()


def _fab_first_card():
    recs = build("fab").extract(_fab_text().encode(), {
        "id": "fab", "name": "First Abu Dhabi Bank", "type": "national",
        "kfs_url": "https://example/fab.pdf",
    })
    return recs[0], recs


def _tier(rec, category):
    for t in rec["rewards"]["tiers"]:
        if t["category"] == category:
            return t
    return None


# --------------------------------------------------------------------------- #
# normalize.parse_aed
# --------------------------------------------------------------------------- #
def test_parse_aed_basic():
    assert normalize.parse_aed("AED 1,000") == 1000.0
    assert normalize.parse_aed("AED 1,000.50") == 1000.5
    assert normalize.parse_aed("Dhs 99/-") == 99.0
    assert normalize.parse_aed("1,000 AED") == 1000.0
    assert normalize.parse_aed("AED 273.50") == 273.5


def test_parse_aed_free_and_junk():
    assert normalize.parse_aed("Free for life") == 0.0
    assert normalize.parse_aed("No charge") == 0.0
    assert normalize.parse_aed("") is None
    assert normalize.parse_aed(None) is None
    assert normalize.parse_aed("no number here") is None


def test_parse_aed_does_not_grab_percent():
    # A bare percentage must not be read as money.
    assert normalize.parse_aed("3%") is None
    # but a real AED amount alongside a percent is found
    assert normalize.parse_aed("3% or AED 99") == 99.0


# --------------------------------------------------------------------------- #
# normalize.parse_pct
# --------------------------------------------------------------------------- #
def test_parse_pct_basic():
    assert approx(normalize.parse_pct("APR 39.5%"), 39.5)
    assert approx(normalize.parse_pct("3.25% per month"), 3.25)
    assert approx(normalize.parse_pct("up to 48.07% p.a."), 48.07)
    assert approx(normalize.parse_pct("2.99 per cent"), 2.99)


def test_parse_pct_fraction_upconverts():
    # a bare ratio in (0,1] with no % is treated as a fraction -> percent
    assert approx(normalize.parse_pct("0.0525"), 5.25)
    assert approx(normalize.parse_pct("5"), 5.0)  # >1 stays as-is
    assert normalize.parse_pct("no rate") is None


# --------------------------------------------------------------------------- #
# normalize.map_category
# --------------------------------------------------------------------------- #
def test_map_category_synonyms():
    assert normalize.map_category("supermarket") == "groceries"
    assert normalize.map_category("grocery spends") == "groceries"
    assert normalize.map_category("restaurants and cafes") == "dining"
    assert normalize.map_category("petrol") == "fuel"
    assert normalize.map_category("school fees") == "education"
    assert normalize.map_category("DEWA bill") == "utilities"
    assert normalize.map_category("non-AED transactions") == "international"
    assert normalize.map_category("Apple Pay") == "mobile_wallet"


def test_map_category_word_boundary_no_false_positive():
    # 'du' must NOT match inside 'due'/'product'; 'car' must NOT match 'card'.
    assert normalize.map_category("Minimum amount due") is None
    assert normalize.map_category("primary card fee") is None
    assert normalize.map_category("unrelated text") is None


# --------------------------------------------------------------------------- #
# generic_kfs — FAB fixture (the required assertions)
# --------------------------------------------------------------------------- #
def test_fab_recovers_core_fees():
    rec, _ = _fab_first_card()
    assert approx(rec["fees"]["annual_fee_aed"], 300.0)
    assert approx(rec["eligibility"]["min_monthly_income_aed"], 5000.0)
    assert approx(rec["fees"]["interest"]["monthly_rate_pct"], 3.25)
    assert approx(rec["fees"]["interest"]["apr_pct"], 39.5)
    assert approx(rec["fees"]["fx_markup_pct"], 2.99)
    assert approx(rec["fees"]["late_payment_fee_aed"], 230.0)
    assert approx(rec["fees"]["over_limit_fee_aed"], 273.5)
    assert approx(rec["fees"]["cash_advance_fee_min_aed"], 99.0)


def test_fab_recovers_groceries_tier_with_cap():
    rec, _ = _fab_first_card()
    g = _tier(rec, "groceries")
    assert g is not None, "expected a groceries reward tier"
    assert approx(g["rate_pct"], 5.0)
    assert approx(g["monthly_cap_aed"], 200.0)


def test_fab_recovers_min_spend_and_overall_cap():
    rec, _ = _fab_first_card()
    assert approx(rec["rewards"]["min_spend_to_earn_aed"], 3000.0)
    assert approx(rec["rewards"]["monthly_cashback_cap_aed"], 1000.0)


def test_fab_dining_and_education_and_international():
    rec, _ = _fab_first_card()
    assert approx(_tier(rec, "dining")["rate_pct"], 3.0)
    assert approx(_tier(rec, "education")["rate_pct"], 3.0)
    intl = _tier(rec, "international")
    assert intl is not None and approx(intl["rate_pct"], 1.0)
    # FX markup (2.99%) must NOT have leaked in as the international cashback rate
    assert not approx(intl["rate_pct"], 2.99)


def test_fab_emits_two_cards_and_detects_islamic():
    _, recs = _fab_first_card()
    assert len(recs) == 2, f"expected 2 FAB cards, got {len(recs)}"
    islamic = [r for r in recs if r.get("islamic")]
    assert len(islamic) == 1
    assert islamic[0]["fees"]["interest"]["basis"] == "profit"
    assert islamic[0]["card_type"] == "islamic"


def test_fab_card_name_strips_label_prefix():
    rec, _ = _fab_first_card()
    assert rec["card_name"] == "FAB Cashback Card"
    assert rec["card_id"] == "fab-fab-cashback-card"


def test_fab_confidence_is_high():
    rec, _ = _fab_first_card()
    assert rec["source"]["confidence"] == "high"
    assert "DRAFT" in rec["source"]["provenance_notes"]


# --------------------------------------------------------------------------- #
# ENBD HTML fixture
# --------------------------------------------------------------------------- #
def test_enbd_html_extraction():
    bank = {"id": "enbd", "name": "Emirates NBD", "type": "national",
            "kfs_url": "https://www.emiratesnbd.com/en/kfs/credit-card"}
    recs = build("enbd").extract(_enbd_text().encode(), bank)
    assert len(recs) == 1
    r = recs[0]
    assert approx(r["fees"]["annual_fee_aed"], 200.0)
    assert approx(r["fees"]["interest"]["apr_pct"], 48.07)
    assert approx(r["fees"]["fx_markup_pct"], 2.99)
    assert approx(_tier(r, "dining")["rate_pct"], 5.0)
    assert approx(_tier(r, "international")["rate_pct"], 1.0)
    assert approx(r["rewards"]["min_spend_to_earn_aed"], 5000.0)


def test_enbd_html_strips_script_and_harvests_links():
    raw = _enbd_text()
    text = html_extractor.html_to_text(raw)
    # <script> contents (a JS var with 48.07) must not leak into visible text
    assert "var x" not in text
    links = html_extractor.kfs_document_links(
        raw, base_url="https://www.emiratesnbd.com/en/kfs/credit-card")
    assert any(u.endswith(".pdf") for u in links)
    assert all(u.startswith("https://") for u in links)


# --------------------------------------------------------------------------- #
# fetch (offline) + content sniff
# --------------------------------------------------------------------------- #
def test_fetch_offline_reads_fixture():
    data = fetchmod.fetch("fab", offline=True)
    assert isinstance(data, bytes) and b"FAB Cashback Card" in data
    # unknown id offline -> FileNotFoundError (no silent network)
    try:
        fetchmod.fetch("does-not-exist", offline=True)
        raised = False
    except FileNotFoundError:
        raised = True
    assert raised


def test_content_type_sniff():
    assert fetchmod.sniff_content_type(b"%PDF-1.7\n...") == "pdf"
    assert fetchmod.sniff_content_type(b"<!DOCTYPE html><html>") == "html"
    assert fetchmod.sniff_content_type(b"<html><body>x</body></html>") == "html"
    assert fetchmod.sniff_content_type(b"plain text", url="x.pdf") == "pdf"


# --------------------------------------------------------------------------- #
# coerce_record
# --------------------------------------------------------------------------- #
def test_coerce_record_fills_required_and_is_serializable():
    rec = normalize.coerce_record({"bank": {"id": "x"}})
    for k in ("card_id", "bank", "card_name", "card_type", "fees", "rewards", "source"):
        assert k in rec
    assert rec["rewards"]["kind"] == "cashback"
    assert rec["source"]["confidence"] in ("high", "medium", "low")
    json.dumps(rec)  # must not raise


def test_coerce_record_drops_noncanonical_tiers():
    rec = normalize.coerce_record({
        "bank": {"id": "x"},
        "rewards": {"kind": "cashback", "tiers": [
            {"category": "groceries", "rate_pct": 5.0},
            {"category": "not_a_category", "rate_pct": 3.0},
            {"category": "dining"},  # missing rate -> dropped
        ]},
    })
    cats = {t["category"] for t in rec["rewards"]["tiers"]}
    assert cats == {"groceries"}


# --------------------------------------------------------------------------- #
# run.py --offline end-to-end + schema-required validation
# --------------------------------------------------------------------------- #
SCHEMA_REQUIRED_TOP = ["card_id", "bank", "card_name", "card_type", "fees", "rewards", "source"]
CANONICAL = {
    "groceries", "dining", "fuel", "education", "utilities", "telecom",
    "transport", "travel", "online", "entertainment", "mobile_wallet",
    "health", "government", "other", "international",
}


def _required_field_validator(rec):
    """Tiny stdlib validator for the schema's REQUIRED structure. Returns
    a list of problems (empty == valid). Used when jsonschema isn't installed."""
    problems = []
    for k in SCHEMA_REQUIRED_TOP:
        if k not in rec:
            problems.append(f"missing top-level '{k}'")
    bank = rec.get("bank", {})
    for k in ("id", "name"):
        if k not in bank:
            problems.append(f"bank missing '{k}'")
    src = rec.get("source", {})
    for k in ("source_type", "as_of", "confidence"):
        if k not in src:
            problems.append(f"source missing '{k}'")
    if "kind" not in rec.get("rewards", {}):
        problems.append("rewards missing 'kind'")
    for t in rec.get("rewards", {}).get("tiers", []):
        if "category" not in t or "rate_pct" not in t:
            problems.append("tier missing category/rate_pct")
        elif t["category"] not in CANONICAL:
            problems.append(f"tier category '{t['category']}' not canonical")
    # type/enum sanity
    if rec.get("card_id") and not all(c.islower() or c.isdigit() or c == "-" for c in rec["card_id"]):
        problems.append("card_id not slug-shaped")
    return problems


def _validate_record(rec):
    """Prefer jsonschema (full schema) when available; else the stdlib checker."""
    try:
        import jsonschema  # type: ignore
    except Exception:
        return _required_field_validator(rec)
    schema_path = os.path.join(_DATA, "schema.json")
    with open(schema_path, encoding="utf-8") as f:
        schema = json.load(f)
    try:
        jsonschema.validate(rec, schema)
        return []
    except jsonschema.ValidationError as e:  # type: ignore
        return [f"jsonschema: {e.message}"]


def test_run_offline_produces_valid_records():
    result = runmod.run(offline=True, write=False)
    recs = result["records"]
    assert len(recs) >= 1, "offline run should produce at least one record"
    assert result["counts"]["errors"] == 0, result["summaries"]
    for rec in recs:
        problems = _validate_record(rec)
        assert not problems, f"{rec.get('card_id')}: {problems}"


def test_run_offline_writes_output_file(tmp_path=None):
    result = runmod.run(offline=True, write=True)
    assert "out_file" in result and os.path.exists(result["out_file"])
    with open(result["out_file"], encoding="utf-8") as f:
        payload = json.load(f)
    assert payload["cards"] and payload["offline"] is True
    # the written cards are valid too
    for rec in payload["cards"]:
        assert not _validate_record(rec)


def test_run_offline_single_bank_and_limit():
    only = runmod.run(offline=True, only_bank="fab", write=False)
    assert {r["bank"]["id"] for r in only["records"]} == {"fab"}
    assert only["counts"]["records"] == 2
    # --limit 1 over banks-with-urls: only the first (fab) is fetched
    lim = runmod.run(offline=True, limit=1, write=False)
    assert {r["bank"]["id"] for r in lim["records"]} == {"fab"}


def test_extracted_records_feed_value_engine():
    """The whole point: extracted records must be consumable by the engine."""
    engine_dir = os.path.normpath(os.path.join(_PIPELINE, "..", "engine"))
    sys.path.insert(0, engine_dir)
    import value_engine as ve  # noqa: E402
    recs = runmod.run(offline=True, write=False)["records"]
    profiles = ve.load_profiles()
    fam = next(p for p in profiles if p["profile_id"] == "family-grocery-school")
    fab = next(r for r in recs if r["card_id"] == "fab-fab-cashback-card")
    e = ve.evaluate_card(fab, fam)
    assert e.annual_reward_aed > 0 and e.eligible is True


# --------------------------------------------------------------------------- #
def _run():
    tests = [g for name, g in sorted(globals().items())
             if name.startswith("test_") and callable(g)]
    passed, failed = 0, 0
    for t in tests:
        try:
            t()
            passed += 1
            print(f"  PASS {t.__name__}")
        except AssertionError as e:
            failed += 1
            print(f"  FAIL {t.__name__}: {e}")
        except Exception as e:  # noqa: BLE001
            failed += 1
            print(f"  ERROR {t.__name__}: {type(e).__name__}: {e}")
    print(f"\n{passed} passed, {failed} failed, {len(tests)} total")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(_run())
