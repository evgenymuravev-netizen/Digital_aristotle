/* Response inhibition & sustained attention — go/no-go.
   Most stimuli are GO (respond fast); a minority are NO-GO (withhold).
   Scored from balanced go/no-go accuracy (80%) plus speed on hits (20%). */
import { el, clear, sleep, instructions, countdown, setProgress, clamp, median, shuffle, randInt } from "../ui.js";

export const meta = {
  id: "gonogo",
  name: "Go / No-Go",
  domain: "Impulse Control",
  icon: "🚦",
  blurb: "React fast — except when the rule says don't.",
  duration: "~75 sec",
  seconds: 75,
};

const GO = 28, NOGO = 12;            // 40 trials, 30% no-go
const STIM_MS = 600, EXTRA_MS = 350; // response window = stimulus + 350 ms
const RT_FAST = 250, RT_SLOW = 600;

export function gonogoScore({ goAcc, nogoAcc, medRT }) {
  const balanced = (goAcc + nogoAcc) / 2;                       // 0.5 = chance
  const balScore = clamp(((balanced - 0.5) / 0.5) * 100, 0, 100);
  const rtScore = medRT == null ? 0 : clamp(((RT_SLOW - medRT) / (RT_SLOW - RT_FAST)) * 100, 0, 100);
  return clamp(balScore * 0.8 + rtScore * 0.2, 0, 100);
}

export async function run(stage, { signal } = {}) {
  const ok = await instructions(stage, {
    domain: meta.domain, title: "Go / No-Go",
    bodyHTML: `<p>A panel flashes. If it's <b style="color:#46c98b">green GO</b>, tap it (or press <span class="keyhint">Space</span>) as fast as you can. If it's <b style="color:#ef6f6f">red ✕</b>, do <b>nothing</b>.</p>
               <ul><li>Most are GO — that's the trap. Stay ready to stop.</li><li>${GO + NOGO} quick trials.</li></ul>`,
    button: "Begin", signal,
  });
  if (!ok) throw new DOMException("aborted", "AbortError");
  if (!(await countdown(stage, 3, signal))) throw new DOMException("aborted", "AbortError");

  clear(stage);
  const counter = el("div", { class: "mini-counter" });
  const area = el("div", { class: "gng", role: "button", tabindex: "0" }, "…");
  stage.append(counter, area);

  const order = shuffle([...Array(GO).fill(true), ...Array(NOGO).fill(false)]);
  let hits = 0, misses = 0, fa = 0, cr = 0;
  const rts = [];
  const state = { accepting: false, pressed: false, rt: null, t0: 0 };
  const press = () => {
    if (!state.accepting || state.pressed) return;
    state.pressed = true;
    state.rt = performance.now() - state.t0;
    area.classList.add("pressed");
  };
  const onKey = (e) => { if (e.code === "Space") { e.preventDefault(); press(); } };
  const onTap = (e) => { e.preventDefault(); press(); };
  window.addEventListener("keydown", onKey);
  area.addEventListener("pointerdown", onTap);

  try {
    for (let i = 0; i < order.length; i++) {
      if (signal?.aborted) throw new DOMException("aborted", "AbortError");
      counter.textContent = `${i + 1} / ${order.length}`;
      setProgress(i / order.length, meta.name);
      area.className = "gng"; area.textContent = "…";
      await sleep(randInt(550, 1050));
      if (signal?.aborted) throw new DOMException("aborted", "AbortError");

      const go = order[i];
      state.accepting = true; state.pressed = false; state.rt = null; state.t0 = performance.now();
      area.className = go ? "gng go" : "gng nogo";
      area.textContent = go ? "GO" : "✕";
      await sleep(STIM_MS);
      area.className = "gng"; area.textContent = "";
      await sleep(EXTRA_MS);
      state.accepting = false;

      if (go) { if (state.pressed) { hits++; rts.push(state.rt); } else misses++; }
      else { if (state.pressed) fa++; else cr++; }
    }
  } finally {
    window.removeEventListener("keydown", onKey);
    area.removeEventListener("pointerdown", onTap);
  }
  setProgress(1, meta.name);

  const goAcc = hits / GO, nogoAcc = cr / NOGO;
  const medRT = rts.length ? median(rts) : null;
  const score = gonogoScore({ goAcc, nogoAcc, medRT });
  return {
    ...meta, score, raw: Math.round(nogoAcc * 100),
    rawLabel: `${fa} false alarm${fa === 1 ? "" : "s"} · ${misses} missed · median ${medRT != null ? Math.round(medRT) : "—"} ms`,
    detail: {
      "GO accuracy": `${Math.round(goAcc * 100)}%`,
      "Stops withheld": `${cr}/${NOGO}`,
      "Median RT": medRT != null ? `${Math.round(medRT)} ms` : "—",
    },
  };
}
