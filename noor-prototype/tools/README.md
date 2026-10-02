# Standalone-build tools

`../../noor-prototype.html` is the whole Noor prototype in one file — no server,
no network. It is generated, not edited by hand; change `noorfinance/` and
rebuild.

```bash
# once, needs network: pull Sora/Onest/Rubik and inline the woff2
python3 fetch_fonts.py "$(grep -oE 'https://fonts.googleapis.com/css2\?[^"]+' ../noorfinance/index.html)"

# every time: fold css, js, images and fonts into one file
python3 bundle_noor.py ../noorfinance ../../noor-prototype.html
```

`fetch_fonts.py` writes `fonts-inline.css` beside itself and caches downloads in
`fontcache/`; both are gitignored. Without that file the bundle still builds and
simply falls back to loading fonts over the network, and the build says so.

Why the fonts are embedded at all: the file is meant to be opened on a phone,
sometimes offline, to review typography — if the faces had to come from Google
the thing being reviewed would be the part that failed to load.
