/* ============================================================
   SAA — deeper "why your answer falls short" explanations.

   Optional, per-question, keyed by the exact prompt text. Where a
   question isn't listed here, the engine composes a topic-aware
   explanation instead, so every wrong answer still gets a deeper
   "why". Extend this file freely — add more entries any time.

   Shape:
     "<exact prompt>": {
       principle: "the core rule / idea in one line",
       best:      "why the correct option fits best",
       traps: { "<exact option text>": "why this tempting choice falls short" }
     }
   NOTE: trap keys must match an option string EXACTLY (including any
   inline HTML), and must not be the correct option — validate.mjs checks this.
   ============================================================ */
window.MMAT_DEEP = {

  /* ---------- APIs & REST ---------- */
  "Which endpoint best follows REST resource-naming conventions for fetching the orders of user 123?": {
    principle: "In REST the URL names a resource (a noun); the HTTP verb says what you're doing to it.",
    best: "<span class='mono'>GET /users/123/orders</span> reads a sub-collection — GET is the action, the path is pure nouns, and the hierarchy (a user's orders) is obvious.",
    traps: {
      "<span class='mono'>GET /getUserOrders?id=123</span>": "The verb 'get' is baked into the path, which just repeats what the GET method already says — a classic RPC-over-HTTP smell, not REST.",
      "<span class='mono'>POST /users/123/orders/list</span>": "Using POST to read is wrong (POST implies a change), and 'list' is a verb — reads should be a safe, cacheable GET on the collection.",
      "<span class='mono'>GET /orders/fetchByUser/123</span>": "'fetchByUser' is an ad-hoc verb phrase; REST would express the relationship as a nested resource, /users/123/orders, not a custom action.",
    },
  },
  "Which of these is the clearest sign of a <b>badly</b> designed REST API?": {
    principle: "The strongest tell of a non-RESTful API is actions encoded as URL paths instead of HTTP methods.",
    best: "Verbs like /createOrder and /deleteOrder duplicate what POST and DELETE already express, and they multiply endpoints instead of reusing one resource URI with different methods.",
    traps: {
      "Plural nouns for collections, e.g. <span class='mono'>/orders</span>": "Plural collection nouns are actually the recommended convention — this is good design, not bad.",
      "Using <span class='mono'>404</span> for a missing resource": "Returning 404 for something that isn't there is exactly correct — the status code carries the meaning.",
      "Returning <span class='mono'>201 Created</span> with a <span class='mono'>Location</span> header": "That's textbook-correct for a successful create — 201 plus a Location pointing to the new resource.",
    },
  },
  "An API returns <span class='mono'>HTTP 200 OK</span> with body <span class='mono'>{\"error\":\"not found\"}</span> for a missing record. What is the main problem?": {
    principle: "The HTTP status line is part of the contract — machines read it before they read your body.",
    best: "A 200 tells every client, proxy and cache 'success', so error handling, retries and caching all misbehave. A missing resource must be a 404.",
    traps: {
      "The body should be XML": "Format isn't the issue — JSON is fine. The problem is the misleading success status.",
      "200 is only for POST": "Not true; 200 is a general success code. The fault is using any 2xx to report a failure.",
      "Nothing — the body explains the error": "Humans can read the body, but load balancers, retry logic and caches key off the status code — and this one lies.",
    },
  },
  "Which statement about HTTP method <b>idempotency</b> is correct?": {
    principle: "Idempotent = making the same call many times leaves the same end state as making it once.",
    best: "DELETE is idempotent: deleting an already-deleted resource still ends with it gone, so a safely-retried DELETE causes no extra harm.",
    traps: {
      "<span class='mono'>POST</span> is idempotent by definition": "The opposite — POST typically creates a new resource each time, which is exactly why blind retries can double-create.",
      "<span class='mono'>GET</span> may safely change server state": "GET must be 'safe' — no observable state change. That's why crawlers and caches can call it freely.",
      "<span class='mono'>PUT</span> must create a new resource on every call": "PUT replaces the resource at a known URI; repeating it lands on the same state — that's what makes it idempotent, not a creator.",
    },
  },

  /* ---------- Protocols ---------- */
  "Which is a defining difference between SOAP and REST?": {
    principle: "SOAP is a protocol with a rigid message format; REST is an architectural style, not a wire format.",
    best: "SOAP mandates an XML Envelope and a stack of WS-* standards; REST is a set of constraints (statelessness, resources, uniform interface) usually realised as JSON over plain HTTP.",
    traps: {
      "REST always uses XML; SOAP always uses JSON": "Backwards — SOAP is always XML; REST is format-agnostic but usually JSON.",
      "SOAP cannot run over HTTP": "SOAP most often runs over HTTP (it can use other transports too) — this is simply false.",
      "REST requires a WSDL contract": "WSDL belongs to SOAP. REST has optional descriptions (like OpenAPI) but no WSDL requirement.",
    },
  },

  /* ---------- Networking & OSI ---------- */
  "At which OSI layer does the <b>HTTP</b> protocol operate?": {
    principle: "Match the protocol to the job it does: HTTP is how applications exchange requests and responses.",
    best: "HTTP is an Application-layer (Layer 7) protocol — it defines methods, headers and status codes for app-to-app messaging, riding on TCP below it.",
    traps: {
      "Layer 4 — Transport": "That's TCP/UDP's layer — the reliable delivery HTTP sits on top of, not HTTP itself.",
      "Layer 3 — Network": "Layer 3 is IP (routing between hosts); HTTP doesn't do addressing or routing.",
      "Layer 2 — Data Link": "Layer 2 (Ethernet/MAC) moves frames on the local link — far below application messaging.",
    },
  },
  "In the classic OSI model, encryption/decryption of data is traditionally associated with which layer?": {
    principle: "The Presentation layer is about how data is represented — translation, compression and encryption of the payload's format.",
    best: "Layer 6 (Presentation) is the textbook home of encryption/decryption and data-format translation — hence the name.",
    traps: {
      "Layer 1 — Physical": "Layer 1 is raw bits on the wire/radio — it has no notion of encrypting the data's meaning.",
      "Layer 3 — Network": "Layer 3 handles IP addressing and routing, not representing or encrypting the payload.",
      "Layer 4 — Transport": "Layer 4 is about reliable delivery and ports; encryption of the data format is classically Layer 6. (In practice TLS straddles 5–6, but the exam answer is Presentation.)",
    },
  },
  "Which protocol gives reliable, connection-oriented, ordered delivery?": {
    principle: "Reliability + ordering + a connection handshake is the signature of TCP.",
    best: "TCP opens a connection (SYN/SYN-ACK/ACK), numbers its segments, retransmits losses and delivers bytes in order — reliable and connection-oriented.",
    traps: {
      "UDP": "UDP is connectionless and best-effort: no handshake, no retransmission, no ordering guarantee.",
      "ICMP": "ICMP carries control/diagnostic messages (ping, unreachable) — it isn't a data-delivery transport.",
      "ARP": "ARP just maps IP addresses to MAC addresses on a local link; it delivers no application data.",
    },
  },

  /* ---------- Messaging & Queues ---------- */
  "In RabbitMQ, which exchange type delivers a copy of each message to <b>every</b> bound queue, ignoring the routing key?": {
    principle: "Pick the exchange by how it decides which queues get the message.",
    best: "A fanout exchange broadcasts every message to all bound queues and ignores the routing key — the natural fit for pub/sub.",
    traps: {
      "Direct": "A direct exchange routes only to queues whose binding key exactly equals the routing key — not a broadcast.",
      "Topic": "A topic exchange routes by pattern (* and #) against the routing key — selective, not everyone.",
      "Headers": "A headers exchange routes on header attributes rather than the routing key — still selective, not a broadcast.",
    },
  },
  "A system guarantees a message is delivered <b>at least once</b>. What must consumers therefore be?": {
    principle: "At-least-once means retries can deliver the same message again — so processing must tolerate duplicates.",
    best: "Idempotent processing (e.g. dedup on a message id, or an upsert) makes a second delivery a harmless no-op, keeping results correct.",
    traps: {
      "Single-threaded": "Threading model is irrelevant to duplicates — a single-threaded consumer can still be handed the same message twice.",
      "Stateless about ordering": "Ordering is a separate concern; being 'stateless about ordering' doesn't make a repeated message safe.",
      "Written in the same language as the producer": "Language has nothing to do with delivery semantics — the risk is duplicate processing, which needs idempotency.",
    },
  },
  "Which is the better description of Apache Kafka versus RabbitMQ?": {
    principle: "Kafka is a durable, replayable log; RabbitMQ is a smart broker that routes and then removes messages.",
    best: "Kafka keeps an ordered, retained log that consumers read by offset (and can replay); RabbitMQ routes via exchanges/bindings and drops a message once it's acknowledged.",
    traps: {
      "They are identical": "They solve overlapping problems very differently — log-and-replay vs. route-and-remove.",
      "Kafka cannot scale horizontally": "Kafka scales out precisely by partitioning topics across brokers — horizontal scale is its strength.",
      "RabbitMQ stores an immutable log consumers replay by offset": "That's Kafka's model. RabbitMQ queues hold messages until acked, then remove them — no offset replay.",
    },
  },

  /* ---------- Databases & Data ---------- */
  "In ACID, what does the <b>D</b> stand for, and what does it promise?": {
    principle: "ACID's D is about surviving failure after you've said 'committed'.",
    best: "Durability: once a transaction commits, its effects persist (via WAL/disk/replication) and survive a crash or power loss.",
    traps: {
      "Distribution — data is sharded": "Sharding is a scaling technique, not part of ACID; ACID says nothing about spreading data across nodes.",
      "Delegation — writes are queued": "Queuing writes isn't an ACID property — and it isn't even what 'D' abbreviates.",
      "Determinism — queries always return the same rows": "Query determinism isn't an ACID guarantee; the D is Durability.",
    },
  },
  "You store the customer's name and address on every order row. Which problem does this most directly cause?": {
    principle: "Repeating the same fact in many rows is denormalization — and it breeds inconsistency.",
    best: "It causes redundancy and update anomalies: change one customer's address and you must find and fix every order row, or the data disagrees with itself. A customer table referenced by a foreign key fixes it.",
    traps: {
      "Loss of durability": "Durability is about surviving crashes after commit — unrelated to duplicating a field across rows.",
      "Broken TLS": "TLS is transport encryption; it has nothing to do with schema design.",
      "Automatic deadlocks": "Deadlocks come from concurrent lock ordering, not from storing a column redundantly.",
    },
  },
  "Which index structure is the default in most relational databases and supports range scans efficiently?": {
    principle: "Choose the index by the queries it must serve — equality only, or ranges too?",
    best: "A B-tree keeps keys in sorted order, so it serves equality AND range predicates (<, >, BETWEEN, ORDER BY) — which is why it's the default.",
    traps: {
      "Hash": "Hash indexes are great for exact-match equality but can't do range scans — the hash destroys order.",
      "Bitmap": "Bitmap indexes suit low-cardinality columns in analytics/warehouses, not general-purpose OLTP range queries.",
      "Inverted (full-text)": "Inverted indexes power text search over documents, not ordered range scans on a column.",
    },
  },
  "Under the <span class='mono'>READ COMMITTED</span> isolation level, which anomaly is still possible?": {
    principle: "Each isolation level blocks a specific set of anomalies; know which one it stops short of.",
    best: "READ COMMITTED only guarantees you read committed data, so a row can change between two reads in the same transaction — a non-repeatable read.",
    traps: {
      "Dirty reads": "Dirty reads are exactly what READ COMMITTED prevents — you never see another transaction's uncommitted write.",
      "Reading uncommitted data": "That's a dirty read by another name, and READ COMMITTED forbids it.",
      "None — it is the strictest level": "SERIALIZABLE is the strictest level; READ COMMITTED is fairly permissive.",
    },
  },

  /* ---------- form-only questions ---------- */
  "Which delivery guarantee is the hardest to achieve and usually needs dedup or transactional writes?": {
    principle: "The three guarantees trade off duplicates against loss; one of them tries to have neither.",
    best: "Exactly-once is hardest — true end-to-end exactly-once is usually approximated with at-least-once delivery plus idempotent/dedup processing or transactional writes.",
    traps: {
      "At-most-once": "At-most-once is the easy end: just don't retry. You risk loss, but it's simple, not hard.",
      "At-least-once": "At-least-once is straightforward (retry until acked); the hard part is removing the duplicates it creates.",
      "Best-effort": "Best-effort makes no promises at all, so there's nothing hard to engineer.",
    },
  },
  "Which isolation level prevents dirty reads, non-repeatable reads AND phantom reads?": {
    principle: "Only the strictest level eliminates all three standard anomalies.",
    best: "SERIALIZABLE makes transactions behave as if run one at a time, so dirty reads, non-repeatable reads and phantoms are all prevented.",
    traps: {
      "Read Committed": "Read Committed stops dirty reads only; non-repeatable reads and phantoms remain possible.",
      "Read Uncommitted": "The weakest level — it even allows dirty reads.",
      "Repeatable Read": "Repeatable Read stops dirty and non-repeatable reads but, in the SQL standard, still allows phantom rows.",
    },
  },
  "Which HTTP method is NOT idempotent, so retries risk creating duplicates?": {
    principle: "Idempotent methods can be retried safely; find the one that can't.",
    best: "POST typically creates a new resource on each call, so a retried POST after a timeout can create a duplicate — it is not idempotent.",
    traps: {
      "PUT": "PUT replaces the resource at a known URI; repeating it lands on the same state, so it's idempotent.",
      "DELETE": "Deleting an already-deleted resource still ends 'gone' — idempotent.",
      "GET": "GET is safe and idempotent — it shouldn't change state at all.",
    },
  },
  "In Kafka, message ordering is guaranteed:": {
    principle: "Kafka's ordering promise is scoped to a partition, not the whole topic.",
    best: "Order is guaranteed within a single partition; to keep related events ordered, give them the same partition key so they land in the same partition.",
    traps: {
      "Across the whole topic globally": "A topic is split into partitions consumed in parallel — there's no global order across them.",
      "Only if there is one consumer": "Consumer count doesn't change the guarantee; ordering is a property of the partition, not the reader.",
      "Never": "Kafka does guarantee per-partition order — 'never' is too strong.",
    },
  },
  "What problem does GraphQL most directly address compared with a typical REST API?": {
    principle: "GraphQL's headline win is letting the client shape the response.",
    best: "It targets over- and under-fetching: the client asks for exactly the fields it needs in one query, instead of over-sized payloads or many round-trips.",
    traps: {
      "Encrypting traffic in transit": "That's TLS's job regardless of GraphQL or REST — not what GraphQL is for.",
      "Guaranteeing message delivery": "Delivery guarantees are a messaging concern; GraphQL is a query language over a request/response API.",
      "Enforcing database normalization": "Normalization is a schema-design concern in the database, unrelated to how the API is queried.",
    },
  },
};
