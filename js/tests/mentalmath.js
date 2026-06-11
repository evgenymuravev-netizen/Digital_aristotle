/* Numeracy — a 60-second mental arithmetic sprint (no calculator!).
   This is the skill most directly handed off to machines, so it's a
   canary for AI-driven atrophy. Score scales with how many you get
   right in the time limit. */
import { el, clear, instructions, countdown, setProgress, clamp, randInt, pick } from "../ui.js";

export const meta = {
  id: "mentalmath",
  name: "Mental Math",
  domain: "Numeracy",
  icon: "➗",
  blurb: "Calculate in your head — the first thing we outsource to devices.",
  duration: "60 sec",
  seconds: 70,
};

const SECONDS = 60;
const SCORE_AT_FULL = 20;   // 20 correct in 60 s → 100

// Progressive difficulty based on how many already solved.
function genProblem(level) {
  if (level < 4) {
    const a = randInt(11, 49), b = randInt(2, 19), op = pick(["+", "-"]);
    return op === "+" ? { text: `${a} + ${b}`, answer: a + b } : { text: `${a + b} − ${a}`, answer: b };
  }
  if (level < 9) {
    const r = Math.random();
    if (r < 0.45) { const a = randInt(2, 9), b = randInt(3, 12); return { text: `${a} × ${b}`, answer: a * b }; }
    const a = randInt(25, 89), b = randInt(15, 79), op = pick(["+", "-"]);
    return op === "+" ? { text: `${a} + ${b}`, answer: a + b } : { text: `${a + b} − ${b}`, answer: a };
  }
  // hardest tier
  const r = Math.random();
  if (r < 0.4) { const a = randInt(12, 29), b = randInt(3, 9); return { text: `${a} × ${b}`, answer: a * b }; }
  if (r < 0.7) { const b = randInt(3, 12), q = randInt(3, 12); return { text: `${b * q} ÷ ${b}`, answer: q }; }
  const a = randInt(45, 139), b = randInt(35, 99), op = pick(["+", "-"]);
  return op === "+" ? { text: `${a} + ${b}`, answer: a + b } : { text: `${a + b} − ${b}`, answer: a };
}

export async function run(stage, { signal } = {}) {
  const ok = await instructions(stage, {
    domain: meta.domain, title: "Mental Math Sprint",
    bodyHTML: `<p>Solve as many as you can in <b>${SECONDS} seconds</b>. Type the answer and press <span class="keyhint">Enter</span>.</p>
               <ul><li>No calculator, no paper — all in your head.</li><li>Problems get harder as you go. Wrong answers just move you on.</li></ul>`,
    button: "Begin", signal,
  });
  if (!ok) throw new DOMException("aborted", "AbortError");
  if (!(await countdown(stage, 3, signal))) throw new DOMException("aborted", "AbortError");

  clear(stage);
  const timerEl = el("div", { class: "mini-timer" }, `${SECONDS}s`);
  const counterEl = el("div", { class: "mini-counter" }, "0 correct");
  const promptEl = el("div", { class: "bigprompt" }, "");
  const input = el("input", { class: "answer-input", type: "text", inputmode: "numeric", autocomplete: "off", "aria-label": "Answer" });
  stage.append(timerEl, counterEl, el("div", {}, [promptEl, el("div", {}, [input])]));
  input.focus();

  let correct = 0, attempted = 0, current = genProblem(0);
  promptEl.textContent = `${current.text} =`;

  const finish = await new Promise((resolve, reject) => {
    const start = performance.now();
    const tick = setInterval(() => {
      const left = Math.max(0, SECONDS - (performance.now() - start) / 1000);
      timerEl.textContent = `${left.toFixed(0)}s`;
      setProgress(1 - left / SECONDS, meta.name);
      if (left <= 0) { done(); }
    }, 100);

    const flash = (good) => {
      input.style.borderColor = good ? "var(--good)" : "var(--bad)";
      setTimeout(() => { input.style.borderColor = ""; }, 180);
    };
    const onKey = (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (input.value.trim() === "") return;
      attempted++;
      const val = parseInt(input.value, 10);
      const good = val === current.answer;
      if (good) { correct++; counterEl.textContent = `${correct} correct`; }
      flash(good);
      input.value = "";
      current = genProblem(correct);
      promptEl.textContent = `${current.text} =`;
    };
    const onAbort = () => { cleanup(); reject(new DOMException("aborted", "AbortError")); };
    const cleanup = () => { clearInterval(tick); input.removeEventListener("keydown", onKey); signal?.removeEventListener("abort", onAbort); };
    const done = () => { cleanup(); resolve(true); };
    input.addEventListener("keydown", onKey);
    signal?.addEventListener("abort", onAbort, { once: true });
  });

  void finish;
  setProgress(1, meta.name);
  const score = clamp((correct / SCORE_AT_FULL) * 100, 0, 100);
  const acc = attempted ? Math.round((correct / attempted) * 100) : 0;
  return {
    ...meta, score, raw: correct,
    rawLabel: `${correct} correct in ${SECONDS}s (${acc}% accuracy)`,
    detail: { Correct: correct, Attempted: attempted, Accuracy: `${acc}%` },
  };
}
