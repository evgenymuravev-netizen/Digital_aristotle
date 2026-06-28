#!/usr/bin/env python3
"""
make_sample.py — generate an ILLUSTRATIVE, SYNTHETIC review corpus so the
word-cloud engine can be demonstrated end-to-end WITHOUT live data access.

THIS IS NOT REAL CUSTOMER DATA. Every record is machine-composed from generic
auto-dealership review vocabulary. It exists only to show the output format
and to exercise the English + Arabic code paths. Replace it with the real
output of collect_google.py / collect_reddit.py for the actual analysis.
"""
from __future__ import annotations
import json
import os
import random

random.seed(20)

BRANDS = ["Toyota", "Lexus", "Honda", "Volvo", "BYD", "Automall"]
LOCS = ["Toyota Dubai Festival City", "Toyota Port Saeed", "Lexus Sheikh Zayed Road",
        "Toyota Airport Road Abu Dhabi", "Honda Airport Road", "Volvo Festival City",
        "Toyota Sharjah", "Lexus Abu Dhabi", "Automall Sheikh Zayed Road"]

POS = [
    "excellent service and very professional staff",
    "smooth buying process and quick delivery of my new car",
    "the sales advisor was helpful knowledgeable and friendly",
    "clean comfortable showroom with a nice waiting lounge",
    "genuine spare parts and a free car wash after service",
    "service was completed on time and the price was transparent",
    "highly recommend this service center great customer service",
    "warranty was honored without any problem very satisfied",
    "courteous team well organized booking and fast maintenance",
    "the service advisor explained everything clearly good experience",
    "friendly staff smooth test drive and fair trade in value",
    "periodic maintenance done quickly genuine parts used",
]
NEG = [
    "long waiting time and very poor communication from the service center",
    "delayed delivery of the car nobody would call back with an update",
    "overpriced service and they charged extra for small parts",
    "worst experience kept waiting for hours appointment was ignored",
    "rude unprofessional staff and an unresolved problem after repair",
    "spare parts were not available so i had to visit again and again",
    "booked an appointment but still waited long disappointed with service",
    "no response from the sales team after paying the booking amount",
    "service quality dropped car came back with the same engine problem",
    "expensive maintenance poor customer service slow advisor response",
    "broken promise on delivery date and the manager never called",
    "warranty claim rejected unfair charges very disappointing service",
]
NEUTRAL = [
    "went for oil change and periodic maintenance battery check",
    "test drive of the new model good engine smooth gearbox",
    "asked about finance insurance and registration options",
    "service center handled the recall and ac repair",
    "tyres replaced and software update done by the advisor",
]
ARABIC = [
    "خدمة ممتازة وموظفين محترفين وسرعة في التسليم",
    "انتظار طويل وخدمة سيئة في مركز الصيانة",
    "سعر مرتفع وقطع الغيار غير متوفرة",
    "تجربة جيدة والموظف كان متعاون وودود",
    "تأخير في تسليم السيارة وعدم الرد على الاتصال",
]


def compose():
    bucket = random.choices(["pos", "neg", "neu", "ar"],
                            weights=[40, 42, 13, 5])[0]
    if bucket == "pos":
        parts = random.sample(POS, k=random.randint(1, 2)); rating = random.choice([5, 5, 4])
        src = "google_maps"; lang = "en"
    elif bucket == "neg":
        parts = random.sample(NEG, k=random.randint(1, 2)); rating = random.choice([1, 1, 2])
        src = random.choice(["google_maps", "reddit"]); lang = "en"
    elif bucket == "neu":
        parts = random.sample(NEUTRAL, k=random.randint(1, 2)); rating = random.choice([3, 4])
        src = "google_maps"; lang = "en"
    else:
        parts = random.sample(ARABIC, k=1); rating = random.choice([1, 2, 4, 5])
        src = "google_maps"; lang = "ar"
    text = ". ".join(p[0].upper() + p[1:] for p in parts) + "."
    return text, rating, src, lang


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, "reviews.sample.jsonl")
    n = 280
    with open(out, "w", encoding="utf-8") as fh:
        for i in range(n):
            text, rating, src, lang = compose()
            year = random.randint(2011, 2025)
            month = random.randint(1, 12)
            rec = {
                "text": text,
                "source": src,
                "brand": random.choice(BRANDS),
                "location": random.choice(LOCS),
                "place_id": "",
                "rating": rating if src == "google_maps" else None,
                "date": f"{year}-{month:02d}-15",
                "lang": lang,
                "author": "EXAMPLE",
                "url": "",
                "extra": {"illustrative": True, "synthetic": True},
            }
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
    print(f"[ok] wrote {n} ILLUSTRATIVE synthetic reviews -> {out}")


if __name__ == "__main__":
    main()
