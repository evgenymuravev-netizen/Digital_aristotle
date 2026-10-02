/* ============================================================
   bellcurve.js — "where you land against everyone else".

   Draws the population as a normal distribution, shades the part of it
   you beat, and marks where you and the average person sit. This is the
   most honest way to show a percentile: it makes obvious that the middle
   is crowded (60th vs 70th is a small real gap) while the tails are thin.

   Colors come from CSS custom properties, so it re-themes for free.
   ============================================================ */

import { el } from "./ui.js";
import { probit } from "./norms.js";

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function setup(canvas, cssW, cssH) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.height = cssH + "px";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

const phi = (z) => Math.exp(-0.5 * z * z) / Math.SQRT2 / Math.sqrt(Math.PI);

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} pct     your percentile, 1..99
 * @param {object} opts    { height, label, reveal (0..1 animation progress) }
 */
export function drawBellCurve(canvas, pct, opts = {}) {
  const cssW = canvas.clientWidth || canvas.parentElement?.clientWidth || 600;
  const cssH = opts.height || 190;
  const ctx = setup(canvas, cssW, cssH);
  const reveal = opts.reveal == null ? 1 : Math.max(0, Math.min(1, opts.reveal));

  const padL = 12, padR = 12, padT = 16, padB = 34;
  const W = cssW - padL - padR, H = cssH - padT - padB;

  const accent = cssVar("--accent", "#e0330f");
  const text = cssVar("--text", "#16140f");
  const dim = cssVar("--text-dim", "#4d4a40");
  const muted = cssVar("--muted", "#8b8577");
  const border = cssVar("--border", "#d8d1bd");
  const panel2 = cssVar("--panel-2", "#eee8d9");

  const Z = 3.2;                                   // draw ±3.2 SD
  const x = (z) => padL + ((z + Z) / (2 * Z)) * W;  // z → px
  const y = (d) => padT + H - (d / phi(0)) * H;     // density → px

  ctx.clearRect(0, 0, cssW, cssH);
  ctx.font = "600 10px 'Inter', -apple-system, system-ui, sans-serif";
  ctx.textBaseline = "middle";

  const zYou = probit(Math.min(Math.max(pct, 1), 99) / 100);
  const zRevealed = -Z + (zYou + Z) * reveal;       // sweep the fill left→right

  const curve = (from, to) => {
    const steps = 160;
    for (let i = 0; i <= steps; i++) {
      const z = from + ((to - from) * i) / steps;
      const px = x(z), py = y(phi(z));
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
  };

  // full population body
  ctx.beginPath();
  ctx.moveTo(x(-Z), y(0));
  curve(-Z, Z);
  ctx.lineTo(x(Z), y(0));
  ctx.closePath();
  ctx.fillStyle = panel2;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.stroke();

  // the slice you beat
  ctx.beginPath();
  ctx.moveTo(x(-Z), y(0));
  curve(-Z, zRevealed);
  ctx.lineTo(x(zRevealed), y(0));
  ctx.closePath();
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.9;
  ctx.fill();
  ctx.globalAlpha = 1;

  // curve outline on top
  ctx.beginPath();
  curve(-Z, Z);
  ctx.strokeStyle = text;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // baseline
  ctx.beginPath();
  ctx.moveTo(padL, y(0) + 0.5);
  ctx.lineTo(padL + W, y(0) + 0.5);
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.stroke();

  // "average person" marker at z = 0
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x(0), y(phi(0)));
  ctx.lineTo(x(0), y(0));
  ctx.strokeStyle = muted;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);

  // your marker
  const yx = x(zRevealed);
  ctx.beginPath();
  ctx.moveTo(yx, padT - 4);
  ctx.lineTo(yx, y(0));
  ctx.strokeStyle = text;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // flag
  ctx.beginPath();
  ctx.arc(yx, padT - 4, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.strokeStyle = text;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const labelText = opts.label || "YOU";
  ctx.font = "800 10px 'Inter', -apple-system, system-ui, sans-serif";
  const tw = ctx.measureText(labelText).width + 12;
  let lx = yx - tw / 2;
  lx = Math.max(padL, Math.min(padL + W - tw, lx));   // keep the chip on-canvas

  // Only label the average when it won't collide with the YOU chip — near the
  // 50th percentile the two markers sit on top of each other.
  const avgW = ctx.measureText("AVERAGE").width;
  if (Math.abs(x(0) - yx) > tw / 2 + avgW / 2 + 8) {
    ctx.font = "600 10px 'Inter', -apple-system, system-ui, sans-serif";
    ctx.fillStyle = muted;
    ctx.textAlign = "center";
    ctx.fillText("AVERAGE", x(0), padT + H + 12);
    ctx.font = "800 10px 'Inter', -apple-system, system-ui, sans-serif";
  }

  ctx.fillStyle = text;
  ctx.fillRect(lx, padT + H + 4, tw, 16);
  ctx.fillStyle = cssVar("--bg", "#f2ede3");
  ctx.textAlign = "center";
  ctx.fillText(labelText, lx + tw / 2, padT + H + 12.5);

  // tail hints
  ctx.font = "600 9px 'Inter', -apple-system, system-ui, sans-serif";
  ctx.fillStyle = dim;
  ctx.textAlign = "left";
  ctx.fillText("SLOWER", padL + 2, padT + 8);
  ctx.textAlign = "right";
  ctx.fillText("SHARPER", padL + W - 2, padT + 8);
}

/**
 * A bell curve that animates in and re-draws on resize/theme change.
 * @returns {{node: HTMLElement, redraw: Function}}
 */
export function bellCurveBlock(pct, { label = "YOU", height = 190, animate = true } = {}) {
  const canvas = el("canvas", { class: "chart bellcurve" });
  const node = el("div", { class: "chart-wrap bell-wrap" }, canvas);

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let raf = null;

  const redraw = (reveal = 1) => {
    if (!canvas.isConnected) return;
    drawBellCurve(canvas, pct, { height, label, reveal });
  };

  const play = () => {
    if (!animate || reduced) { redraw(1); return; }
    const t0 = performance.now();
    const dur = 900;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);         // ease-out cubic
      redraw(eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  // draw once laid out (clientWidth is 0 before insertion)
  requestAnimationFrame(() => { redraw(0); play(); });

  return { node, redraw: () => redraw(1), stop: () => raf && cancelAnimationFrame(raf) };
}

/**
 * Count a number up to its final value — used for the big percentile.
 * Honors prefers-reduced-motion by jumping straight to the value.
 */
export function countUp(node, to, { dur = 900, suffix = "" } = {}) {
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduced) { node.textContent = `${Math.round(to)}${suffix}`; return; }
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    node.textContent = `${Math.round(to * eased)}${suffix}`;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
