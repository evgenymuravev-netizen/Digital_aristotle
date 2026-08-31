/* ============================================================
   Опрос по контурам — движок прохождения (runner).
   Один вопрос на экране, жёсткий кап с автопереходом, назад нельзя,
   пропуск = данные, пишется латентность. По завершении — НЕ оценка,
   а выгрузка ответа для фасилитатора.
   ============================================================ */
(function () {
  "use strict";
  var S = window.SURVEY, CFG = window.CONTOURS_CONFIG || { minN: 5, submitEndpoint: "", org: {} };
  var root = document.getElementById("app");

  var LANG = "ru";
  try { LANG = localStorage.getItem("contours:lang") || "ru"; } catch (e) {}
  function L(o) { return o ? (o[LANG] != null ? o[LANG] : o.ru) : ""; }
  function U(k, vars) { var s = L(S.ui[k]); return vars ? s.replace(/\{(\w+)\}/g, function (m, n) { return vars[n] != null ? vars[n] : m; }) : s; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function el(t, a, kids) { var n = document.createElement(t); if (a) Object.keys(a).forEach(function (k) { if (k === "class") n.className = a[k]; else if (k === "html") n.innerHTML = a[k]; else if (k === "text") n.textContent = a[k]; else if (k.slice(0, 2) === "on" && typeof a[k] === "function") n.addEventListener(k.slice(2), a[k]); else if (a[k] != null) n.setAttribute(k, a[k]); }); if (kids != null) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) { if (c == null) return; n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return n; }

  function subst(str) {
    var org = CFG.org || {};
    return String(str)
      .replace(/\{goal\}/g, org.strategyGoal || "стратегической цели")
      .replace(/\{metric\}/g, org.keyMetric || "ключевой метрики")
      .replace(/\{value1\}/g, (org.values && org.values[0]) || "ценности");
  }
  function optList(key) { return (CFG[key] || []).map(function (o) { return { id: o.id, label: L(o) }; }); }

  /* ---- flatten items in fixed order ---- */
  var ITEMS = [];
  S.blocks.forEach(function (b) { b.items.forEach(function (it) { ITEMS.push(Object.assign({ block: b.id }, it)); }); });
  var TYPE = {}; ITEMS.forEach(function (it) { TYPE[it.id] = it.type; });

  var st = { groupKey: "", isLeader: false, segment: { stage: "", func: "", loc: "" }, life: "", idx: 0, answers: {}, startedAt: null };
  var timer = null, itemStart = 0, latency = null, itemBlock = null;

  /* ---- header ---- */
  function header() {
    return el("header", { class: "topbar", id: "topbar" }, [
      el("div", { class: "brand" }, [
        el("span", { class: "brand-mark", "aria-hidden": "true", text: "◎" }),
        el("span", { class: "brand-text" }, [el("strong", { text: U("brand") }), el("small", { text: U("tagline") })]),
      ]),
      el("select", { class: "lang-select", "aria-label": "Language / Язык",
        onchange: function () { LANG = this.value; try { localStorage.setItem("contours:lang", LANG); } catch (e) {} boot(); } },
        [optionEl("ru", "Русский"), optionEl("en", "English")]),
    ]);
  }
  function optionEl(v, t) { var o = el("option", { value: v, text: t }); if (v === LANG) o.selected = true; return o; }

  function screen(inner) { root.innerHTML = ""; root.appendChild(header()); root.appendChild(el("main", { class: "container", id: "main" }, inner)); var s = document.getElementById("lang-select"); if (s) s.value = LANG; }

  /* ---- START ---- */
  function renderStart() {
    stopTimer();
    var key = el("input", { class: "code-input", id: "gk", value: st.groupKey, placeholder: U("groupKeyPh") });
    var lead = el("input", { type: "checkbox", id: "lead" }); if (st.isLeader) lead.checked = true;
    var stage = el("select", { class: "code-input", id: "seg-stage" }, [
      optPlain("", "—"), optPlain("lt6", LANG === "ru" ? "до 6 мес" : "< 6 mo"), optPlain("6-24", "6–24"), optPlain("24+", "24+")]);
    // Срезы — только крупные фиксированные корзины (анонимность). Свободный текст убран.
    function segSelect(dim, id, cur) {
      var list = (CFG.segments && CFG.segments[dim]) || null; if (!list || !list.length) return null;
      var sel = el("select", { class: "code-input", id: id }, [optPlain("", "—")].concat(list.map(function (o) {
        var op = el("option", { value: o.id, text: L(o) }); if (o.id === cur) op.selected = true; return op;
      })));
      return sel;
    }
    var fn = segSelect("func", "seg-func", st.segment.func);
    var loc = segSelect("loc", "seg-loc", st.segment.loc);
    // тип группы: временная → ведущий показатель канон, долгоживущая → IoA
    var life = el("select", { class: "code-input", id: "life" }, [
      optPlain("", "—"), optPlain("temp", U("life_temp")), optPlain("mid", U("life_mid")), optPlain("long", U("life_long"))]);
    var msg = el("p", { class: "unlock-msg bad", id: "start-msg" });

    screen([
      el("div", { class: "bo-hero" }, [
        el("p", { class: "eyebrow", text: L(S.blocks[0].title).split(" —")[0] + " · " + L(S.blocks[1].title).split(" —")[0] }),
        el("h1", { text: U("start_h") }),
        el("p", { class: "lede", html: U("intro") }),
        el("p", { class: "muted", text: U("anon") }),
        el("p", { class: "muted", style: "font-size:.82rem", text: U("consent") }),
      ]),
      el("div", { class: "panel" }, [
        el("label", { class: "field" }, [el("span", { text: U("groupKey") }), key]),
        el("div", { class: "seg-grid" }, [
          el("label", { class: "field" }, [el("span", { text: U("seg_stage") }), stage]),
          fn ? el("label", { class: "field" }, [el("span", { text: U("seg_func") }), fn]) : null,
          loc ? el("label", { class: "field" }, [el("span", { text: U("seg_loc") }), loc]) : null,
        ]),
        el("p", { class: "muted", style: "margin:-6px 0 10px;font-size:.82rem", text: U("seg_optional") }),
        el("label", { class: "field" }, [el("span", { text: U("life") }), life]),
        el("label", { class: "switch" }, [lead, el("span", { text: U("leader") })]),
        el("div", { class: "cta-row", style: "margin-top:16px" }, [
          el("button", { class: "btn btn-primary btn-lg", type: "button", onclick: function () {
            var k = key.value.trim(); if (!k) { msg.textContent = U("needKey"); return; }
            st.groupKey = k; st.isLeader = lead.checked; st.life = life.value;
            st.segment = { stage: stage.value, func: fn ? fn.value : "", loc: loc ? loc.value : "" };
            st.startedAt = Date.now(); st.idx = 0; st.answers = {};
            renderItem(0);
          }, text: U("begin") }),
        ]),
        msg,
      ]),
    ]);
  }
  function optPlain(v, t) { return el("option", { value: v, text: t }); }

  /* ---- ITEM ---- */
  // эффективный кап: базовое время вопроса × config.capFactor (настройка темпа волны)
  function effCap(it) { var f = CFG.capFactor > 0 ? CFG.capFactor : 1; return Math.round(it.cap * f); }

  function renderItem(i) {
    stopTimer();
    if (i >= ITEMS.length) return finish();
    st.idx = i; var it = ITEMS[i]; itemBlock = it.block; latency = null; itemStart = Date.now();
    var cap = effCap(it);
    var body = el("div", { id: "answer" });
    buildInput(it, body);

    var capWrap = el("div", { class: "cap" }, [
      el("div", { class: "cap-num", id: "cap-num", text: cap + "s" }),
      el("div", { class: "cap-bar" }, el("span", { id: "cap-fill", style: "width:100%" })),
    ]);

    screen([
      el("div", { class: "exam-topline" }, [
        el("span", { class: "q-count", text: "A".indexOf(it.block) === 0 ? it.block : it.block, }),
        el("span", { class: "q-count", text: (i + 1) + " / " + ITEMS.length }),
        el("span", { class: "muted nb", text: "· " + U("noBack") }),
      ]),
      capWrap,
      el("div", { class: "survey-q" }, [
        el("div", { class: "q-topic", "data-cat": it.block === "A" ? "apis" : "messaging", text: (it.block === "A" ? L(S.blocks[0].title) : L(S.blocks[1].title)) }),
        el("div", { class: "q-prompt", html: subst(L(it.prompt)) }),
        body,
      ]),
      el("div", { class: "cta-row", style: "margin-top:6px" }, [
        el("button", { class: "btn btn-primary", type: "button", onclick: function () { finishItem(false); } , text: U("next") }),
        el("button", { class: "btn btn-ghost", type: "button", onclick: function () { finishItem(true); }, text: U("skip") }),
      ]),
    ]);
    // latency: first interaction
    var onFirst = function () { if (latency == null) latency = Date.now() - itemStart; };
    document.getElementById("answer").addEventListener("input", onFirst, true);
    document.getElementById("answer").addEventListener("click", onFirst, true);
    startTimer(cap);
  }

  function buildInput(it, host) {
    if (it.type === "open" || it.type === "name") {
      host.appendChild(it.one || it.type === "name"
        ? el("input", { class: "code-input", id: "in", placeholder: L(it.ph) || "" })
        : el("textarea", { class: "code-input", id: "in", rows: effCap(it) > 60 ? "4" : "3", placeholder: L(it.ph) || "" }));
    } else if (it.type === "scale") {
      var row = el("div", { class: "scale-row", id: "in" });
      for (var v = 1; v <= 5; v++) (function (val) { row.appendChild(el("button", { type: "button", class: "scale-btn", "data-v": val, text: String(val),
        onclick: function () { Array.prototype.forEach.call(row.children, function (c) { c.classList.remove("on"); }); this.classList.add("on"); } })); })(v);
      host.appendChild(el("div", { class: "scale-wrap" }, [el("span", { class: "muted", text: L(it.low) }), row, el("span", { class: "muted", text: L(it.high) })]));
    } else if (it.type === "forced") {
      var fr = el("div", { class: "forced-row", id: "in" });
      [["a", it.a], ["b", it.b]].forEach(function (p) { fr.appendChild(el("button", { type: "button", class: "forced", "data-v": p[0], text: L(p[1]),
        onclick: function () { Array.prototype.forEach.call(fr.children, function (c) { c.classList.remove("on"); }); this.classList.add("on"); } })); });
      host.appendChild(fr);
    } else if (it.type === "multi" || it.type === "single") {
      var opts = it.options ? it.options.map(function (o) { return { id: o.id, label: L(o) }; }) : optList(it.opt);
      var grid = el("div", { class: "card-grid", id: "in" }), self = it;
      opts.forEach(function (o) { grid.appendChild(el("button", { type: "button", class: "opt-card", "data-id": o.id, text: o.label,
        onclick: function () { toggleCard(self, grid, this); } })); });
      host.appendChild(grid);
      if (it.type === "multi") host.appendChild(el("p", { class: "muted choose-note", id: "choose-note", text: U("chooseN", { n: it.choose }) }));
      if (it.own) host.appendChild(el("input", { class: "code-input own-in", id: "own", placeholder: U("ownPh"), style: "margin-top:10px" }));
    } else if (it.type === "assoc") {
      var vals = (CFG.org && CFG.org.values) || ["A", "B", "C"], wrap = el("div", { class: "assoc-grid", id: "in" });
      vals.slice(0, 3).forEach(function (v, vi) {
        var trio = el("div", { class: "assoc-cell" }, [el("b", { text: v })]);
        for (var w = 0; w < 3; w++) trio.appendChild(el("input", { class: "code-input assoc-w", "data-v": String(vi), placeholder: (w + 1) + "…" }));
        wrap.appendChild(trio);
      });
      host.appendChild(wrap);
    }
  }
  function toggleCard(it, grid, btn) {
    if (it.type === "single") { Array.prototype.forEach.call(grid.children, function (c) { c.classList.remove("on"); }); btn.classList.add("on"); return; }
    var on = grid.querySelectorAll(".on").length;
    if (btn.classList.contains("on")) btn.classList.remove("on");
    else if (on < it.choose) btn.classList.add("on");
    var note = document.getElementById("choose-note"); if (note) note.textContent = U("chosen", { k: grid.querySelectorAll(".on").length, n: it.choose });
  }

  function readValue(it) {
    var box = document.getElementById("in");
    if (it.type === "open" || it.type === "name") { var v = (document.getElementById("in").value || "").trim(); return v || null; }
    if (it.type === "scale") { var s = box.querySelector(".on"); return s ? parseInt(s.getAttribute("data-v"), 10) : null; }
    if (it.type === "forced") { var f = box.querySelector(".on"); return f ? f.getAttribute("data-v") : null; }
    if (it.type === "single") { var c = box.querySelector(".on"), own = document.getElementById("own"); if (c) return c.getAttribute("data-id"); if (own && own.value.trim()) return "own:" + own.value.trim(); return null; }
    if (it.type === "multi") { var ids = Array.prototype.map.call(box.querySelectorAll(".on"), function (c) { return c.getAttribute("data-id"); }); var own = document.getElementById("own"); if (own && own.value.trim()) ids.push("own:" + own.value.trim()); return ids.length ? ids : null; }
    if (it.type === "assoc") { var out = {}, vals = (CFG.org && CFG.org.values) || []; box.querySelectorAll(".assoc-w").forEach(function (inp) { var vi = inp.getAttribute("data-v"), key = vals[vi] || vi; (out[key] = out[key] || []).push((inp.value || "").trim()); }); var any = Object.keys(out).some(function (k) { return out[k].some(function (w) { return w; }); }); return any ? out : null; }
    return null;
  }

  function finishItem(forceSkip) {
    var it = ITEMS[st.idx];
    var val = forceSkip ? null : readValue(it);
    st.answers[it.id] = { value: val, skipped: val == null, latencyMs: latency, spentMs: Date.now() - itemStart };
    renderItem(st.idx + 1);
  }

  /* ---- timer ---- */
  function startTimer(cap) {
    var end = Date.now() + cap * 1000, fill = document.getElementById("cap-fill"), num = document.getElementById("cap-num");
    timer = setInterval(function () {
      var rem = Math.max(0, end - Date.now()), pct = Math.max(0, (rem / (cap * 1000)) * 100);
      if (fill) fill.style.width = pct + "%";
      if (num) num.textContent = Math.ceil(rem / 1000) + "s";
      if (rem <= 0) { stopTimer(); finishItem(false); }
      else if (rem <= 5000 && fill) fill.classList.add("danger");
    }, 100);
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  /* ---- DONE ---- */
  function finish() {
    stopTimer();
    // Анонимность: из выгружаемой записи убираем поминутную латентность/время на
    // вопрос (это отпечаток «кто заполнял в 14:32») и огрубляем метки времени до
    // суток. Для метрик дисперсии поминутные тайминги не нужны.
    function dayFloor(ts) { var d = new Date(ts || Date.now()); d.setHours(0, 0, 0, 0); return d.getTime(); }
    var cleanAnswers = {};
    Object.keys(st.answers).forEach(function (k) { var a = st.answers[k]; cleanAnswers[k] = { value: a.value, skipped: a.skipped };
      if (TYPE[k] === "open") cleanAnswers[k].open = 1; }); // метка для бэкенда: этот текст кодируется ИИ и не хранится
    var payload = {
      v: 2, survey: S.meta.id + "-" + S.meta.version, groupKey: st.groupKey, isLeader: st.isLeader,
      segment: st.segment, life: st.life, lang: LANG, startedAt: dayFloor(st.startedAt), finishedAt: dayFloor(Date.now()), answers: cleanAnswers,
    };
    var json = JSON.stringify(payload, null, 0);
    var submitMsg = el("p", { class: "muted", id: "submit-msg" });
    // optional POST
    if (CFG.submitEndpoint) {
      try { fetch(CFG.submitEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: json })
        .then(function (r) { submitMsg.textContent = r.ok ? U("submitted") : U("submitFail"); submitMsg.className = "muted " + (r.ok ? "good" : "bad"); })
        .catch(function () { submitMsg.textContent = U("submitFail"); submitMsg.className = "muted bad"; }); } catch (e) {}
    }
    screen([
      el("div", { class: "bo-hero" }, [
        el("p", { class: "eyebrow", text: "✓" }),
        el("h1", { text: U("done_h") }),
        el("p", { class: "lede", html: U("done_note") }),
      ]),
      el("div", { class: "panel" }, [
        el("div", { class: "cta-row" }, [
          el("button", { class: "btn btn-primary", type: "button", onclick: function () {
            var blob = new Blob([json], { type: "application/json" });
            var rand = Math.random().toString(36).slice(2, 8);
            var a = el("a", { href: URL.createObjectURL(blob), download: "contours-" + st.groupKey + "-" + rand + ".json" });
            document.body.appendChild(a); a.click(); a.remove();
          }, text: U("download") }),
          el("a", { class: "btn btn-ghost", href: "./report.html", text: U("facil_link") }),
        ]),
        CFG.submitEndpoint ? submitMsg : null,
      ]),
    ]);
  }

  function boot() { if (st.startedAt && st.idx < ITEMS.length && st.idx >= 0 && Object.keys(st.answers).length < ITEMS.length) renderItem(st.idx); else renderStart(); }
  boot();
})();
