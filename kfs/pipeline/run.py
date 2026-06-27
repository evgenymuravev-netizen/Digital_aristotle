"""
run.py — the KFS extraction orchestrator (CLI).

WHAT IT DOES
------------
For every bank in banks.json that has a known kfs_url:
  1. FETCH the KFS (live via fetch.py, or from a local fixture in --offline mode),
  2. SNIFF whether it's a PDF or HTML,
  3. ROUTE it to the right extractor adapter (banks.json `extractor`, falling back
     to source-type defaults: pdf -> 'pdf', html -> 'html', else 'generic_kfs'),
  4. NORMALIZE the result (coerce_record already runs inside the extractor),
  5. COLLECT the records and write them to out/cards.extracted.json, printing a
     per-bank summary (records found / skipped / errors).

OFFLINE MODE
------------
`--offline` makes the whole pipeline run with NO network by reading fixtures/
instead (fetch.OFFLINE_FIXTURES maps bank id / URL -> fixture). This is what the
test suite and this sandbox use, since outbound HTTPS to bank hosts is blocked.

LIVE MODE (the user's own environment)
--------------------------------------
Without --offline, fetch.py performs polite real HTTP(S) GETs (browser UA, retry/
backoff, on-disk cache). For an HTML KFS that links out to per-card PDFs (e.g.
Emirates NBD), run.py additionally discovers those links (html_extractor.
kfs_document_links), fetches each PDF, and runs the PDF extractor over it — so a
landing page expands into one record per linked card. (Offline, only the inline
fixture text is parsed.)

Output records conform to kfs/data/schema.json. They are DRAFTS: source.confidence
and source.provenance_notes flag what was recovered vs defaulted; a human-verify
step is required before customer-facing use (see README).
"""

from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "extractors"))

import fetch as fetchmod  # noqa: E402
import extractors  # noqa: E402  (registers all adapters)
from extractors import build, html_extractor  # noqa: E402

BANKS_JSON = os.path.join(HERE, "banks.json")
OUT_DIR = os.path.join(HERE, "out")
OUT_FILE = os.path.join(OUT_DIR, "cards.extracted.json")


def load_banks(path: str = BANKS_JSON) -> list[dict]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)["banks"]


def _route_extractor_name(bank: dict, content_type: str) -> str:
    """Pick the extractor adapter for a bank + sniffed content type.

    Priority: explicit banks.json `extractor` (if it's not the bare default) wins;
    otherwise route by content type. This lets fab/enbd adapters take over while
    unconfigured banks still get a sensible pdf/html/generic default.
    """
    declared = bank.get("extractor") or "generic_kfs"
    if declared not in ("generic_kfs", None):
        return declared
    if content_type == "pdf":
        return "pdf"
    if content_type == "html":
        return "html"
    return "generic_kfs"


def process_bank(bank: dict, offline: bool) -> dict:
    """Fetch + extract one bank. Returns a summary dict with the records.

    Summary keys: bank_id, status ('ok'|'skipped'|'error'), records (list),
    n_records, note (human-readable reason / detail).
    """
    bid = bank.get("id", "?")
    url = bank.get("kfs_url")
    summary = {"bank_id": bid, "status": "skipped", "records": [], "n_records": 0, "note": ""}

    if not url:
        summary["note"] = "no kfs_url"
        return summary

    # --- fetch ---
    try:
        if offline:
            # Offline resolves by bank id first (robust even if the URL host
            # doesn't contain the id), then by the adapter name (so e.g. 'liv',
            # which is served by the 'enbd' adapter, maps to the enbd fixture),
            # then by URL.
            raw = None
            for key in (bid, bank.get("extractor"), url):
                if not key:
                    continue
                try:
                    raw = fetchmod.fetch(key, offline=True)
                    break
                except FileNotFoundError:
                    continue
            if raw is None:
                raise FileNotFoundError(
                    f"no offline fixture for bank '{bid}' (tried id, extractor, url)"
                )
        else:
            raw = fetchmod.fetch(url, offline=False)
    except FileNotFoundError as e:
        summary["note"] = f"no fixture ({e})"
        return summary
    except Exception as e:  # noqa: BLE001  network/HTTP errors in live mode
        summary["status"] = "error"
        summary["note"] = f"fetch failed: {type(e).__name__}: {e}"
        return summary

    content_type = fetchmod.sniff_content_type(raw, url=url)

    # --- extract (inline) ---
    try:
        name = _route_extractor_name(bank, content_type)
        extractor = build(name)
        records = extractor.extract(raw, bank)
    except Exception as e:  # noqa: BLE001  a bad doc shouldn't kill the whole run
        summary["status"] = "error"
        summary["note"] = f"extract failed: {type(e).__name__}: {e}"
        return summary

    # --- follow linked KFS PDFs from an HTML landing page (LIVE only) ---
    # Offline we only have the inline fixture; live we expand each linked PDF into
    # its own record using the pdf extractor.
    if not offline and content_type == "html":
        try:
            links = html_extractor.kfs_document_links(raw, base_url=url)
            pdf_ext = build("pdf")
            for link in links:
                if not link.lower().endswith(".pdf"):
                    continue
                try:
                    sub_raw = fetchmod.fetch(link, offline=False)
                    sub_bank = dict(bank)
                    sub_bank["kfs_url"] = link
                    records.extend(pdf_ext.extract(sub_raw, sub_bank))
                except Exception:  # noqa: BLE001  skip a broken linked doc
                    continue
        except Exception:  # noqa: BLE001
            pass

    summary["records"] = records
    summary["n_records"] = len(records)
    summary["status"] = "ok" if records else "skipped"
    if not records:
        summary["note"] = summary["note"] or "no records recovered from KFS"
    return summary


