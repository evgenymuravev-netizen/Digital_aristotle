/* ============================================================
   SAA — System Analyst Assessment · engine
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
  var CFG = window.MMAT_CONFIG || { paywall: { provider: "demo" }, price: "$17.99", buyUrl: "#" };
  if (!DATA || !Array.isArray(DATA.tests)) {
    document.getElementById("test-grid").innerHTML =
      '<p class="note">Could not load the question bank (questions.js).</p>';
    return;
  }

  var FULL_SECS = (DATA.config && DATA.config.durationSec) || 900;
  var KEY = { session: "saa:v1:session", best: "saa:v1:best", perf: "saa:v1:perf", unlock: "saa:v1:unlock" };

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
  function recordPerf(s) {
    var p = getPerf(); p.topics = p.topics || {}; p.cats = p.cats || {};
    s.items.forEach(function (ref, pos) {
      var q = qOf(ref); if (!q) return;
      var ok = s.answers[pos] === q.answer;
      var ms = (s.timeSpent && s.timeSpent[pos]) || 0;
      [["topics", q.topic], ["cats", q.cat]].forEach(function (x) {
        var bucket = p[x[0]], key = x[1];
        bucket[key] = bucket[key] || { c: 0, t: 0, ms: 0 };
        bucket[key].t++; bucket[key].ms += ms; if (ok) bucket[key].c++;
      });
    });
    if (s.kind === "form" || s.kind === "free") p.done = (p.done || 0) + 1;   // completed tests
    setJSON(KEY.perf, p);
  }
  function testsDone() { return getPerf().done || 0; }
  function weakestTopics(minTotal) {
    var p = getPerf();
    return Object.keys(p.topics)
      .map(function (t) { var d = p.topics[t]; return { topic: t, acc: d.c / d.t, total: d.t }; })
      .filter(function (x) { return x.total >= (minTotal || 2); })
      .sort(function (a, b) { return a.acc - b.acc || b.total - a.total; });
  }

  /* ---------------- screens ---------------- */
  var SCREENS = ["home", "intro", "exam", "results", "paywall", "support", "leaderboard"];
  function show(name) {
    SCREENS.forEach(function (s) { $("screen-" + s).classList.toggle("active", s === name); });
    window.scrollTo(0, 0);
  }

  /* on-brand confirm dialog (works in sandboxed previews, unlike native confirm) */
  function confirmDialog(opts) {
    var root = $("modal-root"); if (!root) { if (opts.onConfirm) opts.onConfirm(); return; }
    root.innerHTML = "";
    var close = function () { root.innerHTML = ""; document.removeEventListener("keydown", onKey); };
    var onKey = function (e) { if (e.key === "Escape") close(); };
    var confirmBtn = el("button", { class: "btn btn-primary", type: "button", text: opts.confirmText || "Confirm",
      onclick: function () { close(); if (opts.onConfirm) opts.onConfirm(); } });
    var overlay = el("div", { class: "modal-overlay", onclick: function (e) { if (e.target === overlay) close(); } }, [
      el("div", { class: "modal", role: "dialog", "aria-modal": "true" }, [
        opts.title ? el("h2", { style: "margin-top:0", text: opts.title }) : null,
        el("p", { class: "dim", style: "margin:0", html: opts.message || "" }),
        el("div", { class: "modal-actions" }, [
          el("button", { class: "btn btn-ghost", type: "button", text: opts.cancelText || "Cancel", onclick: close }),
          confirmBtn,
        ]),
      ]),
    ]);
    root.appendChild(overlay);
    document.addEventListener("keydown", onKey);
    try { confirmBtn.focus(); } catch (e) {}
  }

  /* transient pacing "sign" toast near the top of the screen */
  function showSign(text, kind) {
    var host = $("sign-host"); if (!host) return;
    var s = el("div", { class: "sign " + (kind || ""), role: "status" }, text);
    host.appendChild(s);
    setTimeout(function () { s.classList.add("out"); setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 400); }, 3500);
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
    var _tc = tailoredCard(); if (_tc) host.appendChild(_tc);
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

    var done = testsDone();
    host.appendChild(el("div", { class: "panel dash" }, [
      el("div", { class: "dash-head" }, [
        el("h2", { style: "margin:0", text: "Your skills snapshot" }),
        el("div", { class: "dash-overall" }, [el("b", { text: overall + "%" }), el("span", { class: "muted", text: " overall · " + totalT + " answered" })]),
      ]),
      bars,
      weak.length ? el("div", { class: "weak-wrap" }, [el("span", { class: "muted", text: "Weakest topics: " }), weakRow]) : null,
      personalizedProgress(true),
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
    beginSession({ kind: "custom", testId: null, title: "Your personalized test — weakest topics", items: interleave(items), durationSec: Math.max(300, items.length * 40) });
  }

  /* ---- "tailored to a job" round ----
     A spec is written by tailor.html into localStorage (which domains the job
     needs). We draw a proportional, interleaved round from just those domains,
     using whatever content is accessible (free taster, or everything once
     unlocked). Safe no-op when no spec exists. */
  function getTailor() { return getJSON("saa:v1:tailor", null); }
  function tailoredItems(spec) {
    var all = Object.keys(DATA.categories);
    var cats = (spec && spec.cats && spec.cats.length) ? spec.cats.filter(function (c) { return all.indexOf(c) >= 0; }) : all;
    if (!cats.length) cats = all;
    var wts = (spec && spec.weights) || {};
    var byCat = {};
    allForms().filter(function (f) { return f && (f.free || isUnlocked()); })
      .forEach(function (f) { f.questions.forEach(function (q, i) { if (cats.indexOf(q.cat) < 0) return; (byCat[q.cat] = byCat[q.cat] || []).push({ fid: f.id, qi: i, topic: q.topic, diff: q.diff }); }); });
    var avail = cats.filter(function (c) { return (byCat[c] || []).length; });
    if (!avail.length) return null;
    var shuffle = function (a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), tmp = a[i]; a[i] = a[j]; a[j] = tmp; } return a; };
    var TARGET = 20, totalW = 0;
    avail.forEach(function (c) { totalW += Math.max(1, wts[c] || 1); });
    var picked = [];
    avail.forEach(function (c) {
      var share = Math.max(1, Math.round(TARGET * (Math.max(1, wts[c] || 1) / totalW)));
      var pool = shuffle((byCat[c] || []).slice());
      for (var j = 0; j < share && j < pool.length; j++) picked.push(pool[j]);
    });
    return picked.length >= 6 ? shuffle(picked).slice(0, 25) : null;
  }
  function startTailored() {
    var spec = getTailor(), items = tailoredItems(spec || {});
    if (!items) return renderHome();
    beginSession({ kind: "custom", testId: null, title: (spec && spec.title) || "Tailored test — matched to the job", items: interleave(items), durationSec: Math.max(300, items.length * 45) });
  }
  function tailoredCard() {
    var spec = getTailor(); if (!spec) return null;
    var names = (spec.cats || []).map(function (c) { return catInfo(c).label; }).join(" · ");
    return el("div", { class: "pt-card tailor-card" }, [
      el("div", { class: "pt-top" }, [
        el("b", { text: "🎯 Test tailored to the job" }),
        el("span", { class: "muted", text: names }),
      ]),
      el("div", { class: "cta-row", style: "margin:8px 0 0" }, [
        el("button", { class: "btn btn-primary btn-sm", type: "button", text: "🎯 Start the tailored test", onclick: startTailored }),
        el("a", { class: "btn btn-ghost btn-sm", href: "./tailor.html", text: "Edit" }),
      ]),
    ]);
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
    var picked = [], CAP = 4, TARGET = 20, topicsUsed = 0;
    for (var w = 0; w < weak.length && picked.length < TARGET; w++) {
      var pool = (byTopic[weak[w].topic] || []).slice().sort(function (a, b) { return b.diff - a.diff; });
      if (!pool.length) continue;
      var take = Math.min(CAP, pool.length, TARGET - picked.length);
      for (var j = 0; j < take; j++) picked.push(pool[j]);
      topicsUsed++;
    }
    return (picked.length >= 8 && topicsUsed >= 2) ? picked : null;
  }

  /* The "personalized test" unlocks after 3 completed tests, and only once we
     have enough of your weak-topic data to build a meaningful round. */
  function personalizedReady() { return testsDone() >= 3 && weakRoundItems() !== null; }
  function personalizedCTA() {
    var done = testsDone();
    if (personalizedReady())
      return el("button", { class: "btn btn-primary", type: "button", text: "🎯 Start your personalized test", onclick: startWeakRound });
    if (done < 3) {
      var left = 3 - done;
      return el("button", { class: "btn", type: "button", disabled: "disabled", text: "🎯 Personalized test unlocks after " + left + " more test" + (left === 1 ? "" : "s") });
    }
    return el("button", { class: "btn", type: "button", disabled: "disabled", text: "🎯 Answer a few more so we can map your weak spots" });
  }
  function personalizedProgress(compact) {
    var done = Math.min(3, testsDone()), ready = personalizedReady();
    var pct = ready ? 100 : Math.round(done / 3 * 100);
    var cta = ready
      ? el("button", { class: "btn btn-primary" + (compact ? " btn-sm" : " btn-lg"), type: "button", text: "🎯 Start your personalized test", onclick: startWeakRound })
      : el("button", { class: "btn btn-primary" + (compact ? " btn-sm" : " btn-lg"), type: "button", text: "Take another test to unlock →", onclick: renderHome });
    return el("div", { class: "pt-card" }, [
      el("div", { class: "pt-top" }, [
        el("b", { text: "🎯 Personalized test" }),
        el("span", { class: "muted", text: ready ? "unlocked — only your weakest questions" : done + " of 3 tests done" }),
      ]),
      el("div", { class: "pt-bar" }, el("span", { style: "width:" + pct + "%" })),
      cta,
    ]);
  }

  function beginSession(s) {
    var now = Date.now();
    session = { kind: s.kind, testId: s.testId, title: s.title, items: s.items, durationSec: s.durationSec,
      startedAt: now, deadline: now + s.durationSec * 1000, answers: {}, flags: [], index: 0, timeSpent: {}, visits: {} };
    setJSON(KEY.session, session);
    announced = {};
    enterExam(session);
  }

  function enterExam(s) {
    session = s; announced = {};
    s.timeSpent = s.timeSpent || {}; s.visits = s.visits || {}; s._enter = null; s._activePos = null;
    if (!s.items || !s.items.length) { del(KEY.session); return renderHome(); }
    if (s.deadline <= Date.now()) return finish(true);
    $("exam-title").textContent = s.title;
    $("exam-subtitle").textContent = (s.kind === "custom" ? "Adaptive practice" : "System Analyst") + " · " + s.items.length + " questions";
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
    // pacing "signs" at 5 min in, 10 min in, and 1 minute left
    var elapsed = session.durationSec - remain;
    if (elapsed >= 300 && !announced.m5 && remain > 75) { announced.m5 = 1; showSign("⏱ 5 minutes gone — keep up the pace", "info"); }
    if (elapsed >= 600 && !announced.m10 && remain > 75) { announced.m10 = 1; showSign("⏱ 10 minutes gone — 5 minutes to go", "info"); }
    if (remain <= 60 && !announced.last) { announced.last = 1; showSign("⏳ 1 minute left!", "warn"); }
    if (remain <= 0) finish(true);
  }

  /* ---------------- question render ---------------- */
  function accrueTime() {
    if (!session || session._enter == null || session._activePos == null) return;
    session.timeSpent[session._activePos] = (session.timeSpent[session._activePos] || 0) + (Date.now() - session._enter);
    session._enter = Date.now();
  }
  function renderQuestion(pos) {
    accrueTime();
    if (pos !== session._activePos) session.visits[pos] = (session.visits[pos] || 0) + 1;
    session._activePos = pos; session._enter = Date.now();
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
      }, [el("span", { class: "key", "aria-hidden": "true", text: String(oi + 1) }), el("span", { html: opt })]));
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
    var remain = Math.max(0, Math.round((session.deadline - Date.now()) / 1000));
    var un = session.items.length - Object.keys(session.answers).length;
    var msg = "Are you sure you want to submit? You still have <b>" + fmtTime(remain) + "</b> left on the clock.";
    if (un > 0) msg += "<br>You also have <b>" + un + "</b> unanswered question" + (un === 1 ? "" : "s") + " — they'll be marked wrong.";
    confirmDialog({ title: "Submit test?", message: msg, confirmText: "Submit now", cancelText: "Keep working", onConfirm: function () { finish(false); } });
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
      items.push({ q: q, your: your, correct: ok, skipped: skipped, timeMs: (s.timeSpent && s.timeSpent[pos]) || 0, visits: (s.visits && s.visits[pos]) || 0 });
    });
    var total = s.items.length;
    return { correct: correct, total: total, pct: Math.round((correct / total) * 100), byCat: byCat, byTopic: byTopic, items: items };
  }
  function finish(expired) {
    if (!session) return;
    stopTimer();
    accrueTime();
    var s = session;
    var elapsed = expired ? s.durationSec : Math.min(s.durationSec, Math.round((Date.now() - s.startedAt) / 1000));
    var res = grade(s);
    res.testId = s.testId; res.kind = s.kind; res.title = s.title; res.expired = !!expired; res.elapsed = elapsed;

    recordPerf(s);
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
    confirmDialog({ title: "Quit without scoring?", message: "Your progress on this test will be discarded.", confirmText: "Quit", cancelText: "Stay",
      onConfirm: function () { stopTimer(); del(KEY.session); session = null; renderHome(); } });
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
     We have no official norm table, so we MODEL the distribution from a couple
     of reasonable assumptions: knowledge-test scores are approximately normal,
     and a harder test has a lower expected average. The
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

  /* ---- speed × accuracy profile ---- */
  function verdictFor(fast, accurate) {
    if (fast && accurate) return { label: "Strength", cls: "good" };
    if (!fast && accurate) return { label: "Too slow", cls: "warn" };
    if (fast && !accurate) return { label: "Rushing", cls: "bad" };
    return { label: "Needs work", cls: "bad" };
  }
  function buildProfile(res) {
    var per = {}, times = [];
    res.items.forEach(function (it) {
      var s = per[it.q.topic] = per[it.q.topic] || { n: 0, correct: 0, ms: 0 };
      s.n++; s.ms += it.timeMs || 0; if (it.correct) s.correct++;
      times.push(it.timeMs || 0);
    });
    times.sort(function (a, b) { return a - b; });
    var medianMs = times.length ? times[Math.floor(times.length / 2)] : 0;
    var totalMs = times.reduce(function (a, b) { return a + b; }, 0);
    var topics = Object.keys(per).map(function (t) {
      var s = per[t], tAvg = s.ms / s.n, acc = s.correct / s.n;
      return { topic: t, n: s.n, avgSec: tAvg / 1000, acc: acc, verdict: verdictFor(tAvg <= medianMs * 1.15, acc >= 0.6) };
    }).sort(function (a, b) { var r = { bad: 0, warn: 1, good: 2 }; return r[a.verdict.cls] - r[b.verdict.cls] || a.acc - b.acc; });
    var by = function (lbl) { return topics.filter(function (x) { return x.verdict.label === lbl; }).map(function (x) { return x.topic; }); };
    var needs = by("Needs work"), rush = by("Rushing"), slow = by("Too slow"), strong = by("Strength");
    var recs = [];
    if (needs.length) recs.push("Study the method for <b>" + needs.slice(0, 3).join(", ") + "</b> — slow <em>and</em> often wrong.");
    if (rush.length) recs.push("Slow down on <b>" + rush.slice(0, 3).join(", ") + "</b> — you're fast but making avoidable mistakes.");
    if (slow.length) recs.push("Build speed on <b>" + slow.slice(0, 3).join(", ") + "</b> — you get them right but they eat your clock.");
    if (strong.length) recs.push("Your strengths are <b>" + strong.slice(0, 3).join(", ") + "</b> — bank those marks first, fast.");
    if (!recs.length) recs.push("Nicely balanced — keep doing full timed forms to build stamina.");
    return { avgSec: res.total ? totalMs / res.total / 1000 : 0, revisited: res.items.filter(function (it) { return (it.visits || 0) > 1; }).length, topics: topics, recs: recs };
  }
  function profileTable(topics) {
    var wrap = el("div", { class: "prof-table" });
    wrap.appendChild(el("div", { class: "prof-row prof-head" }, [
      el("span", { text: "Topic" }), el("span", { text: "Avg time" }), el("span", { text: "Accuracy" }), el("span", { text: "Verdict" }),
    ]));
    topics.forEach(function (x) {
      wrap.appendChild(el("div", { class: "prof-row" }, [
        el("span", { class: "prof-topic", text: x.topic }),
        el("span", { class: "prof-num", text: x.avgSec.toFixed(0) + "s" }),
        el("span", { class: "prof-num", text: Math.round(x.acc * 100) + "%" }),
        el("span", {}, el("span", { class: "vchip " + x.verdict.cls, text: x.verdict.label })),
      ]));
    });
    return wrap;
  }

  /* ---- deeper "why your answer misses" ---- */
  function deepFor(q) { return q.deep || (window.MMAT_DEEP && window.MMAT_DEEP[q.prompt]) || null; }
  var PRINCIPLES = {
    "REST principles": "REST rewards resources named as nouns, standard HTTP verbs and statelessness — judge each option against those constraints.",
    "API design": "Good API design is predictable and convention-following; the wrong answer usually breaks a REST convention or hides meaning.",
    "Status codes": "The status code IS the contract — pick the one whose standard meaning matches the situation exactly.",
    "HTTP methods": "Each method has defined semantics (safe / idempotent); the right answer respects them.",
    "Idempotency": "An idempotent call can be repeated with no extra effect; the trap is a method or design where retries duplicate.",
    "Versioning": "Backward compatibility is the rule — additive changes are safe; renames, removals and type changes break clients.",
    "Pagination": "Good paging stays correct as data changes: offset paging drifts under inserts/deletes, cursor paging stays stable.",
    "Caching": "HTTP caching relies on safe, idempotent reads and validators like ETag — not on state-changing calls.",
    "Errors & contracts": "A good error is a correct status plus a stable, machine-readable shape; the trap hides the failure or breaks the contract.",
    "API auth": "Tokens should be short-lived, sent in a header and represent delegated access — the trap leaks or over-trusts them.",
    "REST vs SOAP": "SOAP is a strict XML protocol with WS-*; REST is a lightweight HTTP style — match the choice to the constraint.",
    "SOAP & WSDL": "SOAP centres on the XML envelope and the WSDL contract; the trap confuses it with REST or with transport concerns.",
    "gRPC": "gRPC is Protocol Buffers over HTTP/2 with a .proto contract and streaming; the trap swaps in a REST/JSON trait.",
    "GraphQL": "GraphQL lets the client select exactly the fields it needs; its costs are HTTP caching and N+1 resolvers.",
    "WebSockets": "WebSockets give a persistent, full-duplex channel after an HTTP upgrade; the cost is stateful connections.",
    "HTTP protocol": "Know the roles of headers and the status-code families; the trap misassigns a header or a code.",
    "Protocol choice": "Match the protocol to the interaction shape — request/response, streaming, server push, or async events.",
    "OSI layers": "Place each protocol or device by the job it does; the trap puts it one layer off.",
    "TCP vs UDP": "TCP is reliable, ordered and connection-oriented; UDP is fast and best-effort. Pick by what the workload tolerates.",
    "DNS": "DNS maps names to addresses and is cached by TTL; the trap confuses record types or forgets caching.",
    "TLS/security layer": "TLS authenticates and encrypts data in transit using certificates; the trap confuses it with at-rest or another layer.",
    "IP & ports": "The IP address locates the host; the port selects the service on it. The trap blurs the two.",
    "Encapsulation": "Each layer wraps the payload with its own header/PDU (bit, frame, packet, segment) — know the unit per layer.",
    "Load balancing layer": "An L4 balancer routes by IP/port; an L7 balancer inspects HTTP. The trap uses the wrong layer's information.",
    "AMQP & RabbitMQ": "In RabbitMQ producers publish to exchanges, bindings route to queues, and consumers ack — the trap misplaces a role.",
    "Exchanges & routing": "Pick the exchange by how it chooses recipients: fanout = all, direct = exact key, topic = pattern, headers = attributes.",
    "Delivery guarantees": "Reason about duplicates vs. loss: at-most-once may lose, at-least-once may duplicate, exactly-once is hardest.",
    "Dead-letter & TTL": "Expiry and repeated failures route a message to a dead-letter target for retry or inspection.",
    "Kafka vs RabbitMQ": "Kafka is a retained, replayable, partitioned log; RabbitMQ is a route-and-remove broker — match the need to the model.",
    "Ack & prefetch": "Acks confirm processing; prefetch bounds how many unacked messages a consumer holds, for fair dispatch.",
    "Idempotent consumers": "Because delivery can repeat, safe consumers dedup or upsert on a stable key.",
    "Async patterns": "Async messaging decouples services in time and availability; the trap expects synchronous behaviour.",
    "Queues & DLQ": "A queue buffers messages until they're acked; poison messages get capped retries and dead-lettering.",
    "SQL vs NoSQL": "Match the store to the access pattern — relational joins/ACID vs. key-value, document, wide-column or search.",
    "Normalization": "Normalize so each fact is stored once (no anomalies); denormalize deliberately when reads dominate.",
    "Indexing": "Indexes speed reads that match their key order but cost writes — know B-tree vs. hash vs. covering.",
    "ACID": "Atomicity, Consistency, Isolation, Durability each guard a different failure — and none of them is CAP's 'consistency'.",
    "Isolation levels": "Each level blocks a specific set of anomalies (dirty / non-repeatable / phantom); stricter costs concurrency.",
    "Transactions": "Transactions group writes atomically; concurrency then brings locks, deadlocks and optimistic-vs-pessimistic control.",
    "Joins": "The join type decides which unmatched rows survive; missing indexes on the join keys make joins slow.",
    "Keys & constraints": "Keys identify and relate rows (primary / foreign / natural / surrogate); constraints enforce integrity.",
    "CAP & scaling": "Under a partition you choose consistency or availability; scale reads with replicas and writes with sharding.",
    "Denormalization": "Trade some redundancy for read speed (materialized views / read models) when joins dominate the workload.",
  };
  function topicPrinciple(t) { return PRINCIPLES[t] || "A good answer fits the exact definition or trade-off the question is testing — not just something related to it."; }
  function topicTrap(t, your) {
    var b = "<b>" + your + "</b> ";
    switch (t) {
      case "Status codes": return b + "is a real HTTP status, but its standard meaning doesn't match this situation.";
      case "OSI layers": return b + "names a real layer, but the job in the question actually belongs to a different one.";
      case "Encapsulation": return b + "is a real networking term, but it's the unit/behaviour of another layer, not the one asked about.";
      case "Exchanges & routing": return b + "is a real RabbitMQ exchange type, but it decides recipients differently from what's described.";
      case "Delivery guarantees": return b + "describes a different point on the duplicates-vs-loss trade-off than the one asked for.";
      case "Isolation levels": return b + "is a real isolation level, but it permits (or forbids) a different set of anomalies than the question needs.";
      case "REST vs SOAP": return b + "swaps a property of one style for the other — check which is the strict XML protocol and which is the HTTP style.";
      case "TCP vs UDP": return b + "belongs to the other transport's side of the reliability-vs-speed trade-off.";
      case "gRPC":
      case "GraphQL": return b + "mixes in a trait from a different API style rather than this one's actual model.";
      case "SQL vs NoSQL": return b + "picks a store whose access pattern doesn't match the workload described.";
      case "Kafka vs RabbitMQ": return b + "attributes one system's model (log-and-replay vs. route-and-remove) to the other.";
      default: return b + "is close to the right idea, but it doesn't match the exact definition or trade-off the question is testing.";
    }
  }
  function deepExplanation(q, yourIdx) {
    var d = deepFor(q) || {};
    var correct = q.options[q.answer];
    var yourTxt = (yourIdx != null && yourIdx !== q.answer) ? q.options[yourIdx] : null;
    var principle = d.principle || topicPrinciple(q.topic);
    var best = d.best || "";   // q.explain is already shown as "Why:" — don't repeat it
    var trap = yourTxt ? ((d.traps && d.traps[yourTxt]) || topicTrap(q.topic, yourTxt)) : "";
    var html = "";
    if (yourTxt) html += "<p>It's easy to see why <b>" + yourTxt + "</b> felt right. " + trap + "</p>";
    html += "<p><b>The core idea.</b> " + principle + "</p>";
    if (best) html += "<p><b>Why “" + correct + "” fits best.</b> " + best + "</p>";
    if (!yourTxt) html += "<p>Any option that doesn't fit that exact relationship is a distractor here.</p>";
    return html;
  }
  function reportLogic(q, yourIdx, btn) {
    var rep = { prompt: String(q.prompt).replace(/<[^>]+>/g, ""), topic: q.topic,
      your: (yourIdx != null ? q.options[yourIdx] : null), correct: q.options[q.answer], at: Date.now() };
    var list = getJSON("saa:v1:reports", []); list.push(rep); setJSON("saa:v1:reports", list);
    var sup = CFG.support || {};
    if (sup.endpoint) { try { fetch(sup.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "logic-report", report: rep }) }); } catch (e) {} }
    if (btn) { btn.textContent = "✓ Reported — thanks, we'll review this one"; btn.disabled = true; }
  }

  /* ---- NPS (skippable) ---- */
  function npsPanel() {
    if (getJSON("saa:v1:nps", null)) return null;   // already answered or skipped
    var wrap = el("div", { class: "panel nps" });
    function done(score) {
      setJSON("saa:v1:nps", { score: score, at: Date.now() });
      var sup = CFG.support || {};
      if (score != null && sup.endpoint) { try { fetch(sup.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "nps", score: score }) }); } catch (e) {} }
      wrap.innerHTML = "";
      wrap.appendChild(el("p", { class: "muted", style: "margin:0", text: score == null ? "No problem — maybe next time." : "Thanks for the feedback! 🙏" }));
    }
    var scale = el("div", { class: "nps-scale" });
    for (var i = 0; i <= 10; i++) (function (n) { scale.appendChild(el("button", { class: "nps-btn", type: "button", text: String(n), "aria-label": n + " out of 10", onclick: function () { done(n); } })); })(i);
    wrap.appendChild(el("div", {}, [
      el("h2", { style: "margin-top:0", text: "One quick question" }),
      el("p", { class: "muted", style: "margin-top:-.4em", text: "How likely are you to recommend this test to a friend or colleague?" }),
      scale,
      el("div", { class: "nps-foot" }, [el("span", { text: "0 · Not likely" }), el("span", { class: "spacer" }), el("span", { text: "Very likely · 10" })]),
      el("button", { class: "linkbtn", type: "button", text: "Skip", onclick: function () { done(null); } }),
    ]));
    return wrap;
  }

  /* ---- share results ---- */
  function siteUrl() { return (CFG.siteUrl && String(CFG.siteUrl).trim()) || (typeof window !== "undefined" && window.location ? window.location.href : ""); }
  function sharePanel(res, st) {
    var text = "I scored " + res.pct + "% on the System Analyst Assessment — better than an estimated " + st.pctile + "% of people. Can you beat me?";
    var url = siteUrl(), enc = encodeURIComponent, full = text + (url ? " " + url : "");
    var openWin = function (u) { try { window.open(u, "_blank", "noopener"); } catch (e) {} };
    var btns = [];
    if (typeof navigator !== "undefined" && navigator.share)
      btns.push(el("button", { class: "btn btn-sm", type: "button", text: "Share…", onclick: function () { try { navigator.share({ title: "System Analyst Assessment", text: text, url: url }); } catch (e) {} } }));
    btns.push(el("button", { class: "btn btn-sm", type: "button", text: "𝕏 / Twitter", onclick: function () { openWin("https://twitter.com/intent/tweet?text=" + enc(text) + (url ? "&url=" + enc(url) : "")); } }));
    btns.push(el("button", { class: "btn btn-sm", type: "button", text: "LinkedIn", onclick: function () { openWin("https://www.linkedin.com/sharing/share-offsite/?url=" + enc(url || "")); } }));
    btns.push(el("button", { class: "btn btn-sm", type: "button", text: "WhatsApp", onclick: function () { openWin("https://wa.me/?text=" + enc(full)); } }));
    var copyBtn = el("button", { class: "btn btn-sm", type: "button", text: "Copy result", onclick: function () {
      var ok = function () { copyBtn.textContent = "✓ Copied"; };
      try { if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(full).then(ok, ok); else ok(); } catch (e) { ok(); }
    } });
    btns.push(copyBtn);
    return el("div", { class: "panel" }, [
      el("h2", { style: "margin-top:0", text: "Share your result" }),
      el("p", { class: "muted", style: "margin-top:-.5em", text: text }),
      el("div", { class: "share-row" }, btns),
    ]);
  }

  /* ---- leaderboard (local by default; remote if configured) ---- */
  var BOARD_KEY = "saa:v1:board";
  function getBoardLocal() { return getJSON(BOARD_KEY, []); }
  function boardConfigured() { return !!(CFG.leaderboard && CFG.leaderboard.endpoint); }
  function rankSort(a, b) { return b.pct - a.pct || (b.pctile || 0) - (a.pctile || 0) || (a.at || 0) - (b.at || 0); }
  function submitScore(entry, cb) {
    var l = getBoardLocal(); l.push(entry); l.sort(rankSort); setJSON(BOARD_KEY, l.slice(0, 100));
    if (boardConfigured()) { try { fetch(CFG.leaderboard.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) }).then(function () { cb && cb(true); }, function () { cb && cb(true); }); return; } catch (e) {} }
    cb && cb(true);
  }
  function loadBoard(cb) {
    if (boardConfigured()) { try { fetch(CFG.leaderboard.endpoint, { headers: { "Accept": "application/json" } }).then(function (r) { return r.json(); }).then(function (rows) { cb(Array.isArray(rows) ? rows : [], "global"); }, function () { cb(getBoardLocal(), "local"); }); return; } catch (e) {} }
    cb(getBoardLocal(), "local");
  }
  function renderLeaderboard() {
    var body = $("leaderboard-body"); body.innerHTML = "";
    body.appendChild(el("div", {}, [
      el("p", { class: "muted", text: "Leaderboard" }),
      el("h1", { text: "🏆 All-time leaderboard" }),
      el("p", { class: "lede", id: "lb-sub", text: "Loading…" }),
      el("div", { class: "panel", id: "lb-list" }),
      el("div", { class: "cta-row" }, [el("button", { class: "btn", type: "button", text: "← Back", onclick: renderHome })]),
    ]));
    show("leaderboard");
    loadBoard(function (rows, kind) {
      var sub = $("lb-sub"); if (sub) sub.textContent = kind === "global" ? "The top scores from everyone who has played." : "Your top scores on this device. Connect a backend (see STRATEGY.md) to make it global.";
      var list = $("lb-list"); if (!list) return; list.innerHTML = "";
      rows = (rows || []).slice().sort(rankSort).slice(0, 20);
      if (!rows.length) { list.appendChild(el("p", { class: "muted", text: "No scores yet — finish a test and add yours!" })); return; }
      var tbl = el("div", { class: "lb-table" });
      tbl.appendChild(el("div", { class: "lb-row lb-head" }, [el("span", { text: "#" }), el("span", { text: "Name" }), el("span", { text: "Test" }), el("span", { text: "Score" })]));
      rows.forEach(function (r, i) {
        tbl.appendChild(el("div", { class: "lb-row" + (i < 3 ? " top" : "") }, [
          el("span", { class: "lb-rank", text: String(i + 1) }),
          el("span", { class: "lb-name", text: r.name || "Anonymous" }),
          el("span", { class: "lb-test muted", text: r.title || "" }),
          el("span", { class: "lb-score", text: (r.pct != null ? r.pct + "%" : "") }),
        ]));
      });
      list.appendChild(tbl);
    });
  }
  function boardCTA(res, st) {
    var u = getUser();
    var nameInput = el("input", { class: "code-input", type: "text", maxlength: "24", placeholder: "Your name or initials", value: (u && u.name) || "" });
    var status = el("div", { class: "unlock-msg", id: "board-status" });
    var addBtn = el("button", { class: "btn btn-primary", type: "button", text: "Add my score" });
    addBtn.addEventListener("click", function () {
      var nm = (nameInput.value || "").trim().slice(0, 24) || "Anonymous";
      addBtn.disabled = true; status.className = "unlock-msg"; status.textContent = "Adding…";
      submitScore({ name: nm, pct: res.pct, pctile: st.pctile, title: res.title, at: Date.now() }, function () {
        status.className = "unlock-msg good"; status.textContent = "Added! ";
        status.appendChild(el("button", { class: "linkbtn", type: "button", text: "View leaderboard →", onclick: renderLeaderboard }));
      });
    });
    return el("div", { class: "panel" }, [
      el("h2", { style: "margin-top:0", text: "🏆 Add your score to the leaderboard" }),
      el("p", { class: "muted", style: "margin-top:-.5em", text: "See how you rank against everyone else." }),
      el("div", { class: "code-row" }, [nameInput, addBtn, el("button", { class: "btn", type: "button", text: "View board", onclick: renderLeaderboard })]),
      status,
    ]);
  }

  /* ---- how close was a wrong answer to the correct one? ---- */
  function orderableValue(s) {
    s = String(s).trim();
    if (/^[A-Za-z]$/.test(s)) return s.toUpperCase().charCodeAt(0) - 64;   // A=1 … Z=26
    if (s.indexOf(":") >= 0) return null;                                  // ratios/times aren't a linear scale
    var t = s.replace(/,/g, "");
    var frac = t.match(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/);
    if (frac) return parseFloat(frac[1]) / parseFloat(frac[2]);
    var m = t.match(/-?\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  }
  function fmtGap(x) { return String(Math.round(x * 100) / 100); }
  function answerCloseness(q, yourIdx) {
    if (yourIdx == null || yourIdx === q.answer) return null;
    var vals = q.options.map(orderableValue);
    var orderable = vals.every(function (v) { return v != null && isFinite(v); });
    if (!orderable) {
      var d = deepFor(q), trap = d && d.traps && d.traps[q.options[yourIdx]];
      return { orderable: false, kind: trap ? "close" : "far", label: trap ? "Common trap" : "Off", detail: "" };
    }
    var letters = q.options.every(function (o) { return /^[A-Za-z]$/.test(String(o).trim()); });
    var correctV = vals[q.answer], yourDist = Math.abs(vals[yourIdx] - correctV), nWrong = 0, closer = 0;
    q.options.forEach(function (o, i) { if (i === q.answer) return; nWrong++; if (Math.abs(vals[i] - correctV) < yourDist) closer++; });
    var rank = closer + 1;
    var kind = rank === 1 ? "near" : (rank >= nWrong ? "far" : "close");
    var gap = letters ? yourDist + " letter" + (yourDist === 1 ? "" : "s") : fmtGap(yourDist);
    var detail = kind === "near"
      ? "Nearly! Yours was the closest option to the right answer — just " + gap + " away."
      : "Your answer was " + gap + " from correct" + (kind === "far" ? " — the furthest option." : ".");
    return { orderable: true, kind: kind, label: kind === "near" ? "Near miss 🎯" : (kind === "close" ? "Close" : "Off"), detail: detail };
  }
  function closenessStats(res) {
    var wrong = 0, near = 0, orderable = 0;
    res.items.forEach(function (it) {
      if (it.skipped || it.correct) return;
      wrong++;
      var c = answerCloseness(it.q, it.your);
      if (c && c.orderable) { orderable++; if (c.kind === "near") near++; }
    });
    return { wrong: wrong, near: near, orderable: orderable };
  }

  function renderResults(res) {
    var b = band(res.pct);
    var body = $("results-body"); body.innerHTML = "";

    // ---- celebration + "better than average" estimate ----
    var st = scoreStats(res);
    var cs = closenessStats(res);
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
      el("p", { class: "disclaimer", text: "Estimated from a normal model calibrated to this assessment's difficulty — a guide to gauge yourself against a typical test-taker, not an official benchmark." }),
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
            cs.near > 0 ? el("div", { class: "s", html: "<b>" + cs.near + "</b><span>Near misses</span>" }) : null,
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

    // speed × accuracy profile + recommendations
    var prof = buildProfile(res);
    body.appendChild(el("div", { class: "panel" }, [
      el("h2", { style: "margin-top:0", text: "Speed & accuracy profile" }),
      el("p", { class: "muted", style: "margin-top:-.5em", html: "You averaged <b>" + prof.avgSec.toFixed(0) + "s</b> per question" + (prof.revisited ? " · revisited <b>" + prof.revisited + "</b> question" + (prof.revisited === 1 ? "" : "s") : "") + ". Time counts every visit — including stepping away and coming back." }),
      profileTable(prof.topics),
      cs.wrong ? el("p", { class: "dim", style: "margin-top:12px", html: cs.near > 0
        ? ("🎯 <b>" + cs.near + "</b> of your <b>" + cs.wrong + "</b> wrong answers were <b>near misses</b> — you chose the option closest to correct, so you're closer than the score suggests.")
        : ("Across your <b>" + cs.wrong + "</b> wrong answers, none landed on the closest option — worth reviewing the method for those.") }) : null,
      el("div", { class: "recs" }, prof.recs.map(function (r) { return el("div", { class: "rec", html: "→ " + r }); })),
    ]));

    // weakest topics + personalized-test CTA
    var weak = weakestTopics(2).slice(0, 4);
    var done = testsDone();
    body.appendChild(el("div", { class: "panel" }, [
      el("h2", { style: "margin-top:0", text: "Where to focus next" }),
      weak.length
        ? el("p", { class: "dim", html: "Across everything you've done, your weakest topics are " +
            weak.map(function (w) { return "<b>" + w.topic + "</b> (" + Math.round(w.acc * 100) + "%)"; }).join(", ") + "." })
        : el("p", { class: "dim", text: "Do a couple more tests and we'll pinpoint your weak topics." }),
      personalizedProgress(),
      el("div", { class: "cta-row", style: "margin-bottom:0" }, [
        res.testId && res.kind === "form" ? el("button", { class: "btn", type: "button", text: "↻ Retake this form", onclick: function () { renderIntro(res.testId); } }) : null,
        el("button", { class: "btn", type: "button", text: "All tests", onclick: renderHome }),
      ]),
    ]));

    body.appendChild(sharePanel(res, st));
    body.appendChild(boardCTA(res, st));

    // NPS (skippable, shown once)
    var npsEl = npsPanel(); if (npsEl) body.appendChild(npsEl);

    // review — defaults to Incorrect, with counts on each filter
    var listHost = el("div", { id: "review-list" });
    var counts = { all: res.items.length, wrong: 0, skipped: 0, correct: 0 };
    res.items.forEach(function (it) { counts[it.skipped ? "skipped" : (it.correct ? "correct" : "wrong")]++; });
    var defFilter = counts.wrong > 0 ? "wrong" : (counts.skipped > 0 ? "skipped" : "all");
    var filters = el("div", { class: "review-filter" });
    [["all", "All"], ["wrong", "Incorrect"], ["skipped", "Skipped"], ["correct", "Correct"]].forEach(function (f) {
      filters.appendChild(el("button", { class: "btn btn-sm " + (f[0] === defFilter ? "btn-primary" : "btn-ghost"), type: "button", text: f[1] + " (" + counts[f[0]] + ")",
        onclick: function () { filters.querySelectorAll("button").forEach(function (x) { x.className = "btn btn-sm btn-ghost"; }); this.className = "btn btn-sm btn-primary"; drawReview(listHost, res, f[0]); } }));
    });
    body.appendChild(el("div", { class: "panel" }, [
      el("h2", { style: "margin-top:0", text: "Review answers" }),
      el("p", { class: "muted", style: "margin-top:-.5em", text: "Showing your incorrect answers first — use the filters to see the rest." }),
      filters, listHost,
    ]));
    drawReview(listHost, res, defFilter);
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
        return el("div", { class: cls, html: opt + tag });
      });
      var cl = state === "wrong" ? answerCloseness(q, it.your) : null;
      var kids = [
        el("div", { class: "review-head" }, [
          el("span", { class: "rh-num", text: "Q" + (i + 1) }),
          el("span", { class: "rh-tag " + state, text: state }),
          cl ? el("span", { class: "close-chip " + cl.kind, text: cl.label }) : null,
          el("span", { class: "q-topic", "data-cat": q.cat, text: catInfo(q.cat).label + " · " + (q.topic || "") }),
          el("span", { class: "rh-time", text: "⏱ " + Math.round((it.timeMs || 0) / 1000) + "s" + ((it.visits || 0) > 1 ? " · revisited" : "") }),
        ]),
        el("div", { class: "rv-prompt", html: q.prompt }),
        el("div", {}, optEls),
        cl && cl.detail ? el("div", { class: "rv-close", text: cl.detail }) : null,
        q.explain ? el("div", { class: "rv-explain", html: "<b>Why:</b> " + q.explain }) : null,
      ];
      if (state !== "correct") {
        var summaryTxt = it.skipped ? "Explain this in depth" : "Still not convinced? Why “" + q.options[it.your] + "” misses →";
        kids.push(el("details", { class: "deep" }, [
          el("summary", { text: summaryTxt }),
          el("div", { class: "deep-body", html: deepExplanation(q, it.your) }),
          el("div", { class: "deep-actions" }, [
            el("button", { class: "linkbtn report", type: "button", text: "⚑ Report broken logic", onclick: function () { reportLogic(q, it.your, this); } }),
          ]),
        ]));
      }
      host.appendChild(el("div", { class: "review-item " + state }, kids));
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
     Google sign-in (optional, client-side only)
     ============================================================ */
  var AUTH_KEY = "saa:v1:user", TICKETS_KEY = "saa:v1:tickets";
  function getUser() { return getJSON(AUTH_KEY, null); }
  function decodeJwt(t) { try { var p = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"); return JSON.parse(decodeURIComponent(escape(atob(p)))); } catch (e) { return null; } }
  function handleCredential(resp) {
    var d = decodeJwt(resp && resp.credential); if (!d) return;
    setJSON(AUTH_KEY, { name: d.name, email: d.email, picture: d.picture, sub: d.sub });
    renderAuth(); if ($("screen-home").classList.contains("active")) renderHome();
  }
  function signOut() {
    del(AUTH_KEY);
    try { if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect(); } catch (e) {}
    renderAuth(); renderHome();
  }
  function initGoogleAuth() {
    var cid = CFG.google && CFG.google.clientId; if (!cid) return;               // not configured → no button
    function ready() { try { google.accounts.id.initialize({ client_id: cid, callback: handleCredential }); } catch (e) {} renderAuth(); }
    if (window.google && window.google.accounts && google.accounts.id) return ready();
    var s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true; s.defer = true;
    s.onload = ready; document.head.appendChild(s);                             // only loaded when a client id exists
  }
  function renderAuth() {
    var slot = $("auth-slot"); if (!slot) return; slot.innerHTML = "";
    var u = getUser();
    if (u) {
      slot.appendChild(el("span", { class: "auth-user" }, [
        u.picture ? el("img", { class: "auth-pic", src: u.picture, alt: "", referrerpolicy: "no-referrer" }) : null,
        el("span", { class: "auth-name", text: u.name || u.email || "Signed in" }),
        el("button", { class: "linkbtn", type: "button", text: "Sign out", onclick: signOut }),
      ]));
      return;
    }
    if (!(CFG.google && CFG.google.clientId)) return;                            // no auth configured → show nothing
    var btn = el("div", { class: "gbtn", id: "g-btn" }); slot.appendChild(btn);
    try { google.accounts.id.renderButton(btn, { theme: "filled_black", size: "medium", text: "signin_with", shape: "pill" }); }
    catch (e) { slot.appendChild(el("button", { class: "btn btn-sm", type: "button", text: "Sign in with Google", onclick: function () { try { google.accounts.id.prompt(); } catch (e) {} } })); }
  }

  /* ============================================================
     Support tickets
     ============================================================ */
  function renderSupport() {
    var u = getUser(), sup = CFG.support || {};
    var body = $("support-body"); body.innerHTML = "";
    var name = el("input", { class: "code-input", type: "text", placeholder: "Your name", value: (u && u.name) || "" });
    var email = el("input", { class: "code-input", type: "email", placeholder: "you@email.com", value: (u && u.email) || "" });
    var subject = el("input", { class: "code-input", type: "text", placeholder: "e.g. Access code not working" });
    var message = el("textarea", { class: "code-input", rows: "5", placeholder: "Tell us what happened, and include any error message." });
    var status = el("div", { class: "unlock-msg", id: "sup-status" });
    body.appendChild(el("div", {}, [
      el("p", { class: "muted", text: "Support" }),
      el("h1", { text: "Contact support" }),
      el("p", { class: "lede", text: "Question, bug, or refund request? Send a message and we'll reply by email." }),
      el("div", { class: "panel" }, [
        el("div", { class: "form-grid" }, [
          el("label", {}, [el("span", { text: "Name" }), name]),
          el("label", {}, [el("span", { text: "Email" }), email]),
        ]),
        el("label", { class: "block" }, [el("span", { text: "Subject" }), subject]),
        el("label", { class: "block" }, [el("span", { text: "Message" }), message]),
        el("div", { class: "cta-row", style: "margin-bottom:0" }, [
          el("button", { class: "btn btn-primary", type: "button", text: "Send message", onclick: function () { submitTicket(name.value, email.value, subject.value, message.value, status); } }),
          el("button", { class: "btn btn-ghost", type: "button", text: "Back", onclick: renderHome }),
        ]),
        status,
      ]),
      ticketHistory(),
    ]));
    show("support");
  }
  function ticketHistory() {
    var list = getJSON(TICKETS_KEY, []);
    if (!list.length) return el("p", { class: "muted", style: "margin-top:16px", text: "Your submitted tickets will be listed here." });
    return el("div", { class: "panel" }, [el("h2", { style: "margin-top:0", text: "Your tickets" })].concat(
      list.slice(-5).reverse().map(function (t) { return el("div", { class: "ticket" }, [el("b", { text: t.subject || "(no subject)" }), el("span", { class: "muted", text: " — " + t.status })]); })));
  }
  function submitTicket(name, email, subject, message, status) {
    name = (name || "").trim(); email = (email || "").trim(); subject = (subject || "").trim(); message = (message || "").trim();
    if (!email || !message) { status.className = "unlock-msg bad"; status.textContent = "Please add your email and a message."; return; }
    var sup = CFG.support || {}, ticket = { subject: subject, email: email, at: Date.now(), status: "sending" };
    var save = function (st) { var l = getJSON(TICKETS_KEY, []); ticket.status = st; l.push(ticket); setJSON(TICKETS_KEY, l); };
    status.className = "unlock-msg"; status.textContent = "Sending…";
    if (sup.endpoint) {
      fetch(sup.endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ name: name, email: email, subject: subject, message: message }) })
        .then(function (r) { if (!r.ok) throw new Error(); save("sent"); status.className = "unlock-msg good"; status.textContent = "Thanks! Your message has been sent — we'll reply by email."; })
        .catch(function () { save("failed"); status.className = "unlock-msg bad"; status.textContent = "Couldn't send right now. Please email " + (sup.email || "support") + " directly."; });
    } else {
      var to = sup.email || "support@example.com";
      var href = "mailto:" + to + "?subject=" + encodeURIComponent(subject || "Support request") + "&body=" + encodeURIComponent("From: " + name + " <" + email + ">\n\n" + message);
      save("emailed"); status.className = "unlock-msg good"; status.textContent = "Opening your email app…";
      window.location.href = href;
    }
  }

  /* ============================================================
     Analytics (optional, config-gated; nothing loads unless set)
     ============================================================ */
  function loadAnalytics() {
    var a = CFG.analytics || {};
    try {
      if (a.plausibleDomain) { var p = document.createElement("script"); p.defer = true; p.src = "https://plausible.io/js/script.js"; p.setAttribute("data-domain", a.plausibleDomain); document.head.appendChild(p); }
      if (a.fathomSiteId) { var f = document.createElement("script"); f.defer = true; f.src = "https://cdn.usefathom.com/script.js"; f.setAttribute("data-site", a.fathomSiteId); document.head.appendChild(f); }
      if (a.ga4Id) {
        var g = document.createElement("script"); g.async = true; g.src = "https://www.googletagmanager.com/gtag/js?id=" + a.ga4Id; document.head.appendChild(g);
        var s = document.createElement("script"); s.text = "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','" + a.ga4Id + "');"; document.head.appendChild(s);
      }
    } catch (e) {}
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
    if (session && $("screen-exam").classList.contains("active")) {
      confirmDialog({ title: "Leave this test?", message: "You can resume it later from the list — your time keeps running.", confirmText: "Leave", cancelText: "Stay",
        onConfirm: function () { stopTimer(); renderHome(); } });
      return;
    }
    stopTimer(); renderHome();
  });
  $("exam-submit").addEventListener("click", confirmSubmit);
  $("exam-quit").addEventListener("click", abandon);
  var navSup = $("nav-support"); if (navSup) navSup.addEventListener("click", function (e) { e.preventDefault(); renderSupport(); });
  var navLb = $("nav-leaderboard"); if (navLb) navLb.addEventListener("click", function (e) { e.preventDefault(); renderLeaderboard(); });

  (function boot() {
    loadAnalytics();
    renderAuth();
    initGoogleAuth();
    var saved = getJSON(KEY.session, null);
    if (saved && saved.items && saved.items.length) {
      if (saved.deadline > Date.now()) { enterExam(saved); return; }
      session = saved; finish(true); return;
    }
    renderHome();
  })();
})();
