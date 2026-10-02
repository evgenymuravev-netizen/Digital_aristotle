/* Critical thinking — the ability the AI-and-cognition literature keeps
   pointing at (Gerlich 2025; Lee et al. 2025; Kosmyna et al. 2025).

   Three paradigms, all with decades of validation behind them:

     • Reflection  — CRT-style word problems (Frederick 2005; Toplak 2014;
                     Thomson & Oppenheimer 2016). Each has an answer that
                     leaps to mind and is wrong. Measures whether you check.
     • Logic       — belief-bias syllogisms (Evans, Barston & Pollard 1983).
                     Does the conclusion follow, regardless of whether you
                     believe it? Half the items put logic and belief in
                     conflict; that's where the signal is.
     • Evidence    — passage + claim: does the passage support it, contradict
                     it, or simply not say? The AI-relevant failure mode is
                     overclaiming, so "not enough information" is a real
                     answer, not a cop-out.

   Every item also asks how sure you are. Confidence minus accuracy is
   reported as overconfidence — Lee et al. found that trusting the tool is
   what switches critical thinking off, so the metacognitive read matters.

   Items are generated from parametrised templates and sampled from banks,
   so the same person doesn't see the same problem twice in a row of
   sessions — essential for a test you're meant to take repeatedly. */
import { el, clear, sleep, instructions, setProgress, shuffle, pick, clamp } from "../ui.js";

export const meta = {
  id: "critical",
  name: "Critical Thinking",
  domain: "Critical Thinking",
  blurb: "Override the obvious answer, judge logic over belief, claim only what the evidence supports.",
  duration: "~3 min",
  seconds: 180,
};

export const COUNTS = { reflect: 4, logic: 6, evidence: 4 };
const N_ITEMS = COUNTS.reflect + COUNTS.logic + COUNTS.evidence;
const ITEM_SECONDS = 45;

/** Confidence buttons → the probability we score calibration against. */
export const CONF = [
  { label: "Sure", p: 0.9 },
  { label: "Fairly sure", p: 0.7 },
  { label: "Guessing", p: 0.5 },
];

const money = (n) => n.toFixed(2).replace(/\.00$/, "");
const ord = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

/* ============================================================
   REFLECTION — parametrised so the numbers change every session
   ============================================================ */
const PAIRS = [["bat", "ball"], ["notebook", "pen"], ["coffee", "bagel"], ["racket", "shuttlecock"], ["jacket", "scarf"], ["lamp", "bulb"]];

