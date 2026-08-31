"""
Shared schema + JSONL helpers for the Al-Futtaim Automotive reviews pipeline.

Every collector (Google Maps, Reddit, ...) writes records in the SAME flat
schema below, one JSON object per line (JSONL). build_wordcloud.py then reads
any mix of those files. Keeping one schema is what lets the word-cloud engine
stay source-agnostic.
"""
from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass, asdict, field
from typing import Iterable, Iterator, Optional


# Canonical review record. Collectors should fill as much as they can;
# `text` is the only field the word-cloud engine strictly requires.
@dataclass
class Review:
    text: str                          # verbatim review / comment body
    source: str = ""                   # "google_maps" | "reddit" | ...
    brand: str = ""                    # "Toyota" | "Lexus" | "Honda" | ...
    location: str = ""                 # showroom / service-centre name
    place_id: str = ""                 # Google place_id (if known)
    rating: Optional[float] = None     # star rating 1-5 (Google) if present
    date: str = ""                     # ISO-8601 date if known
    lang: str = ""                     # "en" | "ar" | "" (auto if blank)
    author: str = ""                   # reviewer display name / redditor
    url: str = ""                      # permalink to the review/thread
    extra: dict = field(default_factory=dict)

    def key(self) -> str:
        """Stable dedup key: same author+source+first 120 chars => duplicate."""
        head = " ".join((self.text or "").split())[:120].lower()
        return f"{self.source}|{self.author.lower()}|{head}"


def write_jsonl(path: str, reviews: Iterable[Review]) -> int:
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    n = 0
    with open(path, "w", encoding="utf-8") as fh:
        for r in reviews:
            fh.write(json.dumps(asdict(r), ensure_ascii=False) + "\n")
            n += 1
    return n


def read_jsonl(path: str) -> Iterator[Review]:
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            d = json.loads(line)
            d.setdefault("extra", {})
            # tolerate unknown keys by funnelling them into extra
            known = Review.__dataclass_fields__.keys()
            extra = d.get("extra", {})
            for k in list(d.keys()):
                if k not in known:
                    extra[k] = d.pop(k)
            d["extra"] = extra
            yield Review(**d)


def iter_reviews(paths: Iterable[str], dedup: bool = True) -> Iterator[Review]:
    """Yield reviews from many files/dirs, optionally de-duplicated."""
    seen = set()
    for p in expand_paths(paths):
        for r in read_jsonl(p):
            if dedup:
                k = r.key()
                if k in seen:
                    continue
                seen.add(k)
            yield r


def expand_paths(paths: Iterable[str]) -> list[str]:
    out: list[str] = []
    for p in paths:
        if os.path.isdir(p):
            for name in sorted(os.listdir(p)):
                if name.endswith(".jsonl"):
                    out.append(os.path.join(p, name))
        elif os.path.exists(p):
            out.append(p)
        else:
            print(f"[warn] path not found: {p}", file=sys.stderr)
    return out


def load_places(path: str) -> list[dict]:
    """Flatten config/places.json into a list of location dicts."""
    with open(path, encoding="utf-8") as fh:
        doc = json.load(fh)
    return doc.get("locations", [])
