/* ============================================================
   MMAT — engine
   Classic script (no modules) so it runs from file:// and Pages.

   Features: 15-min full forms + 5-min free taster, runtime
   interleaving (no two adjacent items share a topic), serverless
   license unlock, results dashboard, and an adaptive "weak areas"
   round built from your worst topics.

   Consumes globals from questions.js (window.MMAT) and config.js
   (window.MMAT_CONFIG).
   ============================================================ */
(function () {
  "use strict";

  var DATA = window.MMAT;
  var CFG = window.MMAT_CONFIG || { paywall: { provider: "demo" }, price: "$15.99", buyUrl: "#" };
  if (!DATA || !Array.isArray(DATA.tests)) {
    document.getElementById("test-grid").innerHTML =
      '<p class="note">Could not load the question bank (questions.js).</p>';
    return;
  }

  var FULL_SECS = (DATA.config && DATA.config.durationSec) || 900;
  var KEY = { session: "mmat:v2:session", best: "mmat:v2:best", perf: "mmat:v2:perf", unlock: "mmat:v2:unlock" };

  /* ---------------- helpers ---------------- */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on" && typeof attrs[k] === "function") n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    });
    if (kids != null) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }
  function $(id) { return document.getElementById(id); }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function fmtTime(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + pad2(s % 60); }
  function getJSON(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function setJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function catInfo(c) { return (DATA.categories && DATA.categories[c]) || { label: c, color: "#9fb0c3" }; }

  function allForms() { return [DATA.freeTest].concat(DATA.tests); }
  function formById(id) { var a = allForms(); for (var i = 0; i < a.length; i++) if (a[i] && a[i].id === id) return a[i]; return null; }
  function qOf(ref) { var f = formById(ref.fid); return f ? f.questions[ref.qi] : null; }

  /* ---------------- interleave: no two adjacent same topic ----------------
     Greedy — always take from the largest remaining topic group that isn't
     the previous topic. Deterministic (ties broken by topic name). Works as
     long as no topic exceeds ceil(n/2) items, which holds for our forms. */
  function interleave(list) {
    var groups = {};
    list.forEach(function (it) { (groups[it.topic] = groups[it.topic] || []).push(it); });
    var out = [], prev = null, remaining = list.length;
    while (remaining > 0) {
      var keys = Object.keys(groups).filter(function (k) { return groups[k].length; });
      keys.sort(function (a, b) { return groups[b].length - groups[a].length || (a < b ? -1 : 1); });
      var pick = keys.find(function (k) { return k !== prev; });
      if (!pick) pick = keys[0]; // only the previous topic remains — unavoidable
      out.push(groups[pick].shift());
      prev = pick; remaining--;
    }
    return out;
  }
  function formItems(form) {
    return interleave(form.questions.map(function (q, i) { return { fid: form.id, qi: i, topic: q.topic }; }));
  }

  /* ---------------- unlock / paywall state ---------------- */
  function isUnlocked() { var u = getJSON(KEY.unlock, null); return !!(u && u.unlocked); }
  function setUnlocked(info) { setJSON(KEY.unlock, Object.assign({ unlocked: true, at: Date.now() }, info)); }
  function isLocked(form) { return !!form.locked && !isUnlocked(); }

  /* ---------------- performance tracking (for weak areas) ---------------- */
  function getPerf() { return getJSON(KEY.perf, { topics: {}, cats: {} }); }
  function recordPerf(items, answers) {
    var p = getPerf();
    items.forEach(function (ref, pos) {
      var q = qOf(ref); if (!q) return;
      var ok = answers[pos] === q.answer;
      ["topics:" + q.topic, "cats:" + q.cat].forEach(function (k) {
        var parts = k.split(":"), bucket = p[parts[0]], key = parts[1];
        bucket[key] = bucket[key] || { c: 0, t: 0 };
        bucket[key].t++; if (ok) bucket[key].c++;
      });
    });
    setJSON(KEY.perf, p);
  }
  function weakestTopics(minTotal) {
    var p = getPerf();
    return Object.keys(p.topics)
      .map(function (t) { var d = p.topics[t]; return { topic: t, acc: d.c / d.t, total: d.t }; })
      .filter(function (x) { return x.total >= (minTotal || 2); })
      .sort(function (a, b) { return a.acc - b.acc || b.total - a.total; });
  }

  /* ---------------- screens ---------------- */
  var SCREENS = ["home", "intro", "exam", "results", "paywall"];
  function show(name) {
    SCREENS.forEach(function (s) { $("screen-" + s).classList.toggle("active", s === name); });
    window.scrollTo(0, 0);
  }

  var session = null, timerId = null, announced = {};

  /* ============================================================
     HOME
     ============================================================ */
  function renderHome() {
    // free CTA
    var freeBtn = $("start-free");
    if (freeBtn && !freeBtn._wired) { freeBtn._wired = true; freeBtn.addEventListener("click", function () { startForm("free"); }); }

    renderDashboard($("dashboard"));

    var best = getJSON(KEY.best, {});
    var active = getJSON(KEY.session, null);
    var unlocked = isUnlocked();
    var grid = $("test-grid");
    grid.innerHTML = "";

    DATA.tests.forEach(function (t, i) {
      var b = best[t.id];
      var locked = isLocked(t);
      var resuming = active && active.testId === t.id && active.deadline > Date.now();
      var foot;
      if (locked) {
        foot = el("button", { class: "btn btn-sm", type: "button", text: "🔒 Unlock", onclick: function () { renderPaywall(t.id); } });
      } else {
        foot = el("button", { class: "btn btn-primary btn-sm", type: "button",
          text: resuming ? "Resume" : (b ? "Retake" : "Start"),
          onclick: function () { resuming ? enterExam(active) : renderIntro(t.id); } });
      }
      var card = el("div", { class: "test-card" + (locked ? " locked" : "") }, [
        el("span", { class: "num-chip", "aria-hidden": "true", text: String(i + 1) }),
        el("h3", { text: t.name }),
        el("div", { class: "tc-sub", text: t.blurb || "" }),
        el("div", { class: "tc-meta" }, [
          el("span", { html: "<b>" + t.questions.length + "</b> questions" }),
          el("span", { html: "<b>15</b> min" }),
        ]),
        el("div", { class: "tc-foot" }, [
          b ? el("span", { class: "tc-best", html: "Best: <b>" + b.pct + "%</b>" })
            : el("span", { class: "tc-best muted", text: locked ? "Locked" : "Not attempted" }),
          foot,
        ]),
      ]);
      grid.appendChild(card);
    });

    // unlock status line
    var us = $("unlock-status");
    if (us) {
      us.innerHTML = "";
      if (unlocked) us.appendChild(el("p", { class: "muted", html: "✅ Full access unlocked on this device. <button class='linkbtn' id='relock'>Remove</button>" }));
      else us.appendChild(el("p", { class: "muted", html: "Tests 1–10 are part of <b>Full Access</b> (" + CFG.price + "). The 5-minute taster above is free. <button class='linkbtn' id='have-code'>I have an access code</button>" }));
      var rl = $("relock"); if (rl) rl.addEventListener("click", function () { del(KEY.unlock); renderHome(); });
      var hc = $("have-code"); if (hc) hc.addEventListener("click", function () { renderPaywall(null); });
    }
    show("home");
  }

  function renderDashboard(host) {
    if (!host) return;
    host.innerHTML = "";
    var p = getPerf();
    var cats = Object.keys(p.cats);
    if (!cats.length) {
      host.appendChild(el("div", { class: "note", html: "Take the free taster to start building your <b>skills snapshot</b> — it tracks which question types you're strong and weak on, then builds a custom practice round." }));
      return;
    }
    var totalC = 0, totalT = 0;
    cats.forEach(function (c) { totalC += p.cats[c].c; totalT += p.cats[c].t; });
    var overall = Math.round((totalC / totalT) * 100);

    var bars = el("div", { class: "cat-rows" });
    Object.keys(DATA.categories).forEach(function (c) {
      var d = p.cats[c]; if (!d) return;
      var pct = Math.round((d.c / d.t) * 100);
      bars.appendChild(el("div", { class: "cat-row" }, [
        el("div", { class: "cat-name", text: catInfo(c).label }),
        el("div", { class: "cat-bar" }, el("span", { style: "width:" + pct + "%;background:" + catInfo(c).color })),
        el("div", { class: "cat-val", text: pct + "%" }),
      ]));
    });

    var weak = weakestTopics(2).slice(0, 3);
    var weakRow = el("div", { class: "weak-chips" });
    weak.forEach(function (w) { weakRow.appendChild(el("span", { class: "badge", html: w.topic + " · " + Math.round(w.acc * 100) + "%" })); });

    var canWeak = weakRoundItems() !== null;
    host.appendChild(el("div", { class: "panel dash" }, [
      el("div", { class: "dash-head" }, [
        el("h2", { style: "margin:0", text: "Your skills snapshot" }),
        el("div", { class: "dash-overall" }, [el("b", { text: overall + "%" }), el("span", { class: "muted", text: " overall · " + totalT + " answered" })]),
      ]),
      bars,
      weak.length ? el("div", { class: "weak-wrap" }, [el("span", { class: "muted", text: "Weakest topics: " }), weakRow]) : null,
      el("div", { class: "cta-row", style: "margin-bottom:0" }, [
        canWeak
          ? el("button", { class: "btn btn-primary", type: "button", text: "🎯 Practice your weak areas", onclick: startWeakRound })
          : el("button", { class: "btn", type: "button", disabled: "disabled", text: "🎯 Practice weak areas (answer a few more first)" }),
      ]),
    ]));
  }

  /* ============================================================
     INTRO
     ============================================================ */
  function renderIntro(formId) {
    var t = formById(formId);
    if (!t) return renderHome();
    var counts = {};
    t.questions.forEach(function (q) { counts[q.cat] = (counts[q.cat] || 0) + 1; });
    var mins = Math.round((t.durationSec || FULL_SECS) / 60);
    var body = $("intro-body");
    body.innerHTML = "";
    body.appendChild(el("div", {}, [
      el("p", { class: "muted", text: t.free ? "Free taster" : "Full Access" }),
      el("h1", { text: t.name }),
      el("p", { class: "lede", text: t.blurb || "" }),
      el("div", { class: "panel" }, [
        el("h2", { style: "margin-top:0", text: "Before you start" }),
        el("ul", { class: "tight dim" }, [
          el("li", { html: "<b>" + t.questions.length + " questions</b> in <b>" + mins + " minutes</b>. The clock can't be paused." }),
          el("li", { html: "Questions are <b>interleaved</b> — types are mixed so you switch gears, just like the real test." }),
          el("li", { html: "Answer with a click or keys <span class='mono'>1–5</span>; move with <span class='mono'>←/→</span>; flag with <span class='mono'>F</span>." }),
          el("li", { text: "Unanswered questions count as wrong, so always make your best guess." }),
        ]),
        el("div", { class: "cta-row", style: "margin-bottom:0" }, Object.keys(counts).map(function (c) {
          return el("span", { class: "badge", html: catInfo(c).label + " · " + counts[c] });
        })),
      ]),
      el("div", { class: "cta-row" }, [
        el("button", { class: "btn btn-primary btn-lg", type: "button", text: "▶ Start — " + fmtTime(t.durationSec || FULL_SECS) + " clock", onclick: function () { startForm(formId); } }),
        el("button", { class: "btn btn-ghost", type: "button", text: "Back", onclick: renderHome }),
      ]),
    ]));
    show("intro");
  }

  /* ============================================================
     SESSION lifecycle
     ============================================================ */
  function startForm(formId) {
    var t = formById(formId);
    if (!t) return renderHome();
    if (isLocked(t)) return renderPaywall(formId);
    beginSession({ kind: t.free ? "free" : "form", testId: t.id, title: t.name, items: formItems(t), durationSec: t.durationSec || FULL_SECS });
  }

  function startWeakRound() {
    var items = weakRoundItems();
    if (!items) return renderHome();
    beginSession({ kind: "custom", testId: null, title: "Custom round — your weak areas", items: interleave(items), durationSec: Math.max(300, items.length * 40) });
  }

  /* Build the adaptive round: a spread of questions from your weakest topics.
     Cap per topic so the round stays varied (and interleaves cleanly), and
     only draw from content you can access (free taster, or everything once
     unlocked). */
  function weakRoundItems() {
    var weak = weakestTopics(2);
    if (weak.length < 2) return null;
    var byTopic = {};
    allForms().filter(function (f) { return f && (f.free || isUnlocked()); })
      .forEach(function (f) { f.questions.forEach(function (q, i) { (byTopic[q.topic] = byTopic[q.topic] || []).push({ fid: f.id, qi: i, topic: q.topic, diff: q.diff }); }); });
    var picked = [], CAP = 3, TARGET = 15, topicsUsed = 0;
    for (var w = 0; w < weak.length && picked.length < TARGET; w++) {
      var pool = (byTopic[weak[w].topic] || []).slice().sort(function (a, b) { return b.diff - a.diff; });
      if (!pool.length) continue;
      var take = Math.min(CAP, pool.length, TARGET - picked.length);
      for (var j = 0; j < take; j++) picked.push(pool[j]);
      topicsUsed++;
    }
    return (picked.length >= 8 && topicsUsed >= 2) ? picked : null;
  }

  function beginSession(s) {
    var now = Date.now();
    session = { kind: s.kind, testId: s.testId, title: s.title, items: s.items, durationSec: s.durationSec,
      startedAt: now, deadline: now + s.durationSec * 1000, answers: {}, flags: [], index: 0 };
    setJSON(KEY.session, session);
    announced = {};
    enterExam(session);
  }

  function enterExam(s) {
    session = s; announced = {};
    if (!s.items || !s.items.length) { del(KEY.session); return renderHome(); }
    if (s.deadline <= Date.now()) return finish(true);
    $("exam-title").textContent = s.title;
    $("exam-subtitle").textContent = (s.kind === "custom" ? "Adaptive practice" : "Mental Agility") + " · " + s.items.length + " questions";
    buildPalette(s.items.length);
    renderQuestion(clamp(s.index || 0, 0, s.items.length - 1));
    updateAnswered();
    show("exam");
    startTimer();
  }

  /* ---------------- timer ---------------- */
  function startTimer() { stopTimer(); tick(); timerId = setInterval(tick, 250); }
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function tick() {
    if (!session) return;
    var remain = (session.deadline - Date.now()) / 1000;
    var t = $("exam-timer");
    t.textContent = fmtTime(remain);
    t.classList.toggle("warn", remain <= 120 && remain > 60);
    t.classList.toggle("danger", remain <= 60);
    if (remain <= 120 && !announced[120]) { announced[120] = 1; $("exam-timer-sr").textContent = "Two minutes remaining."; }
    if (remain <= 60 && !announced[60]) { announced[60] = 1; $("exam-timer-sr").textContent = "One minute remaining."; }
    if (remain <= 0) finish(true);
  }

  /* ---------------- question render ---------------- */
  function renderQuestion(pos) {
    session.index = pos;
    setJSON(KEY.session, session);
    var q = qOf(session.items[pos]);
    var chosen = session.answers[pos];

    var opts = el("div", { class: "options", role: "radiogroup", "aria-label": "Answer options" });
    q.options.forEach(function (opt, oi) {
      opts.appendChild(el("button", {
        class: "option", type: "button", role: "radio",
        "aria-checked": chosen === oi ? "true" : "false", "aria-pressed": chosen === oi ? "true" : "false",
        onclick: function () { selectOption(oi); },
      }, [el("span", { class: "key", "aria-hidden": "true", text: String(oi + 1) }), el("span", { text: opt })]));
    });

    var flagged = session.flags.indexOf(pos) >= 0;
    var last = pos === session.items.length - 1;
    var wrap = el("div", {}, [
      el("span", { class: "q-topic", "data-cat": q.cat, text: catInfo(q.cat).label + " · " + (q.topic || "") }),
      el("div", { class: "q-count", text: "Question " + (pos + 1) + " of " + session.items.length }),
      el("div", { class: "q-prompt", html: q.prompt }),
      opts,
      el("div", { class: "q-nav" }, [
        el("button", { class: "btn btn-sm", type: "button", text: "← Previous", disabled: pos === 0 ? "disabled" : null, onclick: function () { gotoQuestion(pos - 1); } }),
        el("button", { class: "btn btn-sm " + (flagged ? "btn-primary" : "btn-ghost"), type: "button", text: flagged ? "⚑ Flagged" : "⚑ Flag", onclick: toggleFlag }),
        el("span", { class: "spacer" }),
        last ? el("button", { class: "btn btn-primary btn-sm", type: "button", text: "Review & submit", onclick: confirmSubmit })
             : el("button", { class: "btn btn-sm", type: "button", text: "Next →", onclick: function () { gotoQuestion(pos + 1); } }),
      ]),
    ]);
    var host = $("exam-question");
    host.innerHTML = "";
    host.appendChild(wrap);
    updatePalette();
  }

  function selectOption(oi) {
    if (!session) return;
    session.answers[session.index] = oi;
    setJSON(KEY.session, session);
    $("exam-question").querySelectorAll(".option").forEach(function (b, idx) {
      var on = idx === oi;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.setAttribute("aria-checked", on ? "true" : "false");
    });
    updatePalette(); updateAnswered();
  }
  function gotoQuestion(pos) { renderQuestion(clamp(pos, 0, session.items.length - 1)); }
  function toggleFlag() {
    var i = session.index, k = session.flags.indexOf(i);
    if (k >= 0) session.flags.splice(k, 1); else session.flags.push(i);
    setJSON(KEY.session, session);
    renderQuestion(i);
  }

  /* ---------------- palette ---------------- */
  function buildPalette(n) {
    var p = $("exam-palette"); p.innerHTML = "";
    for (var i = 0; i < n; i++) (function (i) {
      p.appendChild(el("button", { class: "pal", type: "button", text: String(i + 1), "aria-label": "Question " + (i + 1), onclick: function () { gotoQuestion(i); } }));
    })(i);
  }
  function updatePalette() {
    var btns = $("exam-palette").children;
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle("answered", session.answers[i] != null);
      btns[i].classList.toggle("flagged", session.flags.indexOf(i) >= 0);
      btns[i].classList.toggle("current", i === session.index);
    }
  }
  function updateAnswered() { $("exam-answered").textContent = Object.keys(session.answers).length + " / " + session.items.length; }

  /* ---------------- finish & grade ---------------- */
  function confirmSubmit() {
    var un = session.items.length - Object.keys(session.answers).length;
    var msg = un > 0 ? "You have " + un + " unanswered question" + (un === 1 ? "" : "s") + " (marked wrong). Submit now?"
                     : "Submit your answers and see your score?";
    if (window.confirm(msg)) finish(false);
  }
  function grade(s) {
    var byCat = {}, byTopic = {}, items = [], correct = 0;
    s.items.forEach(function (ref, pos) {
      var q = qOf(ref), your = s.answers[pos], ok = your === q.answer, skipped = your == null;
      if (ok) correct++;
      [["byCat", q.cat, byCat], ["byTopic", q.topic, byTopic]].forEach(function (x) {
        var bucket = x[2], key = x[1];
        bucket[key] = bucket[key] || { correct: 0, total: 0 };
        bucket[key].total++; if (ok) bucket[key].correct++;
      });
      items.push({ q: q, your: your, correct: ok, skipped: skipped });
    });
    var total = s.items.length;
    return { correct: correct, total: total, pct: Math.round((correct / total) * 100), byCat: byCat, byTopic: byTopic, items: items };
  }
  function finish(expired) {
    if (!session) return;
    stopTimer();
    var s = session;
    var elapsed = expired ? s.durationSec : Math.min(s.durationSec, Math.round((Date.now() - s.startedAt) / 1000));
    var res = grade(s);
    res.testId = s.testId; res.kind = s.kind; res.title = s.title; res.expired = !!expired; res.elapsed = elapsed;

    recordPerf(s.items, s.answers);
    if (s.testId) {
      var best = getJSON(KEY.best, {});
      if (!best[s.testId] || res.pct > best[s.testId].pct) {
        best[s.testId] = { pct: res.pct, correct: res.correct, total: res.total, date: Date.now() };
        setJSON(KEY.best, best);
      }
    }
    del(KEY.session); session = null;
    renderResults(res);
  }
  function abandon() {
    if (!session) return renderHome();
    if (window.confirm("Quit this test without scoring? Your progress will be discarded.")) { stopTimer(); del(KEY.session); session = null; renderHome(); }
  }

  /* ============================================================
     RESULTS
     ============================================================ */
  var BANDS = [
    { min: 90, label: "Exceptional agility", color: "var(--good)" },
    { min: 75, label: "Strong", color: "var(--good)" },
    { min: 60, label: "Above average", color: "var(--accent)" },
    { min: 45, label: "Average", color: "var(--accent)" },
    { min: 30, label: "Below average", color: "var(--warn)" },
    { min: 0,  label: "Needs practice", color: "var(--bad)" },
  ];
  function band(pct) { for (var i = 0; i < BANDS.length; i++) if (pct >= BANDS[i].min) return BANDS[i]; return BANDS[BANDS.length - 1]; }

  /* ---- estimated percentile vs. the "average" test-taker ----
     We have no proprietary norm table (McQuaig's are copyrighted and B2B-only),
     so we MODEL the distribution from public facts: cognitive-test scores are
     approximately normal, and a harder test has a lower expected average. The
     mean is derived from this form's own difficulty tags; sigma is a moderate
     spread. This is a transparent estimate, clearly labelled as such — not an
     official norm. Tune the two constants below to taste. */
  function erf(x) {
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    var a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    var t = 1 / (1 + p * x);
    var y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return s * y;
  }
  function normCdf(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
  function ordinal(n) { var s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  function scoreStats(res) {
    var ds = res.items.map(function (it) { return it.q.diff || 2; });
    var avgDiff = ds.reduce(function (a, b) { return a + b; }, 0) / ds.length;   // 1..3
    var mu = Math.round(clamp(62 - 9 * (avgDiff - 1), 40, 66));  // easier form → higher average
    var sigma = 17;
    var pctile = clamp(Math.round(normCdf((res.pct - mu) / sigma) * 100), 1, 99);
    return { mu: mu, sigma: sigma, pctile: pctile, above: Math.round(res.pct - mu) };
  }
  function celebrateCopy(pctile, expired) {
    if (expired && pctile < 40) return { emoji: "⏱️", head: "Time's up — nice try!" };
    if (pctile >= 95) return { emoji: "🏆", head: "Exceptional!" };
    if (pctile >= 80) return { emoji: "🎉", head: "Impressive!" };
    if (pctile >= 60) return { emoji: "✨", head: "Above average!" };
    if (pctile >= 40) return { emoji: "👍", head: "Solid effort!" };
    return { emoji: "✅", head: "Test complete!" };
  }

  function launchConfetti() {
    if (!window.requestAnimationFrame) return;                                   // non-browser (tests)
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var host = $("screen-results"); if (!host) return;
    var cv = document.createElement("canvas"); cv.className = "confetti-overlay"; cv.setAttribute("aria-hidden", "true");
    host.appendChild(cv);
    var ctx = cv.getContext && cv.getContext("2d"); if (!ctx) { if (cv.parentNode) cv.parentNode.removeChild(cv); return; }
    var dpr = window.devicePixelRatio || 1, W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
    var colors = ["#d9b25a", "#46c98b", "#5aa9e6", "#ef6f6f", "#e2b04a", "#e7edf5"];
    var P = [];
    for (var i = 0; i < 150; i++) P.push({ x: W * (0.15 + 0.7 * Math.random()), y: -20 - Math.random() * H * 0.3,
      r: 4 + Math.random() * 5, c: colors[i % colors.length], vx: -2 + Math.random() * 4, vy: 2 + Math.random() * 3.5,
      rot: Math.random() * 6.28, vr: -0.2 + Math.random() * 0.4 });
    var start = null;
    function frame(ts) {
      if (start == null) start = ts; var t = ts - start;
      ctx.clearRect(0, 0, W, H);
      P.forEach(function (p) {
        p.vy += 0.06; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = Math.max(0, 1 - t / 2600);
        ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6); ctx.restore();
      });
      if (t < 2600) window.requestAnimationFrame(frame); else if (cv.parentNode) cv.parentNode.removeChild(cv);
    }
    window.requestAnimationFrame(frame);
  }

  function drawBellCurve(cv, mu, sigma, score) {
    var ctx = cv && cv.getContext && cv.getContext("2d"); if (!ctx) return;      // non-browser (tests)
    var dpr = window.devicePixelRatio || 1, W = cv.clientWidth || 500, H = cv.clientHeight || 120;
    cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
    var padX = 10, padT = 8, padB = 20, plotH = H - padT - padB;
    var css = getComputedStyle(document.documentElement);
    var tok = function (n, f) { return (css.getPropertyValue(n) || "").trim() || f; };
    var accent = tok("--accent", "#d9b25a"), lineC = tok("--text-dim", "#9fb0c3"), muted = tok("--muted", "#6b7c91"), grid = tok("--border", "#273140");
    var X = function (v) { return padX + (v / 100) * (W - 2 * padX); };
    var peak = 1, pdf = function (v) { var z = (v - mu) / sigma; return Math.exp(-0.5 * z * z); };
    var Y = function (v) { return padT + plotH * (1 - pdf(v) / peak); };
    var base = padT + plotH;
    // area you beat (0..score)
    ctx.beginPath(); ctx.moveTo(X(0), base);
    for (var v = 0; v <= score; v++) ctx.lineTo(X(v), Y(v));
    ctx.lineTo(X(score), base); ctx.closePath();
    ctx.fillStyle = accent; ctx.globalAlpha = 0.22; ctx.fill(); ctx.globalAlpha = 1;
    // curve
    ctx.beginPath(); for (var v2 = 0; v2 <= 100; v2++) { var x = X(v2), y = Y(v2); v2 === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.strokeStyle = lineC; ctx.lineWidth = 2; ctx.stroke();
    // baseline
    ctx.strokeStyle = grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(0), base); ctx.lineTo(X(100), base); ctx.stroke();
    // average marker (dashed)
    ctx.setLineDash([4, 4]); ctx.strokeStyle = muted; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(mu), Y(mu)); ctx.lineTo(X(mu), base); ctx.stroke(); ctx.setLineDash([]);
    // you marker
    ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(score), Y(score)); ctx.lineTo(X(score), base); ctx.stroke();
    ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(X(score), Y(score), 4, 0, 6.29); ctx.fill();
    // labels
    var lx = function (x) { return Math.max(30, Math.min(W - 30, x)); };
    ctx.font = "600 11px -apple-system, BlinkMacSystemFont, sans-serif"; ctx.textAlign = "center";
    ctx.fillStyle = muted; ctx.fillText("Avg ~" + mu + "%", lx(X(mu)), base + 14);
    ctx.fillStyle = accent; ctx.fillText("You " + score + "%", lx(X(score)), base + 14);
  }

  function renderResults(res) {
    var b = band(res.pct);
    var body = $("results-body"); body.innerHTML = "";

    // ---- celebration + "better than average" estimate ----
    var st = scoreStats(res);
    var cc = celebrateCopy(st.pctile, res.expired);
    var bell = el("canvas", { class: "bell", role: "img",
      "aria-label": "Distribution curve: your score of " + res.pct + "% sits near the " + ordinal(st.pctile) + " percentile, above the estimated average of about " + st.mu + "%." });
    body.appendChild(el("div", { class: "panel celebrate" }, [
      el("div", { class: "celebrate-emoji", "aria-hidden": "true", text: cc.emoji }),
      el("h1", { class: "celebrate-title", text: cc.head }),
      el("p", { class: "celebrate-sub", html: "You scored <b>" + res.pct + "%</b> — better than an estimated <b>" + st.pctile + "%</b> of people who take a test like this." }),
      el("div", { class: "beat-row" }, [
        el("div", { class: "beat-stat" }, [el("b", { text: ordinal(st.pctile) }), el("span", { text: "percentile (est.)" })]),
        el("div", { class: "beat-stat" }, [el("b", { text: (st.above >= 0 ? "+" : "") + st.above + " pts" }), el("span", { text: "vs the ~" + st.mu + "% average" })]),
      ]),
      bell,
      el("p", { class: "disclaimer", text: "Estimated from a normal model calibrated to this form's difficulty, using public information about how timed cognitive tests score — a guide, not an official McQuaig norm." }),
    ]));

    body.appendChild(el("div", { class: "panel" }, [
      el("div", { class: "score-hero" }, [
        el("div", { class: "dial", style: "--pct:" + res.pct }, el("div", { class: "dial-inner" }, [
          el("div", { class: "dial-pct", text: res.pct + "%" }),
          el("div", { class: "dial-sub", text: res.correct + " / " + res.total + " correct" }),
        ])),
        el("div", { class: "score-meta" }, [
          el("p", { class: "muted", style: "margin:0", text: res.title + (res.expired ? " · time expired" : "") }),
          el("h1", { style: "margin:.1em 0", text: "Your result" }),
          el("span", { class: "band", style: "color:" + b.color + ";background:color-mix(in oklab," + b.color + " 16%, transparent)", text: b.label }),
          el("div", { class: "score-stats" }, [
            el("div", { class: "s", html: "<b>" + res.correct + "/" + res.total + "</b><span>Correct</span>" }),
            el("div", { class: "s", html: "<b>" + fmtTime(res.elapsed) + "</b><span>Time used</span>" }),
            el("div", { class: "s", html: "<b>" + (res.total - res.correct) + "</b><span>Missed</span>" }),
          ]),
        ]),
      ]),
    ]));

    // by-category
    var rows = el("div", { class: "cat-rows" });
    Object.keys(res.byCat).forEach(function (c) {
      var d = res.byCat[c], pct = Math.round((d.correct / d.total) * 100);
      rows.appendChild(el("div", { class: "cat-row" }, [
        el("div", { class: "cat-name", text: catInfo(c).label }),
        el("div", { class: "cat-bar" }, el("span", { style: "width:" + pct + "%;background:" + catInfo(c).color })),
        el("div", { class: "cat-val", text: d.correct + "/" + d.total }),
      ]));
    });
    body.appendChild(el("div", { class: "panel" }, [el("h2", { style: "margin-top:0", text: "By category" }), rows]));

    // weakest topics from cumulative history + adaptive CTA
    var weak = weakestTopics(2).slice(0, 4);
    var canWeak = weakRoundItems() !== null;
    body.appendChild(el("div", { class: "panel" }, [
      el("h2", { style: "margin-top:0", text: "Where to focus next" }),
      weak.length
        ? el("p", { class: "dim", html: "Across everything you've done, your weakest topics are " +
            weak.map(function (w) { return "<b>" + w.topic + "</b> (" + Math.round(w.acc * 100) + "%)"; }).join(", ") + "." })
        : el("p", { class: "dim", text: "Do a couple more tests and we'll pinpoint your weak topics." }),
      el("div", { class: "cta-row", style: "margin-bottom:0" }, [
        canWeak ? el("button", { class: "btn btn-primary", type: "button", text: "🎯 Practice these weak areas", onclick: startWeakRound }) : null,
        res.testId && res.kind === "form" ? el("button", { class: "btn", type: "button", text: "↻ Retake this form", onclick: function () { renderIntro(res.testId); } }) : null,
        el("button", { class: "btn", type: "button", text: "All tests", onclick: renderHome }),
      ]),
    ]));

    // review
    var listHost = el("div", { id: "review-list" });
    var filters = el("div", { class: "review-filter" });
    [["all", "All"], ["wrong", "Incorrect"], ["skipped", "Skipped"], ["correct", "Correct"]].forEach(function (f, idx) {
      filters.appendChild(el("button", { class: "btn btn-sm " + (idx === 0 ? "btn-primary" : "btn-ghost"), type: "button", text: f[1],
        onclick: function () { filters.querySelectorAll("button").forEach(function (x) { x.className = "btn btn-sm btn-ghost"; }); this.className = "btn btn-sm btn-primary"; drawReview(listHost, res, f[0]); } }));
    });
    body.appendChild(el("div", { class: "panel" }, [
      el("h2", { style: "margin-top:0", text: "Review answers" }),
      el("p", { class: "muted", style: "margin-top:-.5em", text: "Worked answer for every question." }),
      filters, listHost,
    ]));
    drawReview(listHost, res, "all");
    show("results");
    if (window.requestAnimationFrame) window.requestAnimationFrame(function () { drawBellCurve(bell, st.mu, st.sigma, res.pct); launchConfetti(); });
  }

  function drawReview(host, res, filter) {
    host.innerHTML = "";
    res.items.forEach(function (it, i) {
      var state = it.skipped ? "skipped" : (it.correct ? "correct" : "wrong");
      if (filter !== "all" && filter !== state) return;
      var q = it.q;
      var optEls = q.options.map(function (opt, oi) {
        var cls = "rv-opt" + (oi === q.answer ? " is-correct" : "") + (oi === it.your && !it.correct ? " is-yours-wrong" : "");
        var tag = oi === q.answer ? "  ✓ correct" : (oi === it.your && !it.correct ? "  ✗ your answer" : "");
        return el("div", { class: cls, text: opt + tag });
      });
      host.appendChild(el("div", { class: "review-item " + state }, [
        el("div", { class: "review-head" }, [
          el("span", { class: "rh-num", text: "Q" + (i + 1) }),
          el("span", { class: "rh-tag " + state, text: state }),
          el("span", { class: "q-topic", "data-cat": q.cat, text: catInfo(q.cat).label + " · " + (q.topic || "") }),
        ]),
        el("div", { class: "rv-prompt", html: q.prompt }),
        el("div", {}, optEls),
        q.explain ? el("div", { class: "rv-explain", html: "<b>Why:</b> " + q.explain }) : null,
      ]));
    });
    if (!host.children.length) host.appendChild(el("p", { class: "muted", text: "Nothing in this category." }));
  }

  /* ============================================================
     PAYWALL / unlock
     ============================================================ */
  function renderPaywall(returnFormId) {
    var body = $("paywall-body"); body.innerHTML = "";
    var status = el("div", { class: "unlock-msg", id: "unlock-msg" });
    var codeInput = el("input", { class: "code-input", id: "code-input", type: "text", placeholder: "Enter your access code", autocomplete: "off", spellcheck: "false" });
    var buyUrl = CFG.buyUrl || "";
    var buyReady = buyUrl && !/REPLACE-ME|example\.lemonsqueezy|YOURSTORE|^#$/.test(buyUrl);
    function buyBtn(cls, label) {
      return buyReady
        ? el("a", { class: cls, href: buyUrl, target: "_blank", rel: "noopener", text: label })
        : el("button", { class: cls, type: "button", disabled: "disabled", text: "Checkout coming soon" });
    }

    body.appendChild(el("div", {}, [
      el("p", { class: "muted", text: "Full Access" }),
      el("h1", { text: "Unlock all 10 tests + guides" }),
      el("p", { class: "lede", text: "One-time payment, lifetime access — about five times cheaper than the big aptitude-prep sites. The 5-minute taster stays free." }),
      el("div", { class: "price-cards" }, [
        el("div", { class: "price-card featured" }, [
          el("div", { class: "pc-tag", text: "Best value" }),
          el("div", { class: "pc-price", text: CFG.price }),
          el("div", { class: "pc-note", text: CFG.priceNote || "" }),
          buyBtn("btn btn-primary btn-lg", "Get Full Access"),
        ]),
        CFG.subPrice ? el("div", { class: "price-card" }, [
          el("div", { class: "pc-price", text: CFG.subPrice }),
          el("div", { class: "pc-note", text: CFG.subNote || "" }),
          buyBtn("btn", "Choose monthly"),
        ]) : null,
      ]),
      el("div", { class: "panel", style: "margin-top:8px" }, [
        el("h2", { style: "margin-top:0", text: buyReady ? "Already bought? Enter your code" : "Enter your access code" }),
        el("p", { class: "muted", style: "margin-top:-.4em", text: buyReady ? "You'll get an access code by email after purchase. Enter it here to unlock on this device." : "Payments aren't live yet — enter an access or promo code to unlock all tests on this device." }),
        el("div", { class: "code-row" }, [
          codeInput,
          el("button", { class: "btn btn-primary", type: "button", text: "Unlock", onclick: function () { validateCode(codeInput.value, returnFormId); } }),
        ]),
        status,
      ]),
      el("div", { class: "cta-row" }, [el("button", { class: "btn btn-ghost", type: "button", text: "← Back", onclick: renderHome })]),
    ]));
    show("paywall");
  }

  function unlockMsg(text, kind) {
    var m = $("unlock-msg"); if (!m) return;
    m.textContent = text;
    m.className = "unlock-msg " + (kind || "");
  }

  function validateCode(code, returnFormId) {
    code = (code || "").trim();
    if (!code) return unlockMsg("Please enter your access code.", "bad");
    var pay = CFG.paywall || { provider: "demo" };
    unlockMsg("Checking…", "");

    function ok(info) { setUnlocked(info); unlockMsg("Unlocked! Loading…", "good"); setTimeout(function () { returnFormId ? startForm(returnFormId) : renderHome(); }, 500); }

    // Promo / comp codes always work, in every provider mode.
    var codes = pay.accessCodes || CFG.accessCodes || [];
    var norm = code.toLowerCase();
    if (codes.some(function (c) { return String(c).trim().toLowerCase() === norm; })) return ok({ key: code, via: "code" });

    if (pay.provider === "lemonsqueezy") {
      fetch("https://api.lemonsqueezy.com/v1/licenses/validate", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ license_key: code }),
      }).then(function (r) { return r.json(); }).then(function (d) {
        var good = d && d.valid && d.license_key && d.license_key.status === "active" &&
          (!pay.storeId || (d.meta && d.meta.store_id === pay.storeId)) &&
          (!pay.productId || (d.meta && d.meta.product_id === pay.productId));
        good ? ok({ key: code, via: "lemonsqueezy" }) : unlockMsg("That code wasn't valid for this product.", "bad");
      }).catch(function () { unlockMsg("Couldn't reach the licence server. Check your connection and try again.", "bad"); });
    } else if (pay.provider === "gumroad") {
      fetch("https://api.gumroad.com/v2/licenses/verify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ product_id: pay.productId || "", license_key: code, increment_uses_count: "false" }),
      }).then(function (r) { return r.json(); }).then(function (d) {
        var p = d && d.purchase;
        (d && d.success && p && !p.refunded && !p.chargebacked) ? ok({ key: code, via: "gumroad" })
          : unlockMsg("That code wasn't valid for this product.", "bad");
      }).catch(function () { unlockMsg("Couldn't reach the licence server (a CORS proxy may be needed — see STRATEGY.md).", "bad"); });
    } else if (pay.provider === "code") {
      unlockMsg("That code wasn't recognised. Check for typos, or use the code from your purchase email.", "bad");
    } else {
      // demo: any non-empty code unlocks, so you can try the flow before wiring payments
      ok({ key: code, via: "demo" });
    }
  }

  /* ============================================================
     keyboard + wiring + boot
     ============================================================ */
  document.addEventListener("keydown", function (e) {
    if (!$("screen-exam").classList.contains("active") || !session) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    var q = qOf(session.items[session.index]);
    if (e.key >= "1" && e.key <= "9") { var idx = parseInt(e.key, 10) - 1; if (idx < q.options.length) { e.preventDefault(); selectOption(idx); } }
    else if (e.key === "ArrowRight") { e.preventDefault(); gotoQuestion(session.index + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); gotoQuestion(session.index - 1); }
    else if (e.key === "f" || e.key === "F") { e.preventDefault(); toggleFlag(); }
  });
  window.addEventListener("beforeunload", function (e) {
    if (session && $("screen-exam").classList.contains("active")) { e.preventDefault(); e.returnValue = ""; }
  });
  $("brand").addEventListener("click", function () {
    if (session && $("screen-exam").classList.contains("active")) { if (!window.confirm("Leave this test? You can resume it later from the list.")) return; }
    stopTimer(); renderHome();
  });
  $("exam-submit").addEventListener("click", confirmSubmit);
  $("exam-quit").addEventListener("click", abandon);

  (function boot() {
    var saved = getJSON(KEY.session, null);
    if (saved && saved.items && saved.items.length) {
      if (saved.deadline > Date.now()) { enterExam(saved); return; }
      session = saved; finish(true); return;
    }
    renderHome();
  })();
})();
