/* Short-term memory — forward digit span (adaptive).
   A sequence of digits is shown one at a time; recall them in order.
   Sequences get longer until you miss twice at a length. Score = span. */
import { el, clear, sleep, instructions, countdown, setProgress, clamp, randInt } from "../ui.js";

export const meta = {
  id: "digitspan",
  name: "Digit Span",
  domain: "Memory",
  icon: "🔢",
  blurb: "How much raw information you can hold for a few seconds.",
  duration: "~90 sec",
};

const START = 3, MAX = 10;
// Score anchors: span 2 → 0, span 9 → 100 (typical adult span ≈ 7).
const SPAN_LO = 2, SPAN_HI = 9;

function recallPrompt(stage, length, signal) {
  return new Promise((resolve, reject) => {
    clear(stage);
    const input = el("input", {
      class: "answer-input", type: "text", inputmode: "numeric", autocomplete: "off",
      "aria-label": "Type the digits you saw", maxlength: String(length + 2),
    });
    const submit = () => {
      const val = input.value.replace(/\D/g, "");
      cleanup(); resolve(val);
    };
    const btn = el("button", { class: "btn btn-primary", type: "button", style: { marginTop: "16px" } }, "Submit ⏎");
    const onKey = (e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } };
    const onAbort = () => { cleanup(); reject(new DOMException("aborted", "AbortError")); };
    const cleanup = () => { input.removeEventListener("keydown", onKey); signal?.removeEventListener("abort", onAbort); };
    input.addEventListener("keydown", onKey);
    btn.addEventListener("click", submit, { once: true });
    signal?.addEventListener("abort", onAbort, { once: true });
    stage.append(el("div", {}, [
      el("div", { class: "tc-domain", text: "Now type them in order" }),
      el("div", {}, [input]),
      el("div", {}, [btn]),
    ]));
    input.focus();
  });
}

async function presentSequence(stage, digits, signal) {
  const cell = el("div", { class: "stim" }, "");
  clear(stage);
  stage.append(el("div", {}, [el("div", { class: "tc-domain", text: "Memorize" }), cell]));
  for (const d of digits) {
    if (signal?.aborted) throw new DOMException("aborted", "AbortError");
    cell.textContent = d; cell.classList.remove("on");
    await sleep(40); cell.classList.add("on");
    await sleep(760);
    cell.textContent = ""; cell.classList.remove("on");
    await sleep(280);
  }
}

export async function run(stage, { signal } = {}) {
  const ok = await instructions(stage, {
    domain: meta.domain, title: "Digit Span",
    bodyHTML: `<p>Digits flash by one at a time. When they stop, type them back <b>in the same order</b>.</p>
               <ul><li>Each round adds a digit. Miss twice at a length and we stop.</li><li>No need to add spaces — just the digits.</li></ul>`,
    button: "Begin", signal,
  });
  if (!ok) throw new DOMException("aborted", "AbortError");
  if (!(await countdown(stage, 3, signal))) throw new DOMException("aborted", "AbortError");

  let best = 0;
  for (let length = START; length <= MAX; length++) {
    setProgress((length - START) / (MAX - START), `Length ${length}`);
    let passed = false;
    for (let attempt = 0; attempt < 2 && !passed; attempt++) {
      const digits = Array.from({ length }, () => randInt(0, 9));
      await presentSequence(stage, digits, signal);
      const answer = await recallPrompt(stage, length, signal);
      if (answer === digits.join("")) { passed = true; best = length; }
      else {
        // brief feedback
        clear(stage);
        stage.append(el("div", { class: "instr" }, [
          el("div", { class: "stim-sub", text: attempt === 0 ? "Not quite — one more try at this length." : "Missed it twice. Locking in your span." }),
        ]));
        await sleep(950);
      }
    }
    if (!passed) break;
  }
  setProgress(1, meta.name);

  const score = clamp(((best - SPAN_LO) / (SPAN_HI - SPAN_LO)) * 100, 0, 100);
  return {
    ...meta, score, raw: best,
    rawLabel: `Span of ${best} digit${best === 1 ? "" : "s"}`,
    detail: { Span: best, "Typical adult": "≈ 7" },
  };
}
