/* ============================================================
   Опрос по контурам v0.2 (window.SURVEY).
   Цель измерения — контуры 1–2 (S Стратегия, V Ценности, St Структуры,
   C Культура), но ВСЕ вопросы задаются через личный опыт респондента в
   контурах 3–4 (эпизоды: договорённости, поведение, собственные действия).

   Порядок ФИКСИРОВАН (A → B), назад нельзя, у каждого вопроса свой
   жёсткий кап с автопереходом, пропуск = данные.

   Типы: open / multi / single / forced / name / scale / assoc — как в v0.1.

   Разметка v0.2:
     comp: {S:1}          — вклад закрытого вопроса в сходимость IoA_c
     episode: true        — эпизодный вопрос: в IoA_c НЕ входит, зато его
                            варианты несут code и питают валентность/конфликты
     options: [{id,ru,en, code:{...}}] — встроенные варианты (не из config)
     code: { w:{S..C: -2..2},   — валентность на составляющие
             sens:"D±|P±|R±",   — показание датчика (К3/К4)
             conf:"K1K2|K1K3|K1K4|K2K3|K2K4|K3K4", — метка конфликта контуров
             fear:1|2 }         — вклад в индекс страха F
     scaleVal: {St:-1}    — шкала как валентность: w_c = ((v−3)/2)·вес
     scaleConf: {conf,from} — ответы ≥ from несут метку конфликта
     pairKey / metaFor / sensitive / closed — как в v0.1.
   ============================================================ */
