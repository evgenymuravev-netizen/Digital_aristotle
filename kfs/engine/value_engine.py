"""
value_engine.py — the universal credit-card comparison algorithm.

THE CORE IDEA
-------------
There is no globally "best" credit card. A card's worth is a function of how a
specific person behaves:  V = V(card | profile). The same card that is #1 for a
grocery-heavy family can be mid-table for a frequent traveller, and actively
harmful for someone who carries a balance. So the algorithm does not score cards
in the abstract — it scores the (card, profile) pair, then ranks per profile.

V(card | profile) = annual_rewards + benefits_value − annual_costs

  annual_rewards  : category cashback / points-converted-to-AED, honouring
                    per-category caps, an overall monthly cap, a minimum-spend
                    gate, whole-card spend-tier bands, and a non-AED bonus rate.
  benefits_value  : lounges, travel insurance etc., monetised by ACTUAL usage
                    declared in the profile (a lounge you never use is worth 0).
  annual_costs    : annual fee (after waiver logic) + FX markup on foreign spend
                    + interest (ONLY if the profile revolves a balance).

The single most important behavioural switch is `revolves`. For a transactor
(pays in full) interest is zero and cashback rules. For a revolver, interest on
the carried balance is usually an order of magnitude larger than any cashback,
so the ranking correctly collapses to "lowest APR, lowest fee" and the engine
will say so out loud.

Everything here is pure-stdlib and deterministic so it is unit-testable and can
be ported 1:1 to the browser (see ../web/engine.js).
"""

from __future__ import annotations
import json
import math
import os
from dataclasses import dataclass, field
from typing import Optional

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.normpath(os.path.join(HERE, "..", "data"))


# --------------------------------------------------------------------------- #
# Tunable valuation parameters (documented assumptions, overridable).
# --------------------------------------------------------------------------- #
@dataclass
class Params:
    lounge_value_aed: float = 120.0          # what one lounge visit is worth
    travel_insurance_value_aed: float = 300.0  # annual value if the profile uses it
    bogo_value_aed: float = 150.0            # rough annual value of BOGO/Entertainer perks
    # Interest model: simple annual interest on the average carried balance.
    # (A fuller model would amortise; this is the honest first-order term and is
    #  what dominates the comparison for revolvers.)


# --------------------------------------------------------------------------- #
# Data loading
# --------------------------------------------------------------------------- #
def load_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_cards(path: Optional[str] = None) -> list[dict]:
    return load_json(path or os.path.join(DATA, "cards.json"))["cards"]


def load_profiles(path: Optional[str] = None) -> list[dict]:
    return load_json(path or os.path.join(DATA, "profiles.json"))["profiles"]


# --------------------------------------------------------------------------- #
# Reward maths
# --------------------------------------------------------------------------- #
def _effective_pct(raw_rate: float, rewards: dict) -> float:
    """Convert a card's raw rate into a cashback-equivalent percentage.

    cashback cards : the rate IS the percentage (5.0 -> 5%).
    points / miles : the rate is the EARN RATE in points-or-miles per AED
                     (e.g. 2.5 miles/AED). Converted with value_per_point_aed:
                     effective% = earn_rate * value_per_point_aed * 100.
    """
    kind = rewards.get("kind", "cashback")
    if kind in ("points", "miles"):
        vpp = rewards.get("value_per_point_aed") or 0.0
        return raw_rate * vpp * 100.0
    return raw_rate


