#!/usr/bin/env python3
"""
collect_google.py — collect EVERY Google Maps review for every Al-Futtaim
Automotive location, via a pluggable third-party provider.

Why a provider is required: Google's official Places API returns at most 5
reviews per location. To get the COMPLETE review history you must use a
scraping provider. Three are supported; pick whichever you have a key for:

    --provider apify       env: APIFY_TOKEN
    --provider outscraper  env: OUTSCRAPER_API_KEY
    --provider serpapi     env: SERPAPI_KEY

Each provider is called with full pagination so you get all reviews, not a
page. Output is written to data/google_reviews.jsonl in the shared schema.

Example:
    export SERPAPI_KEY=...
    python src/collect_google.py --provider serpapi \
        --places config/places.json --out data/google_reviews.jsonl \
        --max-per-place 0          # 0 = no cap, fetch them all

NOTE: this will NOT run inside the Claude Code web sandbox — its egress proxy
blocks api.apify.com / api.outscraper.com / serpapi.com (403 policy denial).
Run it on your own machine or CI.
"""
from __future__ import annotations

import argparse
import os
import sys
import time

import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common  # noqa: E402

UA = "alfuttaim-reviews-pipeline/1.0"


def http_get(url, params=None, headers=None, tries=5):
    for i in range(tries):
        try:
            r = requests.get(url, params=params, headers=headers, timeout=90)
            if r.status_code == 429:
                time.sleep(2 ** i)
                continue
            r.raise_for_status()
            return r.json()
        except Exception as e:  # noqa: BLE001
            if i == tries - 1:
                raise
            print(f"   [retry {i+1}] {e}", file=sys.stderr)
            time.sleep(2 ** i)
    return {}


def http_post(url, json_body, params=None, headers=None, tries=5, timeout=600):
    for i in range(tries):
        try:
            r = requests.post(url, json=json_body, params=params,
                              headers=headers, timeout=timeout)
            if r.status_code == 429:
                time.sleep(2 ** i)
                continue
            r.raise_for_status()
            return r.json()
        except Exception as e:  # noqa: BLE001
            if i == tries - 1:
                raise
            print(f"   [retry {i+1}] {e}", file=sys.stderr)
            time.sleep(2 ** i)
    return {}


# ----------------------------------------------------------------- SerpApi

def serpapi_reviews(place, key, max_reviews, lang):
    """Resolve a query -> data_id, then page through google_maps_reviews."""
    base = "https://serpapi.com/search.json"
    data_id = place.get("place_id") or ""
    if not data_id:
        meta = http_get(base, {"engine": "google_maps", "type": "search",
                               "q": place["google_maps_query"],
                               "hl": lang, "api_key": key})
        res = meta.get("place_results") or (meta.get("local_results") or [{}])[0]
        data_id = res.get("data_id", "")
        if not data_id:
            print(f"   [skip] no data_id for {place['name']}", file=sys.stderr)
            return
    token = None
    got = 0
    while True:
        params = {"engine": "google_maps_reviews", "data_id": data_id,
                  "hl": lang, "sort_by": "newestFirst", "api_key": key}
        if token:
            params["next_page_token"] = token
        data = http_get(base, params)
        for rv in data.get("reviews", []):
            yield common.Review(
                text=rv.get("snippet", "") or rv.get("extracted_snippet", {}).get("original", ""),
                source="google_maps", brand=place.get("brand", ""),
                location=place["name"], place_id=data_id,
                rating=rv.get("rating"), date=rv.get("iso_date", "")[:10],
                author=rv.get("user", {}).get("name", ""),
                url=rv.get("link", ""))
            got += 1
        token = (data.get("serpapi_pagination") or {}).get("next_page_token")
        if not token or (max_reviews and got >= max_reviews):
            break


# --------------------------------------------------------------- Outscraper

