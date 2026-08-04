"""
fab.py — First Abu Dhabi Bank adapter.

FAB publishes a single CONSOLIDATED KFS PDF covering many credit cards. After PDF
text extraction the document is one long blob with a section per card. This adapter
is a thin subclass of the PDF extractor that:

  * supplies FAB-specific hints (Visa, source_type kfs_pdf, FAB provenance),
  * tries to name each card section from its header, and
  * applies the CBUAE fee caps as defaults ONLY where the consolidated table did
    not yield a value (late AED 230, over-limit AED 273.50) — flagged in
    provenance as "CBUAE cap default".

Almost all real parsing is reused from generic_kfs; the value of the adapter is the
layout hints and per-section naming, exactly as the task intends.
"""

from __future__ import annotations

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from base import register  # noqa: E402
from pdf_extractor import PdfKfsExtractor  # noqa: E402

# CBUAE-capped fees used only as last-resort defaults (never override an extracted
# value). These mirror the caps cited across kfs/data/cards.json.
_FAB_DEFAULTS = {
    "fees.late_payment_fee_aed": 230.0,
    "fees.over_limit_fee_aed": 273.50,
}


def _card_name_from_header(chunk: str) -> str | None:
    """Pull a plausible FAB card name from the first lines of a section."""
    for line in chunk.splitlines():
        s = line.strip()
        if not s:
            continue
        # "Product/Card Name: ..." style takes precedence.
        m = re.search(r"(?:product|card)\s+name\s*[:\-]\s*(.+)", s, re.IGNORECASE)
        if m:
            return m.group(1).strip()
        # A bare header like "FAB Cashback Card" / "FAB Islamic Cashback Card".
        if re.search(r"\bFAB\b.*\bcard\b", s, re.IGNORECASE) and len(s) <= 60:
            return s
        break  # only inspect the first non-empty line
    return None


@register("fab")
class FabKfsExtractor(PdfKfsExtractor):
    """FAB consolidated-PDF adapter (subclasses the generic PDF extractor)."""

    name = "fab"
    hints = {
        "network": "Visa",
        "source_type": "kfs_pdf",
        "provenance_extra": "FAB consolidated KFS PDF; bank-specific hints applied",
    }

    def card_hints_for_chunk(self, chunk: str, bank: dict, index: int) -> dict:
        hints = dict(self.hints)
        name = _card_name_from_header(chunk)
        if name:
            hints["card_name"] = name
            if re.search(r"islamic", name, re.IGNORECASE):
                hints["card_type"] = "islamic"
                hints["islamic"] = True
        hints["defaults"] = dict(_FAB_DEFAULTS)
        return hints