def monthly_reward(card: dict, spend_by_cat: dict) -> dict:
    """Compute one month's reward in AED, with a breakdown.

    Returns {'total': aed, 'by_category': {...}, 'gated': bool, 'capped': bool}.
    """
    rewards = card["rewards"]
    base_rate = rewards.get("base_rate_pct", 0.0)
    total_spend = sum(spend_by_cat.values())
    intl_share = spend_by_cat.get("__international_share__", 0.0)

    out_by_cat: dict[str, float] = {}
    gated = False

    # Minimum-spend gate: below it, NO reward this cycle.
    min_gate = rewards.get("min_spend_to_earn_aed")
    if min_gate and total_spend < min_gate:
        return {"total": 0.0, "by_category": {}, "gated": True, "capped": False}

    spend = {k: v for k, v in spend_by_cat.items() if k != "__international_share__"}

    # ---- Whole-card spend-tier bands (e.g. CBD Super Saver 3/5/10%) ----
    spend_tiers = rewards.get("spend_tiers")
    if spend_tiers:
        band = _pick_spend_band(spend_tiers, total_spend)
        if band:
            applies = set(band.get("applies_to", []))
            rate = _effective_pct(band["rate_pct"], rewards)
            band_reward = sum(spend.get(c, 0.0) * rate / 100.0 for c in applies)
            cap = band.get("monthly_cap_aed")
            if cap is not None:
                band_reward = min(band_reward, cap)
            out_by_cat["spend-tier"] = band_reward
        # everything outside the band's categories earns base
        rest = sum(v for c, v in spend.items() if c not in (set(band.get("applies_to", [])) if band else set()))
        if base_rate:
            out_by_cat["base"] = rest * _effective_pct(base_rate, rewards) / 100.0
    else:
        # ---- Per-category tiers + non-AED bonus ----
        tier_map = {t["category"]: t for t in rewards.get("tiers", [])}
        intl_tier = tier_map.get("international")
        intl_rate = _effective_pct(intl_tier["rate_pct"], rewards) if intl_tier else None
        intl_cap = intl_tier.get("monthly_cap_aed") if intl_tier else None
        intl_reward = 0.0

        for cat, amt in spend.items():
            tier = tier_map.get(cat)
            rate = _effective_pct(tier["rate_pct"], rewards) if tier else _effective_pct(base_rate, rewards)
            cap = tier.get("monthly_cap_aed") if tier else None

            if intl_rate is not None:
                # Split this category's spend into domestic vs non-AED, pro-rata.
                dom_amt = amt * (1.0 - intl_share)
                intl_amt = amt * intl_share
                cat_reward = dom_amt * rate / 100.0
                if cap is not None:
                    cat_reward = min(cat_reward, cap)
                out_by_cat[cat] = cat_reward
                intl_reward += intl_amt * intl_rate / 100.0
            else:
                cat_reward = amt * rate / 100.0
                if cap is not None:
                    cat_reward = min(cat_reward, cap)
                out_by_cat[cat] = cat_reward

        if intl_rate is not None:
            if intl_cap is not None:
                intl_reward = min(intl_reward, intl_cap)
            out_by_cat["international"] = intl_reward

    total = sum(out_by_cat.values())

    # ---- Overall monthly cap ----
    capped = False
    overall_cap = rewards.get("monthly_cashback_cap_aed")
    if overall_cap is not None and total > overall_cap:
        # scale the breakdown down proportionally for honest attribution
        scale = overall_cap / total if total else 0.0
        out_by_cat = {k: v * scale for k, v in out_by_cat.items()}
        total = overall_cap
        capped = True

    return {"total": total, "by_category": out_by_cat, "gated": gated, "capped": capped}


def _pick_spend_band(spend_tiers: list[dict], total_spend: float) -> Optional[dict]:
    for band in spend_tiers:
        lo = band.get("min_total_monthly_spend_aed", 0)
        hi = band.get("max_total_monthly_spend_aed")
        if total_spend >= lo and (hi is None or total_spend <= hi):
            return band
    return None


# --------------------------------------------------------------------------- #
# Cost maths
# --------------------------------------------------------------------------- #
def annual_fee_after_waiver(card: dict, annual_spend: float) -> float:
    fees = card.get("fees", {})
    fee = fees.get("annual_fee_aed") or 0.0
    waiver = fees.get("annual_fee_waiver") or {}
    t = waiver.get("type", "none")
    if t == "free_for_life":
        return 0.0
    if t == "income":
        return 0.0  # assume an eligible holder meets the income waiver
    if t == "spend":
        threshold = waiver.get("min_annual_spend_aed")
        return 0.0 if (threshold is not None and annual_spend >= threshold) else fee
    # 'first_year' (steady-state charges it), 'conditional', 'none'
    return fee


