/* Attention & inhibitory control — the Stroop task.
   Name the INK COLOR of the word, ignoring what the word says.
   Scored from performance on the hard (incongruent) trials, combining
   accuracy (weighted 60%) with response speed (40%). */
import { el, clear, sleep, instructions, countdown, setProgress, median, clamp, shuffle } from "../ui.js";

export const meta = {
  id: "stroop",
  name: "Stroop",
  domain: "Attention",
  icon: "🎯",
  blurb: "Focus on the right cue and suppress the automatic, wrong one.",
  duration: "~60 sec",
};

const COLORS = [
  { name: "RED", css: "#e5534b" },
  { name: "GREEN", css: "#46c98b" },
  { name: "BLUE", css: "#5aa9e6" },
  { name: "YELLOW", css: "#e2b04a" },
];
const TRIALS = 20;
// RT→score anchors for correct incongruent responses.
const RT_FAST = 700, RT_SLOW = 1700;

function trial(stage, signal) {
  return new Promise((resolve, reject) => {
    const word = COLORS[Math.floor(Math.random() * COLORS.length)];
    const congruent = Math.random() < 0.5;
    const ink = congruent ? word : shuffle(COLORS.filter((c) => c !== word))[0];

    clear(stage);
    const wordEl = el("div", { class: "stroop-word", style: { color: ink.css } }, word.name);
    const row = el("div", { class: "choice-row cols-4" });
    const buttons = [];
    COLORS.forEach((c, idx) => {
      const b = el("button", { class: "choice", type: "button", "aria-label": c.name }, [
        el("span", { style: { display: "inline-block", width: "16px", height: "16px", borderRadius: "4px", background: c.css, marginRight: "8px", verticalAlign: "-2px" } }),
        c.name + ` (${idx + 1})`,
      ]);
      const h = (e) => { e.preventDefault(); choose(c); };
      b.addEventListener("pointerdown", h);
      b.addEventListener("click", h);            // keyboard/AT activation
      buttons.push(b); row.append(b);
    });
    stage.append(el("div", {}, [
      el("div", { class: "tc-domain", text: "Pick the INK color" }),
      wordEl, row,
    ]));

    const start = performance.now();
    const onKey = (e) => {
      const i = ["1", "2", "3", "4"].indexOf(e.key);
      if (i >= 0) { e.preventDefault(); choose(COLORS[i]); }
    };
    const onAbort = () => { cleanup(); reject(new DOMException("aborted", "AbortError")); };
    const cleanup = () => { window.removeEventListener("keydown", onKey); signal?.removeEventListener("abort", onAbort); };
    const choose = (c) => {
      const rt = performance.now() - start;
      cleanup();
      resolve({ congruent, correct: c === ink, rt });
    };
    window.addEventListener("keydown", onKey);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function run(stage, { signal } = {}) {
  const ok = await instructions(stage, {
    domain: meta.domain, title: "Stroop Test",
    bodyHTML: `<p>A color word appears in a colored ink. Tap the button for the <b>ink color</b>, <i>not</i> the word.</p>
               <ul><li>If <span style="color:#5aa9e6;font-weight:800">RED</span> appears, the answer is <b>BLUE</b> (the ink).</li><li>Use buttons or keys <span class="keyhint">1–4</span>. Go quickly but accurately.</li></ul>`,
    button: "Begin", signal,
  });
  if (!ok) throw new DOMException("aborted", "AbortError");
  if (!(await countdown(stage, 3, signal))) throw new DOMException("aborted", "AbortError");

  const results = [];
  for (let i = 0; i < TRIALS; i++) {
    setProgress(i / TRIALS, meta.name);
    results.push(await trial(stage, signal));
    clear(stage); await sleep(220);   // brief inter-trial blank
  }
  setProgress(1, meta.name);

  const incong = results.filter((r) => !r.congruent);
  const cong = results.filter((r) => r.congruent);
  const accIncong = incong.length ? incong.filter((r) => r.correct).length / incong.length : 0;
  const medIncongRT = median(incong.filter((r) => r.correct).map((r) => r.rt)) || RT_SLOW;
  const medCongRT = median(cong.filter((r) => r.correct).map((r) => r.rt)) || medIncongRT;
  const interference = Math.round(medIncongRT - medCongRT);

  const rtScore = clamp(((RT_SLOW - medIncongRT) / (RT_SLOW - RT_FAST)) * 100, 0, 100);
  const score = clamp(accIncong * 100 * 0.6 + rtScore * 0.4, 0, 100);
  const totalCorrect = results.filter((r) => r.correct).length;

  return {
    ...meta, score, raw: interference,
    rawLabel: `${interference} ms interference · ${totalCorrect}/${TRIALS} correct`,
    detail: { Accuracy: `${totalCorrect}/${TRIALS}`, "Hard-trial speed": `${Math.round(medIncongRT)} ms`, Interference: `${interference} ms` },
  };
}