window.SURVEY = {
  meta: { id: "contours", version: "0.2", framework: "Фреймворк устойчивого окружения (Л. Гончаров)" },

  ui: {
    brand:      { ru: "Опрос по контурам", en: "Contours survey" },
    tagline:    { ru: "Стратегия и культура · диагностика общего контекста", en: "Strategy & culture · shared-context diagnostic" },
    start_h:    { ru: "Прежде чем начать", en: "Before you begin" },
    intro:      { ru: "Здесь нет правильных ответов. Мы меряем не знание, а <b>сходимость</b>: полезен не ваш ответ сам по себе, а то, насколько ответы команды совпадают. Почти все вопросы — про то, что вы лично видели и делали. Отвечайте первым, что приходит — на каждый вопрос своё короткое время, вернуться назад нельзя, пропуск — это тоже ответ.", en: "There are no right answers. We measure convergence, not knowledge: your single answer isn't the point — how the team's answers line up is. Almost every question is about what you personally saw and did. Answer with your first instinct — each question is time-boxed, you can't go back, and skipping is itself data." },
    anon:       { ru: "Ответы анонимны. Агрегат показывается только при 5+ ответах в срезе.", en: "Answers are anonymous. Aggregate is shown only at 5+ responses per segment." },
    consent:    { ru: "Честно: открытые ответы фасилитатор читает дословно. Не пишите того, что не сказали бы вслух. Имени, почты и точного времени мы не собираем; срез — только крупными корзинами.", en: "To be honest: the facilitator reads open answers verbatim. Don't write anything you wouldn't say out loud. We don't collect your name, email or exact time; segments are coarse buckets only." },
    groupKey:   { ru: "Ключ группы (одинаковый у всей команды)", en: "Group key (same for the whole team)" },
    groupKeyPh: { ru: "напр. team-strategy-2026q1", en: "e.g. team-strategy-2026q1" },
    seg_stage:  { ru: "Стаж в компании", en: "Tenure" },
    seg_func:   { ru: "Функция", en: "Function" },
    seg_loc:    { ru: "Локация", en: "Location" },
    seg_optional:{ ru: "необязательно · нужно для разбора дисперсии по срезам", en: "optional · used to break variance down by segment" },
    life:       { ru: "Сколько эта команда уже вместе и сколько ещё планирует?", en: "How long has this team been together — and how long will it stay?" },
    life_temp:  { ru: "временная — месяцы", en: "temporary — months" },
    life_mid:   { ru: "год-два", en: "a year or two" },
    life_long:  { ru: "долгоживущая", en: "long-lived" },
    leader:     { ru: "Я — лид этой команды (мой ответ — точка отсчёта каноничности)", en: "I'm this team's lead (my answers anchor canonicity)" },
    begin:      { ru: "Начать", en: "Begin" },
    needKey:    { ru: "Введите ключ группы — он склеивает ответы команды.", en: "Enter the group key — it stitches the team's answers together." },
    noBack:     { ru: "Назад нельзя", en: "No going back" },
    skip:       { ru: "Пропустить", en: "Skip" },
    next:       { ru: "Дальше", en: "Next" },
    ownPh:      { ru: "свой вариант…", en: "your own…" },
    chooseN:    { ru: "Выберите {n}", en: "Choose {n}" },
    chosen:     { ru: "выбрано {k}/{n}", en: "{k}/{n} chosen" },
    scaleLow:   { ru: "1", en: "1" }, scaleHigh: { ru: "5", en: "5" },
    done_h:     { ru: "Спасибо", en: "Thank you" },
    done_note:  { ru: "Ваш ответ по отдельности не оценивается и не показывается. Он складывается в <b>командный отчёт</b>, когда наберётся 5+ ответов. Передайте файл ниже фасилитатору (или он отправится автоматически, если настроен приём).", en: "Your individual answer isn't scored or shown. It rolls up into a team report once 5+ responses arrive. Hand the file below to the facilitator (or it's sent automatically if intake is configured)." },
    download:   { ru: "Скачать мой ответ (файл)", en: "Download my response (file)" },
    submitted:  { ru: "Отправлено фасилитатору ✓", en: "Sent to the facilitator ✓" },
    submitFail: { ru: "Не удалось отправить — скачайте файл и передайте вручную.", en: "Couldn't send — download the file and hand it over." },
    facil_link: { ru: "Открыть отчёт фасилитатора →", en: "Open the facilitator report →" },
    langName:   { ru: "Русский", en: "English" },
  },

  blocks: [
    { id: "A", title: { ru: "Блок A — Стратегия (контур 1)", en: "Block A — Strategy (contour 1)" },
      note: { ru: "17 вопросов, ~6 минут", en: "17 questions, ~6 min" },
      items: [
        { id: "A1", cap: 15, type: "open", one: true, closed: false, metric: "entities",
          prompt: { ru: "Наша стратегия на ближайший год — одним предложением.", en: "Our strategy for the coming year — in one sentence." },
          ph: { ru: "одно предложение…", en: "one sentence…" } },

        { id: "A2", cap: 10, type: "multi", choose: 3, opt: "a2_directions", closed: true, metric: "boundaries", comp: { S: 1 },
          prompt: { ru: "Отметь три вещи, которые мы <b>не</b> делаем — сознательно.", en: "Pick three things we deliberately do <b>not</b> do." } },

        { id: "A3", cap: 10, type: "single", opt: "a3_metrics", own: true, closed: true, metric: "single-metric", comp: { S: 1 },
          prompt: { ru: "Если весь квартал можно смотреть только на одну цифру — какую?", en: "If you could watch only one number all quarter — which?" } },

        { id: "A4", cap: 15, type: "single", closed: true, episode: true, metric: "cascade",
          prompt: { ru: "Возьми свою вчерашнюю главную задачу. За сколько шагов «зачем?» она доходит до стратегии?", en: "Take yesterday's main task. In how many “why?” steps does it reach the strategy?" },
          options: [
            { id: "a", ru: "1–2 шага", en: "1–2 steps", code: { w: { St: 1 } } },
            { id: "b", ru: "3 и больше", en: "3 or more", code: { w: { St: -1 } } },
            { id: "c", ru: "не доходит до стратегии", en: "it never reaches the strategy", code: { w: { St: -2 } } },
            { id: "d", ru: "моя задача вообще не про стратегию", en: "my task isn't about the strategy at all", code: { w: { St: -1 }, conf: "K1K4" } },
          ] },

        { id: "A5", cap: 10, type: "name", closed: true, metric: "owner", comp: { St: 1 },
          prompt: { ru: "Кто владелец {goal}?", en: "Who owns {goal}?" },
          ph: { ru: "имя…", en: "name…" } },

        { id: "A6", cap: 10, type: "single", opt: "a6_scale", closed: true, metric: "magnitude", comp: { S: 1 },
          prompt: { ru: "Во сколько раз мы должны изменить {metric} за 12 месяцев?", en: "By what factor must we change {metric} in 12 months?" } },

        { id: "A6b", cap: 10, type: "single", closed: true, metric: "resistance", comp: { S: 1 },
          prompt: { ru: "Какое внешнее сопротивление нас ждёт в этом году?", en: "How much external resistance is coming this year?" },
          options: [
            { id: "a", ru: "нас попытаются убить — рынок / конкуренты / регулятор", en: "they'll try to kill us — market / competitors / regulator", code: {} },
            { id: "b", ru: "серьёзное, но переживём", en: "serious, but we'll survive", code: {} },
            { id: "c", ru: "обычный фон", en: "the usual background", code: {} },
            { id: "d", ru: "не знаю", en: "I don't know", code: { w: { S: -1 } } },
          ] },

        { id: "A7", cap: 20, type: "multi", choose: 2, opt: "a7_threats", own: true, closed: true, metric: "threat", comp: { S: 1 },
          prompt: { ru: "Что вероятнее всего убьёт нас в ближайший год? (выбери 2)", en: "What's most likely to kill us in the next year? (pick 2)" } },

        { id: "A8", cap: 15, type: "single", closed: true, episode: true, metric: "personal-benefit",
          prompt: { ru: "Стратегия сработала. Что изменится лично для тебя?", en: "The strategy worked. What changes for you personally?" },
          options: [
            { id: "a", ru: "вырасту в деньгах или роли", en: "I grow in money or role", code: { w: { S: 1 } } },
            { id: "b", ru: "интереснее задачи, больше масштаб", en: "more interesting work, bigger scale", code: { w: { S: 1 } } },
            { id: "c", ru: "буду горд, но материально ничего", en: "I'll be proud, but materially nothing", code: {} },
            { id: "d", ru: "ничего не изменится", en: "nothing changes", code: { w: { S: -1 } } },
            { id: "e", ru: "не знаю", en: "I don't know", code: { w: { S: -1 } } },
          ] },

        { id: "A9a", cap: 10, type: "forced", closed: true, metric: "tradeoff", group: "A9", comp: { S: 1 },
          prompt: { ru: "Что сейчас важнее?", en: "What matters more right now?" },
          a: { ru: "Скорость запуска", en: "Launch speed" }, b: { ru: "Качество данных", en: "Data quality" } },
        { id: "A9b", cap: 10, type: "forced", closed: true, metric: "tradeoff", group: "A9", comp: { S: 1 },
          prompt: { ru: "Что сейчас важнее?", en: "What matters more right now?" },
          a: { ru: "Новый сегмент", en: "A new segment" }, b: { ru: "Удержание текущих", en: "Retaining current" } },
        { id: "A9c", cap: 10, type: "forced", closed: true, metric: "tradeoff", group: "A9", comp: { S: 1 },
          prompt: { ru: "Что сейчас важнее?", en: "What matters more right now?" },
          a: { ru: "Маржинальность", en: "Margin" }, b: { ru: "Объём", en: "Volume" } },

        { id: "A10", cap: 10, type: "single", opt: "a10_resource", closed: true, metric: "resource", comp: { S: 1 },
          prompt: { ru: "Тебе дают +1 человека в команду завтра. Куда?", en: "You get +1 person tomorrow. Where do they go?" } },

        { id: "A11a", cap: 15, type: "single", opt: "a11_behaviors", closed: true, metric: "declared-real", pairKey: "A11", comp: { C: 1 },
          prompt: { ru: "За что у нас <b>реально</b> повышают и продвигают?", en: "What do people <b>actually</b> get promoted for here?" } },
        { id: "A11b", cap: 15, type: "single", opt: "a11_behaviors", closed: true, metric: "declared-should", pairKey: "A11", comp: { V: 1 },
          prompt: { ru: "За что <b>должны</b> повышать, если верить стратегии?", en: "What <b>should</b> they be promoted for, per the strategy?" } },

        { id: "A13", cap: 20, type: "single", closed: true, episode: true, metric: "master-strategy",
          prompt: { ru: "Вспомни последний раз, когда ты делал что-то <b>напрямую ради стратегической цели</b>. Что произошло с тобой?", en: "Recall the last time you did something <b>directly for the strategic goal</b>. What happened to you?" },
          options: [
            { id: "a", ru: "получил выгоду или признание — прошло как обычное дело", en: "I gained benefit or recognition — it passed as business as usual", code: { w: { S: 2 } } },
            { id: "b", ru: "никто не заметил", en: "nobody noticed", code: { w: { S: -1 } } },
            { id: "c", ru: "потерял — время, бонус или отношения", en: "I lost — time, bonus or relationships", code: { w: { S: -2 } } },
            { id: "d", ru: "выглядел «белой вороной», шёл против принятого", en: "I looked like the odd one out, went against the accepted way", code: { w: { C: -1 }, conf: "K1K2" } },
            { id: "e", ru: "конфликт с окружающими, пришлось жертвовать", en: "conflict with others, I had to sacrifice", code: { sens: "P-", conf: "K1K3" } },
            { id: "f", ru: "это стоило выгорания, борьбы с собой", en: "it cost burnout, a fight with myself", code: { sens: "R-", conf: "K1K4" } },
            { id: "g", ru: "не могу вспомнить такого случая", en: "I can't recall such a case", code: { w: { S: -2 } } },
          ] },

        { id: "A12", cap: 5, type: "scale", closed: false, metric: "meta", metaFor: "A",
          prompt: { ru: "Про этот блок — <b>про стратегию</b>: насколько ты уверен, что коллега ответил на его вопросы так же, как ты?", en: "About this block — <b>the strategy one</b>: how sure are you a teammate answered its questions the same way you did?" },
          low: { ru: "совсем нет", en: "not at all" }, high: { ru: "полностью", en: "completely" } },
      ] },

    { id: "B", title: { ru: "Блок B — Культура (контур 2)", en: "Block B — Culture (contour 2)" },
      note: { ru: "18 вопросов, ~8 минут", en: "18 questions, ~8 min" },
      items: [
        { id: "B1", cap: 10, type: "multi", choose: 3, opt: "b1_values", closed: true, metric: "recognition", comp: { V: 1 },
          prompt: { ru: "Выбери три наши ценности.", en: "Pick our three values." } },

        { id: "B2", cap: 45, type: "assoc", closed: false, metric: "semantic",
          prompt: { ru: "К каждой ценности — по три слова, первое, что приходит.", en: "For each value, three words — whatever comes first." } },

        { id: "B3", cap: 20, type: "single", closed: true, episode: true, metric: "master-values",
          prompt: { ru: "Вспомни последний случай, когда ты поступил <b>строго по нашим ценностям</b> — даже если это было неудобно. Что произошло дальше?", en: "Recall the last time you acted <b>strictly on our values</b> — even when it was inconvenient. What happened next?" },
          options: [
            { id: "a", ru: "это продвинуло дело — прошло как обычное дело", en: "it moved the work forward — passed as business as usual", code: { w: { V: 2, C: 1 } } },
            { id: "b", ru: "пришлось идти в обход правил или процессов", en: "I had to go around rules or processes", code: { w: { St: -1 }, conf: "K1K2" } },
            { id: "c", ru: "меня похвалили как за подвиг", en: "I was praised as if it were a feat", code: { w: { C: -1 }, conf: "K2K4" } },
            { id: "d", ru: "осудили, наказали или сочли наивным", en: "I was judged, punished or called naive", code: { w: { C: -2 }, conf: "K1K2" } },
            { id: "e", ru: "дорого далось лично — борьба с собой", en: "it cost me personally — a fight with myself", code: { sens: "R-", conf: "K1K4" } },
            { id: "f", ru: "не могу вспомнить такого случая", en: "I can't recall such a case", code: { w: { V: -2 } } },
          ] },

        { id: "B4a", cap: 10, type: "single", closed: true, episode: true, metric: "antiexample-rate",
          prompt: { ru: "За последние 30 дней был случай, когда поступок <b>против ценностей</b> остался без последствий?", en: "In the last 30 days, was there a case when acting <b>against the values</b> had no consequences?" },
          options: [
            { id: "a", ru: "не было", en: "no such case", code: { w: { C: 1 } } },
            { id: "b", ru: "был", en: "yes, there was", code: { w: { C: -1 }, conf: "K2K3" } },
            { id: "c", ru: "не знаю", en: "I don't know", code: {} },
          ] },

        { id: "B4", cap: 90, type: "open", closed: false, metric: "antiexample", sensitive: true,
          prompt: { ru: "Если был — что произошло? (без имён)", en: "If there was — what happened? (no names)" },
          ph: { ru: "…", en: "…" } },

        { id: "B5", cap: 10, type: "name", closed: true, metric: "exemplar", comp: { V: 0.5, C: 0.5 },
          prompt: { ru: "Кто у нас лучше всех воплощает наши ценности?", en: "Who best embodies our values?" },
          ph: { ru: "имя…", en: "name…" } },

        { id: "B6", cap: 10, type: "scale", closed: true, metric: "cost", comp: { C: 0.5, St: 0.5 }, scaleVal: { C: -0.5, St: -0.5 },
          prompt: { ru: "Поступить по ценностям — это дороже или дешевле, чем в обход?", en: "Acting on the values — is it costlier or cheaper than the workaround?" },
          low: { ru: "дешевле", en: "cheaper" }, high: { ru: "дороже", en: "costlier" } },

        { id: "B7", cap: 30, type: "open", one: true, closed: false, metric: "bypass",
          prompt: { ru: "Назови правило или процесс, который у нас регулярно обходят.", en: "Name a rule or process that's regularly bypassed here." },
          ph: { ru: "…", en: "…" } },

        { id: "B7b", cap: 10, type: "scale", closed: true, metric: "bypass-rate", comp: { St: 1 }, scaleVal: { St: -1 }, scaleConf: { conf: "K2K3", from: 4 },
          prompt: { ru: "Как часто правильный путь у нас длиннее обходного?", en: "How often is the proper path longer than the workaround here?" },
          low: { ru: "почти никогда", en: "almost never" }, high: { ru: "постоянно", en: "all the time" } },

        { id: "B8", cap: 15, type: "single", opt: "b8_reaction", closed: true, metric: "reaction", comp: { C: 1 },
          prompt: { ru: "Ты видишь, что коллега нарушил договорённость. Что произойдёт дальше?", en: "You see a colleague break an agreement. What happens next?" } },

        { id: "B13", cap: 15, type: "single", closed: true, episode: true, metric: "agreement",
          prompt: { ru: "Вспомни последнюю рабочую договорённость с коллегой. Как она была выполнена?", en: "Recall your last working agreement with a colleague. How was it kept?" },
          options: [
            { id: "a", ru: "по умолчанию, без напоминаний", en: "by default, no reminders", code: { w: { C: 1 }, sens: "D+" } },
            { id: "b", ru: "после напоминаний", en: "after reminders", code: { sens: "D-" } },
            { id: "c", ru: "сорвалась — последствий не было", en: "it fell through — no consequences", code: { w: { C: -1 }, sens: "P-", conf: "K2K3" } },
            { id: "d", ru: "сорвалась — открыто разобрались и починили", en: "it fell through — we openly sorted it out", code: { w: { C: 1 }, sens: "P+" } },
            { id: "e", ru: "не вспомню", en: "can't recall", code: {} },
          ] },

        { id: "B14", cap: 15, type: "single", closed: true, episode: true, metric: "help",
          prompt: { ru: "Последний раз, когда тебе была нужна помощь — знание, контакт, подхватить задачу. Что произошло?", en: "The last time you needed help — knowledge, a contact, someone picking up a task. What happened?" },
          options: [
            { id: "a", ru: "пришла сама, по умолчанию", en: "it came by default, unprompted", code: { w: { C: 2 } } },
            { id: "b", ru: "пришла после просьбы", en: "it came once I asked", code: { w: { C: 1 } } },
            { id: "c", ru: "в обмен на услугу — «личные зачёты»", en: "in exchange for a favour — personal scorekeeping", code: { w: { C: -1 }, conf: "K2K3" } },
            { id: "d", ru: "не пришла", en: "it didn't come", code: { w: { C: -1 } } },
            { id: "e", ru: "я не прошу помощи — себе дороже", en: "I don't ask for help — it costs you more here", code: { w: { C: -1 }, sens: "R-", conf: "K3K4", fear: 1 } },
          ] },

        { id: "B15", cap: 15, type: "single", closed: true, episode: true, metric: "heroism",
          prompt: { ru: "Подвиги и переработки у нас за последние 30 дней — это…", en: "Feats and overtime here in the last 30 days were…" },
          options: [
            { id: "a", ru: "редкое событие, после — восстановление", en: "a rare event, with recovery after", code: { w: { St: 1 }, sens: "R+" } },
            { id: "b", ru: "обычный режим работы", en: "the normal mode of working", code: { w: { St: -1 }, sens: "R-", conf: "K2K4" } },
            { id: "c", ru: "героев хвалят и ставят в пример остальным", en: "heroes get praised and held up as the example", code: { w: { C: -1 }, conf: "K2K4" } },
            { id: "d", ru: "не наблюдаю", en: "I don't observe any", code: {} },
          ] },

        { id: "B16", cap: 15, type: "single", closed: true, episode: true, metric: "voice",
          prompt: { ru: "Последний раз, когда ты видел проблему — что ты сделал и что было дальше?", en: "The last time you saw a problem — what did you do, and what happened next?" },
          options: [
            { id: "a", ru: "сказал — услышали и разобрали", en: "I spoke up — I was heard and it was sorted", code: { w: { C: 1 }, sens: "P+" } },
            { id: "b", ru: "сказал — посоветовали потерпеть", en: "I spoke up — I was told to bear with it", code: { sens: "R-", conf: "K3K4", fear: 1 } },
            { id: "c", ru: "сказал — проигнорировали", en: "I spoke up — it was ignored", code: { w: { C: -1 }, sens: "P-" } },
            { id: "d", ru: "сказал — мне же стало хуже", en: "I spoke up — and it backfired on me", code: { sens: "P-", conf: "K3K4", fear: 2 } },
            { id: "e", ru: "промолчал", en: "I stayed quiet", code: { fear: 1 } },
            { id: "f", ru: "проблем не видел", en: "I saw no problems", code: {} },
          ] },

        { id: "B10", cap: 45, type: "open", closed: false, metric: "silence", sensitive: true,
          prompt: { ru: "Если промолчал о проблеме — почему?", en: "If you stayed quiet about a problem — why?" },
          ph: { ru: "…", en: "…" } },

        { id: "B11a", cap: 15, type: "single", opt: "b11_behaviors", closed: true, metric: "declared-real", pairKey: "B11", comp: { C: 1 },
          prompt: { ru: "Какое поведение у нас <b>реально</b> одобряют?", en: "What behaviour is <b>actually</b> approved of here?" } },
        { id: "B11b", cap: 15, type: "single", opt: "b11_behaviors", closed: true, metric: "declared-should", pairKey: "B11", comp: { V: 1 },
          prompt: { ru: "Какое поведение <b>должно</b> одобряться, если верить ценностям?", en: "What behaviour <b>should</b> be approved, per the values?" } },

        { id: "B12", cap: 5, type: "scale", closed: false, metric: "meta", metaFor: "B",
          prompt: { ru: "Теперь про этот блок — <b>про культуру</b>: насколько ты уверен, что коллега ответил на его вопросы так же, как ты?", en: "Now about this block — <b>the culture one</b>: how sure are you a teammate answered its questions the same way you did?" },
          low: { ru: "совсем нет", en: "not at all" }, high: { ru: "полностью", en: "completely" } },
      ] },
  ],
};
