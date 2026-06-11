/* Visuospatial memory — Corsi block-tapping (adaptive span).
   Blocks light up in sequence; tap them back in the same order.
   Two misses at a length ends the test. Score = span. */
import { el, clear, sleep, instructions, countdown, setProgress, clamp, shuffle } from "../ui.js";

export const meta = {
  id: "corsi",
  name: "Corsi Blocks",
  domain: "Spatial Memory",
  icon: "🧊",
  blurb: "Hold positions and their order in mind — digit span's visual twin.",
  duration: "~90 sec",
  seconds: 90,
};

const CELLS = 9;                  // 3×3 grid
const START = 3, MAX = 9;
const SPAN_LO = 2, SPAN_HI = 8;   // span 2 → 0, span 8 → 100 (typical adult ≈ 6)

export function corsiScore(span) {
  return clamp(((span - SPAN_LO) / (SPAN_HI - SPAN_LO)) * 100, 0, 100);
}

const genSeq = (length) => shuffle([...Array(CELLS).keys()]).slice(0, length);

function buildGrid() {
  const grid = el("div", { class: "corsi-grid", role: "group", "aria-label": "Block grid" });
  const cells = [];
  for (let i = 0; i < CELLS; i++) {
    const c = el("button", { class: "corsi-cell", type: "button", "aria-label": `Block ${i + 1}` });
    cells.push(c);
    grid.append(c);
  }
  return { grid, cells };
}

async function playback(label, cells, seq, signal) {
  label.textContent = "Watch the pattern…";
  await sleep(500);
  for (const idx of seq) {
    if (signal?.aborted) throw new DOMException("aborted", "AbortError");
    cells[idx].classList.add("lit");
    await sleep(620);
    cells[idx].classList.remove("lit");
    await sleep(240);
  }
}

function tapPhase(label, grid, cells, length, signal) {
  label.textContent = "Your turn — tap them in order";
  return new Promise((resolve, reject) => {
    const taps = [];
    const handlers = [];
    const cleanup = () => {
      cells.forEach((c, i) => c.removeEventListener("click", handlers[i]));
      signal?.removeEventListener("abort", onAbort);
      grid.classList.remove("live");
    };
    const onAbort = () => { cleanup(); reject(new DOMException("aborted", "AbortError")); };
    cells.forEach((c, i) => {
      const h = () => {
        taps.push(i);
        c.classList.add("picked");
        setTimeout(() => c.classList.remove("picked"), 200);
        if (taps.length === length) { cleanup(); resolve(taps); }
      };
      handlers.push(h);
      c.addEventListener("click", h);
    });
    grid.classList.add("live");
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function run(stage, { signal } = {}) {
  const ok = await instructions(stage, {
    domain: meta.domain, title: "Corsi Blocks",
    bodyHTML: `<p>Blocks light up one after another. When the pattern ends, <b>tap the same blocks in the same order</b>.</p>
               <ul><li>Each round adds a block. Miss twice at a length and we stop.</li><li>Take your time once it's your turn — only order matters, not speed.</li></ul>`,
    button: "Begin", signal,
  });
  if (!ok) throw new DOMException("aborted", "AbortError");
  if (!(await countdown(stage, 3, signal))) throw new DOMException("aborted", "AbortError");

  clear(stage);
  const label = el("div", { class: "tc-domain corsi-label", text: "" });
  const { grid, cells } = buildGrid();
  stage.append(el("div", {}, [label, grid]));

  let best = 0;
  for (let length = START; length <= MAX; length++) {
    setProgress((length - START) / (MAX - START), `Length ${length}`);
    let passed = false;
    for (let attempt = 0; attempt < 2 && !passed; attempt++) {
      const seq = genSeq(length);
      await playback(label, cells, seq, signal);
      const taps = await tapPhase(label, grid, cells, length, signal);
      if (taps.join(",") === seq.join(",")) { passed = true; best = length; label.textContent = "✓ Correct"; }
      else label.textContent = attempt === 0 ? "Not quite — one more try at this length." : "Missed twice — locking in your span.";
      await sleep(800);
    }
    if (!passed) break;
  }
  setProgress(1, meta.name);

  const score = corsiScore(best);
  return {
    ...meta, score, raw: best,
    rawLabel: `Span of ${best} block${best === 1 ? "" : "s"}`,
    detail: { Span: best, "Typical adult": "≈ 6" },
  };
}
