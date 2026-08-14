/* ============================================================
   celebrate.js — confetti, sized to the achievement.

   Deliberately restrained: a strong result gets a real burst, an
   ordinary one gets nothing. Celebrating everything is the same as
   celebrating nothing, and this app's whole claim is that its numbers
   mean something.

   Fully honors prefers-reduced-motion (renders nothing at all).
   ============================================================ */

import { TIERS } from "./achievements.js";

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** Particle counts + spread per tier. `none` never fires. */
const INTENSITY = {
  legendary: { count: 140, spread: 1.0, ribbons: true },
  great:     { count: 90,  spread: 0.85, ribbons: true },
  good:      { count: 55,  spread: 0.7,  ribbons: false },
  solid:     { count: 28,  spread: 0.55, ribbons: false },
  none:      { count: 0,   spread: 0,    ribbons: false },
};

let canvas = null, ctx = null, running = false, parts = [];

function ensureCanvas() {
  if (canvas) return;
  canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  ctx = canvas.getContext("2d");
  resize();
  window.addEventListener("resize", resize);
}

function resize() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function frame() {
  if (!running) return;
  const W = window.innerWidth, H = window.innerHeight;
  ctx.clearRect(0, 0, W, H);

  let alive = 0;
  for (const p of parts) {
    if (p.life <= 0) continue;
    alive++;
    p.vy += 0.16;                 // gravity
    p.vx *= 0.995;                // drag
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vrot;
    p.life -= 1;

    const fade = Math.min(1, p.life / 40);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = fade;
    ctx.fillStyle = p.color;
    if (p.ribbon) ctx.fillRect(-p.size / 2, -p.size / 6, p.size, p.size / 3);
    else ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }

  if (alive === 0) {
    running = false;
    ctx.clearRect(0, 0, W, H);
    return;
  }
  requestAnimationFrame(frame);
}

/**
 * Fire confetti for an achievement tier.
 * @param {string} tier  key of TIERS
 * @param {object} opts  { origin: {x, y} in px; defaults to upper-centre }
 */
export function celebrate(tier = "good", opts = {}) {
  const conf = INTENSITY[tier] || INTENSITY.good;
  if (!conf.count) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  ensureCanvas();
  const W = window.innerWidth, H = window.innerHeight;
  const ox = opts.origin?.x ?? W / 2;
  const oy = opts.origin?.y ?? Math.min(H * 0.34, 300);

  const palette = [
    cssVar("--accent", "#e0330f"),
    cssVar("--text", "#16140f"),
    cssVar("--warn", "#9c6c11"),
    cssVar("--good", "#236941"),
    cssVar("--accent", "#e0330f"),
  ];

  for (let i = 0; i < conf.count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * conf.spread * 1.6;
    const speed = 5 + Math.random() * 9 * conf.spread;
    parts.push({
      x: ox + (Math.random() - 0.5) * 60,
      y: oy + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 6,
      color: palette[(Math.random() * palette.length) | 0],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      life: 90 + Math.random() * 70,
      ribbon: conf.ribbons && Math.random() < 0.45,
    });
  }
  // keep the particle pool bounded on repeat bursts
  if (parts.length > 600) parts = parts.slice(-600);

  if (!running) { running = true; requestAnimationFrame(frame); }
}

/**
 * The celebration banner shown above a result.
 * Returns null for `none` so ordinary results stay quiet.
 */
export function celebrationBanner(ach, { subtitle = "" } = {}) {
  if (!ach || ach.tier === "none") return null;
  const t = TIERS[ach.tier] || TIERS.good;

  const badges = document.createElement("div");
  badges.className = "ach-badges";
  for (const b of ach.badges || []) {
    const chip = document.createElement("span");
    chip.className = `ach-badge ach-${b.key}`;
    chip.title = b.detail || "";
    chip.textContent = b.label;
    badges.append(chip);
  }

  const wrap = document.createElement("div");
  wrap.className = `celebrate ${t.cls}`;
  wrap.setAttribute("role", "status");
  wrap.innerHTML = `
    <div class="celebrate-icon" aria-hidden="true">${t.icon}</div>
    <div class="celebrate-body">
      <div class="celebrate-head">${ach.headline || ""}</div>
      ${subtitle ? `<div class="celebrate-sub">${subtitle}</div>` : ""}
    </div>`;
  if ((ach.badges || []).length) wrap.append(badges);
  return wrap;
}
