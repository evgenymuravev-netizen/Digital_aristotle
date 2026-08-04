"""
Zero-dependency tests for the value engine. Runs under plain `python3` OR pytest.

    python3 kfs/engine/tests/test_value_engine.py     # self-runner, prints PASS/FAIL
    python3 -m pytest kfs/engine/tests/                # if pytest is installed
"""
import os
import sys

sys.path.insert(0, os.path.normpath(os.path.join(os.path.dirname(__file__), "..")))
import value_engine as ve  # noqa: E402


def approx(a, b, tol=0.01):
    return abs(a - b) <= tol


# --- synthetic cards for crisp numeric assertions (not brittle to dataset edits) ---
def synthetic_card(**over):
    card = {
        "card_id": "test", "card_name": "Test", "bank": {"id": "t", "name": "Test Bank"},
        "card_type": "cashback", "islamic": False,
        "eligibility": {"min_monthly_income_aed": 5000},
        "fees": {"annual_fee_aed": 300, "annual_fee_waiver": {"type": "none"},
                 "interest": {"apr_pct": 40.0}, "fx_markup_pct": 3.0},
        "rewards": {"kind": "cashback", "base_rate_pct": 0.15, "min_spend_to_earn_aed": 3000,
                    "monthly_cashback_cap_aed": 1000,
                    "tiers": [
                        {"category": "groceries", "rate_pct": 5.0, "monthly_cap_aed": 200},
                        {"category": "dining", "rate_pct": 3.0, "monthly_cap_aed": 200},
                        {"category": "international", "rate_pct": 1.0},
                    ]},
        "benefits": {}, "source": {},
    }
    card.update(over)
    return card


def test_effective_pct_cashback_passthrough():
    assert ve._effective_pct(5.0, {"kind": "cashback"}) == 5.0


def test_effective_pct_miles_conversion():
    # 2.5 miles/AED at AED 0.02/mile -> 5% effective
    assert approx(ve._effective_pct(2.5, {"kind": "miles", "value_per_point_aed": 0.02}), 5.0)


def test_category_caps_apply():
    card = synthetic_card()
    mr = ve.monthly_reward(card, {"groceries": 5000, "dining": 1000, "other": 1000})
    # groceries 5000*5%=250 capped at 200; dining 1000*3%=30; other 1000*0.15%=1.5
    assert approx(mr["by_category"]["groceries"], 200.0)
    assert approx(mr["by_category"]["dining"], 30.0)
    assert approx(mr["by_category"]["other"], 1.5)
    assert approx(mr["total"], 231.5)


def test_min_spend_gate_zeros_reward():
    card = synthetic_card()
    mr = ve.monthly_reward(card, {"groceries": 1000})  # below 3000 gate
    assert mr["gated"] is True and mr["total"] == 0.0


def test_overall_cap_scales_breakdown():
    card = synthetic_card(rewards={**synthetic_card()["rewards"], "monthly_cashback_cap_aed": 100,
                                   "tiers": [{"category": "groceries", "rate_pct": 5.0}]})
    mr = ve.monthly_reward(card, {"groceries": 5000})  # 250 -> capped to 100
    assert approx(mr["total"], 100.0) and mr["capped"] is True


def test_international_split():
    card = synthetic_card()
    mr = ve.monthly_reward(card, {"groceries": 5000, "dining": 1000, "other": 1000,
                                  "__international_share__": 0.2})
    # grocery domestic 4000*5%=200 (cap200); dining dom 800*3%=24; other dom 800*0.15%=1.2
    # intl pool (1000+200+200)*1% = 14
    assert approx(mr["by_category"]["international"], 14.0)
    assert approx(mr["total"], 200 + 24 + 1.2 + 14)


def test_spend_tier_bands():
    card = synthetic_card(rewards={"kind": "cashback", "base_rate_pct": 0.0, "min_spend_to_earn_aed": 3000,
                                   "monthly_cashback_cap_aed": 2000, "tiers": [],
                                   "spend_tiers": [
                                       {"min_total_monthly_spend_aed": 3000, "max_total_monthly_spend_aed": 9999, "rate_pct": 3.0, "applies_to": ["utilities", "groceries"]},
                                       {"min_total_monthly_spend_aed": 10000, "max_total_monthly_spend_aed": None, "rate_pct": 10.0, "applies_to": ["utilities", "groceries"]},
                                   ]})
    # total 12000 -> 10% band; utilities 2000 + groceries 3000 = 5000*10% = 500
    mr = ve.monthly_reward(card, {"utilities": 2000, "groceries": 3000, "other": 7000})
    assert approx(mr["total"], 500.0)


