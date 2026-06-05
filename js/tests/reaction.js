/* Processing speed — simple reaction time.
   Click/tap (or Space) the moment the panel turns green. */
import { el, clear, sleep, instructions, countdown, setProgress, median, clamp, randInt } from "../ui.js";

export const meta = {
  id: "reaction",
  name: "Reaction Time",
  domain: "Processing Speed",
  icon: "⚡",
  blurb: "How fast your brain registers and responds to a signal.",
  duration: "~45 sec",
};

const TRIALS = 5;
// Score anchors: 200 ms ≈ elite (100), 500 ms ≈ slow (0).
const FAST = 200, SLOW = 500;

function trial(area, signal) {
  return new Promise((resolve, reject) => {
    let state = "waiting", goTime = 0, toId = 0;
    const cleanup = () => {
      clearTimeout(toId);
      area.removeEventListener("pointerdown", onPress);
      window.removeEventListener("keydown", onKey);
      signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => { cleanup(); reject(new DOMException("aborted", "AbortError")); };
    const startWait = () => {
      state = "waiting";
      area.className = "rt-target rt-wait";
      area.textContent = "Wait for green…";
      toId = setTimeout(() => {
        state = "go"; goTime = performance.now();
        area.className = "rt-target rt-go"; area.textContent = "NOW!";
      }, randInt(1300, 3600));
    };
    const press = () => {
      if (state === "waiting") {        // jumped the gun
        state = "tooSoon"; clearTimeout(toId);
        area.className = "rt-target rt-too-soon"; area.textContent = "Too soon — tap to retry";
      } else if (state === "tooSoon") {
        startWait();
      } else if (state === "go") {
        cleanup(); resolve(performance.now() - goTime);
      }
    };
    const onPress = (e) => { e.preventDefault(); press(); };
    const onKey = (e) => { if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); press(); } };
    area.addEventListener("pointerdown", onPress);
    window.addEventListener("keydown", onKey);
    signal?.addEventListener("abort", onAbort, { once: true });
    startWait();
  });
}

export async function run(stage, { signal } = {}) {
  const ok = await instructions(stage, {
    domain: meta.domain, title: "Reaction Time",
    bodyHTML: `<p>A panel will sit <b>red</b>. The instant it turns <b style="color:#46c98b">green</b>, tap it (or press <span class="keyhint">Space</span>) as fast as you can.</p>
               <ul><li>Don't anticipate — tapping early restarts the trial.</li><li>${TRIALS} trials. We keep your median.</li></ul>`,
    button: "Begin", signal,
  });
  if (!ok) throw new DOMException("aborted", "AbortError");
  if (!(await countdown(stage, 3, signal))) throw new DOMException("aborted", "AbortError");

  const rts = [];
  clear(stage);
  const counter = el("div", { class: "mini-counter" });
  const area = el("div", { class: "rt-target rt-wait", role: "button", tabindex: "0" }, "Wait for green…");
  stage.append(counter, area);

  for (let i = 0; i < TRIALS; i++) {
    counter.textContent = `Trial ${i + 1} / ${TRIALS}`;
    setProgress((i) / TRIALS, "Reaction Time");
    const rt = await trial(area, signal);
    rts.push(rt);
    area.className = "rt-target"; area.textContent = `${Math.round(rt)} ms`;
    await sleep(550);
  }
  setProgress(1, "Reaction Time");

  const med = median(rts);
  const score = clamp(((SLOW - med) / (SLOW - FAST)) * 100, 0, 100);
  return {
    ...meta, score, raw: Math.round(med),
    rawLabel: `Median ${Math.round(med)} ms (best ${Math.round(Math.min(...rts))} ms)`,
    detail: { Median: `${Math.round(med)} ms`, Best: `${Math.round(Math.min(...rts))} ms`, Trials: TRIALS },
  };
}
