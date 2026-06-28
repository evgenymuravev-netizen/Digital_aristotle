#!/usr/bin/env python3
"""
enumerate_places.py — discover the FULL Al-Futtaim Automotive location list
(with Google place_ids) so collection is exhaustive, not limited to the
hand-seeded list in config/places.json.

It searches Google Maps (via SerpApi) for each brand in each emirate and
paginates through every local result, keeping the ones that look like
Al-Futtaim / Trading Enterprises / Automall sites.

    export SERPAPI_KEY=...
    python src/enumerate_places.py --out config/places.discovered.json

Then collect with the richer file:
    python src/collect_google.py --provider serpapi \
        --places config/places.discovered.json --out data/google_reviews.jsonl

(Apify alternative: run actor compass~crawler-google-places with
searchStringsArray = the BRAND_QUERIES below and read placeId off each item.)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time

import requests

EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Al Ain",
            "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"]
BRAND_QUERIES = [
    ("Toyota", "Al-Futtaim Motors Toyota"),
    ("Lexus", "Al-Futtaim Lexus"),
    ("Honda", "Trading Enterprises Honda"),
    ("Volvo", "Trading Enterprises Volvo"),
    ("Jeep/Dodge/RAM", "Trading Enterprises Jeep"),
    ("BYD", "Al-Futtaim BYD"),
    ("Automall", "Al-Futtaim Automall"),
]
KEEP_HINTS = ("futtaim", "trading enterprises", "automall")


def search_maps(query, key, hl="en"):
    """Yield local_results across all pages for a Google Maps search query."""
    base = "https://serpapi.com/search.json"
    start = 0
    while True:
        params = {"engine": "google_maps", "type": "search", "q": query,
                  "hl": hl, "start": start, "api_key": key}
        r = requests.get(base, params=params, timeout=90)
        r.raise_for_status()
        data = r.json()
        results = data.get("local_results", [])
        if not results:
            break
        yield from results
        start += 20
        if start > 120:  # safety cap; Maps rarely returns more
            break
        time.sleep(1)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="config/places.discovered.json")
    args = ap.parse_args()

    key = os.environ.get("SERPAPI_KEY")
    if not key:
        sys.exit("Set $SERPAPI_KEY.")

    found = {}
    for brand, q in BRAND_QUERIES:
        for em in EMIRATES:
            query = f"{q} {em}"
            print(f"search: {query}")
            try:
                for res in search_maps(query, key):
                    title = (res.get("title") or "").lower()
                    addr = (res.get("address") or "").lower()
                    if not any(h in title or h in addr for h in KEEP_HINTS):
                        continue
                    data_id = res.get("data_id") or res.get("place_id") or ""
                    if not data_id or data_id in found:
                        continue
                    found[data_id] = {
                        "brand": brand,
                        "name": res.get("title", ""),
                        "emirate": em,
                        "area": res.get("address", ""),
                        "google_maps_query": res.get("title", ""),
                        "place_id": data_id,
                        "gps": res.get("gps_coordinates", {}),
                        "reviews_count": res.get("reviews", None),
                    }
            except Exception as e:  # noqa: BLE001
                print(f"   [error] {e}", file=sys.stderr)
            time.sleep(1)

    doc = {"company": "Al-Futtaim Automotive", "market": "UAE",
           "discovered": True, "count": len(found),
           "locations": list(found.values())}
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, ensure_ascii=False, indent=2)
    total = sum((p.get("reviews_count") or 0) for p in found.values())
    print(f"\n[ok] discovered {len(found)} locations -> {args.out}")
    print(f"[info] approx total reviews across them: {total:,}")


if __name__ == "__main__":
    main()
