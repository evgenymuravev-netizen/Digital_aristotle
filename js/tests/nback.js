/* Working memory — 2-back.
   Letters stream by; respond when the current letter matches the one
   shown 2 steps earlier. Scored with balanced accuracy (hits & correct
   rejections weighted equally), which is robust to the fact that most
   items are non-targets. */
import { el, clear, sleep, instructions, countdown, setProgress, clamp, pick } from "../ui.js";

export const meta = {
  id: "nback",
  name: "N-Back (2-back)",
  domain: "Working Memory",
  icon: "🧠",
  blurb: "Hold a moving window of information in mind and update it.",
  duration: "~75 sec",
};

const N = 2;
const LEN = 24;                 // total letters
const TARGET_RATE = 0.32;       // share of scoreable positions that are matches
const STIM_MS = 750;            // letter visible
const GAP_MS = 1550;            // blank before next (response allowed throughout)
const LETTERS = ["C", "H", "K", "L", "P", "Q", "R", "T"];

function genSequence() {
  const seq = [];
  for (let i = 0; i < LEN; i++) {
    if (i >= N && Math.random() < TARGET_RATE) {
      seq.push(seq[i - N]);                 // plant a target
    } else {
      let c;
      do { c = pick(LETTERS); } while (i >= N && c === seq[i - N]); // ensure a true non-target
      seq.push(c);
    }
  }
  return seq;
}

export async function run(stage, { signal } = {}) {
  const ok = await instructions(stage, {
    domain: meta.domain, title: "N-Back (2-back)",
    bodyHTML: `<p>Letters appear one at a time. Press <span class="keyhint">Space</span> (or tap <b>MATCH</b>) whenever the current letter is the <b>same as the one ${N} letters ago</b>.</p>
               <ul><li>Example: <b>C, H, <u>C</u></b> → the third C matches 2 back → respond.</li><li>Ignore the first two letters. Don't respond when there's no match.</li></ul>`,
    button: "Begin", signal,
  });
  if (!ok) throw new DOMException("aborted", "AbortError");
  if (!(await countdown(stage, 3, signal))) throw new DOMException("aborted", "AbortError");

  const seq = genSequence();
  clear(stage);
  const cell = el("div", { class: "nback-cell" }, "");
  const matchBtn = el("button", { class: "btn btn-lg", type: "button", style: { marginTop: "22px" } }, "MATCH ⎵");
  stage.append(el("div", {}, [cell, el("div", {}, [matchBtn])]));

  const state = { responded: false };
  const respond = () => {
    if (state.responded) return;
    state.responded = true;
    cell.classList.add("flash-good"); // neutral acknowledgement only (no correctness feedback)
    setTimeout(() => cell.classList.remove("flash-good"), 200);
  };
  const onKey = (e) => { if (e.code === "Space") { e.preventDefault(); respond(); } };
  const onTap = (e) => { e.preventDefault(); respond(); };
  const onAbort = () => {};
  window.addEventListener("keydown", onKey);
  matchBtn.addEventListener("pointerdown", onTap);
  matchBtn.addEventListener("click", onTap);     // keyboard/AT activation
  signal?.addEventListener("abort", onAbort);

  let hits = 0, misses = 0, fa = 0, cr = 0, targets = 0, nonTargets = 0;
  try {
    for (let i = 0; i < LEN; i++) {
      if (signal?.aborted) throw new DOMException("aborted", "AbortError");
      const isTarget = i >= N && seq[i] === seq[i - N];
      state.responded = false;

      cell.textContent = seq[i];
      cell.classList.add("on");
      setProgress((i + 1) / LEN, meta.name);
      await sleep(STIM_MS);
      cell.classList.remove("on");
      cell.textContent = "";
      await sleep(GAP_MS);

      if (i < N) continue;                 // not scoreable
      if (isTarget) { targets++; state.responded ? hits++ : misses++; }
      else { nonTargets++; state.responded ? fa++ : cr++; }
    }
  } finally {
    window.removeEventListener("keydown", onKey);
    matchBtn.removeEventListener("pointerdown", onTap);
    matchBtn.removeEventListener("click", onTap);
    signal?.removeEventListener("abort", onAbort);
  }

  const hitRate = targets ? hits / targets : 0;
  const crRate = nonTargets ? cr / nonTargets : 1;
  const balanced = (hitRate + crRate) / 2;                 // 0.5 = chance, 1 = perfect
  const score = clamp(((balanced - 0.5) / 0.5) * 100, 0, 100);

  return {
    ...meta, score, raw: Math.round(balanced * 100),
    rawLabel: `${hits}/${targets} matches caught · ${fa} false alarm${fa === 1 ? "" : "s"}`,
    detail: { Hits: `${hits}/${targets}`, "False alarms": fa, Accuracy: `${Math.round(balanced * 100)}%` },
  };
}
