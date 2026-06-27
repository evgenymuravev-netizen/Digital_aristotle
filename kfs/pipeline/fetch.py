"""
fetch.py — a polite, dependency-light fetcher for KFS documents.

GOALS
-----
Be a good web citizen when run against real bank sites (in the user's own
environment, where those hosts are reachable), and be fully exercisable OFFLINE in
CI / this sandbox (where outbound HTTPS to banks is blocked) by reading from
local fixtures instead.

POLITENESS / CORRECTNESS FEATURES
  * realistic browser User-Agent (some bank WAFs reject the default urllib UA),
  * connect/read timeout,
  * retry with exponential backoff + jitter on transient (5xx / network) errors,
  * on-disk cache under cache/ keyed by a hash of the URL (so re-runs don't
    re-hit the origin),
  * an `offline` switch that resolves a URL to a file in fixtures/ instead of the
    network (used by run.py --offline and by the tests),
  * a content-type sniff so callers can route bytes to the PDF vs HTML extractor.

ROBOTS AWARENESS
  This module ships a best-effort robots.txt check (`robots_allows`) using the
  stdlib `urllib.robotparser`. KFS pages are public regulatory disclosures, but
  the courteous default is to honour robots and to rate-limit. The orchestrator
  calls a single URL per bank at human pace, so we keep this lightweight: callers
  SHOULD check `robots_allows(url)` before a live fetch. (It is not invoked
  automatically inside `fetch()` to avoid surprising extra network calls; see the
  `respect_robots` flag.)

PURE STDLIB. `requests` is supported as an optional fast path but guarded — its
absence never breaks anything.
"""

from __future__ import annotations

import hashlib
import os
import random
import time
import urllib.error
import urllib.request
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(HERE, "cache")
FIXTURES_DIR = os.path.join(HERE, "fixtures")

# A current-ish desktop Chrome UA. Bank WAFs frequently 403 the stdlib default.
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
DEFAULT_TIMEOUT = 30.0
DEFAULT_RETRIES = 3

# Map a bank id (or URL) to a local fixture file for --offline runs. run.py also
# consults this; keeping it here means fetch() is self-contained offline.
OFFLINE_FIXTURES: dict[str, str] = {
    "fab": "fab_consolidated.txt",
    "enbd": "enbd_cashback.txt",
}


# --------------------------------------------------------------------------- #
# Cache helpers
# --------------------------------------------------------------------------- #
def _cache_key(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:32]


def _cache_path(url: str) -> str:
    return os.path.join(CACHE_DIR, _cache_key(url) + ".bin")


def _read_cache(url: str):
    p = _cache_path(url)
    if os.path.exists(p):
        with open(p, "rb") as f:
            return f.read()
    return None


def _write_cache(url: str, data: bytes) -> None:
    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(_cache_path(url), "wb") as f:
        f.write(data)


# --------------------------------------------------------------------------- #
# Offline resolution
# --------------------------------------------------------------------------- #
def _fixture_for(url: str) -> str | None:
    """Resolve a URL (or bank id) to a fixture file path, or None.

    Matching is permissive: an exact bank-id key, or a substring of the URL host
    that matches a known bank id, or a fixtures/<basename> that exists.
    """
    # direct bank-id key
    if url in OFFLINE_FIXTURES:
        cand = os.path.join(FIXTURES_DIR, OFFLINE_FIXTURES[url])
        return cand if os.path.exists(cand) else None
    host = (urlparse(url).netloc or "").lower()
    for key, fname in OFFLINE_FIXTURES.items():
        if key in host or key in url.lower():
            cand = os.path.join(FIXTURES_DIR, fname)
            if os.path.exists(cand):
                return cand
    # last resort: a fixture literally named after the URL basename
    base = os.path.basename(urlparse(url).path)
    if base:
        cand = os.path.join(FIXTURES_DIR, base)
        if os.path.exists(cand):
            return cand
    return None


def _read_offline(url: str) -> bytes:
    path = _fixture_for(url)
    if not path:
        raise FileNotFoundError(
            f"No offline fixture for '{url}'. Add it to fetch.OFFLINE_FIXTURES "
            f"and drop the file in {FIXTURES_DIR}/."
        )
    with open(path, "rb") as f:
        return f.read()


# --------------------------------------------------------------------------- #
# Robots awareness
# --------------------------------------------------------------------------- #
def robots_allows(url: str, user_agent: str = USER_AGENT, timeout: float = DEFAULT_TIMEOUT) -> bool:
    """Best-effort robots.txt check. Returns True if allowed OR unknown.

    Fails OPEN (returns True) when robots.txt can't be fetched, because a missing
    or unreachable robots file is conventionally treated as "no restrictions".
    Callers wanting strict behaviour can treat exceptions as deny themselves.
    """
    try:
        parts = urlparse(url)
        robots_url = f"{parts.scheme}://{parts.netloc}/robots.txt"
        rp = RobotFileParser()
        req = urllib.request.Request(robots_url, headers={"User-Agent": user_agent})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            rp.parse(resp.read().decode("utf-8", errors="replace").splitlines())
        return rp.can_fetch(user_agent, url)
    except Exception:
        return True


