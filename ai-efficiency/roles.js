/* ============================================================
   AI Efficiency Test — roles, dimensions, scoring model.
   window.AIE_MODEL

   Что меряем. НЕ «знаешь ли ты про ИИ» и НЕ «хорош ли ты в профессии»,
   а КПД: сколько полезного результата человек получает с единицы своего
   времени и какого риска это стоит.

   Ключевое отличие от квизов про ИИ: шкала ДВУСТОРОННЯЯ. «Больше ИИ» —
   не всегда лучше. Максимум баллов даёт попадание в задачу: где-то это
   «делегируй целиком», где-то «черновик от ИИ + твоя проверка», а где-то
   «не трогай ИИ вообще». Штрафуются обе крайности — и ручной труд там,
   где машина справится, и слепое доверие там, где цена ошибки высока.
   ============================================================ */
window.AIE_MODEL = {
  version: "1.0",

  /* Шесть измерений КПД. weight — вклад в общий балл. */
  dimensions: [
    { id: "delegation", weight: 1.15,
      name: { en: "Delegation judgment", ru: "Выбор задач" },
      blurb: { en: "Knowing what to hand over, what to co-write, and what must stay yours.",
               ru: "Что отдать целиком, что писать вместе, а что нельзя отдавать вообще." } },
    { id: "context", weight: 1.0,
      name: { en: "Context & framing", ru: "Контекст и постановка" },
      blurb: { en: "Feeding the model the inputs and constraints that make a good answer possible.",
               ru: "Дать модели входные данные и ограничения, без которых хороший ответ невозможен." } },
    { id: "verification", weight: 1.3,
      name: { en: "Verification", ru: "Проверка" },
      blurb: { en: "Catching plausible-but-wrong output before it reaches anyone else.",
               ru: "Поймать правдоподобно-неверное до того, как это увидят другие." } },
    { id: "iteration", weight: 0.9,
      name: { en: "Iteration economics", ru: "Экономика итераций" },
      blurb: { en: "Time-boxing: when to re-prompt, when to change approach, when to stop.",
               ru: "Тайм-боксы: когда переспросить, когда сменить подход, когда остановиться." } },
    { id: "risk", weight: 1.15,
      name: { en: "Risk & confidentiality", ru: "Риск и конфиденциальность" },
      blurb: { en: "What must never be pasted in, and who is accountable for the output.",
               ru: "Что нельзя вставлять в чат и кто отвечает за результат." } },
    { id: "leverage", weight: 1.0,
      name: { en: "Workflow leverage", ru: "Системность" },
      blurb: { en: "Turning one-off wins into something the whole team reuses.",
               ru: "Превращать разовые удачи в то, что переиспользует вся команда." } },
  ],

  /* Профессии. core-вопросы общие, role-вопросы свои. */
  roles: [
    { id: "pm", icon: "◆",
      name: { en: "Product Manager", ru: "Продакт-менеджер" },
      blurb: { en: "Discovery, prioritisation, PRDs, experiment readouts, stakeholder comms.",
               ru: "Дискавери, приоритизация, PRD, разбор экспериментов, коммуникация со стейкхолдерами." } },
    { id: "sa", icon: "◇",
      name: { en: "System Analyst", ru: "Системный аналитик" },
      blurb: { en: "Requirements, specs and API contracts, data models, integrations, test cases.",
               ru: "Требования, спеки и контракты API, модели данных, интеграции, тест-кейсы." } },
    { id: "pjm", icon: "◈",
      name: { en: "Project Manager", ru: "Проджект-менеджер" },
      blurb: { en: "Plans and estimates, status reporting, risks, dependencies, escalations.",
               ru: "Планы и оценки, статусы, риски, зависимости, эскалации." } },
  ],

  /* Полосы общего балла. */
  bands: [
    { min: 85, id: "fluent",   name: { en: "Fluent",      ru: "Свободно" },
      note: { en: "You match the tool to the task and check what matters. Your remaining gains are in making this repeatable for the team, not in your own habits.",
              ru: "Вы подбираете инструмент под задачу и проверяете то, что важно. Дальнейший рост — не в личных привычках, а в том, чтобы это переиспользовала команда." } },
    { min: 70, id: "effective", name: { en: "Effective",  ru: "Уверенно" },
      note: { en: "Solid working practice with specific gaps. The dimension bars below show where the leverage is.",
              ru: "Рабочая практика с точечными провалами. Полоски по измерениям ниже показывают, где рычаг." } },
    { min: 50, id: "developing", name: { en: "Developing", ru: "Развивается" },
      note: { en: "You get value out of AI but leave a lot on the table, and some habits are risky. Two or three changes would move this a long way.",
              ru: "Пользу вы извлекаете, но многое теряете, а часть привычек рискованна. Две-три правки сдвинут результат заметно." } },
    { min: 0, id: "early",     name: { en: "Early",       ru: "Начало" },
      note: { en: "Mostly either doing by hand what could be delegated, or trusting output that needs checking. Start with the two lowest bars.",
              ru: "В основном либо руками то, что можно отдать, либо доверие к непроверенному. Начните с двух самых низких полосок." } },
  ],

  /* Калибровка: вторая, самая интересная ось.
     lean суммируется по ответам: −1 недо-делегирование, +1 пере-доверие.
     Считается как доля от максимума и переводится в полосу. */
  calibration: [
    { max: -0.30, id: "under",
      name: { en: "Under-user", ru: "Недоиспользование" },
      note: { en: "You do by hand a lot of work the machine would do well — synthesis, first drafts, boilerplate. The risk here isn't errors, it's your calendar.",
              ru: "Много делаете руками там, где машина справится: синтез, первые черновики, рутина. Риск здесь не в ошибках, а в вашем календаре." } },
    { max: 0.30, id: "balanced",
      name: { en: "Balanced", ru: "Сбалансированно" },
      note: { en: "You delegate and withhold in roughly the right places. Keep the verification habits that make this safe.",
              ru: "Вы делегируете и придерживаете примерно там, где нужно. Сохраняйте привычки проверки — именно они делают это безопасным." } },
    { max: 1.01, id: "over",
      name: { en: "Over-truster", ru: "Пере-доверие" },
      note: { en: "You hand over readily — including work whose errors are expensive and hard to spot. Speed is real; so is the day a fabricated number reaches a decision-maker.",
              ru: "Вы охотно отдаёте — в том числе то, где ошибка дорога и незаметна. Скорость реальна; но так же реален день, когда выдуманная цифра доедет до принимающего решение." } },
  ],

  /* Полосы для отдельных измерений. */
  dimBands: [
    { min: 80, id: "strong", name: { en: "strong", ru: "сильно" } },
    { min: 55, id: "ok",     name: { en: "workable", ru: "рабочо" } },
    { min: 0,  id: "weak",   name: { en: "weak", ru: "слабо" } },
  ],
};
