// engine.js — faithful browser port of ../engine/value_engine.py.
// Keep in PARITY with the Python (it is the source of truth and is unit-tested).
// Same model: V(card | profile) = annual_rewards + benefits_value − annual_costs.

export const PARAMS = {
  loungeValueAed: 120.0,
  travelInsuranceValueAed: 300.0,
  bogoValueAed: 150.0,
};

// cashback: rate IS the %. points/miles: rate is earn-per-AED, convert with value_per_point_aed.
function effectivePct(rawRate, rewards) {
  const kind = rewards.kind || "cashback";
  if (kind === "points" || kind === "miles") {
    const vpp = rewards.value_per_point_aed || 0.0;
    return rawRate * vpp * 100.0;
  }
  return rawRate;
}

function pickSpendBand(spendTiers, totalSpend) {
  for (const band of spendTiers) {
    const lo = band.min_total_monthly_spend_aed || 0;
    const hi = band.max_total_monthly_spend_aed;
    if (totalSpend >= lo && (hi == null || totalSpend <= hi)) return band;
  }
  return null;
}

// One month's reward in AED + breakdown. `spend` may carry __international_share__.
export function monthlyReward(card, spendWithIntl) {
  const rewards = card.rewards;
  const baseRate = rewards.base_rate_pct || 0.0;
  const intlShare = spendWithIntl.__international_share__ || 0.0;
  const spend = {};
  let totalSpend = 0;
  for (const [k, v] of Object.entries(spendWithIntl)) {
    if (k === "__international_share__") continue;
    spend[k] = v;
    totalSpend += v;
  }

  const minGate = rewards.min_spend_to_earn_aed;
  if (minGate && totalSpend < minGate) {
    return { total: 0.0, byCategory: {}, gated: true, capped: false };
  }

  const byCat = {};

  const spendTiers = rewards.spend_tiers;
  if (spendTiers && spendTiers.length) {
    const band = pickSpendBand(spendTiers, totalSpend);
    let applies = new Set();
    if (band) {
      applies = new Set(band.applies_to || []);
      const rate = effectivePct(band.rate_pct, rewards);
      let bandReward = 0;
      for (const c of applies) bandReward += (spend[c] || 0) * rate / 100.0;
      if (band.monthly_cap_aed != null) bandReward = Math.min(bandReward, band.monthly_cap_aed);
      byCat["spend-tier"] = bandReward;
    }
    let rest = 0;
    for (const [c, v] of Object.entries(spend)) if (!applies.has(c)) rest += v;
    if (baseRate) byCat["base"] = rest * effectivePct(baseRate, rewards) / 100.0;
  } else {
    const tierMap = {};
    for (const t of (rewards.tiers || [])) tierMap[t.category] = t;
    const intlTier = tierMap["international"];
    const intlRate = intlTier ? effectivePct(intlTier.rate_pct, rewards) : null;
    const intlCap = intlTier ? intlTier.monthly_cap_aed : null;
    let intlReward = 0.0;

    for (const [cat, amt] of Object.entries(spend)) {
      const tier = tierMap[cat];
      const rate = tier ? effectivePct(tier.rate_pct, rewards) : effectivePct(baseRate, rewards);
      const cap = tier ? tier.monthly_cap_aed : null;
      if (intlRate != null) {
        const domAmt = amt * (1.0 - intlShare);
        const intlAmt = amt * intlShare;
        let catReward = domAmt * rate / 100.0;
        if (cap != null) catReward = Math.min(catReward, cap);
        byCat[cat] = catReward;
        intlReward += intlAmt * intlRate / 100.0;
      } else {
        let catReward = amt * rate / 100.0;
        if (cap != null) catReward = Math.min(catReward, cap);
        byCat[cat] = catReward;
      }
    }
    if (intlRate != null) {
      if (intlCap != null) intlReward = Math.min(intlReward, intlCap);
      byCat["international"] = intlReward;
    }
  }

  let total = Object.values(byCat).reduce((a, b) => a + b, 0);
  let capped = false;
  const overallCap = rewards.monthly_cashback_cap_aed;
  if (overallCap != null && total > overallCap) {
    const scale = total ? overallCap / total : 0.0;
    for (const k of Object.keys(byCat)) byCat[k] *= scale;
    total = overallCap;
    capped = true;
  }
  return { total, byCategory: byCat, gated: false, capped };
}