# --------------------------------------------------------------------------- #
# Content-type sniff
# --------------------------------------------------------------------------- #
def sniff_content_type(data: bytes, url: str = "", header_ct: str | None = None) -> str:
    """Return 'pdf', 'html', or 'text' from magic bytes / header / URL hints."""
    if header_ct:
        h = header_ct.lower()
        if "pdf" in h:
            return "pdf"
        if "html" in h:
            return "html"
    head = bytes(data[:1024])
    if head[:5] == b"%PDF-":
        return "pdf"
    low = url.lower()
    if low.endswith(".pdf"):
        return "pdf"
    sniff = head.lstrip().lower()
    if sniff.startswith(b"<!doctype html") or sniff.startswith(b"<html") or b"<head" in sniff or b"<body" in sniff:
        return "html"
    if low.endswith((".htm", ".html")):
        return "html"
    return "text"


# --------------------------------------------------------------------------- #
# The fetcher
# --------------------------------------------------------------------------- #
def _http_get(url: str, timeout: float, user_agent: str) -> bytes:
    """Single HTTP GET. Prefers `requests` if present, else stdlib urllib."""
    headers = {
        "User-Agent": user_agent,
        "Accept": "text/html,application/xhtml+xml,application/pdf,*/*",
        "Accept-Language": "en-AE,en;q=0.9",
    }
    try:
        import requests  # type: ignore  (optional fast path)
        resp = requests.get(url, headers=headers, timeout=timeout)
        resp.raise_for_status()
        return resp.content
    except ImportError:
        pass  # fall through to urllib
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def fetch(
    url: str,
    offline: bool = False,
    *,
    timeout: float = DEFAULT_TIMEOUT,
    retries: int = DEFAULT_RETRIES,
    use_cache: bool = True,
    user_agent: str = USER_AGENT,
    respect_robots: bool = False,
) -> bytes:
    """Fetch `url` and return its raw bytes.

    offline=True  -> read from fixtures/ (no network); raises if no fixture.
    use_cache     -> serve/populate the on-disk cache (skipped offline).
    retries       -> exponential backoff with jitter on transient failures.
    respect_robots-> when True, consult robots.txt first and raise PermissionError
                     if disallowed (off by default; KFS are public disclosures).

    Designed to be correct against live bank sites in the user's environment; in
    this sandbox the live path is blocked, so callers pass offline=True.
    """
    if offline:
        return _read_offline(url)

    if use_cache:
        cached = _read_cache(url)
        if cached is not None:
            return cached

    if respect_robots and not robots_allows(url, user_agent=user_agent, timeout=timeout):
        raise PermissionError(f"robots.txt disallows fetching {url}")

    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            data = _http_get(url, timeout=timeout, user_agent=user_agent)
            if use_cache:
                _write_cache(url, data)
            return data
        except urllib.error.HTTPError as e:
            # 4xx (except 429) are not worth retrying — they won't change.
            if e.code != 429 and 400 <= e.code < 500:
                raise
            last_err = e
        except Exception as e:  # network errors, timeouts, 5xx
            last_err = e
        # backoff: 0.5, 1, 2, ... seconds + jitter
        if attempt < retries - 1:
            sleep_s = (0.5 * (2 ** attempt)) + random.uniform(0, 0.25)
            time.sleep(sleep_s)
    assert last_err is not None
    raise last_err


# --------------------------------------------------------------------------- #
# Tiny CLI for manual testing (offline-safe).
# --------------------------------------------------------------------------- #
def main(argv=None):
    import argparse

    ap = argparse.ArgumentParser(description="Fetch a URL (or offline fixture).")
    ap.add_argument("url", help="URL or bank-id (with --offline)")
    ap.add_argument("--offline", action="store_true", help="read from fixtures/")
    ap.add_argument("--no-cache", action="store_true")
    args = ap.parse_args(argv)

    data = fetch(args.url, offline=args.offline, use_cache=not args.no_cache)
    ct = sniff_content_type(data, url=args.url)
    sys_out = f"[{ct}] {len(data)} bytes from {args.url}"
    print(sys_out)
    # show a short preview for text-ish content
    if ct in ("html", "text"):
        preview = data[:400].decode("utf-8", errors="replace")
        print("-" * 60)
        print(preview)


if __name__ == "__main__":
    main()