# --------------------------------------------------------------------------- #
# Benefits valuation (usage-based, conservative)
# --------------------------------------------------------------------------- #
def benefits_value(card: dict, profile: dict, p: Params) -> float:
    b = card.get("benefits", {}) or {}
    beh = profile.get("behavior", {}) or {}
    v = 0.0
    lounge = b.get("lounge", {}) or {}
    visits = beh.get("lounge_visits_per_year", 0) or 0
    if lounge.get("access") == "unlimited":
        v += visits * p.lounge_value_aed
    elif lounge.get("access") == "limited":
        v += min(visits, lounge.get("visits_per_year") or 0) * p.lounge_value_aed
    if b.get("travel_insurance") and beh.get("values_travel_insurance"):
        v += p.travel_insurance_value_aed
    if b.get("buy_one_get_one"):
        v += p.bogo_value_aed if beh.get("lounge_visits_per_year", 0) is not None else 0.0
    return v


# --------------------------------------------------------------------------- #
# Per-(card, profile) evaluation
# --------------------------------------------------------------------------- #
@dataclass
class Evaluation:
    card_id: str
    card_name: str
    bank: str
    eligible: bool
    ineligible_reasons: list[str]
    annual_reward_aed: float
    annual_fee_aed: float
    annual_fx_cost_aed: float
    annual_interest_aed: float
    annual_benefits_aed: float
    net_annual_value_aed: float
    effective_reward_rate_pct: float   # reward / spend, blended
    reward_breakdown: dict
    flags: list[str]


def evaluate_card(card: dict, profile: dict, p: Params = Params()) -> Evaluation:
    spend = dict(profile.get("monthly_spend_by_category", {}))
    intl_share = profile.get("international_share", 0.0) or 0.0
    total_monthly = sum(spend.values())
    annual_spend = total_monthly * 12.0
    beh = profile.get("behavior", {}) or {}

    # ---- Eligibility ----
    reasons: list[str] = []
    elig = card.get("eligibility", {}) or {}
    min_income = elig.get("min_monthly_income_aed")
    if min_income and profile.get("monthly_income_aed", 0) < min_income:
        reasons.append(f"income AED {profile.get('monthly_income_aed'):,} < required AED {min_income:,}")
    if profile.get("preferences", {}).get("islamic_only") and not card.get("islamic"):
        reasons.append("customer wants Islamic only; card is conventional")
    eligible = len(reasons) == 0

    # ---- Rewards ----
    spend_with_intl = dict(spend)
    spend_with_intl["__international_share__"] = intl_share
    mr = monthly_reward(card, spend_with_intl)
    annual_reward = mr["total"] * 12.0

    # ---- Costs ----
    fee = annual_fee_after_waiver(card, annual_spend)
    fx_markup = (card.get("fees", {}).get("fx_markup_pct") or 0.0) / 100.0
    fx_cost = annual_spend * intl_share * fx_markup
    interest = 0.0
    if beh.get("revolves"):
        apr = (card.get("fees", {}).get("interest", {}) or {}).get("apr_pct") or 0.0
        interest = (beh.get("revolving_balance_aed", 0.0) or 0.0) * apr / 100.0

    bv = benefits_value(card, profile, p)
    net = annual_reward + bv - fee - fx_cost - interest

    eff_rate = (annual_reward / annual_spend * 100.0) if annual_spend else 0.0

    flags: list[str] = []
    if mr["gated"]:
        flags.append("reward GATED: monthly spend below the card's minimum to earn")
    if mr["capped"]:
        flags.append("reward hit the monthly cap")
    if beh.get("revolves") and interest > annual_reward:
        flags.append("INTEREST DOMINATES: carried-balance interest exceeds all rewards — clear the balance first")

    return Evaluation(
        card_id=card["card_id"],
        card_name=card["card_name"],
        bank=card["bank"]["name"],
        eligible=eligible,
        ineligible_reasons=reasons,
        annual_reward_aed=round(annual_reward, 2),
        annual_fee_aed=round(fee, 2),
        annual_fx_cost_aed=round(fx_cost, 2),
        annual_interest_aed=round(interest, 2),
        annual_benefits_aed=round(bv, 2),
        net_annual_value_aed=round(net, 2),
        effective_reward_rate_pct=round(eff_rate, 3),
        reward_breakdown={k: round(v * 12.0, 2) for k, v in mr["by_category"].items()},
        flags=flags,
    )