function tBatBall() {
  const [a, b] = pick(PAIRS);
  const x = pick([5, 10, 15, 20, 25]) / 100;      // the cheaper item
  const diff = pick([1, 1.5, 2, 2.5, 3]);
  const total = diff + 2 * x;
  return {
    kind: "reflect", mode: "number", unit: "$", answer: x, intuitive: total - diff,
    prompt: `A ${a} and a ${b} cost $${money(total)} in total. The ${a} costs $${money(diff)} more than the ${b}. How much does the ${b} cost?`,
    explain: `If the ${b} were $${money(total - diff)}, the ${a} would be $${money(total)} and the pair $${money(2 * total - diff)}. It's $${money(x)}: ${money(x)} + ${money(x + diff)} = ${money(total)}.`,
  };
}
function tWidgets() {
  const n = pick([3, 5, 7, 8]), m = pick([50, 100, 200]);
  return {
    kind: "reflect", mode: "number", unit: "min", answer: n, intuitive: m,
    prompt: `If it takes ${n} machines ${n} minutes to make ${n} widgets, how many minutes would it take ${m} machines to make ${m} widgets?`,
    explain: `Each machine makes one widget in ${n} minutes, so ${m} machines make ${m} widgets in ${n} minutes.`,
  };
}
function tLily() {
  const D = pick([24, 36, 48, 60]);
  const thing = pick(["patch of lily pads", "colony of algae", "spot of mould"]);
  return {
    kind: "reflect", mode: "number", unit: "days", answer: D - 1, intuitive: D / 2,
    prompt: `A ${thing} in a pond doubles in size every day. It takes ${D} days to cover the whole pond. How many days did it take to cover half?`,
    explain: `It doubles daily, so it covered half the pond the day before it covered all of it: day ${D - 1}.`,
  };
}
function tSheep() {
  // odd herd sizes: with an even n, n−k can equal k and the item measures nothing
  const n = pick([15, 17, 21, 23]), k = pick([6, 7, 8, 9]);
  const animal = pick(["sheep", "goats", "hens", "cows"]);
  return {
    kind: "reflect", mode: "number", unit: "", answer: k, intuitive: n - k,
    prompt: `A farmer had ${n} ${animal}. All but ${k} died. How many ${animal} are left?`,
    explain: `"All but ${k}" means ${k} survived.`,
  };
}
function tRace() {
  const k = pick([2, 3, 4]);
  const names = ["First", "Second", "Third", "Fourth"];
  return {
    kind: "reflect", mode: "choice", options: names, answer: k - 1, intuitive: k - 2,
    prompt: `You're running a race and you overtake the runner in ${names[k - 1].toLowerCase()} place. What place are you in now?`,
    explain: `You take the place of the runner you passed — ${names[k - 1].toLowerCase()}.`,
  };
}
function tDaughters() {
  const name = pick(["Emily", "Sofia", "Priya", "Hana", "Lena", "Nora"]);
  const [d1, d2] = pick([["April", "May"], ["June", "July"], ["Monday", "Tuesday"], ["Anna", "Bella"]]);
  return {
    kind: "reflect", mode: "text", answer: name.toLowerCase(), intuitive: null,
    prompt: `${name}'s father has three daughters. The first two are named ${d1} and ${d2}. What is the third daughter's name?`,
    explain: `The third daughter is ${name} — it's her father.`,
  };
}
function tTrade() {
  const b = pick([60, 80, 120, 150]);
  const item = pick(["a bicycle", "a painting", "a guitar", "a watch"]);
  return {
    kind: "reflect", mode: "number", unit: "$", answer: 20, intuitive: 10,
    prompt: `A dealer buys ${item} for $${b}, sells it for $${b + 10}, buys it back for $${b + 20}, and sells it again for $${b + 30}. What is the total profit?`,
    explain: `Two separate trades, each +$10: $20 in total.`,
  };
}
function tRank() {
  const k = pick([12, 15, 18, 21]);
  const name = pick(["Jerry", "Mia", "Omar", "Yuki"]);
  return {
    kind: "reflect", mode: "number", unit: "", answer: 2 * k - 1, intuitive: 2 * k,
    prompt: `${name} got both the ${ord(k)} highest and the ${ord(k)} lowest mark in the class. How many students are in the class?`,
    explain: `${k - 1} students above, ${k - 1} below, plus ${name}: ${2 * k - 1}.`,
  };
}
function tStocks() {
  const amt = pick([8000, 5000, 10000]);
  return {
    kind: "reflect", mode: "choice", options: ["Made money", "Broken even", "Lost money"], answer: 2, intuitive: 0,
    prompt: `Sam invested $${amt.toLocaleString("en-US")}. Six months later the shares were down 50%. Over the next three months they rose 75%. Sam has now:`,
    explain: `$${amt.toLocaleString("en-US")} → $${(amt / 2).toLocaleString("en-US")} → $${(amt / 2 * 1.75).toLocaleString("en-US")}. Still below the start.`,
  };
}
export const REFLECT_TEMPLATES = [tBatBall, tWidgets, tLily, tSheep, tRace, tDaughters, tTrade, tRank, tStocks];

export function sampleReflect(n = COUNTS.reflect) {
  return shuffle(REFLECT_TEMPLATES).slice(0, n).map((t) => t());
}

/* ============================================================
   LOGIC — belief-bias syllogisms, Evans (1983) design
   Each content set {A, B, C} is chosen so that
     "some B are not A" is believable and "some A are not B" is not.
   ============================================================ */
