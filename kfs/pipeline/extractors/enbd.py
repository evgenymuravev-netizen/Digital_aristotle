"""
enbd.py — Emirates NBD adapter.

Emirates NBD's KFS is an HTML page that states some headline terms inline and links
out to per-card KFS documents. This adapter subclasses the HTML extractor to:

  * parse the inline page text with ENBD hints (Visa, source_type kfs_html), and
  * apply CBUAE fee caps as last-resort defaults (same policy as the FAB adapter).

Link-following (fetching the linked per-card PDFs and running pdf_extractor over
them) is orchestrated in run.py via html_extractor.kfs_document_links, so all
network I/O stays in one place and this adapter remains unit-testable offline.
"""

from __future__ import annotations

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from base import register  # noqa: E402
from html_extractor import HtmlKfsExtractor  # noqa: E402

_ENBD_DEFAULTS = {
    "fees.late_payment_fee_aed": 230.0,
    "fees.over_limit_fee_aed": 273.50,
}


def _card_name_from_text(chunk: str) -> str | None:
    for line in chunk.splitlines():
        s = line.strip()
        if not s:
            continue
        if re.search(r"emirates\s+nbd.*\bcard\b", s, re.IGNORECASE) and len(s) <= 70:
            return s
        m = re.search(r"(?:product|card)\s+name\s*[:\-]\s*(.+)", s, re.IGNORECASE)
        if m:
            return m.group(1).strip()
        break
    return None


@register("enbd")
class EnbdKfsExtractor(HtmlKfsExtractor):
    """Emirates NBD HTML-KFS adapter (subclasses the generic HTML extractor)."""

    name = "enbd"
    hints = {
        "network": "Visa",
        "source_type": "kfs_html",
        "provenance_extra": "Emirates NBD HTML KFS page; bank-specific hints applied",
    }

    def card_hints_for_chunk(self, chunk: str, bank: dict, index: int) -> dict:
        hints = dict(self.hints)
        name = _card_name_from_text(chunk)
        if name:
            hints["card_name"] = name
        hints["defaults"] = dict(_ENBD_DEFAULTS)
        return hints
