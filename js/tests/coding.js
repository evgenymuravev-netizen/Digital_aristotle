/* Processing speed + associative learning — symbol coding (SDMT-style).
   A key maps six symbols to the digits 1–6. Translate as many symbols as
   possible in 60 seconds. The key is shuffled every session so you can't
   memorise it across runs. */
import { el, clear, instructions, countdown, setProgress, clamp, shuffle, pick } from "../ui.js";

export const meta = {
  id: "coding",
  name: "Symbol Coding",
  domain: "Coding Speed",
  icon: "🔣",
  blurb: "Translate symbols to digits from a key — fast, accurate, relentless.",
  duration: "60 sec",
  seconds: 80,
};

const SECONDS = 60;
const SYMBOLS = ["◆", "✶", "☾", "♠", "✚", "◎"];
const SCORE_AT_FULL = 36;     // 36 correct in 60 s → 100

export function codingScore(correct) {
  return clamp((correct / SCORE_AT_FULL) * 100, 0, 100);
}

export async function run(stage, { signal } = {}) {
  const ok = await instructions(stage, {
    domain: meta.domain, title: "Symbol Coding",
    bodyHTML: `<p>A key at the top pairs each symbol with a digit. A big symbol appears — enter its digit using keys <span class="keyhint">1–6</span> or the buttons.</p>
               <ul><li>As many as you can in <b>${SECONDS} seconds</b>.</li><li>The key stays on screen — glance, don't memorise.</li></ul>`,
    button: "Begin", signal,
  });
  if (!ok) throw new DOMException("aborted", "AbortError");
  if (!(await countdown(stage, 3, signal))) throw new DOMException("aborted", "AbortError");

  const symbols = shuffle(SYMBOLS);   // session key: symbols[i] ↔ digit i+1
  clear(stage);
  const key = el("div", { class: "coding-key", "aria-label": "Symbol key" }, symbols.map((s, i) =>
    el("div", { class: "pair" }, [el("span", { class: "sym", text: s }), el("span", { class: "dig", text: String(i + 1) })])));
  const timerEl = el("div", { class: "mini-timer" }, `${SECONDS}s`);
  const counterEl = el("div", { class: "mini-counter" }, "0 correct");
  const stim = el("div", { class: "coding-stim" }, "");
  const pad = el("div", { class: "coding-pad" });
  const padBtns = [];
  for (let i = 1; i <= 6; i++) {
    const b = el("button", { class: "choice", type: "button", "aria-label": `Digit ${i}` }, String(i));
    padBtns.push(b);
    pad.append(b);
  }
  stage.append(timerEl, counterEl, el("div", {}, [key, stim, pad]));

  let correct = 0, attempted = 0;
  let current = pick(symbols);
  stim.textContent = current;
  const next = () => {
    let s;
    do { s = pick(symbols); } while (s === current);
    current = s;
    stim.textContent = s;
  };

  await new Promise((resolve, reject) => {
    const start = performance.now();
    const tick = setInterval(() => {
      const left = Math.max(0, SECONDS - (performance.now() - start) / 1000);
      timerEl.textContent = `${left.toFixed(0)}s`;
      setProgress(1 - left / SECONDS, meta.name);
      if (left <= 0) { cleanup(); resolve(); }
    }, 100);
    const answer = (d) => {
      attempted++;
      const good = symbols[d - 1] === current;
      if (good) { correct++; counterEl.textContent = `${correct} correct`; }
      stim.classList.add(good ? "flash-good" : "flash-bad");
      setTimeout(() => stim.classList.remove("flash-good", "flash-bad"), 160);
      next();
    };
    const onKey = (e) => {
      const i = ["1", "2", "3", "4", "5", "6"].indexOf(e.key);
      if (i >= 0) { e.preventDefault(); answer(i + 1); }
    };
    const handlers = padBtns.map((b, i) => {
      const h = (e) => { e.preventDefault(); answer(i + 1); };
      b.addEventListener("pointerdown", h);
      return h;
    });
    const onAbort = () => { cleanup(); reject(new DOMException("aborted", "AbortError")); };
    const cleanup = () => {
      clearInterval(tick);
      window.removeEventListener("keydown", onKey);
      padBtns.forEach((b, i) => b.removeEventListener("pointerdown", handlers[i]));
      signal?.removeEventListener("abort", onAbort);
    };
    window.addEventListener("keydown", onKey);
    signal?.addEventListener("abort", onAbort, { once: true });
  });

  setProgress(1, meta.name);
  const acc = attempted ? Math.round((correct / attempted) * 100) : 0;
  const score = codingScore(correct);
  return {
    ...meta, score, raw: correct,
    rawLabel: `${correct} correct in ${SECONDS} s (${acc}% accuracy)`,
    detail: { Correct: correct, Attempted: attempted, Accuracy: `${acc}%` },
  };
}