export const SYLLOGISM_SETS = [
  { A: "cigarettes", B: "addictive things", C: "inexpensive" },
  { A: "roses", B: "flowers", C: "blue" },
  { A: "whales", B: "mammals", C: "land animals" },
  { A: "sparrows", B: "birds", C: "flightless" },
  { A: "diamonds", B: "gemstones", C: "soft" },
  { A: "carrots", B: "vegetables", C: "leafy" },
  { A: "pianos", B: "instruments", C: "portable" },
  { A: "oaks", B: "trees", C: "evergreen" },
];

/**
 * Build one syllogism. form 1 = "No A are C. Some B are C."
 * form 2 = "No B are C. Some A are C." The valid conclusion of each is the
 * one whose subject is the term of the "Some" premise.
 */
export function buildSyllogism(set, form, valid) {
  const { A, B, C } = set;
  const p1 = form === 1 ? `No ${A} are ${C}.` : `No ${B} are ${C}.`;
  const p2 = form === 1 ? `Some ${B} are ${C}.` : `Some ${A} are ${C}.`;
  const aboutB = (form === 1) === valid;                 // conclusion "some B are not A"?
  const concl = aboutB ? `some ${B} are not ${A}` : `some ${A} are not ${B}`;
  const believable = aboutB;
  const conflict = valid !== believable;
  const cell = (valid ? "V" : "I") + (believable ? "B" : "U");
  const explain = {
    VB: `Valid: no ${A} are ${C}, so the ${B} that are ${C} can't be ${A}.`,
    VU: `Valid. Take the premises as given: no ${B} are ${C}, yet some ${A} are ${C} — so those ${A} aren't ${B}. It clashes with what you know, and it still follows.`,
    IB: `Doesn't follow. The premises only tell you about the ${A} that are ${C}; they say nothing about whether any ${B} fall outside ${A}. It sounds true — the premises just don't prove it.`,
    IU: `Doesn't follow. The premises concern the ${B} that are ${C}; they say nothing about ${A} being outside ${B}.`,
  }[cell];
  return {
    kind: "logic", mode: "choice", options: ["Follows", "Doesn't follow"],
    answer: valid ? 0 : 1, valid, believable, conflict, cell,
    prompt: `${p1} ${p2}`, conclusion: `Therefore, ${concl}.`, explain,
  };
}

const CELL_ARGS = { VB: [1, true], IU: [1, false], VU: [2, true], IB: [2, false] };
/** Six items: four in belief–logic conflict, two not — different content each. */
export function sampleLogic() {
  const sets = shuffle(SYLLOGISM_SETS).slice(0, COUNTS.logic);
  const cells = shuffle(["VU", "VU", "IB", "IB", "VB", "IU"]);
  return cells.map((cell, i) => buildSyllogism(sets[i], ...CELL_ARGS[cell]));
}

/* ============================================================
   EVIDENCE — does the passage support the claim?
   0 = follows · 1 = not enough information · 2 = contradicts
   ============================================================ */
