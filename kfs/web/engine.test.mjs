// engine.test.mjs — parity test: the JS engine must match the Python source of truth.
//   node kfs/web/engine.test.mjs
// Asserts top picks + net values equal what value_engine.py produces.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { recommend, rankCards } from "./engine.js";

const here = dirname(fileURLToPath(import.meta.url));
const cards = JSON.parse(readFileSync(join(here, "..", "data", "cards.json"), "utf8")).cards;
const profiles = JSON.parse(readFileSync(join(here, "..", "data", "profiles.json"), "utf8")).profiles;
const byId = id => profiles.find(p => p.profile_id === id);

let pass = 0, fail = 0;
const check = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${detail}`); }
};
const near = (a, b, tol = 1.0) => Math.abs(a - b) <= tol;

// Expected values mirror `python3 kfs/engine/value_engine.py` output.
const foodie = recommend(cards, byId("young-professional-foodie"));
check("foodie winner = Mashreq", foodie.ranking[0].card_id === "mashreq-cashback", foodie.ranking[0].card_id);
check("foodie net ≈ 2196", near(foodie.ranking[0].net_annual_value_aed, 2196), foodie.ranking[0].net_annual_value_aed);

const family = recommend(cards, byId("family-grocery-school"));
check("family winner = ADIB", family.ranking[0].card_id === "adib-cashback-visa", family.ranking[0].card_id);
check("family net ≈ 4077", near(family.ranking[0].net_annual_value_aed, 4077), family.ranking[0].net_annual_value_aed);

const digital = recommend(cards, byId("digital-online-shopper"));
check("digital winner = SC X", digital.ranking[0].card_id === "sc-x", digital.ranking[0].card_id);
check("digital net ≈ 2029", near(digital.ranking[0].net_annual_value_aed, 2029), digital.ranking[0].net_annual_value_aed);

const rev = rankCards(cards, byId("revolver-carries-balance"));
check("revolver all net-negative", rev.every(e => e.net_annual_value_aed < 0));
check("revolver flags interest-dominates", rev[0].flags.some(f => f.includes("INTEREST DOMINATES")));

const trav = recommend(cards, byId("frequent-traveler"));
check("traveler winner = ENBD Skywards", trav.ranking[0].card_id === "enbd-skywards-signature", trav.ranking[0].card_id);

// Eligibility: new-to-credit (AED 5,500) must be filtered off RAKBANK (needs 15k)
const ntc = recommend(cards, byId("new-to-credit"));
check("new-to-credit excludes RAKBANK on income", ntc.ineligible.some(c => c.card_id === "rakbank-world-cashback"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
