"""
extractors package — importing it registers every KFS adapter.

The orchestrator (run.py) does `import extractors` (or `from extractors import
build`) and then `base.build(name)` to get the right adapter for a bank. Importing
this package pulls in each concrete module, whose `@register(...)` decorators
populate base._REGISTRY. Order matters only in that `base` must come first.

Optional-dependency modules (pdf_extractor) are written so that *importing* them
never fails when pdfplumber/pypdf/pdftotext are absent — the dependency is probed
lazily at extraction time — so it is safe to import them all here.
"""

from __future__ import annotations

import os
import sys

# Make sibling modules importable whether this package is imported as
# `kfs.pipeline.extractors` or via a sys.path that points at `kfs/pipeline`.
_HERE = os.path.dirname(os.path.abspath(__file__))
_PIPELINE = os.path.dirname(_HERE)
for _p in (_PIPELINE, _HERE):
    if _p not in sys.path:
        sys.path.insert(0, _p)

import base  # noqa: E402
from base import (  # noqa: E402,F401
    BaseExtractor, register, get_extractor, registry, build,
)

# Import side-effects register the adapters.
import generic_kfs   # noqa: E402,F401  registers "generic_kfs"
import pdf_extractor  # noqa: E402,F401  registers "pdf"
import html_extractor  # noqa: E402,F401  registers "html"
import fab            # noqa: E402,F401  registers "fab"
import enbd           # noqa: E402,F401  registers "enbd"

# IMPORTANT: the modules above are imported by their FLAT names (`base`,
# `generic_kfs`, ...), matching the repo's sys.path-injection convention (cf.
# value_engine). Without the aliases below, `from extractors import base` would
# import a SECOND, distinct module object whose extractor registry is empty —
# a subtle footgun. Bind the package-qualified submodule names to the very same
# flat module objects so `extractors.base is base`, and there is exactly one
# registry no matter how callers import.
for _name, _mod in (
    ("base", base), ("generic_kfs", generic_kfs), ("pdf_extractor", pdf_extractor),
    ("html_extractor", html_extractor), ("fab", fab), ("enbd", enbd),
):
    sys.modules[__name__ + "." + _name] = _mod

__all__ = [
    "BaseExtractor", "register", "get_extractor", "registry", "build",
    "base", "generic_kfs", "pdf_extractor", "html_extractor", "fab", "enbd",
]
