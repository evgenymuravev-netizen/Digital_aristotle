"""
pdf_extractor.py — turn a KFS PDF (bytes) into plain text, then delegate to the
generic field parser.

DEPENDENCY POLICY (matches the repo's dependency-light ethos)
-------------------------------------------------------------
PDF text extraction has no good stdlib option, so we try, in order:
  1. pdfplumber  (best layout fidelity for tables)
  2. pypdf       (pure-python, widely available)
  3. `pdftotext` (poppler CLI, via subprocess — uses -layout to keep columns)
and degrade gracefully: if NONE is available, `pdf_to_text` raises a clear
PdfBackendUnavailable telling the user what to install. None of these is imported
at module load — they're probed lazily inside the function — so importing this
module never fails on a machine without them (the offline tests don't touch PDFs).
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from base import BaseExtractor, register  # noqa: E402
import generic_kfs  # noqa: E402


class PdfBackendUnavailable(RuntimeError):
    """Raised when no PDF text backend (pdfplumber / pypdf / pdftotext) exists."""


def _try_pdfplumber(data: bytes):
    try:
        import pdfplumber  # type: ignore
    except Exception:
        return None
    import io
    out = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page in pdf.pages:
            out.append(page.extract_text() or "")
    return "\n".join(out)


def _try_pypdf(data: bytes):
    reader_cls = None
    try:  # modern package
        from pypdf import PdfReader as reader_cls  # type: ignore
    except Exception:
        try:  # legacy package name
            from PyPDF2 import PdfReader as reader_cls  # type: ignore
        except Exception:
            reader_cls = None
    if reader_cls is None:
        return None
    import io
    reader = reader_cls(io.BytesIO(data))
    return "\n".join((page.extract_text() or "") for page in reader.pages)


def _try_pdftotext(data: bytes):
    exe = shutil.which("pdftotext")
    if not exe:
        return None
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tf:
        tf.write(data)
        pdf_path = tf.name
    try:
        # -layout preserves columnar structure, important for KFS fee tables.
        proc = subprocess.run(
            [exe, "-layout", "-q", pdf_path, "-"],
            capture_output=True, timeout=60,
        )
        if proc.returncode == 0:
            return proc.stdout.decode("utf-8", errors="replace")
        return None
    finally:
        try:
            os.unlink(pdf_path)
        except OSError:
            pass


def pdf_to_text(data: bytes) -> str:
    """Extract text from PDF bytes using the first available backend.

    Raises PdfBackendUnavailable if none of pdfplumber / pypdf / pdftotext works.
    """
    if not isinstance(data, (bytes, bytearray)):
        raise TypeError("pdf_to_text expects bytes")
    for backend in (_try_pdfplumber, _try_pypdf, _try_pdftotext):
        try:
            text = backend(bytes(data))
        except Exception:
            text = None
        if text and text.strip():
            return text
    raise PdfBackendUnavailable(
        "No PDF text backend available. Install one of: "
        "`pip install pdfplumber`, `pip install pypdf`, or the poppler "
        "`pdftotext` CLI (e.g. `apt-get install poppler-utils`)."
    )


@register("pdf")
class PdfKfsExtractor(BaseExtractor):
    """Extract text from a PDF, then run the generic KFS parser over it.

    Used by banks whose KFS is a PDF (kfs_source_type == 'kfs_pdf'). Bank-specific
    PDF adapters (e.g. fab.py) subclass this to add `hints` / chunking.
    """

    name = "pdf"
    hints: dict = {}

    def card_hints_for_chunk(self, chunk: str, bank: dict, index: int) -> dict:
        return dict(self.hints)

    def extract(self, raw, bank: dict) -> list[dict]:
        # raw may already be decoded text (e.g. a .txt fixture) — only run the PDF
        # backend when we were genuinely handed PDF bytes.
        if isinstance(raw, (bytes, bytearray)) and bytes(raw[:5]) == b"%PDF-":
            text = pdf_to_text(bytes(raw))
        else:
            text = self._as_text(raw)
        records = []
        for i, chunk in enumerate(generic_kfs.split_cards(text)):
            if not chunk.strip():
                continue
            hints = self.card_hints_for_chunk(chunk, bank, i)
            if "source_type" not in hints:
                hints["source_type"] = "kfs_pdf"
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
