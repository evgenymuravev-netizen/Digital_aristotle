# Al-Futtaim Automotive review word-cloud pipeline
# ------------------------------------------------
# Quick demo (no network/keys needed):
#     make sample demo
# Real run (needs a provider key, run OUTSIDE the Claude web sandbox):
#     export SERPAPI_KEY=...            # or APIFY_TOKEN / OUTSCRAPER_API_KEY
#     export REDDIT_CLIENT_ID=...  REDDIT_CLIENT_SECRET=...
#     make enumerate google reddit wordcloud

PY ?= python3
PROVIDER ?= serpapi
PLACES ?= config/places.json

.PHONY: install sample demo enumerate google reddit wordcloud all clean

install:
	$(PY) -m pip install -r requirements.txt

# --- demo on synthetic data -------------------------------------------------
sample:
	$(PY) data/make_sample.py

demo: sample
	$(PY) src/build_wordcloud.py data/reviews.sample.jsonl --out output --since 2006-01-01 --max-words 150

# --- real collection --------------------------------------------------------
enumerate:
	$(PY) src/enumerate_places.py --out config/places.discovered.json

google:
	$(PY) src/collect_google.py --provider $(PROVIDER) --places $(PLACES) \
		--out data/google_reviews.jsonl --max-per-place 0

reddit:
	$(PY) src/collect_reddit.py --places $(PLACES) --out data/reddit_reviews.jsonl

wordcloud:
	$(PY) src/build_wordcloud.py data/ --out output --since 2006-01-01 \
		--max-words 250 --ngram 1

all: enumerate google reddit wordcloud

clean:
	rm -f output/* data/google_reviews.jsonl data/reddit_reviews.jsonl \
		config/places.discovered.json