def run(offline: bool = False, only_bank: str | None = None, limit: int | None = None,
        banks_path: str = BANKS_JSON, write: bool = True) -> dict:
    """Run the pipeline. Returns {records, summaries, counts}.

    Args:
        offline:  read fixtures instead of network.
        only_bank: restrict to a single bank id.
        limit:    process at most N banks that have a kfs_url.
        write:    write out/cards.extracted.json (set False in tests).
    """
    banks = load_banks(banks_path)
    if only_bank:
        banks = [b for b in banks if b.get("id") == only_bank]

    all_records: list[dict] = []
    summaries: list[dict] = []
    processed_with_url = 0

    for bank in banks:
        # Honour --limit over banks that actually have a URL to fetch.
        if limit is not None and processed_with_url >= limit:
            break
        if bank.get("kfs_url"):
            processed_with_url += 1
        s = process_bank(bank, offline=offline)
        summaries.append(s)
        all_records.extend(s["records"])

    counts = {
        "banks_considered": len(banks),
        "records": len(all_records),
        "ok": sum(1 for s in summaries if s["status"] == "ok"),
        "skipped": sum(1 for s in summaries if s["status"] == "skipped"),
        "errors": sum(1 for s in summaries if s["status"] == "error"),
    }

    result = {"records": all_records, "summaries": summaries, "counts": counts}

    if write:
        os.makedirs(OUT_DIR, exist_ok=True)
        payload = {
            "$comment": "KFS-extracted UAE credit-card records (DRAFTS). Produced by "
                        "kfs/pipeline/run.py. Conforms to ../data/schema.json. Every "
                        "record's source.confidence + provenance_notes flag what was "
                        "recovered vs defaulted; human verification required before use.",
            "generated_by": "kfs/pipeline/run.py",
            "offline": offline,
            "counts": counts,
            "cards": all_records,
        }
        with open(OUT_FILE, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
            f.write("\n")
        result["out_file"] = OUT_FILE

    return result


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def _print_report(result: dict, offline: bool) -> None:
    print("=" * 72)
    print(f"KFS extraction pipeline {'[OFFLINE]' if offline else '[LIVE]'}")
    print("-" * 72)
    for s in result["summaries"]:
        if s["status"] == "skipped" and s["note"] == "no kfs_url":
            continue  # don't spam the long tail of to_verify banks
        tag = {"ok": " OK ", "skipped": "SKIP", "error": "ERR "}.get(s["status"], "????")
        line = f"  [{tag}] {s['bank_id']:<14} records={s['n_records']}"
        if s["note"]:
            line += f"  ({s['note']})"
        print(line)
    c = result["counts"]
    print("-" * 72)
    print(f"  banks considered: {c['banks_considered']}  |  records: {c['records']}  "
          f"|  ok: {c['ok']}  skipped: {c['skipped']}  errors: {c['errors']}")
    if "out_file" in result:
        print(f"  wrote: {result['out_file']}")
    print("=" * 72)


def main(argv=None):
    ap = argparse.ArgumentParser(description="UAE KFS extraction pipeline")
    ap.add_argument("--offline", action="store_true",
                    help="read fixtures/ instead of the network (no egress)")
    ap.add_argument("--bank", default=None, help="restrict to a single bank id")
    ap.add_argument("--limit", type=int, default=None,
                    help="process at most N banks that have a kfs_url")
    ap.add_argument("--banks", default=BANKS_JSON, help="path to banks.json")
    ap.add_argument("--no-write", action="store_true", help="don't write the output file")
    ap.add_argument("--json", action="store_true", help="print records as JSON to stdout")
    args = ap.parse_args(argv)

    result = run(offline=args.offline, only_bank=args.bank, limit=args.limit,
                 banks_path=args.banks, write=not args.no_write)

    if args.json:
        print(json.dumps(result["records"], indent=2, ensure_ascii=False))
    else:
        _print_report(result, args.offline)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