export const EVIDENCE_OPTIONS = ["Follows", "Not enough information", "Contradicts"];
export const EVIDENCE_BANK = [
  { answer: 1, passage: "A study of 2,000 adults found that people who drank coffee daily reported better mood than those who didn't.", claim: "Drinking coffee improves mood.", explain: "A correlation across people. Happier people may simply drink more coffee, or something else drives both." },
  { answer: 1, passage: "In the survey, 70% of respondents said they use AI tools at work. The survey was sent to subscribers of an AI newsletter.", claim: "Most workers use AI tools.", explain: "The sample is people who already opted into AI news — it says nothing about workers in general." },
  { answer: 2, passage: "Every product the company shipped last year passed its safety test before release.", claim: "Last year the company shipped a product that had failed its safety test.", explain: "Direct contradiction: 'every product passed' rules out a failed one being shipped." },
  { answer: 0, passage: "The bakery sells out of croissants by 9 a.m. on weekdays. On Saturdays it bakes twice as many and still sells out by noon.", claim: "The bakery bakes croissants on Saturdays.", explain: "It bakes twice as many on Saturdays — so it bakes them on Saturdays." },
  { answer: 1, passage: "Sales rose 20% after the new ad campaign launched in March. In March the company also cut prices by 15%.", claim: "The ad campaign caused the sales increase.", explain: "Two things changed at once. The price cut could explain all, some, or none of the rise." },
  { answer: 0, passage: "Only members may enter the club after 10 p.m. Dana entered the club at 11 p.m.", claim: "Dana is a member.", explain: "After 10 p.m. only members get in; Dana got in at 11 — so Dana is a member." },
  { answer: 1, passage: "Only members may enter the club after 10 p.m. Dana entered the club at 8 p.m.", claim: "Dana is a member.", explain: "The rule only applies after 10 p.m. At 8 p.m. anyone might get in." },
  { answer: 2, passage: "Of the 40 students who took the course, none failed the final exam.", claim: "A student who took the course failed the final exam.", explain: "'None failed' contradicts the claim outright." },
  { answer: 1, passage: "The new drug reduced symptoms in 60% of patients; the placebo reduced symptoms in 58%.", claim: "The drug is substantially more effective than placebo.", explain: "A two-point gap with no sample size or error margin could easily be noise. Not shown either way." },
  { answer: 0, passage: "Every painting the museum owns is insured. The museum also owns one sculpture, which is not insured.", claim: "Something the museum owns is not insured.", explain: "The sculpture is owned and uninsured." },
  { answer: 1, passage: "Employees who attended the optional training were promoted at twice the rate of those who did not.", claim: "Attending the training doubles your chance of promotion.", explain: "Optional training attracts the already-ambitious. The gap may be who attends, not what they learn." },
  { answer: 0, passage: "The city recorded 12 rainy days in April and 3 in May.", claim: "May had fewer rainy days than April.", explain: "3 is fewer than 12." },
  { answer: 2, passage: "The lab tested every batch, and every batch was within tolerance.", claim: "At least one batch was out of tolerance.", explain: "'Every batch within tolerance' rules it out." },
  { answer: 1, passage: "Students who use a tutoring app score higher on average than students who don't.", claim: "The app raises scores.", explain: "Higher-scoring students may be the ones who choose the app. No cause shown." },
];

/** Four items: two 'not enough information', one 'follows', one 'contradicts', shuffled. */
export function sampleEvidence() {
  const byAns = (a) => shuffle(EVIDENCE_BANK.filter((x) => x.answer === a));
  const picked = [...byAns(1).slice(0, 2), byAns(0)[0], byAns(2)[0]];
  return shuffle(picked).map((x) => ({ ...x, kind: "evidence", mode: "choice", options: EVIDENCE_OPTIONS, prompt: x.passage }));
}

/* ============================================================
   SCORING (pure)
   ============================================================ */
