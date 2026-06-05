/* ============================================================
   ui.js — small DOM + flow helpers shared by every test.
   Zero dependencies.
   ============================================================ */

/** Create an element with props/attrs and children. */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "text") node.textContent = v;
    else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "dataset") Object.assign(node.dataset, v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Show one of the named screens; deactivate the rest. */
export function showScreen(id) {
  for (const s of document.querySelectorAll(".screen")) s.classList.toggle("active", s.id === `screen-${id}`);
  for (const b of document.querySelectorAll(".topnav [data-nav]")) {
    b.classList.toggle("active", b.dataset.nav === id);
  }
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

/**
 * Render an instructions panel and resolve when the user starts.
 * Returns a promise (true = start, false = aborted via signal).
 */
export function instructions(stage, { domain, title, bodyHTML, button = "Start", signal }) {
  return new Promise((resolve) => {
    clear(stage);
    const startBtn = el("button", { class: "btn btn-primary btn-lg", type: "button" }, button);
    startBtn.addEventListener("click", () => resolve(true), { once: true });
    stage.append(
      el("div", { class: "instr" }, [
        el("div", { class: "tc-domain", text: domain }),
        el("h2", { text: title }),
        el("div", { html: bodyHTML }),
        startBtn,
      ])
    );
    startBtn.focus();
    if (signal) signal.addEventListener("abort", () => resolve(false), { once: true });
  });
}

/** A 3..2..1 countdown inside the stage. */
export async function countdown(stage, from = 3, signal) {
  for (let n = from; n >= 1; n--) {
    if (signal?.aborted) return false;
    clear(stage);
    stage.append(el("div", { class: "countdown", text: String(n) }));
    await sleep(750);
  }
  return true;
}

/** Update the stage progress bar (0..1) and label. Pass null to hide. */
export function setProgress(frac, label = "") {
  const wrap = document.getElementById("stage-progress");
  if (frac == null) { wrap.hidden = true; return; }
  wrap.hidden = false;
  document.getElementById("stage-progress-fill").style.width = `${Math.round(frac * 100)}%`;
  document.getElementById("stage-progress-label").textContent = label;
}

/** Lightweight transient toast. */
let toastEl, toastTimer;
export function toast(msg, ms = 2200) {
  if (!toastEl) { toastEl = el("div", { class: "toast", role: "status" }); document.body.append(toastEl); }
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
}

/** Median of a numeric array. */
export function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export const round = (x, d = 0) => { const p = 10 ** d; return Math.round(x * p) / p; };

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Render a final per-test result inside the stage and resolve when the user
 * clicks continue. Used when a single test is run on its own.
 */
export function showTestResult(stage, result, { button = "Done", signal } = {}) {
  return new Promise((resolve) => {
    clear(stage);
    const kvs = el("div", { class: "kvs" });
    for (const [k, v] of Object.entries(result.detail || {})) {
      kvs.append(el("span", {}, [`${k}: `, el("b", { text: String(v) })]));
    }
    const cont = el("button", { class: "btn btn-primary", type: "button" }, button);
    cont.addEventListener("click", () => resolve(true), { once: true });
    stage.append(
      el("div", { class: "test-result" }, [
        el("div", { class: "tc-domain", text: result.domain }),
        el("h2", { text: result.name }),
        el("div", { class: "score-big", text: String(Math.round(result.score)) }),
        el("div", { class: "muted", text: "/ 100 score" }),
        el("div", { class: "raw", text: result.rawLabel || "" }),
        kvs,
        cont,
      ])
    );
    cont.focus();
    if (signal) signal.addEventListener("abort", () => resolve(false), { once: true });
  });
}

/** Promise that rejects when an AbortSignal fires — used to race against test loops. */
export function abortPromise(signal) {
  return new Promise((_, reject) => {
    if (signal.aborted) reject(new DOMException("aborted", "AbortError"));
    else signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
  });
}
