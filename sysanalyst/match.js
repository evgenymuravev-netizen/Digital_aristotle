/* ============================================================
   SAA — job-description matcher (window.SAA_MATCH)

   Client-side, keyword-based relevance. Given the text of a job
   description (and optionally a résumé), it scores each of the five
   domains and decides which to include in a tailored test, and — for
   employers — scores how well a candidate's per-domain results fit a JD.

   No backend / LLM. It reads pasted TEXT (a URL can't be fetched from a
   static page because of CORS). Keywords cover EN + RU. This is a
   heuristic to be transparent about, not an oracle — it shows its work.
   ============================================================ */
(function () {
  "use strict";

  var LABELS = { apis: "APIs & REST", protocols: "Protocols", network: "Networking & OSI", messaging: "Messaging & Queues", data: "Databases & Data" };
  var ORDER = ["apis", "protocols", "network", "messaging", "data"];

  // keyword → domain (lowercase; matched as substrings against the text)
  var KW = {
    apis: ["api", "apis", "rest", "restful", "openapi", "swagger", "endpoint", "http method", "crud", "idempoten", "pagination", "versioning", "oauth", "jwt", "api gateway", "webhook", "rate limit", "api design", "integration", "интеграц", "апи", "рест", "эндпоинт", "вебхук", "http-метод"],
    protocols: ["soap", "grpc", "graphql", "websocket", "web socket", "protobuf", "protocol buffer", "wsdl", "json-rpc", " rpc", "server-sent", " sse ", "http/2", "http/3", "protocol", "протокол", "грпс", "графкуэл", "вебсокет", "сокет"],
    network: ["osi", " tcp", " udp", " dns", " tls", " ssl", "https", "ip address", "load balanc", "balancer", "firewall", "cidr", " nat ", "networking", "network ", "reverse proxy", " cdn", "latency", "tcp/ip", "сеть", "сети", "сетев", "файрвол", "балансировщ", "маршрутизац"],
    messaging: ["kafka", "rabbitmq", "rabbit mq", " amqp", "message queue", "message broker", " broker", " queue", "pub/sub", "pubsub", "publish/subscribe", "event-driven", "event driven", "event bus", "streaming", " sqs", " nats", "activemq", "kinesis", "очеред", "брокер", "обмен сообщени", "событийн", "стриминг", "шина событий"],
    data: ["sql", "postgres", "mysql", "mariadb", "database", "databases", " db ", "nosql", "mongodb", "mongo", "redis", "cassandra", "elasticsearch", " index", "acid", "transaction", "normaliz", "isolation level", "cap theorem", "shard", "replicat", "data model", "data warehouse", "olap", "oltp", " etl", " query", "базы данных", "база данных", " бд", "индекс", "транзакц", "нормализ", "шардир", "репликац", "хранилищ данных", "запрос"],
  };

  function analyze(text) {
    var s = " " + String(text || "").toLowerCase().replace(/[\n\r]+/g, " ") + " ";
    var detail = {};
    ORDER.forEach(function (c) {
      var hits = [];
      KW[c].forEach(function (k) { if (s.indexOf(k) >= 0) { var t = k.trim(); if (hits.indexOf(t) < 0) hits.push(t); } });
      detail[c] = { score: hits.length, hits: hits };
    });
    var anyReal = ORDER.some(function (c) { return detail[c].hits.length > 0; });
    // APIs are relevant to almost any backend/integration analyst role — keep a baseline.
    if (anyReal && detail.apis.score === 0) { detail.apis.score = 1; detail.apis.baseline = true; }
    var cats = [], weights = {};
    ORDER.forEach(function (c) {
      var included = anyReal ? detail[c].score >= 1 : true;   // nothing matched → keep everything
      detail[c].included = included; detail[c].label = LABELS[c];
      if (included) { cats.push(c); weights[c] = detail[c].score || 1; }
    });
    return { cats: cats, weights: weights, detail: detail, anyReal: anyReal, order: ORDER, labels: LABELS };
  }

  // how well a candidate's per-domain scores fit a JD (0–100) + the breakdown
  function matchCandidate(candCats, jd) {
    var tot = 0, acc = 0, contrib = [];
    (jd.cats || []).forEach(function (c) {
      var w = jd.weights[c] || 1;
      var pct = (candCats && candCats[c] != null) ? candCats[c] : 0;
      tot += w; acc += w * pct;
      contrib.push({ cat: c, label: LABELS[c], w: w, pct: pct });
    });
    contrib.sort(function (a, b) { return b.w - a.w; });
    return { match: tot ? Math.round(acc / tot) : 0, contrib: contrib };
  }

  window.SAA_MATCH = { analyze: analyze, matchCandidate: matchCandidate, LABELS: LABELS, ORDER: ORDER };
})();