# --------------------------------------------------------------------------- #
# Multi-parameter scorecard (the radar) — normalised 0..100 across a candidate set
# --------------------------------------------------------------------------- #
def _norm(value: float, lo: float, hi: float) -> float:
    if hi <= lo:
        return 50.0
    return max(0.0, min(100.0, (value - lo) / (hi - lo) * 100.0))


def scorecard(evals: list[Evaluation], cards_by_id: dict) -> dict[str, dict]:
    """Normalised 0..100 scores across five dimensions, for radar comparison.

    value       : net annual value (higher better)
    cost        : low fees+APR (higher score = cheaper)
    simplicity  : few caps / gates / tiers (higher = simpler)
    flexibility : breadth of above-base earning categories
    perks       : richness of benefits
    """
    if not evals:
        return {}
    nets = [e.net_annual_value_aed for e in evals]
    lo_net, hi_net = min(nets), max(nets)

    def complexity(card):
        r = card["rewards"]
        c = len(r.get("tiers", []))
        c += 2 * len(r.get("spend_tiers") or [])
        if r.get("min_spend_to_earn_aed"):
            c += 1
        if r.get("monthly_cashback_cap_aed"):
            c += 1
        c += sum(1 for t in r.get("tiers", []) if t.get("monthly_cap_aed"))
        return c

    def cost_index(card):
        f = card.get("fees", {})
        apr = (f.get("interest", {}) or {}).get("apr_pct") or 0.0
        return (f.get("annual_fee_aed") or 0.0) + apr * 10  # weight APR

    def flexibility(card):
        r = card["rewards"]
        return len(r.get("tiers", [])) + (1 if r.get("base_rate_pct", 0) >= 1 else 0) + len(r.get("spend_tiers") or [])

    def perks(card):
        b = card.get("benefits", {}) or {}
        score = 0
        lg = b.get("lounge", {}) or {}
        score += {"none": 0, "limited": 2, "unlimited": 4}.get(lg.get("access", "none"), 0)
        score += sum(1 for k in ("travel_insurance", "installment_0pct", "buy_one_get_one", "valet_or_golf", "concierge") if b.get(k))
        return score

    comp = [complexity(cards_by_id[e.card_id]) for e in evals]
    cidx = [cost_index(cards_by_id[e.card_id]) for e in evals]
    flex = [flexibility(cards_by_id[e.card_id]) for e in evals]
    prk = [perks(cards_by_id[e.card_id]) for e in evals]

    out = {}
    for i, e in enumerate(evals):
        out[e.card_id] = {
            "value": round(_norm(e.net_annual_value_aed, lo_net, hi_net), 1),
            "cost": round(100 - _norm(cidx[i], min(cidx), max(cidx)), 1),
            "simplicity": round(100 - _norm(comp[i], min(comp), max(comp)), 1),
            "flexibility": round(_norm(flex[i], min(flex), max(flex)), 1),
            "perks": round(_norm(prk[i], min(prk), max(prk)), 1),
        }
    return out


# --------------------------------------------------------------------------- #
# Ranking + recommendation
# --------------------------------------------------------------------------- #
def rank_cards(cards: list[dict], profile: dict, p: Params = Params()) -> list[Evaluation]:
    evals = [evaluate_card(c, profile, p) for c in cards]
    eligible = [e for e in evals if e.eligible]
    eligible.sort(key=lambda e: e.net_annual_value_aed, reverse=True)
    return eligible


def recommend(cards: list[dict], profile: dict, p: Params = Params(), top_n: int = 3) -> dict:
    ranked = rank_cards(cards, profile, p)
    cards_by_id = {c["card_id"]: c for c in cards}
    scores = scorecard(ranked, cards_by_id)
    revolves = profile.get("behavior", {}).get("revolves")
    headline = None
    if revolves:
        headline = ("This profile carries a balance, so the comparison is dominated by interest, "
                    "not cashback. The winner is the cheapest-to-borrow card; the real advice is to "
                    "stop revolving — no cashback beats ~40% APR.")
    return {
        "profile_id": profile["profile_id"],
        "profile_label": profile["label"],
        "headline": headline,
        "ranking": [e.__dict__ for e in ranked[:top_n]],
        "all_ranked_ids": [e.card_id for e in ranked],
        "scorecards": {cid: scores[cid] for cid in [e.card_id for e in ranked[:top_n]] if cid in scores},
        "ineligible": [
            {"card_id": e.card_id, "card_name": e.card_name, "reasons": e.ineligible_reasons}
            for e in (evaluate_card(c, profile, p) for c in cards) if not e.eligible
        ],
    }


