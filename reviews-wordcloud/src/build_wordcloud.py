#!/usr/bin/env python3
"""
build_wordcloud.py — turn a corpus of reviews (JSONL) into a word cloud.

This is the source-agnostic analysis engine. Point it at any mix of JSONL
files produced by the collectors and it will:

  1. load + de-duplicate reviews
  2. (optionally) filter by date range  -> "last N years"
  3. tokenize English AND Arabic text separately
  4. drop stopwords (English + Arabic + brand/boilerplate noise)
  5. count word (and optional bigram) frequencies
  6. render a PNG word cloud and write frequencies.csv / stats.json

Usage:
    python src/build_wordcloud.py data/reviews.sample.jsonl \
        --out output --since 2006-01-01 --max-words 200 --ngram 1

Accuracy notes:
  * De-duplication is on by default (same author+source+text head).
  * Brand names (toyota, lexus, alfuttaim, ...) are treated as stopwords by
    default because they swamp the cloud without adding insight. Pass
    --include-brands to keep them.
  * Arabic glyphs only RENDER if you supply an Arabic-capable TTF via --font
    (e.g. NotoNaskhArabic). Arabic frequencies are always written to the CSV
    regardless, so no data is lost even without the font.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
from collections import Counter
from datetime import date

# local import whether run as module or script
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common  # noqa: E402

# ---------------------------------------------------------------- tokenizing

# Latin word: letters (incl. accented), length handled later.
LATIN_RE = re.compile(r"[a-zA-ZÀ-ÿ]+")
# Arabic word: Arabic Unicode block.
ARABIC_RE = re.compile(r"[؀-ۿݐ-ݿ]+")
URL_RE = re.compile(r"https?://\S+|www\.\S+")
HARAKAT_RE = re.compile(r"[ؗ-ًؚ-ْٰ]")  # Arabic diacritics


def load_wordlist(path: str) -> set[str]:
    if not path or not os.path.exists(path):
        return set()
    out = set()
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            w = line.strip()
            if w and not w.startswith("#"):
                out.add(w.lower())
    return out


def english_stopwords(extra_paths: list[str], include_brands: bool) -> set[str]:
    try:
        from wordcloud import STOPWORDS
        sw = set(w.lower() for w in STOPWORDS)
    except Exception:
        sw = set()
    # generic review filler the default list misses
    sw |= {
        "im", "ive", "id", "dont", "didnt", "doesnt", "cant", "couldnt",
        "wont", "wasnt", "werent", "isnt", "arent", "hasnt", "havent",
        "got", "get", "getting", "really", "very", "just", "also", "even",
        "would", "could", "should", "one", "two", "go", "going", "went",
        "back", "told", "said", "say", "says", "etc", "thing", "things",
        "much", "many", "lot", "lots", "way", "make", "made", "want",
        "take", "took", "give", "gave", "see", "still", "well", "good",
        "day", "days", "time", "times", "today", "us", "u", "the",
    }
    for p in extra_paths:
        sw |= load_wordlist(p)
    if include_brands:
        sw -= BRAND_TERMS
    else:
        sw |= BRAND_TERMS
    return sw


# Brand / company terms — dominate the cloud but carry no sentiment signal.
BRAND_TERMS = {
    "al", "alfuttaim", "futtaim", "automotive", "motors", "toyota", "lexus",
    "honda", "volvo", "byd", "jeep", "dodge", "chrysler", "ram", "hino",
    "automall", "trading", "enterprises", "dealership", "dealer", "showroom",
    "uae", "dubai", "abu", "dhabi", "sharjah", "ajman", "fujairah", "rak",
    "emirates", "car", "cars", "vehicle", "vehicles",
}


def tokenize(text: str, min_len: int) -> tuple[list[str], list[str]]:
    """Return (latin_tokens, arabic_tokens)."""
    text = URL_RE.sub(" ", text or "")
    latin = [t.lower() for t in LATIN_RE.findall(text) if len(t) >= min_len]
    ar_raw = ARABIC_RE.findall(HARAKAT_RE.sub("", text))
    arabic = [t for t in ar_raw if len(t) >= 2]
    return latin, arabic


def bigrams(tokens: list[str], stop: set[str]) -> list[str]:
    out = []
    for a, b in zip(tokens, tokens[1:]):
        if a in stop or b in stop:
            continue
        out.append(f"{a} {b}")
    return out


# ---------------------------------------------------------------- date filter

def in_range(d: str, since: date | None, until: date | None) -> bool:
    if not (since or until):
        return True
    if not d:
        return True  # keep undated reviews rather than silently dropping data
    try:
        dt = date.fromisoformat(d[:10])
    except ValueError:
        return True
    if since and dt < since:
        return False
    if until and dt > until:
        return False
    return True


# ---------------------------------------------------------------- rendering

ARABIC_FONTS = [
    "/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf",
    "/usr/share/fonts/truetype/amiri/Amiri-Regular.ttf",
    "/usr/share/fonts/truetype/kacst/KacstOne.ttf",
]
LATIN_FONTS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]


def pick_font(explicit: str | None) -> tuple[str | None, bool]:
    """Return (font_path, font_can_render_arabic)."""
    if explicit and os.path.exists(explicit):
        return explicit, True  # trust an explicitly supplied font
    for c in ARABIC_FONTS:
        if os.path.exists(c):
            return c, True
    for c in LATIN_FONTS:
        if os.path.exists(c):
            return c, False
    return None, False  # wordcloud falls back to its bundled latin font


def render(freqs: dict[str, int], out_png: str, args, has_arabic: bool):
    try:
        from wordcloud import WordCloud
    except Exception as e:
        print(f"[warn] wordcloud not installed, skipping PNG: {e}", file=sys.stderr)
        return
    font, font_has_arabic = pick_font(args.font)
    if has_arabic and font_has_arabic:
        try:
            import arabic_reshaper
            from bidi.algorithm import get_display
            freqs = {
                (get_display(arabic_reshaper.reshape(t)) if ARABIC_RE.search(t) else t): c
                for t, c in freqs.items()
            }
        except Exception as e:
            print(f"[warn] arabic reshaping unavailable: {e}", file=sys.stderr)
    elif has_arabic and not font_has_arabic:
        # No Arabic glyphs available -> would render as boxes. Keep Arabic in
        # frequencies.csv (already written) but drop it from the PNG.
        dropped = sum(1 for t in freqs if ARABIC_RE.search(t))
        freqs = {t: c for t, c in freqs.items() if not ARABIC_RE.search(t)}
        if dropped:
            print(f"[warn] no Arabic font found -> excluded {dropped} Arabic "
                  f"terms from PNG (still in frequencies.csv). Pass --font "
                  f"/path/to/NotoNaskhArabic-Regular.ttf to render them.",
                  file=sys.stderr)
    wc = WordCloud(
        width=args.width, height=args.height,
        background_color=args.bg, max_words=args.max_words,
        prefer_horizontal=0.9, collocations=False,
        font_path=font, colormap=args.colormap, relative_scaling=0.5,
        min_font_size=8,
    )
    wc.generate_from_frequencies(freqs)
    wc.to_file(out_png)
    print(f"[ok] wrote {out_png}  (font: {font or 'default'})")


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description="Build a word cloud from review JSONL.")
    ap.add_argument("inputs", nargs="+", help="JSONL files and/or directories")
    ap.add_argument("--out", default="output", help="output directory")
    ap.add_argument("--since", help="ISO date lower bound (e.g. 2006-01-01)")
    ap.add_argument("--until", help="ISO date upper bound")
    ap.add_argument("--min-len", type=int, default=3, help="min latin token length")
    ap.add_argument("--ngram", type=int, default=1, choices=[1, 2],
                    help="1=words, 2=also count bigrams")
    ap.add_argument("--max-words", type=int, default=200)
    ap.add_argument("--top", type=int, default=100, help="rows in frequencies.csv preview")
    ap.add_argument("--width", type=int, default=1600)
    ap.add_argument("--height", type=int, default=900)
    ap.add_argument("--bg", default="white")
    ap.add_argument("--colormap", default="viridis")
    ap.add_argument("--font", help="path to a TTF (Arabic-capable for AR rendering)")
    ap.add_argument("--stopwords", action="append", default=[],
                    help="extra stopword file(s)")
    ap.add_argument("--arabic-stopwords",
                    default=os.path.join(os.path.dirname(__file__), "..",
                                         "config", "arabic_stopwords.txt"))
    ap.add_argument("--include-brands", action="store_true",
                    help="keep brand/company/geo terms in the cloud")
    ap.add_argument("--no-dedup", action="store_true")
    args = ap.parse_args()

    since = date.fromisoformat(args.since) if args.since else None
    until = date.fromisoformat(args.until) if args.until else None

    default_extra = os.path.join(os.path.dirname(__file__), "..",
                                 "config", "stopwords_extra.txt")
    en_stop = english_stopwords([default_extra, *args.stopwords], args.include_brands)
    ar_stop = load_wordlist(args.arabic_stopwords)

    counts: Counter[str] = Counter()
    n_reviews = n_used = 0
    ratings: list[float] = []
    by_source: Counter[str] = Counter()
    by_brand: Counter[str] = Counter()
    dates: list[str] = []
    has_arabic = False

    for r in common.iter_reviews(args.inputs, dedup=not args.no_dedup):
        n_reviews += 1
        if not in_range(r.date, since, until):
            continue
        if not (r.text and r.text.strip()):
            continue
        n_used += 1
        by_source[r.source or "?"] += 1
        by_brand[r.brand or "?"] += 1
        if isinstance(r.rating, (int, float)):
            ratings.append(float(r.rating))
        if r.date:
            dates.append(r.date[:10])

        latin, arabic = tokenize(r.text, args.min_len)
        latin = [t for t in latin if t not in en_stop]
        arabic = [t for t in arabic if t not in ar_stop]
        if arabic:
            has_arabic = True
        counts.update(latin)
        counts.update(arabic)
        if args.ngram == 2:
            counts.update(bigrams(latin, en_stop))

    os.makedirs(args.out, exist_ok=True)

    # frequencies.csv (full) + top preview
    csv_path = os.path.join(args.out, "frequencies.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["rank", "term", "count"])
        for i, (term, c) in enumerate(counts.most_common(), 1):
            w.writerow([i, term, c])

    stats = {
        "reviews_seen": n_reviews,
        "reviews_used": n_used,
        "unique_terms": len(counts),
        "total_tokens": sum(counts.values()),
        "avg_rating": round(sum(ratings) / len(ratings), 3) if ratings else None,
        "rating_n": len(ratings),
        "date_min": min(dates) if dates else None,
        "date_max": max(dates) if dates else None,
        "by_source": dict(by_source),
        "by_brand": dict(by_brand.most_common()),
        "top_terms": counts.most_common(args.top),
        "filters": {"since": args.since, "until": args.until,
                    "include_brands": args.include_brands, "ngram": args.ngram},
    }
    with open(os.path.join(args.out, "stats.json"), "w", encoding="utf-8") as fh:
        json.dump(stats, fh, ensure_ascii=False, indent=2)

    render(dict(counts.most_common(args.max_words)),
           os.path.join(args.out, "wordcloud.png"), args, has_arabic)

    print(f"[ok] reviews used: {n_used}/{n_reviews}  unique terms: {len(counts)}")
    print(f"[ok] wrote {csv_path} and stats.json")
    print("Top 25 terms:")
    for term, c in counts.most_common(25):
        print(f"   {c:6d}  {term}")


if __name__ == "__main__":
    main()