export function checkAnswer(item, given) {
  if (given == null || given === "") return false;
  if (item.mode === "choice") return given === item.answer;
  if (item.mode === "text") return String(given).trim().toLowerCase() === item.answer;
  const n = parseFloat(String(given).replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && Math.abs(n - item.answer) < 0.005;
}

/** Weighted accuracy: reflection 35%, logic 35%, evidence 30% → 0..100. */
export function criticalScore({ reflect, logic, evidence }) {
  const frac = (g) => (g.total ? g.correct / g.total : 0);
  return clamp((0.35 * frac(reflect) + 0.35 * frac(logic) + 0.30 * frac(evidence)) * 100, 0, 100);
}

/** Belief-bias index in points: accuracy on no-conflict minus conflict items. */
export function biasIndex(logicItems) {
  const acc = (xs) => (xs.length ? xs.filter((x) => x.correct).length / xs.length : null);
  const a = acc(logicItems.filter((x) => !x.conflict)), b = acc(logicItems.filter((x) => x.conflict));
  if (a == null || b == null) return null;
  return Math.round((a - b) * 100);
}

/** Mean stated confidence minus actual accuracy, over items that rated confidence. */
export function overconfidence(items) {
  const rated = items.filter((x) => x.conf != null);
  if (!rated.length) return null;
  const conf = rated.reduce((s, x) => s + x.conf, 0) / rated.length;
  const acc = rated.filter((x) => x.correct).length / rated.length;
  return conf - acc;
}

/* ============================================================
   UI
   ============================================================ */
const KICKER = {
  reflect: "Reflection — check the obvious answer before you commit",
  logic: "Logic — assume both premises are true. Does the conclusion follow?",
  evidence: "Evidence — does the passage support the claim?",
};

function askItem(stage, item, index, total, signal) {
  return new Promise((resolve, reject) => {
    clear(stage);
    let given = null, finished = false;

    const timerEl = el("div", { class: "mini-timer" }, `${ITEM_SECONDS}s`);
    const counterEl = el("div", { class: "mini-counter" }, `${index + 1} / ${total}`);
    const wrap = el("div", { class: "ct" });
    wrap.append(el("div", { class: "tc-domain", text: KICKER[item.kind] }));
    wrap.append(el("div", { class: "ct-prompt" }, item.prompt));
    if (item.conclusion) wrap.append(el("div", { class: "ct-conclusion" }, item.conclusion));
    if (item.claim) wrap.append(el("div", { class: "ct-claim" }, [el("b", { text: "Claim: " }), item.claim]));

    // --- confidence row (enabled once there's an answer) ---
    const confBtns = CONF.map((c) => el("button", { class: "choice ct-conf-btn", type: "button", disabled: "" }, c.label));
    const confRow = el("div", { class: "ct-conf" }, [
      el("div", { class: "muted ct-conf-label", text: "How sure are you?" }),
      el("div", { class: "choice-row cols-3" }, confBtns),
    ]);
    const enableConf = () => confBtns.forEach((b) => b.removeAttribute("disabled"));

    // --- answer area ---
    let input = null;
    const choiceBtns = [];
    if (item.mode === "choice") {
      const row = el("div", { class: `choice-row ${item.options.length > 2 ? "cols-3" : ""}` });
      item.options.forEach((opt, i) => {
        const b = el("button", { class: "choice", type: "button" }, `${opt}  (${i + 1})`);
        const h = (e) => { e.preventDefault(); selectChoice(i); };
        b.addEventListener("pointerdown", h);
        b.addEventListener("click", h);
        choiceBtns.push(b); row.append(b);
      });
      wrap.append(row);
    } else {
      input = el("input", {
        class: "answer-input ct-input", type: "text", autocomplete: "off",
        inputmode: item.mode === "number" ? "decimal" : "text",
        placeholder: item.mode === "number" ? (item.unit ? `Answer in ${item.unit === "$" ? "dollars" : item.unit}` : "Your answer") : "Type the answer",
        "aria-label": "Your answer",
      });
      input.addEventListener("input", () => {
        given = input.value.trim() === "" ? null : input.value.trim();
        if (given != null) enableConf();
      });
      wrap.append(el("div", { class: "ct-input-wrap" }, [item.unit === "$" ? el("span", { class: "ct-unit", text: "$" }) : null, input]));
    }
    wrap.append(confRow);
    stage.append(timerEl, counterEl, wrap);
    if (input) input.focus();

    const selectChoice = (i) => {
      given = i;
      choiceBtns.forEach((b, j) => b.classList.toggle("picked", j === i));
      enableConf();
    };

    // --- timing ---
    const t0 = performance.now();
    const tick = setInterval(() => {
      const left = Math.max(0, ITEM_SECONDS - (performance.now() - t0) / 1000);
      timerEl.textContent = `${Math.ceil(left)}s`;
      if (left <= 0) finish(null, true);
    }, 250);

    const onKey = (e) => {
      if (e.key === "Enter" && given != null) { e.preventDefault(); finish(CONF[1].p, false); return; }
      if (item.mode === "choice" && !input) {
        const i = ["1", "2", "3", "4"].indexOf(e.key);
        if (i >= 0 && i < item.options.length) { e.preventDefault(); selectChoice(i); }
      }
    };
    const onAbort = () => { cleanup(); reject(new DOMException("aborted", "AbortError")); };
    const cleanup = () => { clearInterval(tick); window.removeEventListener("keydown", onKey); signal?.removeEventListener("abort", onAbort); };
    const finish = (conf, timedOut) => {
      if (finished) return; finished = true;
      cleanup();
      resolve({ given, conf, timedOut, ms: performance.now() - t0 });
    };
    confBtns.forEach((b, i) => {
      const h = (e) => { e.preventDefault(); if (given != null) finish(CONF[i].p, false); };
      b.addEventListener("pointerdown", h);
      b.addEventListener("click", h);
    });
    window.addEventListener("keydown", onKey);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function describeAnswer(item, given) {
  if (given == null) return "—";
  if (item.mode === "choice") return item.options[given] ?? "—";
  if (item.mode === "number" && item.unit === "$") return `$${given}`;
  return String(given);
}
function describeCorrect(item) {
  if (item.mode === "choice") return item.options[item.answer];
  if (item.mode === "text") return item.answer[0].toUpperCase() + item.answer.slice(1);
  if (item.unit === "$") return `$${money(item.answer)}`;
  return `${item.answer}${item.unit ? " " + item.unit : ""}`;
}

export async function run(stage, { signal } = {}) {
  const ok = await instructions(stage, {
    domain: meta.domain, title: "Critical Thinking",
    bodyHTML: `<p>${N_ITEMS} short items in three flavours. No credit for speed — but each item has a ${ITEM_SECONDS}-second clock.</p>
      <ul>
        <li><b>Reflection</b> — word problems with an answer that jumps out. Check it before you commit.</li>
        <li><b>Logic</b> — two premises and a conclusion. <b>Assume the premises are true</b>, even when they aren't. Does the conclusion follow?</li>
        <li><b>Evidence</b> — a passage and a claim. Does the passage prove it, contradict it, or simply not say?</li>
      </ul>
      <p class="muted">After every answer, say how sure you are — that's scored too. <span class="keyhint">Enter</span> = “fairly sure”.</p>`,
    button: "Begin", signal,
  });
  if (!ok) throw new DOMException("aborted", "AbortError");

  // interleave so no flavour clusters at the end when you're tired
  const items = shuffle([...sampleReflect(), ...sampleLogic(), ...sampleEvidence()]);
  const done = [];
  for (let i = 0; i < items.length; i++) {
    setProgress(i / items.length, meta.name);
    const r = await askItem(stage, items[i], i, items.length, signal);
    const correct = !r.timedOut && checkAnswer(items[i], r.given);
    done.push({ ...items[i], given: r.given, conf: r.timedOut ? null : r.conf, correct, timedOut: r.timedOut });
    clear(stage); await sleep(180);
  }
  setProgress(1, meta.name);

  const group = (kind) => {
    const xs = done.filter((x) => x.kind === kind);
    return { correct: xs.filter((x) => x.correct).length, total: xs.length };
  };
  const g = { reflect: group("reflect"), logic: group("logic"), evidence: group("evidence") };
  const score = criticalScore(g);
  const correct = done.filter((x) => x.correct).length;
  const pctCorrect = Math.round((correct / done.length) * 100);
  const bias = biasIndex(done.filter((x) => x.kind === "logic"));
  const oc = overconfidence(done);

  return {
    ...meta, score, raw: pctCorrect,
    rawLabel: `${correct}/${done.length} correct · reflection ${g.reflect.correct}/${g.reflect.total} · logic ${g.logic.correct}/${g.logic.total} · evidence ${g.evidence.correct}/${g.evidence.total}`,
    detail: {
      Reflection: `${g.reflect.correct}/${g.reflect.total}`,
      Logic: `${g.logic.correct}/${g.logic.total}`,
      Evidence: `${g.evidence.correct}/${g.evidence.total}`,
      "Belief bias": bias == null ? "—" : `${bias > 0 ? "+" : ""}${bias} pts`,
      Overconfidence: oc == null ? "—" : `${oc >= 0 ? "+" : ""}${Math.round(oc * 100)}%`,
    },
    // per-item review, rendered on the results screen (not persisted)
    review: done.map((x) => ({
      kind: x.kind,
      prompt: x.kind === "logic" ? `${x.prompt} ${x.conclusion}` : x.kind === "evidence" ? `${x.passage} — Claim: ${x.claim}` : x.prompt,
      yours: x.timedOut ? "(time ran out)" : describeAnswer(x, x.given),
      correct: describeCorrect(x),
      right: x.correct,
      conf: x.conf,
      explain: x.explain,
    })),
  };
}