# --------------------------------------------------------------------------- #
# Robustness: does the winner survive plausible spend perturbations?
# --------------------------------------------------------------------------- #
def robustness(cards: list[dict], profile: dict, p: Params = Params()) -> dict:
    """Re-rank under a few deterministic 'what if my spend were a bit different'
    scenarios. A card that only wins under the exact assumed spend is fragile."""
    scenarios = {"base": profile}
    spend = profile.get("monthly_spend_by_category", {})
    if spend:
        top_cat = max(spend, key=spend.get)
        # +30% on the dominant category
        s1 = json.loads(json.dumps(profile)); s1["monthly_spend_by_category"][top_cat] *= 1.3
        scenarios["heavier_top_category"] = s1
        # -30% on the dominant category
        s2 = json.loads(json.dumps(profile)); s2["monthly_spend_by_category"][top_cat] *= 0.7
        scenarios["lighter_top_category"] = s2
    # more international
    s3 = json.loads(json.dumps(profile)); s3["international_share"] = min(1.0, (profile.get("international_share", 0) or 0) + 0.2)
    scenarios["more_international"] = s3

    winners = {name: (rank_cards(cards, prof, p)[:1] or [None])[0] for name, prof in scenarios.items()}
    winner_ids = [e.card_id for e in winners.values() if e]
    from collections import Counter
    counts = Counter(winner_ids)
    base_winner = winners["base"].card_id if winners["base"] else None
    stable = all(w == base_winner for w in winner_ids)
    return {
        "base_winner": base_winner,
        "winner_by_scenario": {k: (v.card_id if v else None) for k, v in winners.items()},
        "stable": stable,
        "most_common_winner": counts.most_common(1)[0][0] if counts else None,
    }


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def _fmt_aed(x: float) -> str:
    return f"AED {x:,.0f}"


def main(argv=None):
    import argparse
    ap = argparse.ArgumentParser(description="UAE credit-card value engine")
    ap.add_argument("--cards", default=None, help="path to cards.json")
    ap.add_argument("--profiles", default=None, help="path to profiles.json")
    ap.add_argument("--profile", default=None, help="evaluate a single profile_id")
    ap.add_argument("--json", action="store_true", help="emit JSON instead of a report")
    args = ap.parse_args(argv)

    cards = load_cards(args.cards)
    profiles = load_profiles(args.profiles)
    if args.profile:
        profiles = [p for p in profiles if p["profile_id"] == args.profile]

    results = []
    for prof in profiles:
        rec = recommend(cards, prof)
        rob = robustness(cards, prof)
        rec["robustness"] = rob
        results.append(rec)

    if args.json:
        print(json.dumps(results, indent=2))
        return

    for rec in results:
        print("=" * 78)
        print(f"PROFILE: {rec['profile_label']}  ({rec['profile_id']})")
        if rec["headline"]:
            print("  ! " + rec["headline"])
        print("-" * 78)
        for i, e in enumerate(rec["ranking"], 1):
            tag = "  <-- best" if i == 1 else ""
            print(f"  {i}. {e['card_name']} ({e['bank']}){tag}")
            print(f"       net value {_fmt_aed(e['net_annual_value_aed'])}/yr  "
                  f"= rewards {_fmt_aed(e['annual_reward_aed'])} "
                  f"+ perks {_fmt_aed(e['annual_benefits_aed'])} "
                  f"- fee {_fmt_aed(e['annual_fee_aed'])} "
                  f"- FX {_fmt_aed(e['annual_fx_cost_aed'])} "
                  f"- interest {_fmt_aed(e['annual_interest_aed'])}")
            print(f"       effective reward rate {e['effective_reward_rate_pct']}%")
            for fl in e["flags"]:
                print(f"       * {fl}")
        rob = rec["robustness"]
        print(f"  robustness: winner {'STABLE' if rob['stable'] else 'FRAGILE'} across spend scenarios "
              f"({rob['winner_by_scenario']})")
    print("=" * 78)


if __name__ == "__main__":
    main()