def test_fee_waivers():
    base = synthetic_card()
    assert ve.annual_fee_after_waiver({"fees": {"annual_fee_aed": 300, "annual_fee_waiver": {"type": "free_for_life"}}}, 0) == 0
    assert ve.annual_fee_after_waiver({"fees": {"annual_fee_aed": 300, "annual_fee_waiver": {"type": "spend", "min_annual_spend_aed": 12000}}}, 20000) == 0
    assert ve.annual_fee_after_waiver({"fees": {"annual_fee_aed": 300, "annual_fee_waiver": {"type": "spend", "min_annual_spend_aed": 12000}}}, 5000) == 300
    assert ve.annual_fee_after_waiver({"fees": {"annual_fee_aed": 300, "annual_fee_waiver": {"type": "none"}}}, 99999) == 300


def test_eligibility_income_filter():
    card = synthetic_card(eligibility={"min_monthly_income_aed": 15000})
    profile = {"profile_id": "p", "label": "P", "monthly_income_aed": 8000,
               "monthly_spend_by_category": {"groceries": 4000}, "international_share": 0, "behavior": {}}
    e = ve.evaluate_card(card, profile)
    assert e.eligible is False and any("income" in r for r in e.ineligible_reasons)


def test_revolver_interest_dominates_and_goes_negative():
    card = synthetic_card()
    profile = {"profile_id": "rev", "label": "Rev", "monthly_income_aed": 12000,
               "monthly_spend_by_category": {"groceries": 3000}, "international_share": 0,
               "behavior": {"revolves": True, "revolving_balance_aed": 9000}}
    e = ve.evaluate_card(card, profile)
    # interest = 9000 * 40% = 3600
    assert approx(e.annual_interest_aed, 3600.0)
    assert e.net_annual_value_aed < 0
    assert any("INTEREST DOMINATES" in f for f in e.flags)


def test_transactor_pays_no_interest():
    card = synthetic_card()
    profile = {"profile_id": "t", "label": "T", "monthly_income_aed": 12000,
               "monthly_spend_by_category": {"groceries": 4000}, "international_share": 0,
               "behavior": {"revolves": False}}
    e = ve.evaluate_card(card, profile)
    assert e.annual_interest_aed == 0.0


def test_ranking_orders_by_net_value():
    rich = synthetic_card(card_id="rich", rewards={"kind": "cashback", "base_rate_pct": 3.0, "tiers": []},
                          fees={"annual_fee_aed": 0, "annual_fee_waiver": {"type": "free_for_life"},
                                "interest": {"apr_pct": 40}, "fx_markup_pct": 0})
    poor = synthetic_card(card_id="poor", rewards={"kind": "cashback", "base_rate_pct": 0.1, "tiers": []},
                          fees={"annual_fee_aed": 500, "annual_fee_waiver": {"type": "none"},
                                "interest": {"apr_pct": 40}, "fx_markup_pct": 0})
    profile = {"profile_id": "p", "label": "P", "monthly_income_aed": 12000,
               "monthly_spend_by_category": {"other": 5000}, "international_share": 0, "behavior": {}}
    ranked = ve.rank_cards([poor, rich], profile)
    assert ranked[0].card_id == "rich"


def test_real_dataset_loads_and_ranks():
    cards = ve.load_cards()
    profiles = ve.load_profiles()
    assert len(cards) >= 10 and len(profiles) >= 6
    rec = ve.recommend(cards, next(p for p in profiles if p["profile_id"] == "family-grocery-school"))
    assert rec["ranking"], "family profile should have at least one eligible card"


def test_real_revolver_all_negative():
    cards = ve.load_cards()
    profiles = ve.load_profiles()
    rev = next(p for p in profiles if p["profile_id"] == "revolver-carries-balance")
    ranked = ve.rank_cards(cards, rev)
    assert all(e.net_annual_value_aed < 0 for e in ranked), "a heavy revolver should be net-negative on every card"


# --------------------------------------------------------------------------- #
def _run():
    tests = [g for name, g in sorted(globals().items()) if name.startswith("test_") and callable(g)]
    passed, failed = 0, 0
    for t in tests:
        try:
            t()
            passed += 1
            print(f"  PASS {t.__name__}")
        except AssertionError as e:
            failed += 1
            print(f"  FAIL {t.__name__}: {e}")
        except Exception as e:  # noqa: BLE001
            failed += 1
            print(f"  ERROR {t.__name__}: {type(e).__name__}: {e}")
    print(f"\n{passed} passed, {failed} failed, {len(tests)} total")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(_run())
