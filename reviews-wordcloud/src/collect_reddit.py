#!/usr/bin/env python3
"""
collect_reddit.py — collect Reddit posts AND comments mentioning Al-Futtaim
Automotive, across the UAE car subreddits and Reddit-wide.

Auth (create an app at https://www.reddit.com/prefs/apps -> "script"):
    export REDDIT_CLIENT_ID=...
    export REDDIT_CLIENT_SECRET=...
    export REDDIT_USER_AGENT="alfuttaim-reviews by u/yourname"

Run:
    python src/collect_reddit.py --places config/places.json \
        --out data/reddit_reviews.jsonl

Coverage note: Reddit's official search returns a bounded, recency-weighted
set per query (~250 results). For EXHAUSTIVE historical coverage ("last 20
years" — though r/dubai only dates to ~2010), add an archive backend such as
the Arctic Shift API (github.com/ArthurHeitmann/arctic_shift) or an academic
Pushshift mirror, then feed those IDs into fetch_submission() below. The
function is split out so an archive source can drop straight in.

NOTE: blocked by the Claude Code web sandbox egress proxy (oauth.reddit.com
returns 403). Run locally or in CI.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common  # noqa: E402

BRAND_HINTS = [
    "futtaim", "trading enterprises", "automall",
    "toyota", "lexus", "honda", "volvo", "byd",
]


def looks_relevant(text: str) -> bool:
    t = (text or "").lower()
    # require Al-Futtaim signal, not just a bare brand name
    if "futtaim" in t or "trading enterprises" in t or "automall" in t:
        return True
    return False


def fetch_submission(reddit, submission, brand_guess, out):
    """Emit one Review for the post body + one per comment."""
    out.append(common.Review(
        text=f"{submission.title}\n\n{submission.selftext}".strip(),
        source="reddit", brand=brand_guess,
        location=f"r/{submission.subreddit.display_name}",
        date=_iso(submission.created_utc),
        author=str(submission.author), rating=None,
        url="https://reddit.com" + submission.permalink,
        extra={"score": submission.score, "kind": "post"}))
    submission.comments.replace_more(limit=None)
    for c in submission.comments.list():
        body = getattr(c, "body", "")
        if not body or body in ("[deleted]", "[removed]"):
            continue
        out.append(common.Review(
            text=body, source="reddit", brand=brand_guess,
            location=f"r/{submission.subreddit.display_name}",
            date=_iso(c.created_utc), author=str(c.author), rating=None,
            url="https://reddit.com" + c.permalink,
            extra={"score": c.score, "kind": "comment"}))


def _iso(epoch):
    from datetime import datetime, timezone
    try:
        return datetime.fromtimestamp(epoch, tz=timezone.utc).date().isoformat()
    except Exception:
        return ""


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--places", default="config/places.json")
    ap.add_argument("--out", default="data/reddit_reviews.jsonl")
    ap.add_argument("--limit", type=int, default=250, help="max results per query")
    ap.add_argument("--all-comments", action="store_true", default=True,
                    help="fetch full comment trees (default on)")
    args = ap.parse_args()

    try:
        import praw
    except ImportError:
        sys.exit("pip install praw")

    cid = os.environ.get("REDDIT_CLIENT_ID")
    csec = os.environ.get("REDDIT_CLIENT_SECRET")
    ua = os.environ.get("REDDIT_USER_AGENT", "alfuttaim-reviews/1.0")
    if not (cid and csec):
        sys.exit("Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET.")
    reddit = praw.Reddit(client_id=cid, client_secret=csec, user_agent=ua)
    reddit.read_only = True

    with open(args.places, encoding="utf-8") as fh:
        cfg = json.load(fh)
    targets = cfg.get("reddit_targets", {})
    subs = targets.get("subreddits", ["dubai", "UAE"])
    queries = targets.get("queries", ["Al-Futtaim"])

    out: list[common.Review] = []
    seen_posts = set()

    def handle(submission):
        if submission.id in seen_posts:
            return
        seen_posts.add(submission.id)
        guess = next((b for b in ("Toyota", "Lexus", "Honda", "Volvo", "BYD")
                      if b.lower() in (submission.title + submission.selftext).lower()), "")
        fetch_submission(reddit, submission, guess, out)

    # 1) targeted: each query within each UAE subreddit
    for sub in subs:
        for q in queries:
            print(f"r/{sub}  q='{q}'")
            try:
                for s in reddit.subreddit(sub).search(q, limit=args.limit,
                                                       sort="relevance"):
                    if looks_relevant(s.title + " " + s.selftext):
                        handle(s)
            except Exception as e:  # noqa: BLE001
                print(f"   [error] {e}", file=sys.stderr)

    # 2) reddit-wide: catch mentions outside the UAE subs
    for q in ("Al-Futtaim Motors", "Trading Enterprises Honda", "Al Futtaim Automall"):
        print(f"r/all  q='{q}'")
        try:
            for s in reddit.subreddit("all").search(q, limit=args.limit):
                if looks_relevant(s.title + " " + s.selftext):
                    handle(s)
        except Exception as e:  # noqa: BLE001
            print(f"   [error] {e}", file=sys.stderr)

    common.write_jsonl(args.out, out)
    posts = sum(1 for r in out if r.extra.get("kind") == "post")
    print(f"\n[ok] {posts} posts + {len(out)-posts} comments -> {args.out}")


if __name__ == "__main__":
    main()
