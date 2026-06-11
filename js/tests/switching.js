/* Cognitive flexibility — letter/number task switching (Rogers & Monsell style).
   A letter–digit pair appears with a cue: LETTER → vowel or consonant?
   NUMBER → odd or even? The rule alternates every two trials, so half the
   trials are switches; the RT cost of switching is the core measure. */
import { el, clear, sleep, instructions, countdown, setProgress, clamp, median, pick } from "../ui.js";

export const meta = {
  id: "switching",
  name: "Task Switching",
  domain: "Mental Flexibility",
  icon: "🔀",
  blurb: "Shift between two rules without one contaminating the other.",
  duration: "~90 sec",
  seconds: 95,
};

const PRACTICE = 4, TRIALS = 24;
const COST_HI = 600;   // switch cost 0 ms → 100, 600 ms → 0

export function switchingScore({ acc, cost }) {
  const accScore = clamp(((acc - 0.5) / 0.5) * 100, 0, 100);   // two-choice → chance = 50%
  const costScore = clamp(((COST_HI - Math.max(0, cost)) / COST_HI) * 100, 0, 100);
  return clamp(accScore * 0.6 + costScore * 0.4, 0, 100);
}

const VOWELS = ["A", "E", "I", "O", "U"], CONS = ["G", "K", "M", "R", "T"];
const ODD = [1, 3, 5, 7, 9], EVEN = [2, 4, 6, 8];

function genTrial(task) {
  const letter = Math.random() < 0.5 ? pick(VOWELS) : pick(CONS);
  const digit = Math.random() < 0.5 ? pick(ODD) : pick(EVEN);
  const answer = task === "letter" ? (VOWELS.includes(letter) ? 0 : 1) : (ODD.includes(digit) ? 0 : 1);
  return { letter, digit, task, answer };
}

function trial(stage, t, { feedback, signal }) {
  return new Promise((resolve, reject) => {
    clear(stage);
    const isLetter = t.task === "letter";
    const cue = el("div", { class: `sw-cue ${t.task}`, text: isLetter ? "LETTER" : "NUMBER" });
    const pair = el("div", { class: "sw-pair", text: `${t.letter}${t.digit}` });
    const labels = isLetter ? ["Vowel", "Consonant"] : ["Odd", "Even"];
    const row = el("div", { class: "choice-row" });
    const fb = el("div", { class: "sw-feedback", text: "" });

    const start = performance.now();
    let done = false;
    const onAbort = () => { cleanup(); reject(new DOMException("aborted", "AbortError")); };
    const onKey = (e) => { const i = ["1", "2"].indexOf(e.key); if (i >= 0) { e.preventDefault(); choose(i); } };
    const cleanup = () => { window.removeEventListener("keydown", onKey); signal?.removeEventListener("abort", onAbort); };
    const choose = async (i) => {
      const rt = performance.now() - start;
      if (rt < 150 || done) return;          // ignore accidental immediate/double taps
      done = true;
      cleanup();
      const correct = i === t.answer;
      if (feedback) {
        fb.textContent = correct ? "✓" : `✗ — it was ${labels[t.answer].toLowerCase()}`;
        fb.style.color = correct ? "var(--good)" : "var(--bad)";
        await sleep(700);
      }
      resolve({ correct, rt });
    };
    labels.forEach((lab, i) => {
      const b = el("button", { class: "choice", type: "button" }, `${lab}  (${i + 1})`);
      const h = (e) => { e.preventDefault(); choose(i); };
      b.addEventListener("pointerdown", h);
      b.addEventListener("click", h);        // keyboard/AT activation
      row.append(b);
    });
    stage.append(el("div", {}, [cue, pair, row, fb]));
    window.addEventListener("keydown", onKey);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function run(stage, { signal } = {}) {
  const ok = await instructions(stage, {
    domain: meta.domain, title: "Task Switching",
    bodyHTML: `<p>You'll see a letter–number pair like <b>G7</b>. The cue above it says which rule applies:</p>
               <ul><li><b style="color:#5aa9e6">LETTER</b> → is the letter a <b>vowel</b> or a <b>consonant</b>?</li>
                   <li><b style="color:#e2b04a">NUMBER</b> → is the number <b>odd</b> or <b>even</b>?</li>
                   <li>The rule changes every two turns. Use buttons or keys <span class="keyhint">1–2</span>. ${PRACTICE} practice rounds first.</li></ul>`,
    button: "Begin", signal,
  });
  if (!ok) throw new DOMException("aborted", "AbortError");
  if (!(await countdown(stage, 3, signal))) throw new DOMException("aborted", "AbortError");

  // Tasks alternate every two trials: L L N N L L …
  const taskAt = (i) => (Math.floor(i / 2) % 2 === 0 ? "letter" : "number");

  for (let i = 0; i < PRACTICE; i++) {
    setProgress(0, "Practice");
    await trial(stage, genTrial(taskAt(i)), { feedback: true, signal });
  }
  clear(stage);
  stage.append(el("div", { class: "instr" }, [
    el("div", { class: "stim-sub", text: "Practice done — for real now. Quick and accurate." }),
  ]));
  await sleep(1100);

  const recs = [];
  for (let i = 0; i < TRIALS; i++) {
    setProgress(i / TRIALS, meta.name);
    const task = taskAt(i);
    const r = await trial(stage, genTrial(task), { feedback: false, signal });
    recs.push({ ...r, switch: i > 0 && task !== taskAt(i - 1) });
    clear(stage);
    await sleep(180);
  }
  setProgress(1, meta.name);

  const acc = recs.filter((r) => r.correct).length / recs.length;
  const corr = recs.filter((r, i) => r.correct && i > 0);   // first trial is switch-ambiguous
  const swRT = corr.filter((r) => r.switch).map((r) => r.rt);
  const rpRT = corr.filter((r) => !r.switch).map((r) => r.rt);
  const cost = swRT.length && rpRT.length ? Math.round(median(swRT) - median(rpRT)) : 0;
  const score = switchingScore({ acc, cost });
  return {
    ...meta, score, raw: cost,
    rawLabel: `${Math.round(acc * 100)}% correct · ${cost} ms switch cost`,
    detail: {
      Accuracy: `${Math.round(acc * 100)}%`,
      "Switch cost": `${cost} ms`,
      "Repeat speed": rpRT.length ? `${Math.round(median(rpRT))} ms` : "—",
    },
  };
}