export function annualFeeAfterWaiver(card, annualSpend) {
  const fees = card.fees || {};
  const fee = fees.annual_fee_aed || 0.0;
  const waiver = fees.annual_fee_waiver || {};
  const t = waiver.type || "none";
  if (t === "free_for_life") return 0.0;
  if (t === "income") return 0.0;
  if (t === "spend") {
    const th = waiver.min_annual_spend_aed;
    return (th != null && annualSpend >= th) ? 0.0 : fee;
  }
  return fee; // first_year (steady-state), conditional, none
}

export function benefitsValue(card, profile, p = PARAMS) {
  const b = card.benefits || {};
  const beh = profile.behavior || {};
  let v = 0.0;
  const lounge = b.lounge || {};
  const visits = beh.lounge_visits_per_year || 0;
  if (lounge.access === "unlimited") v += visits * p.loungeValueAed;
  else if (lounge.access === "limited") v += Math.min(visits, lounge.visits_per_year || 0) * p.loungeValueAed;
  if (b.travel_insurance && beh.values_travel_insurance) v += p.travelInsuranceValueAed;
  if (b.buy_one_get_one) v += p.bogoValueAed;
  return v;
}

export function evaluateCard(card, profile, p = PARAMS) {
  const spend = { ...(profile.monthly_spend_by_category || {}) };
  const intlShare = profile.international_share || 0.0;
  const totalMonthly = Object.values(spend).reduce((a, b) => a + b, 0);
  const annualSpend = totalMonthly * 12.0;
  const beh = profile.behavior || {};

  const reasons = [];
  const elig = card.eligibility || {};
  const minIncome = elig.min_monthly_income_aed;
  if (minIncome && (profile.monthly_income_aed || 0) < minIncome) {
    reasons.push(`income AED ${(profile.monthly_income_aed || 0).toLocaleString()} < required AED ${minIncome.toLocaleString()}`);
  }
  if (profile.preferences && profile.preferences.islamic_only && !card.islamic) {
    reasons.push("customer wants Islamic only; card is conventional");
  }
  const eligible = reasons.length === 0;

  const spendWithIntl = { ...spend, __international_share__: intlShare };
  const mr = monthlyReward(card, spendWithIntl);
  const annualReward = mr.total * 12.0;

  const fee = annualFeeAfterWaiver(card, annualSpend);
  const fxMarkup = ((card.fees && card.fees.fx_markup_pct) || 0.0) / 100.0;
  const fxCost = annualSpend * intlShare * fxMarkup;
  let interest = 0.0;
  if (beh.revolves) {
    const apr = ((card.fees && card.fees.interest && card.fees.interest.apr_pct) || 0.0);
    interest = (beh.revolving_balance_aed || 0.0) * apr / 100.0;
  }
  const bv = benefitsValue(card, profile, p);
  const net = annualReward + bv - fee - fxCost - interest;
  const effRate = annualSpend ? (annualReward / annualSpend * 100.0) : 0.0;

  const flags = [];
  if (mr.gated) flags.push("reward GATED: monthly spend below the card's minimum to earn");
  if (mr.capped) flags.push("reward hit the monthly cap");
  if (beh.revolves && interest > annualReward) flags.push("INTEREST DOMINATES: carried-balance interest exceeds all rewards — clear the balance first");

  return {
    card_id: card.card_id, card_name: card.card_name, bank: card.bank.name,
    eligible, ineligible_reasons: reasons,
    annual_reward_aed: round2(annualReward), annual_fee_aed: round2(fee),
    annual_fx_cost_aed: round2(fxCost), annual_interest_aed: round2(interest),
    annual_benefits_aed: round2(bv), net_annual_value_aed: round2(net),
    effective_reward_rate_pct: round3(effRate),
    reward_breakdown: Object.fromEntries(Object.entries(mr.byCategory).map(([k, v]) => [k, round2(v * 12.0)])),
    flags,
  };
}

