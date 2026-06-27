// app.js — loads the data, drives the profile editor, runs the engine live,
// renders the ranking + a dependency-free radar. Keep logic in engine.js.
import { recommend } from "./engine.js";

const $ = sel => document.querySelector(sel);
const fmtAed = x => "AED " + Math.round(x).toLocaleString();
const RADAR_AXES = [
  ["value", "Value"], ["cost", "Low cost"], ["simplicity", "Simplicity"],
  ["flexibility", "Flexibility"], ["perks", "Perks"],
];
const SERIES_COLORS = ["#48e0a8", "#5aa9ff", "#ffce6b"];

let CARDS = [], PROFILES = [], CATEGORIES = [], CARDS_BY_ID = {};
let state = null; // the live (mutable) profile

async function boot() {
  try {
    const [c, p, cat] = await Promise.all([
      fetch("../data/cards.json").then(r => r.json()),
      fetch("../data/profiles.json").then(r => r.json()),
      fetch("../data/categories.json").then(r => r.json()),
    ]);
    CARDS = c.cards; PROFILES = p.profiles; CATEGORIES = cat.categories;
    CARDS_BY_ID = Object.fromEntries(CARDS.map(x => [x.card_id, x]));
  } catch (e) {
    const el = $("#loadError");
    el.hidden = false;
    el.textContent = "Could not load data (" + e.message + "). Serve this folder over HTTP — e.g. `python3 -m http.server` — rather than opening the file directly.";
    return;
  }
  buildArchetypes();
  buildSpendGrid();
  wireEditor();
  selectArchetype(PROFILES.find(p => p.profile_id === "family-grocery-school") || PROFILES[0]);
}

function buildArchetypes() {
  const host = $("#archetypes");
  host.innerHTML = "";
  for (const prof of PROFILES) {
    const b = document.createElement("button");
    b.dataset.id = prof.profile_id;
    b.innerHTML = `${prof.label}<small>${shortDesc(prof)}</small>`;
    b.onclick = () => selectArchetype(prof);
    host.appendChild(b);
  }
}
function shortDesc(p) {
  if (p.behavior?.revolves) return "carries a balance";
  const s = p.monthly_spend_by_category || {};
  const top = Object.entries(s).sort((a, b) => b[1] - a[1])[0];
  return top ? "mostly " + (labelFor(top[0]) || top[0]).toLowerCase() : "";
}
function labelFor(key) { return (CATEGORIES.find(c => c.key === key) || {}).label; }

function buildSpendGrid() {
  const grid = $("#spendGrid");
  grid.innerHTML = "";
  for (const cat of CATEGORIES) {
    const wrap = document.createElement("div");
    wrap.className = "cat";
    wrap.innerHTML = `<label for="sp_${cat.key}" title="${cat.examples || ""}">${cat.label}</label>
      <input type="number" id="sp_${cat.key}" data-cat="${cat.key}" min="0" step="50" value="0" />`;
    grid.appendChild(wrap);
  }
}

function selectArchetype(prof) {
  // deep clone so edits don't mutate the dataset
  state = JSON.parse(JSON.stringify(prof));
  state.behavior = state.behavior || {};
  state.preferences = state.preferences || {};
  document.querySelectorAll("#archetypes button").forEach(b =>
    b.classList.toggle("active", b.dataset.id === prof.profile_id));
  syncEditorFromState();
  recompute();
}

function syncEditorFromState() {
  $("#income").value = state.monthly_income_aed || 0;
  const spend = state.monthly_spend_by_category || {};
  for (const cat of CATEGORIES) {
    $("#sp_" + cat.key).value = Math.round(spend[cat.key] || 0);
  }
  const intlPct = Math.round((state.international_share || 0) * 100);
  $("#intl").value = intlPct; $("#intlVal").textContent = intlPct + "%";
  $("#revolves").checked = !!state.behavior.revolves;
  $("#balanceField").hidden = !state.behavior.revolves;
  $("#balance").value = state.behavior.revolving_balance_aed || 0;
  $("#lounge").value = state.behavior.lounge_visits_per_year || 0;
  $("#insurance").checked = !!state.behavior.values_travel_insurance;
  $("#islamic").checked = !!state.preferences.islamic_only;
  updateTotals();
}

