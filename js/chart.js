/* ============================================================
   chart.js — tiny self-contained canvas charts (no libraries).
   Reads theme colors from CSS custom properties so it matches
   light/dark automatically.
   ============================================================ */

import { el } from "./ui.js";

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** Prepare a canvas for crisp drawing at the given CSS size. */
function setup(canvas, cssW, cssH) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.height = cssH + "px";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/**
 * Line chart of {ts, score} points on a 0..100 scale.
 * Draws gridlines at 0/25/50/75/100, the line, area fill, and point dots.
 */
export function drawLineChart(canvas, points, opts = {}) {
  const cssW = canvas.clientWidth || canvas.parentElement.clientWidth || 600;
  const cssH = opts.height || 240;
  const ctx = setup(canvas, cssW, cssH);

  const padL = 34, padR = 14, padT = 16, padB = 26;
  const W = cssW - padL - padR, H = cssH - padT - padB;
  const text = cssVar("--text-dim", "#9fb0c3");
  const grid = cssVar("--grid", "#212a36");
  const accent = cssVar("--accent", "#d9b25a");

  ctx.clearRect(0, 0, cssW, cssH);
  ctx.font = "11px -apple-system, system-ui, sans-serif";
  ctx.textBaseline = "middle";

  // y gridlines
  ctx.strokeStyle = grid; ctx.fillStyle = text; ctx.lineWidth = 1;
  for (let s = 0; s <= 100; s += 25) {
    const y = padT + H * (1 - s / 100);
    ctx.beginPath(); ctx.moveTo(padL, y + 0.5); ctx.lineTo(padL + W, y + 0.5); ctx.stroke();
    ctx.textAlign = "right"; ctx.fillText(String(s), padL - 6, y);
  }

  if (!points.length) return;

  const n = points.length;
  const x = (i) => padL + (n === 1 ? W / 2 : (W * i) / (n - 1));
  const y = (v) => padT + H * (1 - v / 100);

  // area fill
  const grad = ctx.createLinearGradient(0, padT, 0, padT + H);
  grad.addColorStop(0, accent + "55");
  grad.addColorStop(1, accent + "05");
  ctx.beginPath();
  ctx.moveTo(x(0), y(points[0].score));
  points.forEach((p, i) => ctx.lineTo(x(i), y(p.score)));
  ctx.lineTo(x(n - 1), padT + H); ctx.lineTo(x(0), padT + H); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  // line
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(x(i), y(p.score)) : ctx.moveTo(x(i), y(p.score))));
  ctx.strokeStyle = accent; ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.stroke();

  // dots
  ctx.fillStyle = accent;
  points.forEach((p, i) => { ctx.beginPath(); ctx.arc(x(i), y(p.score), 3.5, 0, Math.PI * 2); ctx.fill(); });

  // last value label
  const last = points[n - 1];
  ctx.fillStyle = cssVar("--text", "#e7edf5");
  ctx.font = "bold 12px -apple-system, system-ui, sans-serif";
  ctx.textAlign = n === 1 ? "center" : "right";
  ctx.fillText(String(last.score), x(n - 1) - (n === 1 ? 0 : 6), y(last.score) - 12);

  // x end dates
  ctx.fillStyle = text; ctx.font = "10px -apple-system, system-ui, sans-serif";
  const fmt = (ts) => new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  ctx.textAlign = "left"; ctx.fillText(fmt(points[0].ts), padL, padT + H + 12);
  if (n > 1) { ctx.textAlign = "right"; ctx.fillText(fmt(last.ts), padL + W, padT + H + 12); }
}

/** Tiny sparkline for a domain row. */
export function drawSparkline(canvas, values) {
  const cssW = canvas.clientWidth || 90, cssH = 30;
  const ctx = setup(canvas, cssW, cssH);
  ctx.clearRect(0, 0, cssW, cssH);
  if (values.length < 2) {
    ctx.fillStyle = cssVar("--muted", "#6b7c91");
    ctx.font = "10px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(values.length ? "—" : "", cssW / 2, cssH / 2);
    return;
  }
  const pad = 3, W = cssW - pad * 2, H = cssH - pad * 2;
  const x = (i) => pad + (W * i) / (values.length - 1);
  const y = (v) => pad + H * (1 - v / 100);
  const accent = cssVar("--accent", "#d9b25a");
  ctx.beginPath();
  values.forEach((v, i) => (i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))));
  ctx.strokeStyle = accent; ctx.lineWidth = 1.8; ctx.lineJoin = "round"; ctx.stroke();
  // last dot
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(x(values.length - 1), y(values[values.length - 1]), 2.2, 0, Math.PI * 2); ctx.fill();
}

/**
 * Radial gauge (0..100) used for the headline Aristotle Index.
 * Returns the wrapping element.
 */
export function indexDial(value, size = 150) {
  const wrap = el("div", { class: "index-dial" });
  const canvas = el("canvas", { width: size, height: size, style: { width: size + "px", height: size + "px" } });
  wrap.append(canvas);

  const draw = () => {
    const ctx = setup(canvas, size, size);
    const cx = size / 2, cy = size / 2, r = size / 2 - 12;
    const start = Math.PI * 0.75, end = Math.PI * 2.25; // 270° arc
    ctx.clearRect(0, 0, size, size);
    ctx.lineCap = "round";
    // track
    ctx.beginPath(); ctx.arc(cx, cy, r, start, end);
    ctx.strokeStyle = cssVar("--panel-2", "#1c2533"); ctx.lineWidth = 12; ctx.stroke();
    if (value != null) {
      const frac = Math.max(0, Math.min(1, value / 100));
      const col = value >= 75 ? cssVar("--good", "#46c98b") : value >= 50 ? cssVar("--accent", "#d9b25a") : value >= 30 ? cssVar("--warn", "#e2b04a") : cssVar("--bad", "#ef6f6f");
      ctx.beginPath(); ctx.arc(cx, cy, r, start, start + (end - start) * frac);
      ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.stroke();
    }
    // value text
    ctx.fillStyle = cssVar("--text", "#e7edf5");
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `600 ${Math.round(size * 0.28)}px "Iowan Old Style", Georgia, serif`;
    ctx.fillText(value == null ? "—" : String(Math.round(value)), cx, cy - 4);
    ctx.fillStyle = cssVar("--muted", "#6b7c91");
    ctx.font = "11px system-ui"; ctx.fillText("INDEX / 100", cx, cy + size * 0.16);
  };
  // Draw now and after layout/theme settle.
  requestAnimationFrame(draw);
  wrap._redraw = draw;
  return wrap;
}
