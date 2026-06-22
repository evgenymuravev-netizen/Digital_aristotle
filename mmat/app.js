/* ============================================================
   MMAT — McQuaig-style Mental Agility practice test (engine)
   Classic script (no modules) so it runs from file:// and Pages.

   Consumes the global `MMAT` defined in questions.js:
     MMAT.config      = { durationSec }
     MMAT.categories  = { <cat>: { label, color } }
     MMAT.tests       = [ { id, name, blurb, questions:[ {
                             cat, topic, prompt, options:[...], answer:<idx>, explain
                           } ] } ]
   ============================================================ */
(function () {
  "use strict";

  var DATA = window.MMAT;
  if (!DATA || !Array.isArray(DATA.tests)) {
    document.getElementById("test-grid").innerHTML =
      '<p class="note">Could not load the question bank (questions.js).</p>';
    return;
  }

  var DURATION = (DATA.config && DATA.config.durationSec) || 900; // 15 minutes
  var KEY = { session: "mmat:v1:session", best: "mmat:v1:best" };

  /* ---------------- tiny helpers ---------------- */
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
  function fmtTime(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ":" + pad2(sec % 60); }
  function getJSON(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function setJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function testById(id) { for (var i = 0; i < DATA.tests.length; i++) if (DATA.tests[i].id === id) return DATA.tests[i]; return null; }
  function catInfo(c) { return (DATA.categories && DATA.categories[c]) || { label: c, color: "#9fb0c3" }; }

  /* ---------------- screens ---------------- */
  var SCREENS = ["home", "intro", "exam", "results"];
  function show(name) {
    SCREENS.forEach(function (s) { $("screen-" + s).classList.toggle("active", s === name); });
    window.scrollTo(0, 0);
  }

  /* ---------------- runtime state ---------------- */
  var session = null;     // active attempt
  var timerId = null;
  var announced = {};     // SR threshold announcements

  /* ============================================================
     HOME
     ============================================================ */
  function renderHome() {
    var best = getJSON(KEY.best, {});
    var grid = $("test-grid");
    grid.innerHTML = "";
    var active = getJSON(KEY.session, null);

    DATA.tests.forEach(function (t, i) {
      var b = best[t.id];
      var resuming = active && active.testId === t.id && active.deadline > Date.now();
      var card = el("div", { class: "test-card" }, [
        el("span", { class: "num-chip", "aria-hidden": "true", text: String(i + 1) }),
        el("h3", { text: t.name }),
        el("div", { class: "tc-sub", text: t.blurb || "" }),
        el("div", { class: "tc-meta" }, [
          el("span", { html: "<b>" + t.questions.length + "</b> questions" }),
          el("span", { html: "<b>15</b> min" }),
        ]),
        el("div", { class: "tc-foot" }, [
          b ? el("span", { class: "tc-best", html: "Best: <b>" + b.pct + "%</b> · " + b.correct + "/" + b.total })
            : el("span", { class: "tc-best muted", text: "Not attempted" }),
          el("button", {
            class: "btn " + (resuming ? "btn-primary" : "btn-primary") + " btn-sm",
            type: "button",
            text: resuming ? "Resume" : (b ? "Retake" : "Start"),
            onclick: function () { resuming ? enterExam(active) : renderIntro(t.id); },
          }),
        ]),
      ]);
      grid.appendChild(card);
    });
    show("home");
  }

  /* ============================================================
     INTRO (pre-test briefing)
     ============================================================ */
  function renderIntro(testId) {
    var t = testById(testId);
    if (!t) return renderHome();
    // category mix summary
    var counts = {};
    t.questions.forEach(function (q) { counts[q.cat] = (counts[q.cat] || 0) + 1; });
    var mix = Object.keys(counts).map(function (c) {
      return el("span", { class: "badge", html: catInfo(c).label + " · " + counts[c] });
    });

    var body = $("intro-body");
    body.innerHTML = "";
    body.appendChild(el("div", {}, [
      el("p", { class: "muted", html: "Form " + (DATA.tests.indexOf(t) + 1) + " of " + DATA.tests.length }),
      el("h1", { text: t.name }),
      el("p", { class: "lede", text: t.blurb || "" }),
      el("div", { class: "panel" }, [
        el("h2", { style: "margin-top:0", text: "Before you start" }),
        el("ul", { class: "tight dim" }, [
          el("li", { html: "<b>" + t.questions.length + " questions</b> in <b>15 minutes</b>. The clock cannot be paused." }),
          el("li", { html: "Answer with a click or keys <span class='mono'>1–5</span>; move with <span class='mono'>←/→</span>; flag with <span class='mono'>F</span>." }),
          el("li", { text: "Unanswered questions count as wrong, so make your best guess before time runs out." }),
          el("li", { text: "If you refresh or close the tab, you can resume with the time that remains." }),
        ]),
        el("div", { class: "cta-row", style: "margin-bottom:0" }, mix),
      ]),
      el("div", { class: "cta-row" }, [
        el("button", { class: "btn btn-primary btn-lg", type: "button", text: "▶ Start — 15:00 clock", onclick: function () { startSession(testId); } }),
        el("button", { class: "btn btn-ghost", type: "button", text: "Back", onclick: renderHome }),
      ]),
    ]));
    show("intro");
  }

  /* ============================================================
     SESSION lifecycle
     ============================================================ */
  function startSession(testId) {
    var now = Date.now();
    session = { testId: testId, startedAt: now, deadline: now + DURATION * 1000, answers: {}, flags: [], index: 0 };
    setJSON(KEY.session, session);
    announced = {};
    enterExam(session);
  }

  function enterExam(s) {
    session = s;
    announced = {};
    var t = testById(s.testId);
    if (!t) { del(KEY.session); return renderHome(); }
    if (s.deadline <= Date.now()) return finish(true); // already expired

    $("exam-title").textContent = t.name;
    $("exam-subtitle").textContent = "Mental Agility · " + t.questions.length + " questions";
    buildPalette(t);
    renderQuestion(clamp(s.index || 0, 0, t.questions.length - 1));
    updateAnswered(t);
    show("exam");
    startTimer();
  }

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  /* ---------------- timer ---------------- */
  function startTimer() {
    stopTimer();
    tick();
    timerId = setInterval(tick, 250);
  }
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function tick() {
    if (!session) return;
    var remain = (session.deadline - Date.now()) / 1000;
    var t = $("exam-timer");
    t.textContent = fmtTime(remain);
    t.classList.toggle("warn", remain <= 120 && remain > 60);
    t.classList.toggle("danger", remain <= 60);
    // screen-reader thresholds
    if (remain <= 120 && !announced[120]) { announced[120] = 1; $("exam-timer-sr").textContent = "Two minutes remaining."; }
    if (remain <= 60 && !announced[60]) { announced[60] = 1; $("exam-timer-sr").textContent = "One minute remaining."; }
    if (remain <= 0) finish(true);
  }

  /* ---------------- question render ---------------- */
  function renderQuestion(i) {
    var t = testById(session.testId);
    session.index = i;
    setJSON(KEY.session, session);
    var q = t.questions[i];
    var chosen = session.answers[i];

    var opts = el("div", { class: "options", role: "radiogroup", "aria-label": "Answer options" });
    q.options.forEach(function (opt, oi) {
      var btn = el("button", {
        class: "option", type: "button", role: "radio",
        "aria-checked": chosen === oi ? "true" : "false",
        "aria-pressed": chosen === oi ? "true" : "false",
        onclick: function () { selectOption(oi); },
      }, [
        el("span", { class: "key", "aria-hidden": "true", text: String(oi + 1) }),
        el("span", { text: opt }),
      ]);
      opts.appendChild(btn);
    });

    var flagged = session.flags.indexOf(i) >= 0;
    var wrap = el("div", {}, [
      el("span", { class: "q-topic", "data-cat": q.cat, text: catInfo(q.cat).label + " · " + (q.topic || "") }),
      el("div", { class: "q-count", text: "Question " + (i + 1) + " of " + t.questions.length }),
      el("div", { class: "q-prompt", html: q.prompt }),
      opts,
      el("div", { class: "q-nav" }, [
        el("button", { class: "btn btn-sm", type: "button", text: "← Previous", disabled: i === 0 ? "disabled" : null, onclick: function () { gotoQuestion(i - 1); } }),
        el("button", { class: "btn btn-sm " + (flagged ? "btn-primary" : "btn-ghost"), type: "button", text: flagged ? "⚑ Flagged" : "⚑ Flag", onclick: toggleFlag }),
        el("span", { class: "spacer" }),
        i === t.questions.length - 1
          ? el("button", { class: "btn btn-primary btn-sm", type: "button", text: "Review & submit", onclick: confirmSubmit })
          : el("button", { class: "btn btn-sm", type: "button", text: "Next →", onclick: function () { gotoQuestion(i + 1); } }),
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
    var btns = $("exam-question").querySelectorAll(".option");
    btns.forEach(function (b, idx) {
      var on = idx === oi;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.setAttribute("aria-checked", on ? "true" : "false");
    });
    updatePalette();
    updateAnswered(testById(session.testId));
  }

  function gotoQuestion(i) {
    var t = testById(session.testId);
    renderQuestion(clamp(i, 0, t.questions.length - 1));
  }

  function toggleFlag() {
    var i = session.index, k = session.flags.indexOf(i);
    if (k >= 0) session.flags.splice(k, 1); else session.flags.push(i);
    setJSON(KEY.session, session);
    renderQuestion(i);
  }

  /* ---------------- palette ---------------- */
  function buildPalette(t) {
    var p = $("exam-palette");
    p.innerHTML = "";
    t.questions.forEach(function (_, i) {
      p.appendChild(el("button", {
        class: "pal", type: "button", "data-i": i, text: String(i + 1),
        "aria-label": "Question " + (i + 1),
        onclick: function () { gotoQuestion(i); },
      }));
    });
  }
  function updatePalette() {
    var btns = $("exam-palette").children;
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      b.classList.toggle("answered", session.answers[i] != null);
      b.classList.toggle("flagged", session.flags.indexOf(i) >= 0);
      b.classList.toggle("current", i === session.index);
    }
  }
  function updateAnswered(t) {
    var n = Object.keys(session.answers).length;
    $("exam-answered").textContent = n + " / " + t.questions.length;
  }

  /* ---------------- finish & grade ---------------- */
  function confirmSubmit() {
    var t = testById(session.testId);
    var unanswered = t.questions.length - Object.keys(session.answers).length;
    var msg = unanswered > 0
      ? "You have " + unanswered + " unanswered question" + (unanswered === 1 ? "" : "s") + " (they will be marked wrong). Submit now?"
      : "Submit your answers and see your score?";
    if (window.confirm(msg)) finish(false);
  }

  function grade(s, t) {
    var byCat = {}, items = [], correct = 0;
    t.questions.forEach(function (q, i) {
      var your = s.answers[i];
      var isCorrect = your === q.answer;
      var skipped = your == null;
      if (isCorrect) correct++;
      if (!byCat[q.cat]) byCat[q.cat] = { correct: 0, total: 0 };
      byCat[q.cat].total++;
      if (isCorrect) byCat[q.cat].correct++;
      items.push({ q: q, your: your, correct: isCorrect, skipped: skipped });
    });
    var total = t.questions.length;
    return { correct: correct, total: total, pct: Math.round((correct / total) * 100), byCat: byCat, items: items };
  }

  function finish(expired) {
    if (!session) return;
    stopTimer();
    var s = session, t = testById(s.testId);
    var elapsedSec = Math.min(DURATION, Math.round((Date.now() - s.startedAt) / 1000));
    if (expired) elapsedSec = DURATION;
    var res = grade(s, t);
    res.testId = s.testId; res.expired = !!expired; res.elapsed = elapsedSec; res.date = Date.now();

    // persist best
    var best = getJSON(KEY.best, {});
    if (!best[s.testId] || res.pct > best[s.testId].pct) {
      best[s.testId] = { pct: res.pct, correct: res.correct, total: res.total, date: res.date };
      setJSON(KEY.best, best);
    }
    del(KEY.session);
    session = null;
    renderResults(t, res);
  }

  function abandon() {
    if (!session) return renderHome();
    if (window.confirm("Quit this test without scoring? Your progress will be discarded.")) {
      stopTimer(); del(KEY.session); session = null; renderHome();
    }
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

  function renderResults(t, res) {
    var b = band(res.pct);
    var body = $("results-body");
    body.innerHTML = "";

    var dial = el("div", { class: "dial", style: "--pct:" + res.pct }, [
      el("div", { class: "dial-inner" }, [
        el("div", { class: "dial-pct", text: res.pct + "%" }),
        el("div", { class: "dial-sub", text: res.correct + " / " + res.total + " correct" }),
      ]),
    ]);
    var hero = el("div", { class: "panel" }, [
      el("div", { class: "score-hero" }, [
        dial,
        el("div", { class: "score-meta" }, [
          el("p", { class: "muted", style: "margin:0", text: t.name + (res.expired ? " · time expired" : "") }),
          el("h1", { style: "margin:.1em 0", text: "Your result" }),
          el("span", { class: "band", style: "color:" + b.color + ";background:color-mix(in oklab," + b.color + " 16%, transparent)", text: b.label }),
          el("div", { class: "score-stats" }, [
            el("div", { class: "s", html: "<b>" + res.correct + "/" + res.total + "</b><span>Correct</span>" }),
            el("div", { class: "s", html: "<b>" + fmtTime(res.elapsed) + "</b><span>Time used</span>" }),
            el("div", { class: "s", html: "<b>" + (res.total - res.correct) + "</b><span>Missed</span>" }),
          ]),
        ]),
      ]),
    ]);
    body.appendChild(hero);

    // category breakdown
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

    // actions
    body.appendChild(el("div", { class: "cta-row" }, [
      el("button", { class: "btn btn-primary", type: "button", text: "↻ Retake this form", onclick: function () { renderIntro(res.testId); } }),
      el("button", { class: "btn", type: "button", text: "All tests", onclick: renderHome }),
    ]));

    // review with filter
    var listHost = el("div", { id: "review-list" });
    var filters = el("div", { class: "review-filter" });
    [["all", "All"], ["wrong", "Incorrect"], ["skipped", "Skipped"], ["correct", "Correct"]].forEach(function (f, idx) {
      filters.appendChild(el("button", {
        class: "btn btn-sm " + (idx === 0 ? "btn-primary" : "btn-ghost"), type: "button", text: f[1],
        onclick: function () {
          filters.querySelectorAll("button").forEach(function (x) { x.className = "btn btn-sm btn-ghost"; });
          this.className = "btn btn-sm btn-primary";
          drawReview(listHost, res, f[0]);
        },
      }));
    });
    body.appendChild(el("div", { class: "panel" }, [
      el("h2", { style: "margin-top:0", text: "Review answers" }),
      el("p", { class: "muted", style: "margin-top:-.5em", text: "See the worked answer for every question." }),
      filters, listHost,
    ]));
    drawReview(listHost, res, "all");

    show("results");
  }

  function drawReview(host, res, filter) {
    host.innerHTML = "";
    res.items.forEach(function (it, i) {
      var state = it.skipped ? "skipped" : (it.correct ? "correct" : "wrong");
      if (filter !== "all" && filter !== state) return;
      var q = it.q;
      var optEls = q.options.map(function (opt, oi) {
        var cls = "rv-opt";
        if (oi === q.answer) cls += " is-correct";
        if (oi === it.your && !it.correct) cls += " is-yours-wrong";
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
     global keyboard + wiring
     ============================================================ */
  document.addEventListener("keydown", function (e) {
    if (!$("screen-exam").classList.contains("active") || !session) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    var t = testById(session.testId);
    if (e.key >= "1" && e.key <= "9") {
      var idx = parseInt(e.key, 10) - 1;
      if (idx < t.questions[session.index].options.length) { e.preventDefault(); selectOption(idx); }
    } else if (e.key === "ArrowRight") { e.preventDefault(); gotoQuestion(session.index + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); gotoQuestion(session.index - 1); }
    else if (e.key === "f" || e.key === "F") { e.preventDefault(); toggleFlag(); }
  });

  window.addEventListener("beforeunload", function (e) {
    if (session && $("screen-exam").classList.contains("active")) {
      e.preventDefault(); e.returnValue = ""; // browsers show a generic "leave site?" prompt
    }
  });

  $("brand").addEventListener("click", function () {
    if (session && $("screen-exam").classList.contains("active")) { if (!window.confirm("Leave this test? You can resume it later from the list.")) return; }
    stopTimer(); renderHome();
  });
  $("exam-submit").addEventListener("click", confirmSubmit);
  $("exam-quit").addEventListener("click", abandon);

  /* ---------------- boot: resume if a live session exists ---------------- */
  (function boot() {
    var saved = getJSON(KEY.session, null);
    if (saved && testById(saved.testId)) {
      if (saved.deadline > Date.now()) { enterExam(saved); return; }
      // expired while away — grade what was answered
      session = saved; finish(true); return;
    }
    renderHome();
  })();
})();