function norm(value, lo, hi) {
  if (hi <= lo) return 50.0;
  return Math.max(0.0, Math.min(100.0, (value - lo) / (hi - lo) * 100.0));
}

export function scorecard(evals, cardsById) {
  if (!evals.length) return {};
  const nets = evals.map(e => e.net_annual_value_aed);
  const loNet = Math.min(...nets), hiNet = Math.max(...nets);

  const complexity = card => {
    const r = card.rewards;
    let c = (r.tiers || []).length;
    c += 2 * (r.spend_tiers || []).length;
    if (r.min_spend_to_earn_aed) c += 1;
    if (r.monthly_cashback_cap_aed) c += 1;
    c += (r.tiers || []).filter(t => t.monthly_cap_aed).length;
    return c;
  };
  const costIndex = card => {
    const f = card.fees || {};
    const apr = (f.interest && f.interest.apr_pct) || 0.0;
    return (f.annual_fee_aed || 0.0) + apr * 10;
  };
  const flexibility = card => {
    const r = card.rewards;
    return (r.tiers || []).length + ((r.base_rate_pct || 0) >= 1 ? 1 : 0) + (r.spend_tiers || []).length;
  };
  const perks = card => {
    const b = card.benefits || {};
    let s = 0;
    s += ({ none: 0, limited: 2, unlimited: 4 })[(b.lounge && b.lounge.access) || "none"] || 0;
    s += ["travel_insurance", "installment_0pct", "buy_one_get_one", "valet_or_golf", "concierge"].filter(k => b[k]).length;
    return s;
  };

  const comp = evals.map(e => complexity(cardsById[e.card_id]));
  const cidx = evals.map(e => costIndex(cardsById[e.card_id]));
  const flex = evals.map(e => flexibility(cardsById[e.card_id]));
  const prk = evals.map(e => perks(cardsById[e.card_id]));

  const out = {};
  evals.forEach((e, i) => {
    out[e.card_id] = {
      value: round1(norm(e.net_annual_value_aed, loNet, hiNet)),
      cost: round1(100 - norm(cidx[i], Math.min(...cidx), Math.max(...cidx))),
      simplicity: round1(100 - norm(comp[i], Math.min(...comp), Math.max(...comp))),
      flexibility: round1(norm(flex[i], Math.min(...flex), Math.max(...flex))),
      perks: round1(norm(prk[i], Math.min(...prk), Math.max(...prk))),
    };
  });
  return out;
}

export function rankCards(cards, profile, p = PARAMS) {
  const evals = cards.map(c => evaluateCard(c, profile, p));
  return evals.filter(e => e.eligible).sort((a, b) => b.net_annual_value_aed - a.net_annual_value_aed);
}

export function recommend(cards, profile, p = PARAMS, topN = 5) {
  const ranked = rankCards(cards, profile, p);
  const cardsById = Object.fromEntries(cards.map(c => [c.card_id, c]));
  const scores = scorecard(ranked, cardsById);
  const revolves = profile.behavior && profile.behavior.revolves;
  const headline = revolves
    ? "This profile carries a balance, so the comparison is dominated by interest, not cashback. The winner is the cheapest-to-borrow card; the real advice is to stop revolving — no cashback beats ~40% APR."
    : null;
  const allEvals = cards.map(c => evaluateCard(c, profile, p));
  return {
    profile_id: profile.profile_id, profile_label: profile.label, headline,
    ranking: ranked, scorecards: scores,
    ineligible: allEvals.filter(e => !e.eligible).map(e => ({ card_id: e.card_id, card_name: e.card_name, reasons: e.ineligible_reasons })),
  };
}

const round1 = x => Math.round(x * 10) / 10;
const round2 = x => Math.round(x * 100) / 100;
const round3 = x => Math.round(x * 1000) / 1000;
