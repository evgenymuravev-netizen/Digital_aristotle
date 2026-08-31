/* ============================================================
   Опрос по контурам — конфигурация развёртывания
   (window.CONTOURS_CONFIG)

   Здесь только то, что зависит от компании и от волны. Значения-
   заглушки помечены DEMO — их НУЖНО заменить реальным содержанием
   вашей стратегии/ценностей перед боевым запуском. Ничего секретного
   тут нет (файл уезжает в браузер).
   ============================================================ */
window.CONTOURS_CONFIG = {
  minN: 5,               // не показывать агрегат в срезе меньше N (анонимность)
  submitEndpoint: "",    // необяз.: POST ответов сюда (Formspree/Worker/Supabase).
                         // Пусто → респондент просто скачивает файл ответа.

  /* Подстановки в формулировки вопросов (замените на своё). */
  org: {
    strategyGoal: "стратегической цели №1",        // A5  (DEMO)
    keyMetric:    "ключевой метрики",               // A6  (DEMO)
    values:       ["Скорость", "Прозрачность", "Ответственность"], // 3 реальные ценности (DEMO) — для B2/B3
  },

  /* Срезы для разбора дисперсии. АНОНИМНОСТЬ: только КРУПНЫЕ фиксированные
     корзины — свободный текст («юротдел, Дубай») деанонимизирует. Держите
     корзины большими: цель — чтобы в любой ячейке было ≥ minN человек. Ячейки
     меньше minN в отчёте подавляются. Уберите dim (или задайте []), если срез
     в вашей команде всё равно вычисляет человека. DEMO. */
  segments: {
    func: [
      { id: "prod", ru: "Продукт / инженерия", en: "Product / engineering" },
      { id: "gtm",  ru: "Продажи / маркетинг", en: "Sales / marketing" },
      { id: "ops",  ru: "Операции / поддержка", en: "Operations / support" },
      { id: "ga",   ru: "G&A (финансы / HR / юр.)", en: "G&A (finance / HR / legal)" },
    ],
    loc: [
      { id: "hq",     ru: "Основной офис", en: "Main office" },
      { id: "other",  ru: "Другой офис", en: "Other office" },
      { id: "remote", ru: "Удалённо", en: "Remote" },
    ],
    // стаж (stage) — фиксированные корзины в самом раннере (до 6 мес / 6–24 / 24+)
  },

  /* A2 · 12 направлений: 4 реально отвергнуты, 4 в работе, 4 нейтральных дистрактора.
     kind помечает истину для чтения каноничности (респондент его не видит). DEMO. */
  a2_directions: [
    { id: "d1", ru: "Выход на рынок США", en: "Enter the US market", kind: "rejected" },
    { id: "d2", ru: "Собственное железо/устройства", en: "Own hardware/devices", kind: "rejected" },
    { id: "d3", ru: "Массовый сегмент/дешёвый тариф", en: "Mass-market cheap tier", kind: "rejected" },
    { id: "d4", ru: "Консалтинговые услуги под ключ", en: "Bespoke consulting services", kind: "rejected" },
    { id: "d5", ru: "Enterprise-сегмент", en: "Enterprise segment", kind: "inwork" },
    { id: "d6", ru: "Самообслуживание (self-serve)", en: "Self-serve onboarding", kind: "inwork" },
    { id: "d7", ru: "Партнёрская экосистема", en: "Partner ecosystem", kind: "inwork" },
    { id: "d8", ru: "Мобильное приложение", en: "Mobile app", kind: "inwork" },
    { id: "d9", ru: "Ребрендинг", en: "Rebranding", kind: "distractor" },
    { id: "d10", ru: "Релокация офиса", en: "Office relocation", kind: "distractor" },
    { id: "d11", ru: "Новая CRM", en: "New CRM", kind: "distractor" },
    { id: "d12", ru: "Хакатоны для найма", en: "Hiring hackathons", kind: "distractor" },
  ],

  /* A3 · единственная цифра квартала (1 из 8 + своё). DEMO. */
  a3_metrics: [
    { id: "m1", ru: "Выручка (MRR/ARR)", en: "Revenue (MRR/ARR)" },
    { id: "m2", ru: "Активные пользователи", en: "Active users" },
    { id: "m3", ru: "Удержание (retention)", en: "Retention" },
    { id: "m4", ru: "Маржинальность", en: "Margin" },
    { id: "m5", ru: "Скорость релизов", en: "Release velocity" },
    { id: "m6", ru: "NPS / удовлетворённость", en: "NPS / satisfaction" },
    { id: "m7", ru: "Конверсия воронки", en: "Funnel conversion" },
    { id: "m8", ru: "Стоимость привлечения (CAC)", en: "CAC" },
  ],

  /* A6 · масштаб изменения ключевой метрики за 12 мес. (порядок величины). */
  a6_scale: [
    { id: "s1", ru: "1.2×", en: "1.2×" }, { id: "s2", ru: "2×", en: "2×" },
    { id: "s3", ru: "5×", en: "5×" }, { id: "s4", ru: "10×", en: "10×" },
    { id: "s5", ru: "Не знаю", en: "Don't know" },
  ],

  /* A7 · что вероятнее всего убьёт (2 из 8 + своё). DEMO — микс внутр./внешн. */
  a7_threats: [
    { id: "t1", ru: "Крупный конкурент", en: "A big competitor", ext: true },
    { id: "t2", ru: "Изменение регуляций", en: "Regulatory change", ext: true },
    { id: "t3", ru: "Кассовый разрыв / нет денег", en: "Running out of cash", ext: true },
    { id: "t4", ru: "Спад спроса на рынке", en: "Market demand drop", ext: true },
    { id: "t5", ru: "Внутренние конфликты", en: "Internal conflict", ext: false },
    { id: "t6", ru: "Потеря ключевых людей", en: "Losing key people", ext: false },
    { id: "t7", ru: "Расфокус / делаем всё сразу", en: "Loss of focus", ext: false },
    { id: "t8", ru: "Медленная разработка", en: "Slow execution", ext: false },
  ],

  /* A10 · +1 человек завтра — куда (1 из 6). DEMO. */
  a10_resource: [
    { id: "r1", ru: "Продукт/разработка", en: "Product/engineering" },
    { id: "r2", ru: "Продажи", en: "Sales" },
    { id: "r3", ru: "Маркетинг", en: "Marketing" },
    { id: "r4", ru: "Поддержка/успех клиента", en: "Support/CS" },
    { id: "r5", ru: "Аналитика/данные", en: "Analytics/data" },
    { id: "r6", ru: "Операции/найм", en: "Ops/recruiting" },
  ],

  /* A11 · за что повышают/продвигают (реально vs должно). Общий список. DEMO. */
  a11_behaviors: [
    { id: "p1", ru: "За результат по метрикам", en: "Hitting metric results" },
    { id: "p2", ru: "За переработки и героизм", en: "Overwork and heroics" },
    { id: "p3", ru: "За лояльность и стаж", en: "Loyalty and tenure" },
    { id: "p4", ru: "За близость к руководству", en: "Closeness to leadership" },
    { id: "p5", ru: "За инициативу и риск", en: "Initiative and risk-taking" },
    { id: "p6", ru: "За командную работу", en: "Team play" },
  ],

  /* B1 · 15 ценностей: 3 реальные, 4 близких дистрактора, 8 универсальных. DEMO.
     kind: real | near | universal — респондент не видит. */
  b1_values: [
    { id: "v1", ru: "Скорость", en: "Speed", kind: "real" },
    { id: "v2", ru: "Прозрачность", en: "Transparency", kind: "real" },
    { id: "v3", ru: "Ответственность", en: "Ownership", kind: "real" },
    { id: "v4", ru: "Открытость", en: "Openness", kind: "near" },
    { id: "v5", ru: "Подотчётность", en: "Accountability", kind: "near" },
    { id: "v6", ru: "Проактивность", en: "Proactivity", kind: "near" },
    { id: "v7", ru: "Оперативность", en: "Responsiveness", kind: "near" },
    { id: "v8", ru: "Инновации", en: "Innovation", kind: "universal" },
    { id: "v9", ru: "Клиентоориентированность", en: "Customer focus", kind: "universal" },
    { id: "v10", ru: "Качество", en: "Quality", kind: "universal" },
    { id: "v11", ru: "Уважение", en: "Respect", kind: "universal" },
    { id: "v12", ru: "Честность", en: "Integrity", kind: "universal" },
    { id: "v13", ru: "Командность", en: "Teamwork", kind: "universal" },
    { id: "v14", ru: "Развитие", en: "Growth", kind: "universal" },
    { id: "v15", ru: "Совершенство", en: "Excellence", kind: "universal" },
  ],

  /* B8 · реакция системы на нарушение (1 из 5) — формулировки общие. */
  b8_reaction: [
    { id: "x1", ru: "Ничего не произойдёт", en: "Nothing happens" },
    { id: "x2", ru: "Скажу ему лично", en: "I'll tell them privately" },
    { id: "x3", ru: "Вынесем на команду", en: "We'll raise it with the team" },
    { id: "x4", ru: "Скажу руководителю", en: "I'll tell the manager" },
    { id: "x5", ru: "Его за это скорее похвалят", en: "They'll likely be praised for it" },
  ],

  /* B11 · какое поведение одобряют (реально vs должно). Общий список. DEMO. */
  b11_behaviors: [
    { id: "b1", ru: "Быстро, но грязно", en: "Fast but sloppy" },
    { id: "b2", ru: "Тщательно, но медленно", en: "Careful but slow" },
    { id: "b3", ru: "Молчать о проблемах", en: "Staying quiet about problems" },
    { id: "b4", ru: "Поднимать неудобные вопросы", en: "Raising uncomfortable issues" },
    { id: "b5", ru: "Соглашаться с руководством", en: "Agreeing with leadership" },
    { id: "b6", ru: "Спорить по существу", en: "Arguing on the merits" },
  ],
};