def outscraper_reviews(place, key, max_reviews, lang):
    """reviewsLimit=0 => ALL reviews. Handles async result polling."""
    url = "https://api.outscraper.com/maps/reviews-v3"
    headers = {"X-API-KEY": key, "User-Agent": UA}
    params = {"query": place.get("place_id") or place["google_maps_query"],
              "reviewsLimit": max_reviews or 0, "limit": 1,
              "sort": "newest", "language": lang, "async": "false"}
    data = http_get(url, params=params, headers=headers)
    # async fallback: provider returns a results_location to poll
    if data.get("status") == "Pending" and data.get("results_location"):
        loc = data["results_location"]
        for _ in range(120):
            time.sleep(5)
            data = http_get(loc, headers=headers)
            if data.get("status") == "Success":
                break
    for biz in data.get("data", []):
        for rv in biz.get("reviews_data", []):
            yield common.Review(
                text=rv.get("review_text", "") or "",
                source="google_maps", brand=place.get("brand", ""),
                location=place["name"],
                place_id=biz.get("place_id", "") or place.get("place_id", ""),
                rating=rv.get("review_rating"),
                date=str(rv.get("review_datetime_utc", ""))[:10],
                author=rv.get("author_title", ""),
                url=rv.get("review_link", ""))


# ------------------------------------------------------------------- Apify

def apify_reviews(place, key, max_reviews, lang):
    """Run the compass google-maps-reviews actor synchronously."""
    actor = "compass~google-maps-reviews-scraper"
    url = f"https://api.apify.com/v2/acts/{actor}/run-sync-get-dataset-items"
    body = {
        "language": lang,
        "maxReviews": max_reviews or 99999,
        "reviewsSort": "newest",
        "personalData": True,
    }
    if place.get("place_id"):
        body["placeIds"] = [place["place_id"]]
    else:
        body["searchStrings"] = [place["google_maps_query"]]
    items = http_post(url, body, params={"token": key})
    if isinstance(items, dict):  # error envelope
        print(f"   [apify] {items.get('error', items)}", file=sys.stderr)
        return
    for rv in items:
        yield common.Review(
            text=rv.get("text", "") or rv.get("textTranslated", "") or "",
            source="google_maps", brand=place.get("brand", ""),
            location=place["name"], place_id=rv.get("placeId", ""),
            rating=rv.get("stars"), date=str(rv.get("publishedAtDate", ""))[:10],
            author=rv.get("name", ""), url=rv.get("reviewUrl", ""))


PROVIDERS = {
    "serpapi": ("SERPAPI_KEY", serpapi_reviews),
    "outscraper": ("OUTSCRAPER_API_KEY", outscraper_reviews),
    "apify": ("APIFY_TOKEN", apify_reviews),
}


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--provider", required=True, choices=list(PROVIDERS))
    ap.add_argument("--places", default="config/places.json")
    ap.add_argument("--out", default="data/google_reviews.jsonl")
    ap.add_argument("--max-per-place", type=int, default=0,
                    help="0 = ALL reviews (recommended for completeness)")
    ap.add_argument("--lang", default="en")
    args = ap.parse_args()

    env_key, fn = PROVIDERS[args.provider]
    key = os.environ.get(env_key)
    if not key:
        sys.exit(f"Set ${env_key} for provider '{args.provider}'.")

    places = common.load_places(args.places)
    print(f"Collecting Google reviews for {len(places)} locations "
          f"via {args.provider} ...")

    all_reviews: list[common.Review] = []
    seen = set()
    for i, place in enumerate(places, 1):
        print(f"[{i}/{len(places)}] {place['name']}")
        try:
            n = 0
            for rv in fn(place, key, args.max_per_place, args.lang):
                k = rv.key()
                if k in seen:
                    continue
                seen.add(k)
                all_reviews.append(rv)
                n += 1
            print(f"      +{n} reviews (running total {len(all_reviews)})")
        except Exception as e:  # noqa: BLE001
            print(f"      [error] {e}", file=sys.stderr)

    common.write_jsonl(args.out, all_reviews)
    print(f"\n[ok] wrote {len(all_reviews)} reviews -> {args.out}")


if __name__ == "__main__":
    main()
