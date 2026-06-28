"""
html_extractor.py — turn a KFS HTML page (bytes/str) into (a) visible text and
(b) the list of KFS document links it points at, then run the generic parser.

WHY STDLIB html.parser (not bs4)
--------------------------------
Some banks (e.g. Emirates NBD) publish a KFS *landing page* that both states some
terms inline and links out to per-card KFS PDFs. We need to: strip tags to get the
readable text, drop <script>/<style> noise, and harvest <a href> links that look
like KFS documents (so a higher layer can fetch them). The stdlib `html.parser`
does all of this with zero dependencies. We *guard* an optional bs4 import purely
as an upgrade path; the default path is pure-stdlib so the offline tests need
nothing installed.

Exposes:
  html_to_text(raw)  -> visible text
  extract_links(raw, base_url=None) -> [absolute-or-relative hrefs]
  HtmlKfsExtractor   -> records (parsing the inline text; link-following is the
                        orchestrator's job so fetching stays in one place)
"""

from __future__ import annotations

import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import urljoin

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from base import BaseExtractor, register  # noqa: E402
import generic_kfs  # noqa: E402

_SKIP_TAGS = {"script", "style", "head", "noscript", "svg", "template"}
_BLOCK_TAGS = {"p", "div", "br", "li", "tr", "table", "h1", "h2", "h3", "h4",
               "h5", "h6", "section", "header", "footer", "ul", "ol", "td", "th"}


class _TextLinkParser(HTMLParser):
    """Collect visible text (block-aware) and hyperlinks; ignore script/style."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self._skip_depth = 0
        self.text_parts: list[str] = []
        self.links: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag in _SKIP_TAGS:
            self._skip_depth += 1
        if tag == "a":
            for k, v in attrs:
                if k == "href" and v:
                    self.links.append(v.strip())
        if tag in _BLOCK_TAGS:
            self.text_parts.append("\n")

    def handle_endtag(self, tag):
        if tag in _SKIP_TAGS and self._skip_depth > 0:
            self._skip_depth -= 1
        if tag in _BLOCK_TAGS:
            self.text_parts.append("\n")

    def handle_data(self, data):
        if self._skip_depth == 0 and data and data.strip():
            self.text_parts.append(data)


def _to_str(raw) -> str:
    if isinstance(raw, (bytes, bytearray)):
        return bytes(raw).decode("utf-8", errors="replace")
    return raw


def _collapse_ws(text: str) -> str:
    # Collapse runs of spaces/tabs but keep newlines (the generic parser is
    # line-oriented, so newlines carry label/value association).
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def html_to_text(raw) -> str:
    """Strip tags to readable, line-structured visible text (stdlib parser)."""
    p = _TextLinkParser()
    p.feed(_to_str(raw))
    return _collapse_ws("".join(p.text_parts))


def extract_links(raw, base_url: str | None = None) -> list[str]:
    """Return hyperlinks; if base_url is given, resolve relative ones absolute.

    Filters lightly to links that plausibly point at a KFS document (pdf/doc, or a
    URL/anchor text mentioning 'kfs'/'key fact'), but keeps order and de-dupes.
    """
    p = _TextLinkParser()
    p.feed(_to_str(raw))
    out, seen = [], set()
    for href in p.links:
        absu = urljoin(base_url, href) if base_url else href
        if absu in seen:
            continue
        seen.add(absu)
        out.append(absu)
    return out


def kfs_document_links(raw, base_url: str | None = None) -> list[str]:
    """The subset of links that look like downloadable KFS documents."""
    candidates = extract_links(raw, base_url)
    keep = []
    for u in candidates:
        low = u.lower()
        if low.endswith((".pdf", ".doc", ".docx")) or "kfs" in low or "key-fact" in low \
                or "key_fact" in low or "keyfact" in low:
            keep.append(u)
    return keep


@register("html")
class HtmlKfsExtractor(BaseExtractor):
    """Parse a KFS HTML page's INLINE text into records via the generic parser.

    Following links to per-card PDFs is intentionally NOT done here (that needs a
    fetcher; keeping I/O in run.py/fetch.py means this stays unit-testable). The
    orchestrator can call `kfs_document_links` to discover and fetch those docs,
    then feed each to the pdf extractor.
    """

    name = "html"
    hints: dict = {}

    def card_hints_for_chunk(self, chunk: str, bank: dict, index: int) -> dict:
        return dict(self.hints)

    def extract(self, raw, bank: dict) -> list[dict]:
        text = html_to_text(raw)
        records = []
        for i, chunk in enumerate(generic_kfs.split_cards(text)):
            if not chunk.strip():
                continue
            hints = self.card_hints_for_chunk(chunk, bank, i)
            if "source_type" not in hints:
                hints["source_type"] = "kfs_html"
            rec = generic_kfs.parse_kfs_text(chunk, bank, hints)
            has_signal = (
                rec["rewards"]["tiers"]
                or rec["fees"]["annual_fee_aed"] is not None
                or rec["fees"]["interest"]["apr_pct"] is not None
                or rec["fees"]["interest"]["monthly_rate_pct"] is not None
            )
            if has_signal:
                records.append(rec)
        return records
