/* ============================================================
   SAA — back-office data layer (window.SAA_STORE)

   A PLUGGABLE store. Today it reads the browser's own localStorage
   (the same keys the exam engine writes) so the candidate profile
   works with zero backend. Swap the read/write/directory methods for
   fetch() calls to a real API to make profiles + the employer
   directory shared and consented across devices (see BACKOFFICE.md).

   Nothing here is a security boundary: certificates are checksum-
   stamped with a PUBLIC salt for demo verification only. Production
   must sign them server-side (HMAC/JWT) — see BACKOFFICE.md.
   ============================================================ */
(function () {
  "use strict";

  var KEYS = {
    perf: "saa:v1:perf", best: "saa:v1:best",
    profile: "saa:v1:profile", integ: "saa:v1:integrity:last",
  };

  // domains (mirrors questions.js categories)
  var CATS = {
    apis:      { label: "APIs & REST",        color: "#8fc9f5" },
    protocols: { label: "Protocols",          color: "#7fe3b0" },
    network:   { label: "Networking & OSI",   color: "#e7cf86" },
    messaging: { label: "Messaging & Queues", color: "#d3a9f2" },
    data:      { label: "Databases & Data",   color: "#f2a184" },
  };
  var CAT_ORDER = ["apis", "protocols", "network", "messaging", "data"];

  function getJSON(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function setJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ---- results derived from the engine's own storage ---- */
  function stats() {
    var perf = getJSON(KEYS.perf, { topics: {}, cats: {} });
    var best = getJSON(KEYS.best, {});
    var cats = {}, sumC = 0, sumT = 0;
    CAT_ORDER.forEach(function (c) {
      var b = (perf.cats && perf.cats[c]) || { c: 0, t: 0 };
      var pct = b.t ? Math.round((b.c / b.t) * 100) : null;
      cats[c] = { pct: pct, c: b.c || 0, t: b.t || 0 };
      sumC += b.c || 0; sumT += b.t || 0;
    });
    var bestForm = 0, forms = 0;
    Object.keys(best).forEach(function (k) { forms++; if (best[k].pct > bestForm) bestForm = best[k].pct; });
    // weakest topics
    var topics = perf.topics || {}, weak = [];
    Object.keys(topics).forEach(function (t) { var b = topics[t]; if (b.t >= 2) weak.push({ topic: t, pct: Math.round((b.c / b.t) * 100) }); });
    weak.sort(function (a, b) { return a.pct - b.pct; });
    return {
      done: perf.done || 0, formsTaken: forms, bestForm: bestForm,
      overall: sumT ? Math.round((sumC / sumT) * 100) : null,
      answered: sumT, cats: cats, weakest: weak.slice(0, 4),
    };
  }

  function integrity() {
    var r = getJSON(KEYS.integ, null);
    if (!r) return { verdict: "n/a", score: null, proctored: false, flags: [] };
    return r;
  }

  /* ---- profile record (local; replace with an authenticated user record) ---- */
  function getProfile() {
    var p = getJSON(KEYS.profile, null);
    if (!p) p = { name: "", handle: "", headline: "", visible: false, createdAt: Date.now() };
    return p;
  }
  function saveProfile(p) { p.updatedAt = Date.now(); setJSON(KEYS.profile, p); return p; }

  /* ---- certificate: verifiable payload (DEMO checksum, not a real signature) ---- */
  var SALT = "saa-demo-v1";                    // public — production signs server-side
  function b64uEncode(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function b64uDecode(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return decodeURIComponent(escape(atob(s))); }
  function checksum(s) { var h = 5381, i; for (i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }
  function certId(payloadStr) { var h = checksum(payloadStr + SALT).toUpperCase().replace(/[^A-Z0-9]/g, "0"); h = (h + "00000000").slice(0, 8); return "SAA-" + h.slice(0, 4) + "-" + h.slice(4, 8); }

  function makeCert() {
    var p = getProfile(), s = stats(), ig = integrity();
    var catPct = {}; CAT_ORDER.forEach(function (c) { catPct[c] = s.cats[c].pct; });
    var payload = {
      v: 1, n: p.name || "Anonymous", h: p.handle || "", hl: p.headline || "",
      done: s.done, ov: s.overall, best: s.bestForm, cats: catPct,
      ig: ig.verdict, pr: !!ig.proctored, iss: new Date().toISOString().slice(0, 10),
    };
    var str = JSON.stringify(payload);
    payload.id = certId(str);
    var full = JSON.stringify(payload);
    return { id: payload.id, code: b64uEncode(full) + "." + checksum(full + SALT), payload: payload };
  }
  function verifyCert(code) {
    try {
      var parts = String(code).trim().split(".");
      if (parts.length !== 2) return { valid: false, error: "Not a SAA certificate code." };
      var json = b64uDecode(parts[0]);
      if (checksum(json + SALT) !== parts[1]) return { valid: false, error: "Checksum failed — the code was altered or truncated." };
      return { valid: true, payload: JSON.parse(json) };
    } catch (e) { return { valid: false, error: "Could not read the code." }; }
  }

  /* ---- employer directory ----
     DEMO ONLY: seeded fictional candidates + (if the local user opted in) their
     own profile. A real directory is a server query over consented candidates. */
  function demoCandidates() {
    return [
      { name: "Priya N.", handle: "priya-sa", headline: "Integration analyst, 4y", ov: 88, best: 92, done: 6, cats: { apis: 90, protocols: 86, network: 80, messaging: 88, data: 94 }, ig: "clean", pr: true, id: "SAA-7F2A-11C9" },
      { name: "Marcus D.", handle: "mdev", headline: "Junior systems analyst", ov: 74, best: 80, done: 4, cats: { apis: 78, protocols: 72, network: 70, messaging: 68, data: 82 }, ig: "clean", pr: false, id: "SAA-3B5E-90AA" },
      { name: "Wei L.", handle: "weil", headline: "Backend-leaning BA", ov: 81, best: 88, done: 5, cats: { apis: 84, protocols: 90, network: 72, messaging: 86, data: 78 }, ig: "review", pr: false, id: "SAA-6C10-42F7" },
      { name: "Sara K.", handle: "sara-k", headline: "Platform analyst, 6y", ov: 93, best: 96, done: 8, cats: { apis: 96, protocols: 92, network: 90, messaging: 92, data: 95 }, ig: "clean", pr: true, id: "SAA-0AD4-77B1" },
    ];
  }
  function directory() {
    var list = demoCandidates();
    var p = getProfile();
    if (p.visible && (p.name || p.handle)) {
      var s = stats();
      var catPct = {}; CAT_ORDER.forEach(function (c) { catPct[c] = s.cats[c].pct || 0; });
      list.unshift({ name: p.name || "You", handle: p.handle || "you", headline: p.headline || "This device", ov: s.overall || 0, best: s.bestForm, done: s.done, cats: catPct, ig: integrity().verdict, pr: false, id: (makeCert().id), you: true });
    }
    return list;
  }

  window.SAA_STORE = {
    CATS: CATS, CAT_ORDER: CAT_ORDER,
    stats: stats, integrity: integrity,
    getProfile: getProfile, saveProfile: saveProfile,
    makeCert: makeCert, verifyCert: verifyCert, directory: directory,
  };
})();
