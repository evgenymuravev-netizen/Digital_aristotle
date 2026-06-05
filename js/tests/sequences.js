/* Fluid reasoning — number-series completion.
   Infer the rule behind a sequence and pick the next term. This taps
   abstract pattern-finding, the kind of "figure it out from scratch"
   reasoning that's easy to lean on AI for. Score = % correct. */
import { el, clear, sleep, instructions, countdown, setProgress, shuffle, randInt } from "../ui.js";

export const meta = {
  id: "sequences",
  name: "Number Series",
  domain: "Reasoning",
  icon: "🧩",
  blurb: "Spot the hidden rule and extend the pattern.",
  duration: "~90 sec",
};

const PROBLEMS = 8;

const GENERATORS = [
  // arithmetic progression
  () => { const a = randInt(1, 12), d = randInt(2, 9); return Array.from({ length: 6 }, (_, i) => a + i * d); },
  // geometric progression
  () => { const a = randInt(2, 4), r = randInt(2, 3); return Array.from({ length: 6 }, (_, i) => a * r ** i); },
  // increasing differences (e.g. +1,+2,+3,…)
  () => { let a = randInt(1, 9), d = randInt(1, 4); const inc = randInt(1, 3); const s = [a]; for (let i = 1; i < 6; i++) { a += d; s.push(a); d += inc; } return s; },
  // perfect squares, possibly offset
  () => { const k = randInt(0, 3); return Array.from({ length: 6 }, (_, i) => (i + 1 + k) ** 2); },
  // fibonacci-like
  () => { let x = randInt(1, 4), y = randInt(2, 6); const s = [x, y]; for (let i = 2; i < 6; i++) { const z = x + y; s.push(z); x = y; y = z; } return s; },
  // two interleaved arithmetic series
  () => { let p = randInt(1, 9), q = randInt(2, 9); const d1 = randInt(2, 5), d2 = randInt(2, 5); const s = []; for (let i = 0; i < 3; i++) { s.push(p, q); p += d1; q += d2; } return s.slice(0, 6); },
  // ×2 then +1 style
  () => { let a = randInt(1, 4); const s = [a]; for (let i = 1; i < 6; i++) { a = a * 2 + 1; s.push(a); } return s; },
];

function distractors(answer, seq) {
  const step = (seq[seq.length - 1] - seq[seq.length - 2]) || 1;
  const pool = [answer + step, answer - step, answer + 1, answer - 1, answer + 2, answer - 2,
    Math.round(answer * 1.5), answer + Math.max(2, Math.round(answer * 0.1)), seq[seq.length - 1] + step];
  const out = [];
  for (const c of shuffle(pool)) {
    if (c !== answer && c > 0 && !out.includes(c)) out.push(c);
    if (out.length === 3) break;
  }
  let pad = 3;
  while (out.length < 3) { const c = answer + (pad++); if (c !== answer && !out.includes(c)) out.push(c); }
  return out;
}

function problem(stage, index, signal) {
  return new Promise((resolve, reject) => {
    const seq = GENERATORS[Math.floor(Math.random() * GENERATORS.length)]();
    const answer = seq[5];
    const shown = seq.slice(0, 5);
    const options = shuffle([answer, ...distractors(answer, shown)]);

    clear(stage);
    const row = el("div", { class: "choice-row" });
    const onAbort = () => { cleanup(); reject(new DOMException("aborted", "AbortError")); };
    const onKey = (e) => { const i = ["1", "2", "3", "4"].indexOf(e.key); if (i >= 0) { e.preventDefault(); choose(options[i]); } };
    const cleanup = () => { window.removeEventListener("keydown", onKey); signal?.removeEventListener("abort", onAbort); };
    const choose = (v) => { cleanup(); resolve(v === answer); };
    options.forEach((opt, i) => {
      const b = el("button", { class: "choice", type: "button" }, `${opt}  (${i + 1})`);
      const h = (e) => { e.preventDefault(); choose(opt); };
      b.addEventListener("pointerdown", h);
      b.addEventListener("click", h);            // keyboard/AT activation
      row.append(b);
    });
    stage.append(el("div", {}, [
      el("div", { class: "tc-domain", text: `Problem ${index + 1} of ${PROBLEMS} — what comes next?` }),
      el("div", { class: "bigprompt" }, `${shown.join(",  ")},  ?`),
      row,
    ]));
    window.addEventListener("keydown", onKey);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function run(stage, { signal } = {}) {
  const ok = await instructions(stage, {
    domain: meta.domain, title: "Number Series",
    bodyHTML: `<p>Each sequence follows a hidden rule. Work out the rule and choose the number that comes <b>next</b>.</p>
               <ul><li>Example: <b>2, 4, 8, 16, …</b> → next is <b>32</b> (each ×2).</li><li>${PROBLEMS} problems. Use buttons or keys <span class="keyhint">1–4</span>.</li></ul>`,
    button: "Begin", signal,
  });
  if (!ok) throw new DOMException("aborted", "AbortError");
  if (!(await countdown(stage, 3, signal))) throw new DOMException("aborted", "AbortError");

  let correct = 0;
  for (let i = 0; i < PROBLEMS; i++) {
    setProgress(i / PROBLEMS, meta.name);
    if (await problem(stage, i, signal)) correct++;
    clear(stage); await sleep(200);
  }
  setProgress(1, meta.name);

  const score = (correct / PROBLEMS) * 100;
  return {
    ...meta, score, raw: correct,
    rawLabel: `${correct}/${PROBLEMS} sequences solved`,
    detail: { Correct: `${correct}/${PROBLEMS}` },
  };
}
