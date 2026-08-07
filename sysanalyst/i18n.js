/* ============================================================
   SAA — lightweight i18n for the landing page

   Elements tagged with data-i18n (textContent) or data-i18n-html
   (innerHTML) are translated on the fly. English is the baseline: it
   is captured from the DOM at load, so only the Russian strings live
   here. The choice is persisted in localStorage.

   To add a language: add its code to the <select> in index.html and a
   dictionary below. To extend into the exam engine later, call
   window.SAA_I18N.t(key, englishDefault) from app.js.
   ============================================================ */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var LANG_KEY = "saa:v1:lang";

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
      "how.li1": "<b>Бесплатный полный тест:</b> 20 вопросов по всем пяти областям за полные 15 минут — без регистрации, не урезанная версия.",
      "how.li2": "<b>Ещё десять тестов:</b> по 15 вопросов за 15 минут, от простого к сложному, по всем областям.",
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

  var base = {};   // captured English baseline, keyed by data-i18n key

  function els() { return document.querySelectorAll("[data-i18n],[data-i18n-html]"); }
  function keyOf(el) { return el.getAttribute("data-i18n") || el.getAttribute("data-i18n-html"); }
  function isHtml(el) { return el.hasAttribute("data-i18n-html"); }

  function capture() {
    var list = els(), i, el, k;
    for (i = 0; i < list.length; i++) { el = list[i]; k = keyOf(el); if (!(k in base)) base[k] = isHtml(el) ? el.innerHTML : el.textContent; }
  }

  function apply(lang) {
    var d = DICT[lang] || null, list = els(), i, el, k, v;
    for (i = 0; i < list.length; i++) {
      el = list[i]; k = keyOf(el);
      v = (d && d[k] != null) ? d[k] : base[k];
      if (v == null) continue;
      if (isHtml(el)) el.innerHTML = v; else el.textContent = v;
    }
    document.documentElement.setAttribute("lang", lang);
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    var sel = document.getElementById("lang-select"); if (sel && sel.value !== lang) sel.value = lang;
  }

  function init() {
    capture();
    var saved = null; try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
    var lang = (saved && (saved === "en" || DICT[saved])) ? saved : "en";
    var sel = document.getElementById("lang-select");
    if (sel) { sel.value = lang; sel.addEventListener("change", function () { apply(sel.value); }); }
    apply(lang);
    window.SAA_I18N = {
      apply: apply,
      t: function (k, def) { var l = document.documentElement.getAttribute("lang") || "en"; var d = DICT[l]; return (d && d[k] != null) ? d[k] : (base[k] != null ? base[k] : (def != null ? def : k)); },
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
