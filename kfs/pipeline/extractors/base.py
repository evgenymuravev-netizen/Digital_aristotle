"""
base.py — the extractor interface every KFS adapter implements, plus a tiny
name -> class registry the orchestrator uses to route a bank to its adapter.

DESIGN
------
A KFS arrives as raw bytes (a PDF) or text/HTML. An *extractor* turns that into a
list of normalized card records (the kfs/data/schema.json shape). We separate two
concerns:

  1. SOURCE shape  (PDF vs HTML)         -> PdfKfsExtractor / HtmlKfsExtractor
                                            (they only know how to get plain text)
  2. CONTENT parsing (label -> field)    -> generic_kfs.parse_kfs_text(...)
                                            (the heuristic that finds fees/rewards)

Bank-specific adapters (fab.py, enbd.py) subclass the source extractor and pass
bank-specific *hints* down to the generic parser, but contain almost no logic of
their own — that is the whole point of the CBUAE-standardized KFS format.

The registry is a plain dict so adding a bank adapter is a one-line decorator.
"""

from __future__ import annotations

import abc
from typing import Callable, Optional, Type, Union

Raw = Union[bytes, str]


class BaseExtractor(abc.ABC):
    """Abstract base for all KFS extractors.

    Subclasses implement `extract(raw, bank) -> list[dict]`, returning records
    that already pass through normalize.coerce_record (so they satisfy the
    schema's required keys). `name` is the registry key referenced by
    banks.json's `extractor` field.
    """

    #: registry key; must be set by concrete subclasses
    name: str = "base"

    #: optional per-adapter hints handed to the generic text parser
    hints: dict = {}

    @abc.abstractmethod
    def extract(self, raw: Raw, bank: dict) -> list[dict]:
        """Parse raw KFS content for one bank into normalized card records.

        Args:
            raw:  bytes (PDF) or str/bytes (HTML/text) as returned by fetch().
            bank: the banks.json entry (id, name, type, kfs_url, ...). Used to
                  stamp provenance and seed bank id/name onto each record.

        Returns:
            list of normalized records (possibly empty). Implementations MUST run
            each record through normalize.coerce_record before returning so the
            output is schema-shaped and safe to serialize.
        """
        raise NotImplementedError

    # -- small shared helpers ------------------------------------------------ #
    @staticmethod
    def _as_text(raw: Raw, encoding: str = "utf-8") -> str:
        """Decode bytes to text leniently; pass str through unchanged."""
        if isinstance(raw, bytes):
            return raw.decode(encoding, errors="replace")
        return raw

    @staticmethod
    def bank_stub(bank: dict) -> dict:
        """The {id, name, type} sub-object every record carries for `bank`."""
        stub = {"id": bank.get("id", "unknown"), "name": bank.get("name", "Unknown")}
        if bank.get("type") in ("national", "foreign", "wholesale", "digital"):
            stub["type"] = bank["type"]
        return stub


# --------------------------------------------------------------------------- #
# Registry
# --------------------------------------------------------------------------- #
_REGISTRY: dict[str, Type[BaseExtractor]] = {}


def register(name: str) -> Callable[[Type[BaseExtractor]], Type[BaseExtractor]]:
    """Class decorator: register an extractor under `name` (its banks.json key)."""
    def _wrap(cls: Type[BaseExtractor]) -> Type[BaseExtractor]:
        cls.name = name
        _REGISTRY[name] = cls
        return cls
    return _wrap


def get_extractor(name: str) -> Optional[Type[BaseExtractor]]:
    """Look up an extractor class by name, or None if not registered."""
    return _REGISTRY.get(name)


def registry() -> dict[str, Type[BaseExtractor]]:
    """The live registry (read-only view by convention)."""
    return dict(_REGISTRY)


def build(name: str, default: str = "generic_kfs") -> BaseExtractor:
    """Instantiate the named extractor, falling back to `default` if unknown.

    Importing this module does NOT import the concrete extractors (to avoid a
    cycle); the orchestrator imports the `extractors` package, whose __init__
    pulls in every adapter and thus populates the registry before build() runs.
    """
    cls = _REGISTRY.get(name) or _REGISTRY.get(default)
    if cls is None:
        raise KeyError(
            f"No extractor '{name}' (and default '{default}') registered. "
            f"Known: {sorted(_REGISTRY)}"
        )
    return cls()
