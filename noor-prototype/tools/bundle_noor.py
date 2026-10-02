#!/usr/bin/env python3
"""Fold the Noor build into one self-contained .html file.

Everything the page needs travels with it: stylesheets and scripts inline,
images as data URIs, and a localStorage shim so the file still runs when a
sandboxed iframe refuses storage access.
"""
import base64, io, os, re, sys

ROOT = sys.argv[1].rstrip('/') + '/'
OUT = sys.argv[2]

rd = lambda p: io.open(ROOT + p, encoding='utf-8').read()


def datauri(p):
    ext = os.path.splitext(p)[1].lower()
    mime = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif'}[ext]
    return 'data:%s;base64,%s' % (mime, base64.b64encode(open(ROOT + p, 'rb').read()).decode())


html = rd('index.html')

# ---------------------------------------------------------------- 1. assets
# Keys are the paths assetSrc() is called with (relative to assets/).
asset_map = {}
for root, _dirs, files in os.walk(ROOT + 'assets'):
    for f in files:
        full = os.path.join(root, f)
        rel = os.path.relpath(full, ROOT + 'assets').replace(os.sep, '/')
        if os.path.splitext(f)[1].lower() in ('.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'):
            asset_map[rel] = datauri('assets/' + rel)

# Static src="assets/x" in the shell and in script templates.
def sub_static(s):
    return re.sub(r'(src=["\'])assets/([A-Za-z0-9_./-]+?)(["\'])',
                  lambda m: m.group(1) + asset_map.get(m.group(2), 'assets/' + m.group(2)) + m.group(3), s)

html = sub_static(html)
html = re.sub(r'(rel="apple-touch-icon" href=")assets/([^"]+)(")',
              lambda m: m.group(1) + asset_map.get(m.group(2), 'assets/' + m.group(2)) + m.group(3), html)

# ---------------------------------------------------------------- 2. css
# The inlined webfaces go first so they are defined before anything uses them;
# the Google Fonts <link> stays in the page as a fallback for Noto Kufi Arabic.
font_css = ''
fpath = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts-inline.css')
if os.path.exists(fpath):
    font_css = io.open(fpath, encoding='utf-8').read()

css_files = re.findall(r'<link rel="stylesheet" href="(css/[^"]+)">', html)
css = font_css + '\n'.join('/* ===== %s ===== */\n%s' % (p, rd(p)) for p in css_files)
first = '<link rel="stylesheet" href="%s">' % css_files[0]
html = html.replace(first, '<style>\n%s\n</style>' % css, 1)
for p in css_files[1:]:
    html = html.replace('<link rel="stylesheet" href="%s">' % p, '')

# ---------------------------------------------------------------- 3. js
js_files = re.findall(r'<script src="(js/[^"]+)"></script>', html)
seen, ordered = set(), []
for p in js_files:                      # keep order, drop any accidental repeat
    if p not in seen:
        seen.add(p); ordered.append(p)

shim = """/* ---- single-file bundle preamble ---- */
window.ASSET_URI = %s;
/* Sandboxed iframes can throw on storage access; fall back to memory. */
(function(){
  try { window.localStorage.setItem('__t','1'); window.localStorage.removeItem('__t'); return; }
  catch(e){}
  var mem = {};
  var stub = { getItem:function(k){ return k in mem ? mem[k] : null; },
               setItem:function(k,v){ mem[k] = String(v); },
               removeItem:function(k){ delete mem[k]; },
               clear:function(){ mem = {}; },
               key:function(i){ return Object.keys(mem)[i] || null; } };
  Object.defineProperty(stub,'length',{get:function(){ return Object.keys(mem).length; }});
  try { Object.defineProperty(window,'localStorage',{value:stub,configurable:true}); }
  catch(e){ window.localStorage = stub; }
})();
""" % repr(asset_map).replace("'", '"')

bundle = [shim]
for p in ordered:
    bundle.append('/* ===== %s ===== */\n%s' % (p, sub_static(rd(p))))
js = '\n;\n'.join(bundle)

html = html.replace('<script src="%s"></script>' % ordered[0],
                    '<script>\n%s\n</script>' % js, 1)
for p in ordered[1:]:
    html = html.replace('<script src="%s"></script>' % p, '')

# ---------------------------------------------------------------- 4. tidy
html = html.replace('<link rel="manifest" href="manifest.webmanifest">', '')
html = re.sub(r'\n{3,}', '\n\n', html)

io.open(OUT, 'w', encoding='utf-8').write(html)

leftovers = re.findall(r'(?:src|href)="(?!data:|https?:|#)([^"]+)"', html)
print('bundled -> %s  (%.0f KB)' % (OUT, os.path.getsize(OUT) / 1024))
print('css: %s' % ', '.join(css_files))
print('js : %d files' % len(ordered))
print('assets inlined: %d' % len(asset_map))
print('fonts inlined: %s' % ('yes, %d KB' % (len(font_css) / 1024) if font_css else 'NO (run fetch_fonts.py)'))
print('unresolved local refs: %s' % (leftovers or 'none'))
