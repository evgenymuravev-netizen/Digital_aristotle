/* Short-term & working memory — forward + backward digit span (adaptive).
   Forward: recall the digits in the order shown. Backward: type them in
   reverse — the classic working-memory variant. Both halves are adaptive
   (two misses at a length end the half). Score = mean of the two parts. */
import { el, clear, sleep, instructions, countdown, setProgress, clamp, randInt } from "../ui.js";

export const meta = {
  id: "digitspan",
  name: "Digit Span",
  domain: "Memory",
  icon: "🔢",
  blurb: "How much you can hold — and mentally manipulate — for a few seconds.",
  duration: "~2.5 min",
  seconds: 150,
};

const FWD = { start: 3, max: 9, lo: 2, hi: 9 };   // span 2 → 0, 9 → 100 (typical ≈ 6.6)
const BWD = { start: 2, max: 8, lo: 1, hi: 8 };   // span 1 → 0, 8 → 100 (typical ≈ 4.8)

export function spanScore(fwd, bwd) {
  const f = clamp(((fwd - FWD.lo) / (FWD.hi - FWD.lo)) * 100, 0, 100);
  const b = clamp(((bwd - BWD.lo) / (BWD.hi - BWD.lo)) * 100, 0, 100);
  return (f + b) / 2;
}

function recallPrompt(stage, length, signal, promptText) {
  return new Promise((resolve, reject) => {
    clear(stage);
    const input = el("input", {
      class: "answer-input", type: "text", inputmode: "numeric", autocomplete: "off",
      "aria-label": "Type the digits", maxlength: String(length + 2),
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
      el("div", { class: "tc-domain", text: promptText }),
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

async function spanBlock(stage, signal, mode, cfg, progressBase) {
  const prompt = mode === "fwd"
    ? "Now type them in order"
    : "Now type them BACKWARD — last digit first";
  let best = 0;
  for (let length = cfg.start; length <= cfg.max; length++) {
    setProgress(progressBase + ((length - cfg.start) / (cfg.max - cfg.start)) * 0.5, `${mode === "fwd" ? "Forward" : "Backward"} · length ${length}`);
    let passed = false;
    for (let attempt = 0; attempt < 2 && !passed; attempt++) {
      const digits = Array.from({ length }, () => randInt(0, 9));
      await presentSequence(stage, digits, signal);
      const answer = await recallPrompt(stage, length, signal, prompt);
      const target = mode === "fwd" ? digits.join("") : [...digits].reverse().join("");
      if (answer === target) { passed = true; best = length; }
      else {
        clear(stage);
        stage.append(el("div", { class: "instr" }, [
          el("div", { class: "stim-sub", text: attempt === 0 ? "Not quite — one more try at this length." : "Missed it twice. Locking in this span." }),
        ]));
        await sleep(950);
      }
    }
    if (!passed) break;
  }
  return best;
}

export async function run(stage, { signal } = {}) {
  const ok = await instructions(stage, {
    domain: meta.domain, title: "Digit Span",
    bodyHTML: `<p>Digits flash by one at a time. This test has <b>two parts</b>:</p>
               <ul><li><b>Part 1 — forward:</b> type them back in the same order.</li>
                   <li><b>Part 2 — backward:</b> type them in <b>reverse</b> order (harder!).</li>
                   <li>Each round adds a digit. Miss twice at a length and that part ends.</li></ul>`,
    button: "Begin", signal,
  });
  if (!ok) throw new DOMException("aborted", "AbortError");
  if (!(await countdown(stage, 3, signal))) throw new DOMException("aborted", "AbortError");

  const fwd = await spanBlock(stage, signal, "fwd", FWD, 0);

  const cont = await instructions(stage, {
    domain: meta.domain, title: "Part 2 — backward",
    bodyHTML: `<p>Same idea, but now type the digits in <b>reverse order</b> — last digit first.</p>
               <p class="muted">Example: you see <b>3 · 9 · 4</b> → reversed that's 4, 9, 3 → you type <b>493</b>.</p>`,
    button: "Start part 2", signal,
  });
  if (!cont) throw new DOMException("aborted", "AbortError");

  const bwd = await spanBlock(stage, signal, "bwd", BWD, 0.5);
  setProgress(1, meta.name);

  const score = spanScore(fwd, bwd);
  return {
    ...meta, score, raw: fwd + bwd,
    rawLabel: `Forward ${fwd} · Backward ${bwd}`,
    detail: { Forward: fwd, Backward: bwd, "Typical adult": "≈ 7 / ≈ 5" },
  };
}
