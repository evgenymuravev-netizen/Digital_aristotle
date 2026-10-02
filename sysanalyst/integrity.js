/* ============================================================
   SAA — client-side INTEGRITY signals (anti-cheat, deterrent-grade)

   Self-contained: it attaches its own listeners, watches the exam
   screen, and writes an integrity report into the results screen +
   localStorage. It does NOT touch the exam engine (app.js), so it can
   never break grading.

   ⚠️ HONEST SCOPE — read INTEGRITY.md.
   These are BEHAVIOURAL DETERRENTS AND FLAGS, not proof. A determined
   cheater who reads the question and types it into an AI on a *second
   device* (phone) leaves zero signals here. Real assurance needs a
   backend (server-side statistical detection) and/or proctoring. Treat
   the score below as "how much friction/suspicion", not "did they cheat".
   ============================================================ */
(function () {
  "use strict";
  if (typeof window === "undefined" || typeof document === "undefined") return;

  var LAST = "saa:v1:integrity:last";
  var LOG = "saa:v1:integrity:log";
  var PANEL_ID = "saa-integrity-panel";

  var S = null;                 // signals for the active attempt
  var examWasActive = false;

  function now() { return Date.now(); }
  function byId(id) { return document.getElementById(id); }
  function examActive() { var s = byId("screen-exam"); return !!(s && s.classList && s.classList.contains("active")); }
  function resultsActive() { var s = byId("screen-results"); return !!(s && s.classList && s.classList.contains("active")); }

  function reset() {
    S = {
      start: now(), hidden: 0, hiddenAt: 0, hides: 0, blurs: 0,
      pastes: 0, copies: 0, cuts: 0, ctx: 0, answers: [], lastAnswerAt: 0, done: false,
    };
  }

  /* ---- global signal listeners (only accumulate while the exam is active) ---- */
  document.addEventListener("visibilitychange", function () {
    if (!S || !examActive()) return;
    if (document.hidden) { S.hides++; S.hiddenAt = now(); }
    else if (S.hiddenAt) { S.hidden += now() - S.hiddenAt; S.hiddenAt = 0; }
  });
  window.addEventListener("blur", function () { if (S && examActive()) S.blurs++; });
  document.addEventListener("paste", function () { if (S && examActive()) S.pastes++; });
  document.addEventListener("copy", function () { if (S && examActive()) S.copies++; });
  document.addEventListener("cut", function () { if (S && examActive()) S.cuts++; });
  document.addEventListener("contextmenu", function () { if (S && examActive()) S.ctx++; });

  // time each answer (option buttons carry the .option class)
  document.addEventListener("click", function (e) {
    if (!S || !examActive()) return;
    var t = e.target;
    while (t && t !== document) { if (t.classList && t.classList.contains("option")) break; t = t.parentNode; }
    if (!t || t === document) return;
    var ts = now();
    var dt = S.lastAnswerAt ? ts - S.lastAnswerAt : ts - S.start;
    S.lastAnswerAt = ts;
    if (dt > 0 && dt < 600000) S.answers.push(dt);   // ignore absurd gaps (idle/resume)
  }, true);

  /* ---- scoring ---- */
  function finalize() {
    if (!S || S.done) return getJSON(LAST, null);
    if (S.hiddenAt) { S.hidden += now() - S.hiddenAt; S.hiddenAt = 0; }
    S.done = true;

    var flags = [];
    var add = function (sev, t) { flags.push({ sev: sev, t: t }); };

    if (S.pastes) add("high", S.pastes + " paste event" + (S.pastes > 1 ? "s" : "") + " during the test — content may have been pasted in from elsewhere.");
    if (S.hidden > 20000 || S.hides >= 3) add("high", "Left the test tab " + S.hides + "× for ~" + Math.round(S.hidden / 1000) + "s total.");
    else if (S.hides === 2) add("med", "Switched away from the test tab twice.");
    else if (S.hides === 1) add("low", "Switched away from the test tab once.");
    if (S.blurs >= 3) add("med", "The window lost focus " + S.blurs + " times.");
    if (S.copies || S.cuts) add("med", (S.copies + S.cuts) + " copy/cut event" + ((S.copies + S.cuts) > 1 ? "s" : "") + " — questions may have been copied out to an AI tool.");

    var fast = 0, i;
    for (i = 0; i < S.answers.length; i++) if (S.answers[i] < 3000) fast++;
    var threshold = Math.max(3, Math.ceil(S.answers.length * 0.4));
    if (S.answers.length >= 5 && fast >= threshold)
      add("med", fast + " answers came in under 3s — unusually fast for reading a technical question and four options.");

    // very low variance in answer timing can indicate scripted/paced answering
    if (S.answers.length >= 6) {
      var mean = 0; for (i = 0; i < S.answers.length; i++) mean += S.answers[i]; mean /= S.answers.length;
      var v = 0; for (i = 0; i < S.answers.length; i++) v += Math.pow(S.answers[i] - mean, 2); v /= S.answers.length;
      var cv = mean > 0 ? Math.sqrt(v) / mean : 1;      // coefficient of variation
      if (cv < 0.25 && mean < 8000) add("low", "Answer timing was oddly uniform — humans vary more per question.");
    }

    var score = 100;
    flags.forEach(function (f) { score -= f.sev === "high" ? 34 : (f.sev === "med" ? 16 : 6); });
    score = Math.max(0, Math.min(100, score));
    var verdict = score >= 85 ? "clean" : (score >= 55 ? "review" : "flagged");

    var rep = {
      score: score, verdict: verdict, flags: flags,
      signals: { hidden: S.hidden, hides: S.hides, blurs: S.blurs, pastes: S.pastes, copies: S.copies + S.cuts, ctx: S.ctx, fastAnswers: fast, answered: S.answers.length },
      proctored: false, at: now(),
    };
    try {
      localStorage.setItem(LAST, JSON.stringify(rep));
      var log = getJSON(LOG, []); log.push(rep); localStorage.setItem(LOG, JSON.stringify(log.slice(-50)));
    } catch (e) {}
    return rep;
  }

  function getJSON(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }

  /* ---- results panel ---- */
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }

  function injectPanel(rep) {
    var body = byId("results-body");
    if (!body || byId(PANEL_ID) || !rep) return;
    var wrap = el("div", "panel integ"); wrap.id = PANEL_ID;

    var head = el("div", "integ-head");
    head.appendChild(el("h2", null, "Integrity check"));
    var vlabel = rep.verdict === "clean" ? "Looks clean" : (rep.verdict === "review" ? "Worth a look" : "Flagged");
    head.appendChild(el("span", "integ-verdict " + rep.verdict, vlabel + " · " + rep.score + "/100"));
    wrap.appendChild(head);

    if (rep.flags.length) {
      var ul = el("ul", "integ-flags");
      rep.flags.forEach(function (f) {
        var li = el("li");
        li.appendChild(el("span", "sev-dot " + f.sev));
        li.appendChild(el("span", null, f.t));
        ul.appendChild(li);
      });
      wrap.appendChild(ul);
    } else {
      wrap.appendChild(el("p", "muted", "No behavioural red flags on this device during the test."));
    }

    var note = el("p", "disclaimer");
    note.innerHTML = "These are on-device behavioural signals — a <b>deterrent and a flag, not proof</b>. They can't see a phone or second computer, so a verified result for an employer should come from a <b>proctored</b> re-test. See the integrity notes for how this becomes robust.";
    wrap.appendChild(note);

    // place it just after the score hero if possible, else append
    var anchor = body.querySelector(".panel");
    if (anchor && anchor.nextSibling) body.insertBefore(wrap, anchor.nextSibling);
    else body.appendChild(wrap);
  }

  /* ---- drive from screen changes ---- */
  function onScreens() {
    var ea = examActive();
    if (ea && !examWasActive) reset();          // a fresh attempt started
    examWasActive = ea;
    if (resultsActive() && S && !S.done) {
      var rep = finalize();
      // let the engine finish rendering results-body first
      (window.requestAnimationFrame || function (f) { setTimeout(f, 16); })(function () { injectPanel(rep); });
    }
  }

  function observe(id) {
    var n = byId(id); if (!n || !window.MutationObserver) return;
    new MutationObserver(onScreens).observe(n, { attributes: true, attributeFilter: ["class"] });
  }
  observe("screen-exam");
  observe("screen-results");
  onScreens();
})();
