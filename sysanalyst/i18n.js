/* ============================================================
   SAA — i18n (English / Русский)

   Two layers:
   1. STATIC — elements tagged data-i18n / data-i18n-html on the
      landing page are swapped from a dictionary (English captured
      from the DOM as the baseline).
   2. ENGINE — the app renders its UI (exam, results, dialogs, etc.)
      in English at runtime. When Russian is selected, a MutationObserver
      localizes that rendered content in place (exact strings, regex
      rules for dynamic bits, and a few whole-sentence rules), and
      restores English when switched back. This needs no engine changes.

   Question CONTENT (prompts, options, the worked "why") stays in English —
   that is a separate content-translation effort.
   ============================================================ */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var LANG_KEY = "saa:v1:lang";
  var LANG = "en";

  /* ---------------- 1. STATIC landing dictionary ---------------- */
  var DICT = {
    ru: {
      "nav.guide": "Руководство",
      "nav.profile": "Ваш профиль",
      "nav.employers": "Работодателям",
      "nav.leaderboard": "Рейтинг",
      "nav.support": "Поддержка",

      "home.eyebrow": "Системный аналитик · проверка знаний",
      "home.h1": "Оценка системного аналитика — практика онлайн",
      "home.lede": "Проверка знаний для <strong>системных, интеграционных и технических аналитиков</strong>. Она оценивает, насколько хорошо вы разбираетесь в <strong>API и REST</strong>, <strong>протоколах</strong> (SOAP, gRPC, GraphQL, WebSockets), <strong>модели OSI</strong> и сетях, <strong>RabbitMQ и обмене сообщениями</strong>, а также <strong>базах данных</strong>. Начните с бесплатного полного теста, узнайте свои сильные и слабые стороны, а затем пройдите десять тестов на время.",
      "home.cta.start": "▶ Начать бесплатный 15-минутный тест",
      "home.cta.guide": "📘 Учебное руководство — основы",

      "how.title": "Как это работает",
      "how.li1": "<b>Бесплатный полный тест:</b> 25 вопросов по всем пяти областям за полные 15 минут — без регистрации, не урезанная версия.",
      "how.li2": "<b>Ещё десять тестов:</b> по 20 вопросов за 15 минут, от простого к сложному, по всем областям.",
      "how.li3": "<b>Перемешивание:</b> типы вопросов чередуются, поэтому похожие вопросы не идут подряд.",
      "how.li4": "<b>Адаптивность:</b> по вашим результатам формируется персональный раунд из тем, где вы чаще ошибаетесь.",
      "how.note": "Все вопросы оригинальные и независимы от вендоров, отражают повседневные знания практикующего системного аналитика. Для самопроверки и подготовки к собеседованиям — не связано ни с одним сертификационным органом.",

      "why.title": "Почему стоит практиковаться здесь?",
      "why.c1.h": "Создано для аналитиков",
      "why.c1.p": "Не общая викторина — именно те задачи по проектированию API, протоколам, OSI, обмену сообщениями и базам данных, которые системный аналитик решает на работе, с разбором удачных и неудачных решений.",
      "why.c2.h": "По-настоящему адаптивно",
      "why.c2.p": "После трёх тестов открывается <b>персональный тест</b>, составленный только из тем, где вы слабее всего, — а не тот же типовой набор для всех.",
      "why.c3.h": "Обучение, а не просто оценка",
      "why.c3.p": "Каждый результат раскладывает вашу <b>скорость и точность</b> по темам, с углублённым «почему» для каждого неверного ответа — чтобы вы понимали концепцию, а не просто запоминали ответ.",

      "cmp.caption": "Сравнение этой оценки с типичными сайтами-викторинами",
      "cmp.h.feature": "Возможность",
      "cmp.h.this": "Эта оценка",
      "cmp.h.typical": "Типичные викторины",
      "cmp.r1.k": "Направленность", "cmp.r1.a": "Основы системного анализа, от и до", "cmp.r1.b": "Разрозненные викторины по одной теме",
      "cmp.r2.k": "Цена", "cmp.r2.a": "$17.99 разово", "cmp.r2.b": "$30–$60 или регулярная подписка",
      "cmp.r3.k": "Бесплатный полный тест", "cmp.r3.a": "Полный 15-мин тест, без регистрации", "cmp.r3.b": "Несколько примеров вопросов",
      "cmp.r4.k": "Персональный тест (по слабым темам)", "cmp.r4.a": "Да — после 3 тестов", "cmp.r4.b": "Редко",
      "cmp.r5.k": "Углублённое «почему» для каждого вопроса", "cmp.r5.a": "Да — разбирает именно ваш неверный выбор", "cmp.r5.b": "Одна строка ответа, если есть",
      "cmp.r6.k": "Анализ скорости и точности", "cmp.r6.a": "Профиль по темам", "cmp.r6.b": "Только балл",
      "cmp.r7.k": "Симуляция на 15 минут", "cmp.r7.a": "Да", "cmp.r7.b": "Обычно без таймера",
      "cmp.r8.k": "Учебное руководство", "cmp.r8.a": "Бесплатное и подробное", "cmp.r8.b": "Платное дополнение",
      "cmp.note": "Сравнение отражает типичные платные сайты викторин/подготовки; возможности и цены зависят от провайдера и региона.",

      "forms.title": "Десять полных тестов",
      "forms.sub": "Каждый — независимый тест на 15 минут с вопросами возрастающей сложности по всем пяти областям. Ваш лучший результат по каждому тесту сохраняется на этом устройстве.",

      "footer": "Оригинальная, независимая от вендоров оценка системного аналитика — часть проекта Digital Aristotle. Все вопросы оригинальны, а результаты остаются в вашем браузере. Названия продуктов и технологий (RabbitMQ, Kafka, GraphQL и др.) упоминаются только для описания.",
    },
  };
  var base = {};
  function staticEls() { return document.querySelectorAll("[data-i18n],[data-i18n-html]"); }
  function keyOf(el) { return el.getAttribute("data-i18n") || el.getAttribute("data-i18n-html"); }
  function isHtml(el) { return el.hasAttribute("data-i18n-html"); }
  function captureStatic() { var l = staticEls(), i, el, k; for (i = 0; i < l.length; i++) { el = l[i]; k = keyOf(el); if (!(k in base)) base[k] = isHtml(el) ? el.innerHTML : el.textContent; } }
  function applyStatic(lang) {
    var d = DICT[lang] || null, l = staticEls(), i, el, k, v;
    for (i = 0; i < l.length; i++) { el = l[i]; k = keyOf(el); v = (d && d[k] != null) ? d[k] : base[k]; if (v == null) continue; if (isHtml(el)) el.innerHTML = v; else el.textContent = v; }
  }

  /* ---------------- 2. ENGINE (runtime UI) dictionary ---------------- */
  // exact full text-node strings
  var ENG = {
    // home / dashboard / cards / intro
    "🔒 Unlock": "🔒 Открыть", "Resume": "Продолжить", "Retake": "Пройти снова", "Start": "Начать",
    "Your skills snapshot": "Ваш профиль навыков", "Weakest topics:": "Слабые темы:",
    "Before you start": "Перед началом", "Back": "Назад",
    "🎯 Start your personalized test": "🎯 Начать персональный тест", "🎯 Personalized test": "🎯 Персональный тест",
    "🎯 Answer a few more so we can map your weak spots": "🎯 Пройдите ещё немного, чтобы мы определили ваши слабые места",
    "Take another test to unlock →": "Пройдите ещё тест, чтобы открыть →", "Best:": "Лучший:",
    "Unanswered questions count as wrong, so always make your best guess.": "Пропущенные вопросы считаются неверными — всегда давайте наиболее вероятный ответ.",
    "Free full test": "Бесплатный полный тест",
    // exam
    "← Previous": "← Назад", "Next →": "Далее →", "Review & submit": "Проверить и отправить",
    "Question navigator": "Навигатор по вопросам", "Submit": "Отправить", "Assessment": "Тест",
    "Answered": "Отвечено", "Not answered": "Без ответа", "Flagged for review": "Отмечено для проверки",
    "✕ Quit without scoring": "✕ Выйти без сохранения",
    "System Analyst": "Системный аналитик", "Adaptive practice": "Адаптивная практика",
    // dialogs
    "Submit test?": "Отправить тест?", "Submit now": "Отправить сейчас", "Keep working": "Продолжить",
    "Quit without scoring?": "Выйти без оценки?", "Your progress on this test will be discarded.": "Ваш прогресс по этому тесту будет удалён.",
    "Quit": "Выйти", "Stay": "Остаться", "Leave this test?": "Покинуть тест?", "Leave": "Покинуть",
    "You can resume it later from the list — your time keeps running.": "Вы сможете вернуться к нему позже из списка — время продолжает идти.",
    // signs
    "⏱ 5 minutes gone — keep up the pace": "⏱ Прошло 5 минут — держите темп",
    "⏱ 10 minutes gone — 5 minutes to go": "⏱ Прошло 10 минут — осталось 5",
    "⏳ 1 minute left!": "⏳ Осталась 1 минута!",
    // results — celebration / bands / percentile
    "Time's up — nice try!": "Время вышло — хорошая попытка!", "Exceptional!": "Исключительно!",
    "Impressive!": "Впечатляюще!", "Above average!": "Выше среднего!", "Solid effort!": "Достойный результат!",
    "Exceptional agility": "Исключительная подготовка", "Strong": "Сильно", "Above average": "Выше среднего",
    "Average": "Средне", "Below average": "Ниже среднего", "Needs practice": "Нужна практика",
    "percentile (est.)": "перцентиль (оц.)", "Your result": "Ваш результат",
    "Estimated from a normal model calibrated to this assessment's difficulty — a guide to gauge yourself against a typical test-taker, not an official benchmark.": "Оценка по нормальной модели, откалиброванной под сложность этого теста, — ориентир, чтобы сравнить себя с типичным участником, а не официальный эталон.",
    // results — profile / recs / review
    "By category": "По областям", "Speed & accuracy profile": "Профиль скорости и точности",
    "Topic": "Тема", "Avg time": "Ср. время", "Accuracy": "Точность", "Verdict": "Оценка",
    "Strength": "Сильная сторона", "Too slow": "Слишком медленно", "Rushing": "Спешка", "Needs work": "Нужно подтянуть",
    "Where to focus next": "На чём сосредоточиться дальше",
    "Do a couple more tests and we'll pinpoint your weak topics.": "Пройдите ещё пару тестов, и мы точно определим ваши слабые темы.",
    "↻ Retake this form": "↻ Пройти этот тест снова", "All tests": "Все тесты",
    "Review answers": "Разбор ответов",
    "Showing your incorrect answers first — use the filters to see the rest.": "Сначала показаны неверные ответы — используйте фильтры, чтобы увидеть остальные.",
    "Nothing in this category.": "В этой категории ничего нет.", "Why:": "Почему:",
    "⚑ Report broken logic": "⚑ Сообщить об ошибке в вопросе",
    "Near miss 🎯": "Почти 🎯", "Close": "Близко", "Off": "Мимо",
    // NPS
    "One quick question": "Один короткий вопрос",
    "How likely are you to recommend this test to a friend or colleague?": "Насколько вероятно, что вы порекомендуете этот тест другу или коллеге?",
    "0 · Not likely": "0 · Вряд ли", "Very likely · 10": "Точно да · 10", "Skip": "Пропустить",
    // share
    "Share your result": "Поделитесь результатом", "Share…": "Поделиться…", "Copy result": "Скопировать результат",
    // leaderboard
    "Leaderboard": "Рейтинг", "🏆 All-time leaderboard": "🏆 Рейтинг за всё время", "Loading…": "Загрузка…",
    "← Back": "← Назад", "No scores yet — finish a test and add yours!": "Пока нет результатов — пройдите тест и добавьте свой!",
    "Name": "Имя", "Test": "Тест", "Score": "Балл", "Add my score": "Добавить мой результат",
    "View leaderboard →": "Открыть рейтинг →", "🏆 Add your score to the leaderboard": "🏆 Добавьте свой результат в рейтинг",
    "See how you rank against everyone else.": "Посмотрите, как вы выглядите на фоне остальных.", "View board": "Открыть рейтинг",
    // paywall
    "Full Access": "Полный доступ", "Unlock all 10 tests + guides": "Откройте все 10 тестов + руководства",
    "One-time payment, lifetime access — about five times cheaper than the big aptitude-prep sites. The 5-minute taster stays free.": "Разовая оплата, доступ навсегда. Бесплатный тест остаётся бесплатным.",
    "Best value": "Выгоднее всего", "Unlock": "Открыть", "Checkout coming soon": "Оплата скоро появится",
    "System Analyst Assessment — Full Access": "Оценка системного аналитика — полный доступ",
    "one-time payment · all 10 assessments + strategy guide · lifetime access": "разовая оплата · все 10 тестов + руководство · доступ навсегда",
    "or a monthly plan — cancel anytime": "или ежемесячная подписка — отмена в любой момент",
    // auth / support
    "Sign out": "Выйти", "Sign in with Google": "Войти через Google",
    "Support": "Поддержка", "Contact support": "Связаться с поддержкой",
    "Question, bug, or refund request? Send a message and we'll reply by email.": "Вопрос, ошибка или возврат средств? Напишите нам, и мы ответим по электронной почте.",
    "Email": "Эл. почта", "Subject": "Тема", "Message": "Сообщение", "Send message": "Отправить сообщение",
    "Your tickets": "Ваши обращения", "Your submitted tickets will be listed here.": "Здесь появятся отправленные вами обращения.",
  };

  // regex rules on trimmed text (string or function replacement)
  var RU_PLURAL = function (n, one, few, many) { n = Math.abs(+n) % 100; var d = n % 10; if (n > 10 && n < 20) return many; if (d === 1) return one; if (d >= 2 && d <= 4) return few; return many; };
  var RX = [
    [/^Question (\d+) of (\d+)$/, "Вопрос $1 из $2"],
    [/^▶ Start — (.+) clock$/, "▶ Начать — $1 на часах"],
    [/^🎯 Personalized test unlocks after (\d+) more tests?$/, function (m, n) { return "🎯 Персональный тест откроется ещё через " + n + " " + RU_PLURAL(n, "тест", "теста", "тестов"); }],
    [/^All \((\d+)\)$/, "Все ($1)"],
    [/^Incorrect \((\d+)\)$/, "Неверные ($1)"],
    [/^Skipped \((\d+)\)$/, "Пропущенные ($1)"],
    [/^Correct \((\d+)\)$/, "Верные ($1)"],
    [/^overall · (\d+) answered$/, "всего · $1 отвечено"],
    [/^(\d+) of 3 tests$/, "$1 из 3 тестов"],
    [/^vs the ~(\d+)% average$/, "относительно ~$1% в среднем"],
    [/^([+-]?\d+) pts$/, "$1 очк."],
    [/^(\d+)(?:st|nd|rd|th)$/, "$1-й"],
    [/^⏱ (\d+)s( · revisited)?$/, function (m, s, rev) { return "⏱ " + s + "с" + (rev ? " · повторно" : ""); }],
    [/^System Analyst · (\d+) questions$/, "Системный аналитик · $1 вопросов"],
    [/^Adaptive practice · (\d+) questions$/, "Адаптивная практика · $1 вопросов"],
    [/^Your personalized test — weakest topics$/, "Ваш персональный тест — слабые темы"],
    [/^Test (\d+)$/, "Тест $1"],
  ];

  // whole-sentence (innerHTML) rules for elements with inline markup
  var CONTAINERS = [
    { sel: ".celebrate-sub", fn: function (h) { var m = h.match(/^You scored <b>(.+?)<\/b> — better than an estimated <b>(.+?)<\/b> of people who take a test like this\.$/); return m ? "Вы набрали <b>" + m[1] + "</b> — лучше, чем примерно <b>" + m[2] + "</b> людей, проходящих подобный тест." : null; } },
    { sel: ".rec", fn: function (h) {
      var R = [["Slow down on ", "Помедленнее с "], [" — you're fast but making avoidable mistakes.", " — вы быстры, но допускаете обидные ошибки."],
               ["Build speed on ", "Ускоряйтесь в "], [" — you get them right but they eat your clock.", " — вы отвечаете верно, но это съедает время."],
               ["Your strengths are ", "Ваши сильные стороны — "], [" — bank those marks first, fast.", " — берите эти баллы первыми и быстро."],
               ["Nicely balanced — keep doing full timed forms to build stamina.", "Хороший баланс — продолжайте проходить полные тесты на время для выносливости."]];
      var out = h; R.forEach(function (p) { out = out.split(p[0]).join(p[1]); }); return out === h ? null : out; } },
  ];

  var ATTR = {
    "Enter your access code": "Введите код доступа", "Your name or initials": "Ваше имя или инициалы",
    "Your name": "Ваше имя", "e.g. Access code not working": "напр. Не работает код доступа",
    "Tell us what happened, and include any error message.": "Опишите, что произошло, и приложите текст любой ошибки.",
  };

  var ORIG = null, CORIG = null, AORIG = null;   // restore maps (created on demand)
  var ROOT_IDS = ["main", "modal-root", "sign-host"];
  var observer = null, pending = false;

  function roots() { var r = [], i, n; for (i = 0; i < ROOT_IDS.length; i++) { n = document.getElementById(ROOT_IDS[i]); if (n) r.push(n); } return r; }
  function hasI18nAncestor(node) { var e = node.parentNode; while (e && e.nodeType === 1) { if (e.hasAttribute && (e.hasAttribute("data-i18n") || e.hasAttribute("data-i18n-html"))) return true; e = e.parentNode; } return false; }
  function lookup(key) {
    if (ENG[key] != null) return ENG[key];
    for (var i = 0; i < RX.length; i++) { var m = key.match(RX[i][0]); if (m) { var r = RX[i][1]; return typeof r === "function" ? r.apply(null, m) : key.replace(RX[i][0], r); } }
    return null;
  }
  function walkText(node) {
    if (node.nodeType === 3) {
      var tag = node.parentNode && node.parentNode.nodeName;
      if (tag === "SCRIPT" || tag === "STYLE") return;
      if (hasI18nAncestor(node)) return;
      var s = node.nodeValue; if (!s) return; var key = s.trim(); if (!key) return;
      var ru = lookup(key);
      if (ru != null && ru !== key) { if (!ORIG.has(node)) ORIG.set(node, s); node.nodeValue = s.replace(key, ru); }
      return;
    }
    if (node.nodeType === 1) { var c = node.childNodes, i; for (i = 0; i < c.length; i++) walkText(c[i]); }
  }
  function applyContainers(root) {
    CONTAINERS.forEach(function (c) {
      var els = root.querySelectorAll(c.sel), i, el, cur, next;
      for (i = 0; i < els.length; i++) { el = els[i]; if (hasI18nAncestor(el)) continue; cur = el.innerHTML; next = c.fn(cur); if (next != null && next !== cur) { if (!CORIG.has(el)) CORIG.set(el, cur); el.innerHTML = next; } }
    });
  }
  function applyAttrs(root) {
    ["placeholder", "aria-label", "title"].forEach(function (a) {
      var els = root.querySelectorAll("[" + a + "]"), i, el, v, ru, m;
      for (i = 0; i < els.length; i++) { el = els[i]; v = el.getAttribute(a); ru = ATTR[v]; if (ru != null) { m = AORIG.get(el) || {}; if (m[a] == null) { m[a] = v; AORIG.set(el, m); } el.setAttribute(a, ru); } }
    });
  }
  function translateEngine() {
    if (!ORIG) { ORIG = new Map(); CORIG = new Map(); AORIG = new Map(); }
    var rs = roots(), i;
    for (i = 0; i < rs.length; i++) { applyContainers(rs[i]); walkText(rs[i]); applyAttrs(rs[i]); }
  }
  function restoreEngine() {
    if (ORIG) { ORIG.forEach(function (o, n) { try { n.nodeValue = o; } catch (e) {} });
      CORIG.forEach(function (o, el) { try { el.innerHTML = o; } catch (e) {} });
      AORIG.forEach(function (m, el) { Object.keys(m).forEach(function (a) { try { el.setAttribute(a, m[a]); } catch (e) {} }); }); }
    ORIG = CORIG = AORIG = null;
  }
  function scheduleTranslate() {
    if (LANG !== "ru" || pending) return; pending = true;
    var run = function () { pending = false; if (LANG !== "ru") return; if (observer) observer.disconnect(); translateEngine(); connectObserver(); };
    (window.requestAnimationFrame || function (f) { setTimeout(f, 16); })(run);
  }
  function connectObserver() {
    if (!observer || !window.MutationObserver) return;
    roots().forEach(function (r) { observer.observe(r, { childList: true, subtree: true, characterData: true }); });
  }

  /* ---------------- apply / init ---------------- */
  function apply(lang) {
    LANG = lang;
    applyStatic(lang);
    if (observer) observer.disconnect();
    if (lang === "ru") { translateEngine(); connectObserver(); }
    else restoreEngine();
    document.documentElement.setAttribute("lang", lang);
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    var sel = document.getElementById("lang-select"); if (sel && sel.value !== lang) sel.value = lang;
  }
  function init() {
    captureStatic();
    if (window.MutationObserver) observer = new MutationObserver(scheduleTranslate);
    var saved = null; try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
    var lang = (saved && (saved === "en" || DICT[saved])) ? saved : "en";
    var sel = document.getElementById("lang-select");
    if (sel) { sel.value = lang; sel.addEventListener("change", function () { apply(sel.value); }); }
    apply(lang);
    window.SAA_I18N = { apply: apply, tr: function (s) { return (LANG === "ru" && ENG[s] != null) ? ENG[s] : s; } };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
