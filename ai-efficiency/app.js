/* ============================================================
   AI Efficiency Test — раннер и экран результатов.
   Один сценарий на экран, назад можно (это не тест на скорость —
   здесь меряется суждение, и обдумать ответ полезно, а не вредно).
   Ничего не отправляется наружу: всё считается в браузере.
   ============================================================ */
(function () {
  "use strict";
  var M = window.AIE_MODEL, QS = window.AIE_QUESTIONS, E = window.AIE_ENGINE;
  var root = document.getElementById("app");

  var LANG = "en";
  try { LANG = localStorage.getItem("aie:lang") || "en"; } catch (e) {}
  function L(o) { return o ? (o[LANG] != null ? o[LANG] : o.en) : ""; }
  function T(en, ru) { return LANG === "ru" ? ru : en; }
  function el(t, a, kids) {
    var n = document.createElement(t);
    if (a) Object.keys(a).forEach(function (k) {
      if (k === "class") n.className = a[k];
      else if (k === "html") n.innerHTML = a[k];
      else if (k === "text") n.textContent = a[k];
      else if (k.slice(0, 2) === "on" && typeof a[k] === "function") n.addEventListener(k.slice(2), a[k]);
      else if (a[k] != null) n.setAttribute(k, a[k]);
    });
    if (kids != null) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }

  var st = { role: null, items: [], idx: 0, answers: {} };

  function header() {
    return el("header", { class: "topbar", id: "topbar" }, [
      el("a", { class: "brand", href: "./index.html" }, [
        el("span", { class: "brand-mark", "aria-hidden": "true", text: "◎" }),
        el("span", { class: "brand-text" }, [
          el("strong", { text: T("AI Efficiency Test", "Тест на КПД с ИИ") }),
          el("small", { text: T("how well you actually work with AI", "насколько эффективно вы работаете с ИИ") }),
        ]),
      ]),
      el("nav", { class: "topnav" }, [
        el("a", { href: "../index.html", text: "Digital Aristotle" }),
        el("select", { class: "lang-select", "aria-label": "Language / Язык",
          onchange: function () { LANG = this.value; try { localStorage.setItem("aie:lang", LANG); } catch (e) {} render(); } },
          [opt("en", "English"), opt("ru", "Русский")]),
      ]),
    ]);
  }
  function opt(v, t) { var o = el("option", { value: v, text: t }); if (v === LANG) o.selected = true; return o; }

  function screen(inner) {
    root.innerHTML = "";
    root.appendChild(header());
    root.appendChild(el("main", { class: "container", id: "main" }, inner));
    window.scrollTo(0, 0);
  }

  /* ---------------- START ---------------- */
  function renderStart() {
    screen([
      el("div", { class: "bo-hero" }, [
        el("p", { class: "eyebrow", text: T("AI at work · efficiency check", "ИИ в работе · проверка КПД") }),
        el("h1", { text: T("How efficiently do you actually work with AI?", "Насколько эффективно вы работаете с ИИ?") }),
        el("p", { class: "lede", html: T(
          "Not a quiz about how AI works. Sixteen situations from your actual job — you choose what you would really do. It measures <strong>output per hour of your attention, and the risk that comes with it</strong>.",
          "Это не викторина о том, как устроен ИИ. Шестнадцать ситуаций из вашей настоящей работы — вы выбираете, что сделали бы на самом деле. Меряется <strong>результат на час вашего внимания и риск, который к нему прилагается</strong>.") }),
      ]),
      el("div", { class: "note" }, el("span", { html: T(
        "<strong>More AI is not the answer.</strong> The scale runs both ways: doing by hand what a machine does well costs you time, and trusting output that needed checking costs you something worse. Top marks go to matching the tool to the task — including the tasks where the right answer is not to use it.",
        "<strong>«Больше ИИ» — не ответ.</strong> Шкала здесь двусторонняя: делать руками то, с чем машина справится, стоит вам времени, а доверять непроверенному — стоит дороже. Максимум даёт попадание в задачу, включая те, где правильно ИИ не использовать вовсе.") })),
      el("h2", { class: "section-title", text: T("Pick your role", "Выберите роль") }),
      el("div", { class: "role-grid" }, M.roles.map(function (r) {
        return el("button", { class: "role-card", type: "button", onclick: function () { start(r); } }, [
          el("span", { class: "role-mark", "aria-hidden": "true", text: r.icon }),
          el("strong", { text: L(r.name) }),
          el("span", { class: "role-blurb", text: L(r.blurb) }),
          el("span", { class: "role-go", text: T("16 situations · ~12 min →", "16 ситуаций · ~12 мин →") }),
        ]);
      })),
      el("p", { class: "disclaimer", text: T(
        "Everything is scored in your browser. Nothing is uploaded, stored or sent anywhere.",
        "Всё считается в вашем браузере. Ничего не загружается, не сохраняется и никуда не отправляется.") }),
    ]);
  }

  function start(role) {
    st.role = role;
    st.items = E.pickList(QS, role.id);
    st.idx = 0; st.answers = {};
    renderItem();
  }

  /* ---------------- ITEM ---------------- */
  function renderItem() {
    var q = st.items[st.idx], n = st.items.length;
    var picked = st.answers[q.id];
    var dim = M.dimensions.filter(function (d) { return d.id === q.dim; })[0];

    screen([
      el("div", { class: "exam-topline" }, [
        el("span", { class: "q-count", text: L(st.role.name) }),
        el("span", { class: "q-count", text: (st.idx + 1) + " / " + n }),
      ]),
      el("div", { class: "cap-bar" }, el("span", { style: "width:" + Math.round(((st.idx + 1) / n) * 100) + "%" })),
      el("div", { class: "survey-q" }, [
        el("div", { class: "q-topic", text: dim ? L(dim.name) : "" }),
        el("div", { class: "q-prompt", text: L(q.prompt) }),
        el("p", { class: "muted choose-note", text: T("What would you actually do?", "Что бы вы сделали на самом деле?") }),
        el("div", { class: "card-grid one-col" }, q.options.map(function (o) {
          return el("button", {
            class: "opt-card" + (picked === o.id ? " on" : ""), type: "button",
            onclick: function () { st.answers[q.id] = o.id; next(); },
          }, el("span", { text: L(o.text) }));
        })),
      ]),
      el("div", { class: "cta-row" }, [
        st.idx > 0 ? el("button", { class: "btn btn-ghost", type: "button",
          onclick: function () { st.idx--; renderItem(); }, text: T("← Back", "← Назад") }) : null,
        el("button", { class: "btn btn-ghost", type: "button",
          onclick: function () { delete st.answers[q.id]; next(); }, text: T("Skip", "Пропустить") }),
      ]),
    ]);
  }
  function next() {
    // idx доводим до length: иначе render() после смены языка на экране
    // результатов считает, что мы всё ещё на последнем вопросе
    if (st.idx + 1 >= st.items.length) { st.idx = st.items.length; renderResult(); }
    else { st.idx++; renderItem(); }
  }

  /* ---------------- RESULT ---------------- */
  function renderResult() {
    var r = E.score(st.answers, st.items, M);
    var weak = E.weakest(r, M, 2);

    // ось калибровки: −1 … +1 → 0 … 100%
    var pos = Math.round(((r.calibration.lean + 1) / 2) * 100);

    screen([
      el("div", { class: "bo-hero" }, [
        el("p", { class: "eyebrow", text: L(st.role.name) }),
        el("h1", { text: T("Your AI efficiency", "Ваш КПД с ИИ") }),
      ]),

      /* — общий балл — */
      el("div", { class: "panel score-panel" }, [
        el("div", { class: "score-row" }, [
          el("div", { class: "score-big" }, [
            el("strong", { text: String(r.overall) }),
            el("span", { class: "score-of", text: "/100" }),
          ]),
          el("div", { class: "score-meta" }, [
            el("h2", { text: L(r.band.name) }),
            el("p", { class: "muted", text: L(r.band.note) }),
            el("p", { class: "muted small", text: T(
              "Best answer chosen on " + r.correct + " of " + r.total + " situations.",
              "Лучший вариант выбран в " + r.correct + " из " + r.total + " ситуаций.") }),
          ]),
        ]),
      ]),

      /* — калибровка: вторая ось — */
      el("h2", { class: "section-title", text: T("Calibration", "Калибровка") }),
      el("div", { class: "panel" }, [
        el("div", { class: "calib" }, [
          el("div", { class: "calib-track" }, [
            el("span", { class: "calib-mid", "aria-hidden": "true" }),
            el("span", { class: "calib-dot", style: "left:" + pos + "%" }),
          ]),
          el("div", { class: "calib-ends" }, [
            el("span", { text: T("Under-user", "Недоиспользование") }),
            el("span", { text: T("Balanced", "Баланс") }),
            el("span", { text: T("Over-truster", "Пере-доверие") }),
          ]),
        ]),
        el("p", { class: "calib-verdict" }, el("strong", { text: L(r.calibration.band.name) })),
        el("p", { class: "muted", text: L(r.calibration.band.note) }),
        el("p", { class: "disclaimer", text: T(
          "This axis is deliberately separate from the score. Two people can score the same and need opposite advice.",
          "Эта ось намеренно отделена от балла. Двое с одинаковым баллом могут нуждаться в противоположных советах.") }),
      ]),

      /* — измерения — */
      el("h2", { class: "section-title", text: T("Where it comes from", "Из чего это складывается") }),
      el("div", { class: "panel" }, M.dimensions.map(function (d) {
        var v = r.dims[d.id], b = r.dimBands[d.id];
        return el("div", { class: "dim-row" }, [
          el("div", { class: "dim-head" }, [
            el("strong", { text: L(d.name) }),
            el("span", { class: "dim-val " + (b ? b.id : "") , text: v == null ? "—" : v + "%" }),
          ]),
          el("div", { class: "dim-track" }, el("span", { class: b ? b.id : "", style: "width:" + (v || 0) + "%" })),
          el("p", { class: "muted small", text: L(d.blurb) }),
        ]);
      })),

      /* — что делать — */
      el("h2", { class: "section-title", text: T("Start here", "С чего начать") }),
      el("div", { class: "panel" }, [
        el("p", { class: "muted", text: T("Your two weakest axes, and the situations where they showed up:", "Две самые слабые оси и ситуации, где они проявились:") }),
        el("div", {}, weak.map(function (d) {
          var missed = r.perItem.filter(function (p) {
            return !p.skipped && !p.correct && itemById(p.id) && itemById(p.id).dim === d.id;
          });
          return el("div", { class: "mrow" }, [
            el("div", { class: "mrow-h" }, [
              el("b", { text: L(d.name) }),
              el("span", { class: "muted", text: " — " + (r.dims[d.id] == null ? "—" : r.dims[d.id] + "%") }),
            ]),
            el("p", { class: "muted small", text: L(d.blurb) }),
            missed.length
              ? el("p", { class: "muted small", text: T("Review: ", "Разобрать: ") + missed.map(function (p) { return p.id; }).join(", ") })
              : el("p", { class: "muted small", text: T("No misses here — this is relative, not a problem.", "Здесь промахов нет — это относительная слабость, а не проблема.") }),
          ]);
        })),
      ]),

      /* — разбор по вопросам — */
      el("h2", { class: "section-title", text: T("Every situation, reviewed", "Разбор каждой ситуации") }),
      el("div", { class: "panel" }, r.perItem.map(function (p) {
        var q = itemById(p.id); if (!q) return null;
        var chosen = optById(q, p.chosen), best = optById(q, p.best);
        var tag = p.skipped ? "na" : (p.correct ? "clean" : "review");
        var tagText = p.skipped ? T("skipped", "пропущено") : (p.correct ? T("best answer", "лучший ответ") : T("review", "разобрать"));
        return el("details", { class: "deep" + (p.correct ? "" : " miss") }, [
          el("summary", {}, [
            el("span", { class: "tag-badge " + tag, text: tagText }),
            el("span", { text: " " + p.id + " · " + L(q.prompt).slice(0, 80) + (L(q.prompt).length > 80 ? "…" : "") }),
          ]),
          el("div", { class: "deep-body" }, [
            el("p", { class: "q-prompt small", text: L(q.prompt) }),
            chosen ? el("div", { class: "q-ans" }, [
              el("b", { text: T("You chose: ", "Ваш выбор: ") }), el("span", { text: L(chosen.text) }),
              el("p", { class: "muted", text: L(chosen.why) }),
            ]) : null,
            (!p.correct && best) ? el("div", { class: "q-ans good-ans" }, [
              el("b", { text: T("Strongest answer: ", "Самый сильный ответ: ") }), el("span", { text: L(best.text) }),
              el("p", { class: "muted", text: L(best.why) }),
            ]) : null,
          ]),
        ]);
      })),

      el("div", { class: "cta-row" }, [
        el("button", { class: "btn btn-primary", type: "button", onclick: renderStart,
          text: T("Take another role's test", "Пройти тест другой роли") }),
        el("button", { class: "btn btn-ghost", type: "button", onclick: function () { window.print(); },
          text: T("Print / PDF", "Печать / PDF") }),
      ]),
      el("p", { class: "disclaimer", text: T(
        "Thresholds are judgement-based, not norm-referenced against a measured population. Read the dimension bars and the calibration axis, not the headline number alone.",
        "Пороги основаны на экспертном суждении, а не на нормах по измеренной популяции. Читайте полоски измерений и ось калибровки, а не одно итоговое число.") }),
    ]);
  }

  function itemById(id) { for (var i = 0; i < st.items.length; i++) if (st.items[i].id === id) return st.items[i]; return null; }
  function optById(q, id) { if (!q || !id) return null; for (var i = 0; i < q.options.length; i++) if (q.options[i].id === id) return q.options[i]; return null; }

  function render() { if (!st.role) renderStart(); else if (st.idx < st.items.length) renderItem(); else renderResult(); }
  renderStart();
})();
