/* ============================================================
   icons.js — line icons drawn in the same hand as the rest of
   the page: 24×24, currentColor, 1.6 stroke, no fill.

   Emoji were doing this job before. They came with their own
   palette and their own drawing style, so every card carried a
   little piece of someone else's design system. These don't.
   ============================================================ */

/* Each entry is the inner markup of a 0 0 24 24 svg. */
const PATHS = {
  /* ---------------- test domains ---------------- */

  // processing speed — a bolt
  reaction: `<path d="M13.2 2.6 5.9 13.4h5.1l-.9 8 7.2-11.2h-5.2z"/>`,

  // coding speed — a symbol→digit key, twice over
  coding: `<path d="M6 4.4 8.7 7.1 6 9.8 3.3 7.1z"/>
           <path d="M10.8 7.1h4"/><path d="M16.6 5.2v3.8M19.4 5.2v3.8"/>
           <circle cx="6" cy="16.9" r="2.7"/>
           <path d="M10.8 16.9h4"/><path d="M18 15v3.8"/>`,

  // working memory — a window sliding along a sequence
  nback: `<circle cx="4.3" cy="12" r="1.8"/>
          <rect x="8.4" y="7" width="12.2" height="10" rx="2.8"/>
          <circle cx="12.9" cy="12" r="1.8" fill="currentColor" stroke="none"/>
          <circle cx="17.1" cy="12" r="1.8" fill="currentColor" stroke="none"/>`,

  // spatial memory — a route across a grid of locations
  corsi: `<path d="M6.6 17.4 6.6 6.6 17.4 17.4" stroke-linejoin="round"/>
          <circle cx="6.6" cy="6.6" r="2.1" fill="currentColor" stroke="none"/>
          <circle cx="17.4" cy="6.6" r="2.1"/>
          <circle cx="6.6" cy="17.4" r="2.1"/>
          <circle cx="17.4" cy="17.4" r="2.1" fill="currentColor" stroke="none"/>`,

  // attention — a target
  stroop: `<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.4"/>
           <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>`,

  // impulse control — go, and don't
  gonogo: `<rect x="7.9" y="2.6" width="8.2" height="18.8" rx="3.4"/>
           <circle cx="12" cy="7.4" r="1.5" fill="currentColor" stroke="none"/>
           <circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="16.6" r="1.5"/>`,

  // memory — a held sequence, then run backwards
  digitspan: `<path d="M5.6 13.6V9M12 13.6V5.4M18.4 13.6v-6.2" stroke-width="2.1"/>
              <path d="M18.4 18.4H5.6"/><path d="M8.1 15.9 5.6 18.4l2.5 2.5"/>`,

  // mental flexibility — two rules crossing over
  switching: `<path d="M3 7.6h3.9c1.2 0 2 .5 2.7 1.4l4.8 6c.7.9 1.5 1.4 2.7 1.4H21"/>
              <path d="M3 16.4h3.9c1.2 0 2-.5 2.7-1.4l4.8-6c.7-.9 1.5-1.4 2.7-1.4H21"/>
              <path d="M18.6 5.2 21 7.6l-2.4 2.4"/><path d="M18.6 14 21 16.4l-2.4 2.4"/>`,

  // numeracy — arithmetic, in the head
  mentalmath: `<circle cx="12" cy="12" r="8.8"/>
               <circle cx="12" cy="8.2" r="1.3" fill="currentColor" stroke="none"/>
               <path d="M7.6 12h8.8"/>
               <circle cx="12" cy="15.8" r="1.3" fill="currentColor" stroke="none"/>`,

  // reasoning — the pattern, and the piece you infer
  sequences: `<path d="M2.6 18.2h5.2V13h5.2" stroke-linejoin="round"/>
              <path d="M13 13V7.8h5.2V4" stroke-linejoin="round" stroke-dasharray="2.6 2.3"/>
              <circle cx="18.2" cy="4" r="1.6" fill="currentColor" stroke="none"/>`,

  /* ---------------- verdicts ---------------- */
  calibrating: `<path d="M4 17.4a8 8 0 0 1 16 0"/>
                <path d="M12 17.4 15.8 11" stroke-width="1.9"/>
                <circle cx="12" cy="17.4" r="1.6" fill="currentColor" stroke="none"/>`,
  improving: `<path d="M3.5 17 9 11.4l3.6 3L20 6.6"/><path d="M15.4 6.6H20v4.6"/>`,
  steady: `<path d="M4 9.6h16M4 14.4h16"/>`,
  watch: `<path d="M2.4 12s3.7-6.2 9.6-6.2S21.6 12 21.6 12s-3.7 6.2-9.6 6.2S2.4 12 2.4 12z"/>
          <circle cx="12" cy="12" r="2.7"/>`,
  decline: `<path d="M3.5 7 9 12.6l3.6-3L20 17.4"/><path d="M15.4 17.4H20v-4.6"/>`,

  /* ---------------- celebration tiers ---------------- */
  legendary: `<path d="m12 2.9 2.8 5.7 6.3.9-4.6 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.5l6.3-.9z" stroke-linejoin="round"/>`,
  great: `<path d="M12 3v4.2M12 16.8V21M3 12h4.2M16.8 12H21M5.6 5.6l3 3M15.4 15.4l3 3M18.4 5.6l-3 3M8.6 15.4l-3 3"/>`,
  good: `<circle cx="12" cy="12" r="8.8"/><path d="m7.9 13.6 4.1-4 4.1 4"/>`,
  solid: `<path d="m4.8 12.4 4.6 4.6L19.2 7.2"/>`,
};

/** Test ids reuse their own key; anything else falls back to a dot. */
export function iconHTML(name, { size = 20, cls = "" } = {}) {
  const body = PATHS[name];
  if (!body) return "";
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" ` +
    `fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" ` +
    `aria-hidden="true" focusable="false">${body}</svg>`;
}

/** DOM node version, for the places that build elements rather than strings. */
export function iconEl(name, opts = {}) {
  const span = document.createElement("span");
  span.className = "tc-icon";
  span.innerHTML = iconHTML(name, opts);
  return span;
}

export const hasIcon = (name) => Boolean(PATHS[name]);