function readStateFromEditor() {
  state.monthly_income_aed = num($("#income").value);
  const spend = {};
  for (const cat of CATEGORIES) {
    const v = num($("#sp_" + cat.key).value);
    if (v) spend[cat.key] = v;
  }
  state.monthly_spend_by_category = spend;
  state.international_share = num($("#intl").value) / 100;
  state.behavior.revolves = $("#revolves").checked;
  state.behavior.revolving_balance_aed = num($("#balance").value);
  state.behavior.lounge_visits_per_year = num($("#lounge").value);
  state.behavior.values_travel_insurance = $("#insurance").checked;
  state.preferences.islamic_only = $("#islamic").checked;
}

function wireEditor() {
  const inputs = ["#income", "#balance", "#lounge", "#intl"];
  inputs.forEach(s => $(s).addEventListener("input", onEdit));
  ["#revolves", "#insurance", "#islamic"].forEach(s => $(s).addEventListener("change", onEdit));
  $("#spendGrid").addEventListener("input", onEdit);
  $("#intl").addEventListener("input", () => $("#intlVal").textContent = $("#intl").value + "%");
  $("#revolves").addEventListener("change", () => $("#balanceField").hidden = !$("#revolves").checked);
}
function onEdit() {
  // switching to custom: drop the active archetype highlight
  document.querySelectorAll("#archetypes button").forEach(b => b.classList.remove("active"));
  readStateFromEditor();
  updateTotals();
  recompute();
}

function updateTotals() {
  const total = CATEGORIES.reduce((a, c) => a + num($("#sp_" + c.key).value), 0);
  $("#totalSpend").textContent = fmtAed(total);
  $("#annualSpend").textContent = fmtAed(total * 12);
}
const num = v => Math.max(0, parseFloat(v) || 0);

// ───────────── render ─────────────
function recompute() {
  const rec = recommend(CARDS, state, undefined, 5);
  renderHeadline(rec);
  renderRanking(rec);
  renderIneligible(rec);
  renderRadar(rec);
}

function renderHeadline(rec) {
  const el = $("#headline");
  if (rec.headline) { el.hidden = false; el.textContent = "⚠ " + rec.headline; }
  else el.hidden = true;
}

const SHOW_TOP = 8;
function renderRanking(rec) {
  const ol = $("#ranking");
  ol.innerHTML = "";
  if (!rec.ranking.length) {
    ol.innerHTML = `<li class="muted">No eligible cards for this profile. Lower the income requirement or relax the Islamic-only filter.</li>`;
    return;
  }
  const shown = rec.ranking.slice(0, SHOW_TOP);
  shown.forEach((e, i) => {
    const card = CARDS_BY_ID[e.card_id];
    const conf = (card.source && card.source.confidence) || "low";
    const net = e.net_annual_value_aed;
    const li = document.createElement("li");
    li.className = "card" + (i === 0 ? " win" : "");
    li.innerHTML = `
      <span class="rank">${i + 1}</span>
      <div class="card-top">
        <div>
          <div class="card-name">${card.card_name}</div>
          <div class="card-bank">${card.bank.name}${card.islamic ? " · Islamic" : ""}${card.network ? " · " + card.network : ""}</div>
        </div>
        <div class="netval">
          <span class="big ${net >= 0 ? "pos" : "neg"}">${net >= 0 ? "+" : "−"}${fmtAed(Math.abs(net)).replace("AED ", "AED ")}</span>
          <span class="unit">net value / year</span>
        </div>
      </div>
      <div class="breakdown">
        <span class="chip plus">＋ rewards ${fmtAed(e.annual_reward_aed)}</span>
        ${e.annual_benefits_aed ? `<span class="chip plus">＋ perks ${fmtAed(e.annual_benefits_aed)}</span>` : ""}
        ${e.annual_fee_aed ? `<span class="chip minus">－ fee ${fmtAed(e.annual_fee_aed)}</span>` : `<span class="chip">fee waived</span>`}
        ${e.annual_fx_cost_aed ? `<span class="chip minus">－ FX ${fmtAed(e.annual_fx_cost_aed)}</span>` : ""}
        ${e.annual_interest_aed ? `<span class="chip minus">－ interest ${fmtAed(e.annual_interest_aed)}</span>` : ""}
      </div>
      <div class="meta-row">
        <span class="effrate">effective reward rate <b>${e.effective_reward_rate_pct}%</b></span>
        <span class="conf ${conf}" title="${(card.source && card.source.provenance_notes) || ""}">${conf} confidence</span>
      </div>
      ${e.flags.length ? `<div class="flags">${e.flags.map(f =>
        `<div class="flag ${f.includes("INTEREST") ? "bad" : ""}">${f}</div>`).join("")}</div>` : ""}`;
    ol.appendChild(li);
  });
  if (rec.ranking.length > SHOW_TOP) {
    const more = document.createElement("li");
    more.className = "muted small more-row";
    more.textContent = `+ ${rec.ranking.length - SHOW_TOP} more eligible cards ranked below (net value ${fmtAed(rec.ranking[SHOW_TOP].net_annual_value_aed)} and lower).`;
    ol.appendChild(more);
  }
}

