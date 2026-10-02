#!/usr/bin/env python3
"""Fetch the Google Fonts the build links to and emit one self-contained
stylesheet with the woff2 files inlined.

Google serves one *variable* woff2 per family+subset covering every weight, and
then repeats it in a separate @font-face per weight. Embedding it per weight
would duplicate the same blob four or five times, so this collapses each
family+subset to a single @font-face with a weight range.

Scope: the three UI faces (Sora, Onest, Rubik) in latin and latin-ext. Noto
Kufi Arabic is left out on purpose — it is 120 KB for a mode the viewer has to
switch on, and the build keeps its Google Fonts <link>, so it still loads over
the network while the Latin UI is guaranteed offline.

Writes fonts-inline.css beside this script; the bundler reads that, so network
is needed only once.
"""
import base64, io, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 '
      '(KHTML, like Gecko) Version/17.0 Safari/605.1.15')
FAMS = {'Sora', 'Onest', 'Rubik'}
SUBSETS = ['latin', 'latin-ext']
CACHE = os.path.join(HERE, 'fontcache')
os.makedirs(CACHE, exist_ok=True)


def get(url, binary=False):
    p = os.path.join(CACHE, re.sub(r'[^A-Za-z0-9]+', '_', url)[-120:])
    if not os.path.exists(p):
        subprocess.run(['curl', '-sS', '--fail', '-A', UA, '-o', p, url], check=True)
    return open(p, 'rb').read() if binary else io.open(p, encoding='utf-8').read()


css = get(sys.argv[1])

faces = {}   # (family, subset) -> {url, weights, unicode_range}
for b in re.split(r'(?=/\*\s*[a-z0-9-]+\s*\*/)', css):
    m = re.match(r'/\*\s*([a-z0-9-]+)\s*\*/', b.strip())
    if not m or '@font-face' not in b:
        continue
    subset = m.group(1)
    fam = re.search(r"font-family: '([^']+)'", b).group(1)
    if fam not in FAMS or subset not in SUBSETS:
        continue
    wt = int(re.search(r'font-weight: (\d+)', b).group(1))
    url = re.search(r'url\((https://[^)]+)\)', b).group(1)
    ur = re.search(r'unicode-range: ([^;]+);', b)
    f = faces.setdefault((fam, subset), {'url': url, 'weights': set(), 'range': ur.group(1) if ur else None})
    f['weights'].add(wt)
    assert f['url'] == url, 'subset %s/%s is not a single variable file' % (fam, subset)

out, total = [], 0
for (fam, subset) in sorted(faces, key=lambda k: (list(FAMS).index(k[0]) if k[0] in FAMS else 9, SUBSETS.index(k[1]))):
    f = faces[(fam, subset)]
    raw = get(f['url'], binary=True)
    total += len(raw)
    lo, hi = min(f['weights']), max(f['weights'])
    weight = str(lo) if lo == hi else '%d %d' % (lo, hi)
    out.append('/* %s · %s */\n@font-face{font-family:\'%s\';font-style:normal;font-weight:%s;font-display:swap;'
               'src:url(data:font/woff2;base64,%s) format(\'woff2\');%s}'
               % (fam, subset, fam, weight, base64.b64encode(raw).decode(),
                  ('unicode-range:%s;' % f['range']) if f['range'] else ''))

banner = ('/* Sora, Onest and Rubik inlined so the standalone file keeps its typography\n'
          '   with no network. One variable face per family+subset, weights as a range.\n'
          '   Noto Kufi Arabic (RTL mode) still comes from the Google Fonts link. */\n')
dest = os.path.join(HERE, 'fonts-inline.css')
io.open(dest, 'w', encoding='utf-8').write(banner + '\n'.join(out) + '\n')
print('faces: %d  (%s)' % (len(out), ', '.join('%s/%s' % k for k in sorted(faces))))
print('woff2: %d KB raw -> stylesheet %d KB' % (total / 1024, os.path.getsize(dest) / 1024))