function renderIneligible(rec) {
  $("#inelCount").textContent = rec.ineligible.length;
  const ul = $("#ineligible");
  ul.innerHTML = rec.ineligible.map(c =>
    `<li><b>${c.card_name}</b> — ${c.reasons.join("; ")}</li>`).join("") || `<li>None — you're eligible for every card in the set.</li>`;
}

// ───────────── radar (dependency-free canvas) ─────────────
function renderRadar(rec) {
  const cv = $("#radar"), ctx = cv.getContext("2d");
  const W = cv.width, H = cv.height, cx = W / 2, cy = H / 2 + 6, R = Math.min(W, H) / 2 - 64;
  ctx.clearRect(0, 0, W, H);
  const n = RADAR_AXES.length;
  const ang = i => -Math.PI / 2 + i * 2 * Math.PI / n;
  const pt = (i, r) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];

  // grid rings
  ctx.strokeStyle = "#243049"; ctx.fillStyle = "#93a0b8"; ctx.lineWidth = 1;
  for (let ring = 1; ring <= 4; ring++) {
    const r = R * ring / 4;
    ctx.beginPath();
    for (let i = 0; i < n; i++) { const [x, y] = pt(i, r); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath(); ctx.stroke();
  }
  // spokes + labels
  ctx.font = "12px system-ui";
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(i, R); ctx.strokeStyle = "#243049";
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
    const [lx, ly] = pt(i, R + 24);
    ctx.fillStyle = "#c7d2e6"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(RADAR_AXES[i][1], lx, ly);
  }
  // series (top 3)
  const top = rec.ranking.slice(0, 3);
  const legend = $("#radarLegend"); legend.innerHTML = "";
  top.forEach((e, s) => {
    const sc = rec.scorecards[e.card_id]; if (!sc) return;
    const col = SERIES_COLORS[s];
    ctx.beginPath();
    RADAR_AXES.forEach(([key], i) => {
      const r = R * Math.max(0, Math.min(100, sc[key])) / 100;
      const [x, y] = pt(i, r); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = col + "22"; ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
    RADAR_AXES.forEach(([key], i) => {
      const r = R * Math.max(0, Math.min(100, sc[key])) / 100;
      const [x, y] = pt(i, r); ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 2 * Math.PI); ctx.fill();
    });
    const span = document.createElement("span");
    span.innerHTML = `<i style="background:${col}"></i>${CARDS_BY_ID[e.card_id].card_name}`;
    legend.appendChild(span);
  });
}

boot();
