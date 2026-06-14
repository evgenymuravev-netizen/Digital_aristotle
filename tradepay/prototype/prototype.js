/* =====================================================================
   TRADEPAY — clickable prototype
   Three chapters, hash-routed: #/<era>/<persona>/<screen>
   Era 1 Rail (2026) · Era 2 Engine (2027–28) · Era 3 Arm (2029–31)
   ===================================================================== */
(function () {
  "use strict";

  /* ---------------- structure ---------------- */
  var ERAS = [
    { id: "rail",   y: "2026",     name: "The Rail",   tag: "Own the flow" },
    { id: "engine", y: "2027–28",  name: "The Engine", tag: "Win the math" },
    { id: "arm",    y: "2029–31",  name: "The Arm",    tag: "Sell the machine" }
  ];

  var NAV = {
    rail: [
      { id: "merchant", label: "Merchant", ic: "🛒", frame: "phone",
        tabs: [
          { id: "activate", label: "Home", ic: "🏠" },
          { id: "order", label: "Buy", ic: "🛒" },
          { id: "repay", label: "Repay", ic: "💸" },
          { id: "statement", label: "Activity", ic: "📊" }
        ],
        screens: [
          { id: "onboard",   label: "1 · Welcome" },
          { id: "identity",  label: "2 · Nafath" },
          { id: "business",  label: "3 · Your shop" },
          { id: "consent",   label: "4 · Consent" },
          { id: "terms",     label: "5 · Terms" },
          { id: "activate",  label: "6 · Limit live" },
          { id: "order",     label: "Place order" },
          { id: "repay",     label: "Repay" },
          { id: "statement", label: "Statement" }
        ] },
      { id: "rep", label: "Field rep", ic: "🚐", frame: "phone",
        tabs: [
          { id: "route", label: "Route", ic: "🗺️" },
          { id: "onboard", label: "Onboard", ic: "🪪" },
          { id: "approve", label: "Approve", ic: "✅" },
          { id: "cashin", label: "Cash-in", ic: "🧾" }
        ],
        screens: [
          { id: "route",   label: "Route" },
          { id: "onboard", label: "Onboard a shop" },
          { id: "approve", label: "Approve order" },
          { id: "cashin",  label: "Cash-in" }
        ] },
      { id: "distributor", label: "Distributor", ic: "🏭", frame: "console",
        screens: [
          { id: "golive",      label: "Go-live" },
          { id: "dashboard",   label: "Settlement" },
          { id: "collections", label: "Collections" },
          { id: "uplift",      label: "Credit uplift" }
        ] }
    ],
    engine: [
      { id: "merchant", label: "Merchant app", ic: "📱", frame: "phone",
        tabs: [
          { id: "home", label: "Home", ic: "🏠" },
          { id: "netting", label: "Netting", ic: "🔗" },
          { id: "limitup", label: "Limit", ic: "📈" },
          { id: "record", label: "Record", ic: "🗂️" }
        ],
        screens: [
          { id: "home",    label: "Home" },
          { id: "netting", label: "Netting" },
          { id: "limitup", label: "Limit up" },
          { id: "repay",   label: "Repay" },
          { id: "record",  label: "Record" }
        ] },
      { id: "risk", label: "Risk cockpit", ic: "🎛️", frame: "console",
        screens: [
          { id: "frontier",   label: "Approval@loss" },
          { id: "challenger", label: "Challenger" },
          { id: "guardrails", label: "Guardrails" },
          { id: "fraud",      label: "Fraud graph" }
        ] },
      { id: "partner", label: "Partner / channel", ic: "🔌", frame: "console",
        screens: [
          { id: "uplifttest", label: "+15pp test" },
          { id: "checkout",   label: "Checkout widget" },
          { id: "api",        label: "Engine API" }
        ] }
    ],
    arm: [
      { id: "distributor", label: "Arm tenant", ic: "🏢", frame: "console",
        screens: [
          { id: "launcher", label: "Launch arm" },
          { id: "tenant",   label: "Portfolio" }
        ] },
      { id: "funder", label: "Bank / funder", ic: "🏦", frame: "console",
        screens: [
          { id: "warehouse",      label: "Warehouse" },
          { id: "securitization", label: "Securitization" }
        ] },
      { id: "brand", label: "FMCG brand", ic: "📊", frame: "console",
        screens: [
          { id: "intelligence", label: "Trade intel" }
        ] }
    ]
  };

  /* narrative order for the guided tour across all five years */
  var TOUR = [
    "rail/merchant/onboard", "rail/merchant/identity", "rail/merchant/business",
    "rail/merchant/consent", "rail/merchant/terms", "rail/merchant/activate",
    "rail/merchant/order", "rail/merchant/repay", "rail/merchant/statement",
    "rail/rep/onboard", "rail/rep/approve", "rail/rep/cashin",
    "rail/distributor/golive", "rail/distributor/dashboard", "rail/distributor/collections", "rail/distributor/uplift",
    "engine/merchant/home", "engine/merchant/netting", "engine/merchant/limitup", "engine/merchant/record",
    "engine/risk/frontier", "engine/risk/challenger", "engine/risk/guardrails", "engine/risk/fraud",
    "engine/partner/uplifttest", "engine/partner/checkout", "engine/partner/api",
    "arm/distributor/launcher", "arm/distributor/tenant", "arm/funder/warehouse",
    "arm/funder/securitization", "arm/brand/intelligence"
  ];

  var DEFAULT = "rail/merchant/onboard";

  /* ---------------- state ---------------- */
  var STATE = {
    onb: { id: false },
    consent: { zatca: true, bureau: true, market: false },
    order: { basket: 22000, placed: false },
    repay: { paid: false },
    limitup: false,
    rep: { decided: null, onbStep: 0 },
    lossBudget: 2.5,
    promoted: false,
    guards: { caps: true, breaker: true, velocity: true, concentration: false },
    breakerTripped: false,
    upliftRun: false,
    armStep: 0,
    arm: { name: "Watania Capital", color: "#155e46" },
    draw: 180,
    tranche: { senior: true, mezz: true, equity: true }
  };

  var MERCHANT = { name: "Abu Khalid", shop: "بقالة النور · Al Noor Grocery", limit: 32000, used: 14200 };
  function free() { return MERCHANT.limit - MERCHANT.used; }

  /* ---------------- helpers ---------------- */
  function money(n) { return Number(Math.round(n)).toLocaleString("en-US"); }
  function el(id) { return document.getElementById(id); }
  function chip(t, k) { return '<span class="u-chip ' + (k || "dim") + '">' + t + "</span>"; }

  function ring(pct, big, small, color) {
    var R = 52, C = 2 * Math.PI * R, off = C * (1 - pct / 100);
    color = color || "#181815";
    return '<div class="u-ring"><svg width="118" height="118" viewBox="0 0 118 118">' +
      '<circle cx="59" cy="59" r="52" fill="none" stroke="#ececec" stroke-width="11"/>' +
      '<circle cx="59" cy="59" r="52" fill="none" stroke="' + color + '" stroke-width="11" stroke-linecap="round" ' +
      'stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg>' +
      '<div class="in"><b>' + big + "</b><small>" + small + "</small></div></div>";
  }

  function spark(vals, w, h, color, fill) {
    var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
    var rng = (max - min) || 1, n = vals.length;
    var pts = vals.map(function (v, i) {
      var x = (i / (n - 1)) * w, y = h - ((v - min) / rng) * (h - 6) - 3;
      return x.toFixed(1) + "," + y.toFixed(1);
    });
    var poly = '<polyline fill="none" stroke="' + color + '" stroke-width="2.2" points="' + pts.join(" ") + '"/>';
    var area = "";
    if (fill) area = '<polygon fill="' + fill + '" stroke="none" points="0,' + h + " " + pts.join(" ") + " " + w + "," + h + '"/>';
    return '<svg viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" style="width:100%;height:' + h + 'px">' + area + poly + "</svg>";
  }

  function bars(vals, labels, color, h) {
    h = h || 90;
    var max = Math.max.apply(null, vals) || 1, n = vals.length, gap = 6;
    var bw = (100 - gap * (n - 1)) / n;
    var out = '<svg viewBox="0 0 100 ' + (h + 16) + '" style="width:100%;height:auto">';
    vals.forEach(function (v, i) {
      var bh = (v / max) * h, x = i * (bw + gap), y = h - bh;
      out += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="1.2" fill="' + (typeof color === "function" ? color(i) : color) + '"/>';
      if (labels) out += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (h + 11) + '" font-size="5" fill="#a3a39b" text-anchor="middle" font-family="JetBrains Mono">' + labels[i] + "</text>";
    });
    return out + "</svg>";
  }

  function statTile(lbl, num, sub, delta, dcls) {
    return '<div class="u-stat"><div class="lbl">' + lbl + '</div><div class="num">' + num +
      (sub ? ' <small>' + sub + "</small>" : "") + "</div>" +
      (delta ? '<div class="delta ' + (dcls || "up") + '">' + delta + "</div>" : "") + "</div>";
  }

  function row(t, d, r, rs) {
    return '<div class="u-row"><div class="l"><div class="t">' + t + '</div><div class="d">' + d +
      '</div></div><div class="r">' + r + (rs ? "<small>" + rs + "</small>" : "") + "</div></div>";
  }

  /* ===================================================================
     SCREEN RENDERERS  (return inner HTML of the device body / main)
     =================================================================== */
  var S = {};

  /* ---------- RAIL · MERCHANT ---------- */
  function onbSteps(active) {
    var labels = ["Welcome", "Nafath", "Shop", "Consent", "Terms", "Live"];
    return '<div class="u-steps">' + labels.map(function (l, i) {
      return '<span class="' + (i < active ? "done" : i === active ? "on" : "") + '"></span>';
    }).join("") + "</div>";
  }
  S["rail/merchant/onboard"] = {
    head: { t: "Welcome", sub: "Set up by your rep · مع المندوب" },
    render: function () {
      return onbSteps(0) +
        '<div class="u-dark u-pop"><div class="lbl">بقالة النور · Al Noor Grocery</div>' +
        '<div class="amt" style="font-size:26px">Let’s set up<br>your <span>buying limit</span></div>' +
        '<div class="ft"><span>NO BRANCH · NO QUEUE</span><span>~3 MINUTES</span></div></div>' +
        '<div class="u-note">Your distributor’s rep is doing this with you, on the counter, in the language you speak. Everything is earned after a relationship you already trust — not a bank assessment.</div>' +
        '<div class="u-card"><div class="u-sec">What happens next</div>' +
        row("Confirm who you are", "National ID via Nafath — one tap", chip("STEP 2", "dim")) +
        row("Confirm your shop", "Pre-filled from your distributor", chip("STEP 3", "dim")) +
        row("Choose what to share", "Honest, reversible consent", chip("STEP 4", "dim")) +
        row("Read your terms", "Murabaha, one page, no late fees", chip("STEP 5", "dim")) + "</div>" +
        '<button class="u-btn" onclick="TP.go(\'rail/merchant/identity\')">Start →</button>';
    }
  };
  S["rail/merchant/identity"] = {
    head: { t: "Confirm identity", sub: "الهوية · via Nafath" },
    render: function () {
      var done = STATE.onb.id;
      return onbSteps(1) +
        (done
          ? '<div class="u-center u-pop"><div class="big">✅</div><h3>Verified with Nafath</h3><p>No password stored. Your bank-grade national identity, in one tap.</p></div>' +
            '<div class="u-card">' +
            '<div class="u-kv"><span class="k">Name</span><span class="v">' + MERCHANT.name + '</span></div>' +
            '<div class="u-kv"><span class="k">National ID</span><span class="v">1•••••••842</span></div>' +
            '<div class="u-kv"><span class="k">Method</span><span class="v ok">Nafath SSO</span></div></div>' +
            '<button class="u-btn" onclick="TP.go(\'rail/merchant/business\')">Continue →</button>'
          : '<div class="u-card" style="text-align:center;padding:26px 18px">' +
            '<div style="font-size:42px">🪪</div>' +
            '<h3 style="margin:12px 0 6px;font-size:17px">Sign in with Nafath</h3>' +
            '<p style="font-size:12.5px;color:var(--dim);max-width:30ch;margin:0 auto 4px">The Kingdom’s national digital identity. We never see or store a password — auth happens on Nafath’s side.</p></div>' +
            '<button class="u-btn amber" onclick="TP.onbId()">Open Nafath →</button>') ;
    }
  };
  S["rail/merchant/business"] = {
    head: { t: "Your shop", sub: "المنشأة · pre-filled" },
    render: function () {
      return onbSteps(2) +
        '<div class="u-note ok">Pulled from your distributor’s records — confirm or fix. The rep already knows this shop; you’re not filling forms from scratch.</div>' +
        '<div class="u-card"><div class="u-sec">Business details</div>' +
        '<label class="u-sec" style="margin-top:0">Shop name</label><input class="u-input" value="Al Noor Grocery · بقالة النور" style="margin-bottom:10px">' +
        '<label class="u-sec">Commercial registration</label><input class="u-input" value="CR 1010••••" style="margin-bottom:10px">' +
        '<div class="u-row"><div class="l"><div class="t">Shopfront photo</div><div class="d">Geo-tagged by the rep</div></div><div class="r">' + chip("ON FILE", "ok") + '</div></div>' +
        '<div class="u-row"><div class="l"><div class="t">Route & district</div><div class="d">Route 12 · Al Olaya</div></div><div class="r">' + chip("MATCHED", "dim") + '</div></div></div>' +
        '<button class="u-btn" onclick="TP.go(\'rail/merchant/consent\')">Looks right — continue →</button>';
    }
  };
  S["rail/merchant/consent"] = {
    head: { t: "What you share", sub: "الموافقة · PDPL" },
    render: function () {
      var c = STATE.consent;
      return onbSteps(3) +
        '<div class="u-note">A fair trade, stated plainly: the more you connect, the faster your limit can grow. You can turn any of these off later — consent is reversible.</div>' +
        '<div class="u-card">' +
        consentToggle("zatca", "Connect ZATCA e-invoicing", "Your real sales — the strongest signal. Bigger limit, faster.", c.zatca) +
        consentToggle("bureau", "SIMAH bureau — read & report", "Build a formal credit history every on-time cycle.", c.bureau) +
        consentToggle("market", "Aggregated market insights", "Anonymous, k-anonymized — never your shop, identifiably.", c.market) +
        "</div>" +
        '<div class="u-card flat"><div class="u-sec">Your estimated limit with these choices</div>' +
        '<div class="u-dark" style="margin:0"><div class="lbl">Indicative buying limit</div><div class="amt">SAR <span id="consentLimit">' + money(consentLimit()) + "</span></div>" +
        '<div class="ft"><span>BASE 18,000</span><span id="consentBoost">' + consentBoostLbl() + "</span></div></div></div>" +
        '<button class="u-btn" onclick="TP.go(\'rail/merchant/terms\')">Continue →</button>';
    }
  };
  S["rail/merchant/terms"] = {
    head: { t: "Your terms", sub: "مرابحة · one page" },
    render: function () {
      return onbSteps(4) +
        '<div class="u-banner"><span class="ic">📜</span><div>Scholar-certified <b>Murabaha</b> — genuine cost-plus, not a wrapper. So plain it fits on one screen.</div></div>' +
        '<div class="u-card"><div class="u-sec">The whole contract</div>' +
        '<div class="u-kv"><span class="k">Structure</span><span class="v">Murabaha (cost-plus)</span></div>' +
        '<div class="u-kv"><span class="k">Cost</span><span class="v">Flat fee in riyals, shown per order</span></div>' +
        '<div class="u-kv"><span class="k">Late fees</span><span class="v ok">None — ever</span></div>' +
        '<div class="u-kv"><span class="k">Miss a cycle</span><span class="v">A restructure offer, not a charge</span></div>' +
        '<div class="u-kv"><span class="k">Pay early</span><span class="v ok">Earn a rebate</span></div>' +
        '<div class="u-kv"><span class="k">Your data</span><span class="v">Yours · revocable anytime</span></div></div>' +
        '<div class="u-row"><div class="l"><div class="t">Shariah board</div><div class="d">Certified, per product change</div></div><div class="r">' + chip("✓ CERTIFIED", "ok") + '</div></div>' +
        '<button class="u-btn" onclick="TP.go(\'rail/merchant/activate\')">Accept &amp; activate my limit →</button>';
    }
  };
  S["rail/merchant/activate"] = {
    head: { t: "Marhaba, Abu Khalid", sub: MERCHANT.shop },
    render: function () {
      return onbSteps(5) +
        '<div class="u-center" style="padding:8px 0 4px"><div class="big u-pop">🎉</div></div>' +
        '<div class="u-dark u-pop"><div class="lbl">حد الشراء · Buying limit — now live</div>' +
        '<div class="amt">SAR <span>' + money(MERCHANT.limit) + "</span></div>" +
        '<div class="bar"><i style="width:' + (MERCHANT.used / MERCHANT.limit * 100) + '%"></i></div>' +
        '<div class="ft"><span>USED ' + money(MERCHANT.used) + "</span><span>FREE " + money(free()) + "</span></div></div>" +
        '<div class="u-note ok">Sized from your distributor’s sales history with this shop — the cold-start solved by the channel, not a credit file you don’t have.</div>' +
        '<div class="u-card"><div class="u-sec">What you can do now</div>' +
        row("Stock with any connected supplier", "5 suppliers on the rail today", chip("READY", "ok")) +
        row("One due date", "Everything nets to a single weekly schedule", chip("AUTO", "dim")) +
        row("Grow your limit", "On-time repayment reports to SIMAH", chip("SIMAH", "amber")) +
        "</div>" +
        '<button class="u-btn" onclick="TP.go(\'rail/merchant/order\')">Place your first order →</button>';
    }
  };
  S["rail/merchant/statement"] = {
    head: { t: "Activity", sub: "كشف الحساب · this month" },
    render: function () {
      return '<div class="u-dark"><div class="lbl">This month on the rail</div><div class="amt">SAR <span>41,200</span></div>' +
        '<div class="ft"><span>FINANCED</span><span class="amber">FEE SAR 494 · 1.2%</span></div></div>' +
        '<div class="u-grid2" style="gap:10px">' +
        '<div class="u-stat"><div class="lbl">ON-TIME</div><div class="num" style="font-size:22px">22</div><div class="delta up">cycles in a row</div></div>' +
        '<div class="u-stat"><div class="lbl">LIMIT</div><div class="num" style="font-size:22px">+25%</div><div class="delta up">earned since Jan</div></div></div>' +
        '<div class="u-chart"><div class="u-sec">Cash-flow mirror — money in vs out</div>' +
        spark([18, 22, 19, 26, 24, 30, 28, 34, 31, 38], 600, 78, "#1e7f4f", "rgba(30,127,79,.09)") +
        '<div class="u-legend"><span>weekly net position · safe-to-stock window highlighted in-app</span></div></div>' +
        '<div class="u-card"><div class="u-sec">Recent</div>' +
        row("Order · Al Noor Wholesale", "Thu · financed", "SAR 12,400") +
        row("Repaid · netted", "5 suppliers, one date", "−SAR 4,950") +
        row("Rebate · early settlement", "On-time bonus", "+SAR 22") + "</div>" +
        '<div class="u-note">The statement doubles as a cash-flow mirror — given, not sold. Insight that deepens the rail and earns the merchant’s trust.</div>';
    }
  };
  function consentLimit() {
    var l = 18000; if (STATE.consent.zatca) l += 11000; if (STATE.consent.bureau) l += 3000; return l;
  }
  function consentBoostLbl() {
    var b = consentLimit() - 18000;
    return b > 0 ? "+" + money(b) + " from sharing" : "base only";
  }
  function consentToggle(id, t, d, on) {
    return '<div class="u-toggle"><div>' + t + '<div class="d">' + d + '</div></div>' +
      '<button class="sw ' + (on ? "on" : "") + '" onclick="TP.consent(\'' + id + '\')"></button></div>';
  }
  S["rail/merchant/order"] = {
    head: { t: "New order", sub: "Al Noor Wholesale · مخزن" },
    render: function () {
      var o = STATE.order, b = o.basket;
      var approved = Math.min(b, free()), cash = Math.max(0, b - free());
      var fee = approved * 0.012;
      if (o.placed) {
        return '<div class="u-center u-pop"><div class="big">✅</div><h3>Order placed</h3>' +
          '<p>Your supplier is settled on-rail. Your obligation joins one netted schedule.</p></div>' +
          '<div class="u-card">' +
          '<div class="u-kv"><span class="k">Financed now</span><span class="v">SAR ' + money(approved) + "</span></div>" +
          (cash > 0 ? '<div class="u-kv"><span class="k">Paid cash</span><span class="v">SAR ' + money(cash) + "</span></div>" : "") +
          '<div class="u-kv"><span class="k">Murabaha fee</span><span class="v amber">SAR ' + money(fee) + "</span></div>" +
          '<div class="u-kv"><span class="k">Due (one date)</span><span class="v">Thursday · netted</span></div></div>' +
          '<button class="u-btn ghost" onclick="TP.resetOrder()">↺ Try another basket</button>' +
          '<button class="u-btn" style="margin-top:8px" onclick="TP.go(\'rail/merchant/repay\')">See repayment ▸</button>';
      }
      return '' +
        '<div class="u-dark"><div class="lbl">Available headroom</div><div class="amt">SAR <span>' + money(free()) + "</span></div>" +
        '<div class="ft"><span>LIMIT ' + money(MERCHANT.limit) + "</span><span>USED " + money(MERCHANT.used) + "</span></div></div>" +
        '<div class="u-card"><div class="u-sec">Choose your basket</div>' +
        '<div class="u-grid3" style="gap:8px;margin-bottom:10px">' +
        chipBtn(8000, b) + chipBtn(14000, b) + chipBtn(22000, b) + "</div>" +
        '<input class="u-slider" type="range" min="2000" max="30000" step="500" value="' + b + '" oninput="TP.basket(this.value)">' +
        '<div class="u-barlbl"><span>SAR 2,000</span><span id="bkVal">SAR ' + money(b) + "</span><span>SAR 30,000</span></div></div>" +
        '<div class="u-card" id="decision">' + decisionBlock(b) + "</div>" +
        '<button class="u-btn" onclick="TP.placeOrder()">Confirm order ▸</button>';
    }
  };
  function chipBtn(v, cur) {
    return '<button class="u-btn ' + (v === cur ? "" : "ghost") + ' sm" style="width:100%" onclick="TP.basketSet(' + v + ')">SAR ' + money(v) + "</button>";
  }
  function decisionBlock(b) {
    var approved = Math.min(b, free()), cash = Math.max(0, b - free()), fee = approved * 0.012;
    var partial = cash > 0;
    return (partial
        ? '<div class="u-note">Partial approval — the basket-rescue moment. <b>SAR ' + money(approved) + "</b> on your line, <b>SAR " + money(cash) + "</b> cash. <br>SAR 4,200 more frees after Thursday’s repayment."
        : '<div class="u-note ok">Full approval — <b>SAR ' + money(approved) + "</b> on your line.") + "</div>" +
      '<div class="u-kv"><span class="k">Decision latency</span><span class="v ok">212 ms</span></div>' +
      '<div class="u-kv"><span class="k">Financed</span><span class="v">SAR ' + money(approved) + "</span></div>" +
      (partial ? '<div class="u-kv"><span class="k">Cash top-up</span><span class="v">SAR ' + money(cash) + "</span></div>" : "") +
      '<div class="u-kv"><span class="k">Murabaha fee (1.2%)</span><span class="v amber">SAR ' + money(fee) + "</span></div>";
  }
  S["rail/merchant/repay"] = {
    head: { t: "Repayment", sub: "One date · كل الموردين" },
    render: function () {
      if (STATE.repay.paid) {
        return '<div class="u-center u-pop"><div class="big">🎉</div><h3>Settled early</h3>' +
          '<p>SAR 22 rebate applied. Your limit just grew — and it’s written to SIMAH.</p></div>' +
          '<div class="u-dark"><div class="lbl">New buying limit</div><div class="amt">SAR <span>' + money(MERCHANT.limit + 4000) + "</span></div>" +
          '<div class="ft"><span>WAS ' + money(MERCHANT.limit) + '</span><span class="amber">+4,000 unlocked</span></div></div>' +
          '<button class="u-btn ghost" onclick="TP.repayReset()">↺ Replay</button>';
      }
      return '' +
        '<div class="u-card"><div class="u-sec">Due Thursday — 5 suppliers, one schedule</div>' +
        row("Al Noor Wholesale", "Dry goods", "SAR 1,980") +
        row("Tamimi Distribution", "Dairy + chilled", "SAR 1,240") +
        row("Nadec Direct", "Beverages", "SAR 920") +
        row("Sunbulah Foods", "Frozen", "SAR 510") +
        row("Almarai Route", "Daily fresh", "SAR 300") +
        '<div class="u-kv" style="margin-top:8px"><span class="k">Total, netted</span><span class="v">SAR 4,950</span></div></div>' +
        '<div class="u-note">Collected by <b>sarie</b> standing transfer, wallet auto-debit, or your rep on the route — met where your cash already moves. No late fees; lateness triggers a restructure, not a charge.</div>' +
        '<button class="u-btn" onclick="TP.repay()">Repay early → claim SAR 22 rebate ▸</button>';
    }
  };

  /* ---------- RAIL · REP ---------- */
  S["rail/rep/route"] = {
    head: { t: "Route 12 · Al Olaya", sub: "مندوب · 18 stops today" },
    render: function () {
      return '<div class="u-card"><div class="u-sec">Today’s stops</div>' +
        row("Al Noor Grocery", "Limit free SAR 17,800", chip("VISIT", "amber")) +
        row("Basmah Mini-market", "Onboard — pre-scored SAR 12k", chip("NEW", "dim")) +
        row("Hadiya Foodstuff", "Repayment due — collect", chip("CASH-IN", "ok")) +
        row("Rawabi Store", "Limit free SAR 6,400", chip("VISIT", "amber")) +
        "</div>" +
        '<div class="u-note">Acquisition rides the rep’s existing route. Zero new behavior asked of the merchant — the channel <b>is</b> the distribution.</div>' +
        '<button class="u-btn" onclick="TP.go(\'rail/rep/approve\')">Open Al Noor → take an order ▸</button>';
    }
  };
  S["rail/rep/approve"] = {
    head: { t: "Al Noor Grocery", sub: "Order on the tablet" },
    render: function () {
      var d = STATE.rep.decided;
      return '<div class="u-dark"><div class="lbl">Merchant line — live</div><div class="amt">SAR <span>17,800</span> <span style="font-size:13px;color:#bdbdb4">free</span></div></div>' +
        '<div class="u-card"><div class="u-sec">Basket scanned</div>' +
        row("22 SKUs", "Dry, dairy, beverages", "SAR 22,000") + "</div>" +
        (d ? '<div class="u-card u-pop">' +
          '<div class="u-note">Decision in 0.21s, identical to app &amp; checkout.</div>' +
          row("Approved on line", "Financed", "SAR 17,800") +
          row("Collect as cash", "Top-up", "SAR 4,200") +
          '<div class="u-kv"><span class="k">Headroom hint</span><span class="v amber">+SAR 4,200 after Thu</span></div></div>' +
          '<button class="u-btn" onclick="TP.go(\'rail/rep/cashin\')">Take SAR 4,200 cash-in ▸</button>'
          : '<button class="u-btn" onclick="TP.repApprove()">Request credit decision ▸</button>') ;
    }
  };
  S["rail/rep/cashin"] = {
    head: { t: "Cash-in", sub: "Repayment at the source" },
    render: function () {
      return '<div class="u-center"><div class="big">🧾</div><h3>SAR 3,150 collected</h3><p>Recorded on-rail against Hadiya’s schedule. Receipt sent on WhatsApp.</p></div>' +
        '<div class="u-card">' +
        '<div class="u-kv"><span class="k">Merchant</span><span class="v">Hadiya Foodstuff</span></div>' +
        '<div class="u-kv"><span class="k">Method</span><span class="v">Rep cash-in</span></div>' +
        '<div class="u-kv"><span class="k">Posted to rail</span><span class="v ok">Instant</span></div>' +
        '<div class="u-kv"><span class="k">DPD impact</span><span class="v ok">Current</span></div></div>' +
        '<div class="u-note">Three capture rails — sarie, auto-debit, rep cash-in — so repayment meets the merchant’s real cash rhythm. This is the number that prices everything downstream.</div>';
    }
  };

  /* ---------- RAIL · DISTRIBUTOR (console) ---------- */
  S["rail/distributor/dashboard"] = {
    title: "Settlement & rail", url: "console.tradepay.sa/rail/al-noor-distribution",
    render: function () {
      return '<div class="u-h"><div><h2>Al Noor Distribution — settlement</h2><div class="sub">Riyadh · 1,240 merchants on-rail · Route book 12</div></div>' +
        chip("● LIVE · CHAPTER 1 / 2026", "ok") + "</div>" +
        '<div class="u-grid4">' +
        statTile("SETTLED TODAY", "SAR 312,400", "T+1, on-rail", "▲ 18% MoM", "up") +
        statTile("REPAYMENT ON-RAIL", "63%", "of volume", "target ≥60% ✓", "up") +
        statTile("DPD vs FIELD", "−41%", "better than notebook", "collections proof", "up") +
        statTile("CREDIT RISK CARRIED", "SAR 0", "by you", "Tradepay holds it", "up") +
        "</div>" +
        '<div class="u-chart"><div class="u-sec">On-rail repayment capture — last 12 weeks</div>' +
        spark([41, 44, 47, 49, 52, 54, 55, 57, 59, 60, 62, 63], 600, 90, "#1e7f4f", "rgba(30,127,79,.10)") +
        '<div class="u-legend"><span><i style="background:#1e7f4f"></i>% repayment captured on the rail (the Y1 exit metric)</span></div></div>' +
        '<div class="u-grid2">' +
        '<div class="u-card"><div class="u-sec">Settlement queue</div>' +
        row("Almarai Route payout", "47 financed orders", "SAR 88,200", "T+1") +
        row("Tamimi Distribution", "31 financed orders", "SAR 61,050", "T+1") +
        row("Nadec Direct", "22 financed orders", "SAR 40,400", "T+1") + "</div>" +
        '<div class="u-card"><div class="u-sec">Your DSO collapsed</div>' +
        ring(78, "12d", "DSO now", "#181815") +
        '<p style="font-size:11.5px;color:var(--dim);text-align:center;margin-top:10px">From 54 days of informal terms to 12. The route stops being a collections agency.</p></div>' +
        "</div>";
    }
  };
  S["rail/distributor/collections"] = {
    title: "AR & collections", url: "console.tradepay.sa/rail/collections",
    render: function () {
      return '<div class="u-h"><div><h2>Collections workflow</h2><div class="sub">The A10 module, shipped as a rail feature — your daily AR screen</div></div>' + chip("FREE SOFTWARE", "amber") + "</div>" +
        '<div class="u-grid4">' +
        statTile("CURRENT", "94.2%", "of book", "", "up") +
        statTile("1–29 DPD", "4.1%", "", "auto-nudged", "mid") +
        statTile("30–89 DPD", "1.2%", "", "restructure first", "mid") +
        statTile("90+ NPL", "0.5%", "budget < 2.5%", "Square < 3% ✓", "up") + "</div>" +
        '<div class="u-card"><div class="u-sec">Work queue — system-prioritized</div>' +
        '<table class="u-table"><thead><tr><th>Merchant</th><th>Status</th><th>Signal</th><th>Action</th></tr></thead><tbody>' +
        '<tr><td><b>Rawabi Store</b></td><td class="dim">2 DPD</td><td>Sales dip on ZATCA</td><td>' + chip("WhatsApp nudged", "dim") + "</td></tr>" +
        '<tr><td><b>Hadiya Foodstuff</b></td><td class="dim">Settlement stutter</td><td>Early-warning fired</td><td>' + chip("Restructure offer", "amber") + "</td></tr>" +
        '<tr><td><b>Basmah Mini-market</b></td><td class="dim">Current</td><td>Strong ZATCA month</td><td>' + chip("Limit +SAR 3k", "ok") + "</td></tr>" +
        "</tbody></table></div>" +
        '<div class="u-note">A missed cycle triggers an engine-sized <b>restructuring offer before any human chase</b>. Recovery as product, not pursuit — the relationship survives the bad month.</div>';
    }
  };
  S["rail/distributor/uplift"] = {
    title: "Credit uplift", url: "console.tradepay.sa/rail/uplift",
    render: function () {
      return '<div class="u-h"><div><h2>What the financing lifts</h2><div class="sub">Routes, reps and SKUs where credit moves volume</div></div>' + chip("ATTRIBUTION", "dim") + "</div>" +
        '<div class="u-grid3">' +
        statTile("BASKET SIZE", "+34%", "financed vs cash orders", "", "up") +
        statTile("ORDER FREQUENCY", "+1.8×", "weekly reorders", "", "up") +
        statTile("ACTIVE SKUS / SHOP", "+22%", "range expansion", "", "up") + "</div>" +
        '<div class="u-chart"><div class="u-sec">Average order value — financed vs cash (SAR)</div>' +
        bars([9200, 12300, 9100, 16400, 9300, 17800], ["Wk1", "Wk2", "Wk3", "Wk4", "Wk5", "Wk6"], function (i) { return i % 2 ? "#FFC53D" : "#d8d8d0"; }, 90) +
        '<div class="u-legend"><span><i style="background:#d8d8d0"></i>cash baseline</span><span><i style="background:#FFC53D"></i>on financed line</span></div></div>' +
        '<div class="u-note">This is genuine operational software the distributor wants — and it quietly deepens the rail. Every screen here is also a feed for the Engine that arrives next year.</div>' +
        '<button class="u-btn" style="max-width:360px" onclick="TP.tour(1)">Year 1 proven → open Chapter 2 ▸</button>';
    }
  };

  /* ---------- ENGINE · MERCHANT ---------- */
  S["engine/merchant/home"] = {
    head: { t: "Tradepay", sub: "تريدباي · the app, after trust" },
    render: function () {
      return '<div class="u-banner"><span class="ic">📱</span><div><b>2027 — the app arrives second.</b> You met us through your rep; now you hold the controls.</div></div>' +
        '<div class="u-dark"><div class="lbl">حد الشراء · Buying limit</div><div class="amt">SAR <span>' + money(MERCHANT.limit) + "</span></div>" +
        '<div class="bar"><i style="width:44%"></i></div><div class="ft"><span>USED 14,200</span><span>FREE 17,800</span></div></div>' +
        '<div class="u-grid2" style="gap:10px">' +
        '<div class="u-stat"><div class="lbl">DUE THURSDAY</div><div class="num" style="font-size:18px">SAR 4,950</div><div class="delta mid">5 suppliers · 1 date</div></div>' +
        '<div class="u-stat"><div class="lbl">FORECAST</div><div class="num" style="font-size:18px">Safe</div><div class="delta up">cash-flow mirror</div></div></div>' +
        '<div class="u-card"><div class="u-sec">Quick actions</div>' +
        row("One-tap repay", "sarie / wallet", chip("→", "dim")) +
        row("Multi-supplier netting", "one limit across all", chip("NEW", "amber")) +
        row("Your portable record", "SIMAH-grade, yours", chip("→", "dim")) + "</div>" +
        '<button class="u-btn" onclick="TP.go(\'engine/merchant/netting\')">See multi-supplier netting ▸</button>';
    }
  };
  S["engine/merchant/netting"] = {
    head: { t: "Netting", sub: "One limit · five suppliers" },
    render: function () {
      return '<div class="u-card"><div class="u-sec">Before — five lines, five chases</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">' + chip("Almarai", "dim") + chip("Tamimi", "dim") + chip("Nadec", "dim") + chip("Sunbulah", "dim") + chip("Al Noor", "dim") + "</div>" +
        '<p style="font-size:11.5px;color:var(--dim)">Five due dates, five reps, five ways to fall behind.</p></div>' +
        '<div class="u-center" style="padding:6px"><div style="font-size:22px">↓</div></div>' +
        '<div class="u-dark"><div class="lbl">After — one netted obligation</div><div class="amt">SAR <span>4,950</span></div>' +
        '<div class="ft"><span>5 SUPPLIERS</span><span class="amber">ONE THURSDAY</span></div></div>' +
        '<div class="u-note ok">The single most-loved feature of every portable-credit analogue — delivered <b>through</b> the channel, not against it. And the engine sees cross-supplier signal no captive arm ever will.</div>' +
        '<button class="u-btn ghost" onclick="TP.go(\'engine/merchant/record\')">View my portable record ▸</button>';
    }
  };
  S["engine/merchant/repay"] = {
    head: { t: "Repay", sub: "سداد · one tap" },
    render: function () {
      return '<div class="u-dark"><div class="lbl">Due Thursday — netted</div><div class="amt">SAR <span>4,950</span></div></div>' +
        '<div class="u-card"><div class="u-toggle"><div>Pay now via sarie<div class="d">From your linked bank — instant</div></div><button class="sw on"></button></div>' +
        '<div class="u-toggle"><div>Auto-debit future cycles<div class="d">Salary/cash-cycle aware, Ramadan-adjusted</div></div><button class="sw on"></button></div>' +
        '<div class="u-toggle"><div>Early-settlement rebate<div class="d">Save SAR 22 if you pay today</div></div><button class="sw on"></button></div></div>' +
        '<button class="u-btn" onclick="TP.go(\'engine/merchant/record\')">Confirm repayment ▸</button>';
    }
  };
  S["engine/merchant/record"] = {
    head: { t: "Your record", sub: "ملفك · portable, yours" },
    render: function () {
      return '<div class="u-center"><div class="big">📈</div><h3>22 on-time cycles</h3><p>Your first bureau-grade history — owned by you, portable across every supplier and brand on the rail.</p></div>' +
        '<div class="u-chart"><div class="u-sec">Limit growth — earned by repayment</div>' +
        spark([12, 12, 14, 14, 18, 18, 22, 24, 26, 28, 30, 32], 600, 80, "#181815", "rgba(24,24,21,.07)") +
        '<div class="u-legend"><span>SAR thousands · each on-time cycle steps it up</span></div></div>' +
        '<div class="u-card">' + row("Reported to SIMAH", "Every cycle", chip("✓", "ok")) +
        row("Portable across rail", "Keeps history under any brand", chip("YOURS", "amber")) +
        row("Adverse action", "Always a path back, in your language", chip("FAIR", "dim")) + "</div>";
    }
  };

  /* ---------- ENGINE · RISK (console) ---------- */
  S["engine/risk/frontier"] = {
    title: "Approval @ loss", url: "console.tradepay.sa/engine/frontier",
    render: function () {
      return '<div class="u-h"><div><h2>The operating frontier</h2><div class="sub">Maximum approvals inside the quarterly loss budget — the engine’s only job</div></div>' + chip("● CHAPTER 2 / 2027–28", "amber") + "</div>" +
        '<div class="u-grid2" style="align-items:start">' +
        '<div class="u-card"><div class="u-sec">Loss budget (set by Risk + Finance)</div>' +
        '<input class="u-slider" type="range" min="1.5" max="4" step="0.1" value="' + STATE.lossBudget + '" oninput="TP.frontier(this.value)">' +
        '<div class="u-barlbl"><span>1.5% conservative</span><span id="lbVal">' + STATE.lossBudget.toFixed(1) + '%</span><span>4.0% aggressive</span></div>' +
        '<div style="margin-top:16px" id="frontierStats"></div></div>' +
        '<div class="u-card"><div class="u-sec">The frontier — approvals vs loss</div><div id="frontierChart"></div>' +
        '<div class="u-legend"><span><i style="background:#181815"></i>frontier</span><span><i style="background:#FFC53D"></i>your operating point</span><span><i style="background:#d8d8d0"></i>a relationship credit desk</span></div></div>' +
        "</div>" +
        '<div class="u-note">Every policy change must beat champion on <b>both</b> approval and loss in the same vintage — challenger or it didn’t ship. The rail’s own settlement data is the feature no off-rail lender has.</div>';
    },
    init: function () { paintFrontier(); }
  };
  function frontierApprovals(loss) {
    /* concave: approvals rise with loss tolerance, with diminishing returns */
    var a = 78 - 30 * Math.exp(-(loss - 1.0) * 0.95);
    return a;
  }
  function paintFrontier() {
    var loss = STATE.lossBudget, appr = frontierApprovals(loss), desk = appr - 15;
    var fs = el("frontierStats");
    if (fs) fs.innerHTML =
      '<div class="u-grid2" style="gap:10px">' +
      '<div class="u-stat"><div class="lbl">ENGINE APPROVALS</div><div class="num">' + appr.toFixed(0) + '%</div><div class="delta up">at ' + loss.toFixed(1) + '% loss</div></div>' +
      '<div class="u-stat"><div class="lbl">CREDIT DESK</div><div class="num" style="color:#a3a39b">' + desk.toFixed(0) + '%</div><div class="delta dn">same loss, −15pp</div></div></div>' +
      '<div class="u-note ok" style="margin-bottom:0">+' + (appr - desk).toFixed(0) + 'pp approvals at an identical loss rate — measured, not asserted.</div>';
    var fc = el("frontierChart");
    if (fc) {
      var W = 300, H = 150, pad = 6;
      var pts = [], dpts = [];
      for (var l = 1.5; l <= 4.01; l += 0.1) {
        var x = pad + ((l - 1.5) / 2.5) * (W - 2 * pad);
        var y = H - pad - (frontierApprovals(l) / 80) * (H - 2 * pad);
        pts.push(x.toFixed(1) + "," + y.toFixed(1));
        var yd = H - pad - ((frontierApprovals(l) - 15) / 80) * (H - 2 * pad);
        dpts.push(x.toFixed(1) + "," + yd.toFixed(1));
      }
      var px = pad + ((loss - 1.5) / 2.5) * (W - 2 * pad);
      var py = H - pad - (appr / 80) * (H - 2 * pad);
      fc.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;height:auto">' +
        '<polyline fill="none" stroke="#d8d8d0" stroke-width="2" stroke-dasharray="4 3" points="' + dpts.join(" ") + '"/>' +
        '<polyline fill="none" stroke="#181815" stroke-width="2.4" points="' + pts.join(" ") + '"/>' +
        '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="6" fill="#FFC53D" stroke="#181815" stroke-width="1.5"/>' +
        '<text x="' + px.toFixed(1) + '" y="' + (py - 10).toFixed(1) + '" font-size="9" text-anchor="middle" font-family="JetBrains Mono" fill="#181815">' + appr.toFixed(0) + '%</text>' +
        "</svg>";
    }
  }
  S["engine/risk/challenger"] = {
    title: "Champion / challenger", url: "console.tradepay.sa/engine/challenger",
    render: function () {
      var p = STATE.promoted;
      return '<div class="u-h"><div><h2>Challenger v18 — promote?</h2><div class="sub">Evaluated on live shadow decisions before it touches a real merchant</div></div>' + (p ? chip("PROMOTED", "ok") : chip("SHADOW", "amber")) + "</div>" +
        '<div class="u-grid3">' +
        statTile("APPROVAL", "71.4%", "challenger", "+3.1pp vs champ", "up") +
        statTile("LOSS (vintage)", "2.38%", "challenger", "−0.12pp vs champ", "up") +
        statTile("DECISIONS SHADOWED", "184,500", "same vintage", "stat-sig ✓", "up") + "</div>" +
        '<div class="u-card"><div class="u-sec">Promotion gate — both must improve, same vintage</div>' +
        '<div class="u-kv"><span class="k">Beats champion on approval</span><span class="v ok">✓ +3.1pp</span></div>' +
        '<div class="u-kv"><span class="k">Beats champion on loss</span><span class="v ok">✓ −0.12pp</span></div>' +
        '<div class="u-kv"><span class="k">Fairness tests (no protected proxies)</span><span class="v ok">✓ pass</span></div>' +
        '<div class="u-kv"><span class="k">Model card generated</span><span class="v ok">✓ v18</span></div></div>' +
        (p ? '<div class="u-note ok">Promoted. Champion retired to shadow. The edge compounds vintage over vintage — a moat that widens while competitors copy last year’s model.</div>'
          : '<button class="u-btn" onclick="TP.promote()">Promote challenger to champion ▸</button>');
    }
  };
  S["engine/risk/guardrails"] = {
    title: "Guardrails", url: "console.tradepay.sa/engine/guardrails",
    render: function () {
      var g = STATE.guards;
      return '<div class="u-h"><div><h2>Survival guardrails</h2><div class="sub">A9’s discipline, installed in peacetime — before growth pressure exists</div></div>' +
        (STATE.breakerTripped ? chip("● BREAKER TRIPPED", "bad") : chip("ALL NOMINAL", "ok")) + "</div>" +
        '<div class="u-card">' +
        guardToggle("caps", "Vintage-exposure caps", "Hard ceiling on each monthly cohort’s exposure", g.caps) +
        guardToggle("breaker", "Per-market circuit breakers", "Auto-halt originations if a market’s early-warning trips", g.breaker) +
        guardToggle("velocity", "New-merchant velocity limits", "Step-up only on anomaly — fast growth is a fraud magnet", g.velocity) +
        guardToggle("concentration", "Single-distributor concentration cap", "Limit book share from any one anchor", g.concentration) +
        "</div>" +
        '<div class="u-grid2">' +
        '<div class="u-card"><div class="u-sec">Vintage exposure vs caps</div>' +
        bars([62, 71, 80, 74, 58, 44], ["Q1", "Q2", "Q3", "Q4", "Q1", "Q2"], function (i) { return i === 2 ? "#b54708" : "#181815"; }, 80) +
        '<div class="u-legend"><span>% of cap used · Q3 near ceiling — new originations auto-throttle</span></div></div>' +
        '<div class="u-card"><div class="u-sec">Circuit breaker drill</div>' +
        '<p style="font-size:11.5px;color:var(--dim);margin-bottom:10px">Simulate an early-warning spike in one market. Risk has authority to brake the company — and everyone knows it.</p>' +
        (STATE.breakerTripped
          ? '<div class="u-note bad" style="margin:0">Originations halted in Market A. Existing book seasons; no new exposure added. Reset when signals normalize.</div><button class="u-btn ghost sm" style="margin-top:10px" onclick="TP.resetBreaker()">↺ Signals normalized — resume</button>'
          : '<button class="u-btn ok" onclick="TP.tripBreaker()">⚠ Trip the breaker (drill)</button>') +
        "</div></div>" +
        '<div class="u-note">Retrofitting discipline during a growth phase is how Capiters happen. These caps own the company’s survival — three owners, never confused: Risk owns the budget, the engine owns the frontier, the caps own survival.</div>';
    }
  };
  function guardToggle(id, t, d, on) {
    return '<div class="u-toggle"><div>' + t + '<div class="d">' + d + '</div></div>' +
      '<button class="sw ' + (on ? "on" : "") + '" onclick="TP.guard(\'' + id + '\')"></button></div>';
  }

  /* ---------- ENGINE · PARTNER (console) ---------- */
  S["engine/partner/uplifttest"] = {
    title: "The +15pp test", url: "console.tradepay.sa/engine/proof",
    render: function () {
      if (STATE.upliftRun) {
        return '<div class="u-h"><div><h2>Result — on your own book</h2><div class="sub">Sary Distribution · 42,800 historical decisions replayed</div></div>' + chip("AUDITED ✓", "ok") + "</div>" +
          '<div class="u-grid3">' +
          statTile("YOUR DESK", "54%", "approvals", "at 3.1% loss", "dn") +
          statTile("TRADEPAY ENGINE", "69%", "approvals", "at 3.0% loss", "up") +
          statTile("UPLIFT", "+15pp", "same loss", "→ more sales", "up") + "</div>" +
          '<div class="u-chart"><div class="u-sec">Approvals at a constant loss rate</div>' +
          bars([54, 69], ["Your desk", "Tradepay"], function (i) { return i ? "#1e7f4f" : "#d8d8d0"; }, 90) + "</div>" +
          '<div class="u-note ok">A relationship-intuition desk cannot answer a measured test. This converts the build-an-arm impulse into a license-the-engine conversation — the structural answer to the named threat.</div>' +
          '<button class="u-btn ghost" style="max-width:300px" onclick="TP.resetUplift()">↺ Run again</button>';
      }
      return '<div class="u-h"><div><h2>Prove it on your book</h2><div class="sub">“+15pp approvals at your loss rate, or you don’t pay.”</div></div>' + chip("MEASURED OFFER", "amber") + "</div>" +
        '<div class="u-card"><div class="u-sec">Upload a historical decision set</div>' +
        row("Sary Distribution — 42,800 decisions", "Last 12 months, anonymized", chip("READY", "dim")) +
        '<div class="u-note">We replay your own past decisions through the engine and compare approvals at your realized loss rate. No cherry-picking — your vintage, your loss, audited.</div></div>' +
        '<button class="u-btn" onclick="TP.runUplift()">Run the test ▸</button>' +
        '<div id="upliftRun"></div>';
    }
  };
  S["engine/partner/checkout"] = {
    title: "Checkout widget", url: "marketplace.example.sa/cart",
    render: function () {
      return '<div class="u-h"><div><h2>“Pay later with Tradepay”</h2><div class="sub">Embedded under any B2B marketplace checkout — Sary, Retailo, anyone</div></div>' + chip("WIDGET", "dim") + "</div>" +
        '<div style="max-width:420px;margin:0 auto"><div class="u-card" style="background:#fff">' +
        '<div class="mkt-head">SoukB2B <small>Checkout · cart SAR 22,000</small></div>' +
        row("22 items", "Dry goods, dairy, beverages", "SAR 22,000") +
        '<div class="paywith"><div class="hd"><span class="mk"></span> Pay later with Tradepay</div>' +
        '<div class="u-kv" style="margin-top:8px"><span class="k">Approved instantly</span><span class="v ok">SAR 17,800</span></div>' +
        '<div class="u-kv"><span class="k">Cash at delivery</span><span class="v">SAR 4,200</span></div>' +
        '<div class="u-kv"><span class="k">One due date</span><span class="v">Thursday · netted</span></div></div>' +
        '<button class="u-btn">Confirm — decision in 0.2s</button></div>' +
        '<div class="u-note">We never fight for the marketplace’s surface — we power credit <b>beneath</b> it. The African lesson: the finance layer profits while the logistics layer bleeds.</div></div>';
    }
  };
  S["engine/partner/api"] = {
    title: "Engine API", url: "console.tradepay.sa/engine/api",
    render: function () {
      return '<div class="u-h"><div><h2>One API, every surface</h2><div class="sub">Rep tablet, app, marketplace, and every future Arm tenant — same endpoint</div></div>' + chip("DECISIONS-AS-A-SERVICE", "amber") + "</div>" +
        '<div class="u-card" style="background:#0f0f12;border-color:#222"><pre style="font-family:JetBrains Mono;font-size:11.5px;line-height:1.7;color:#8c8c8a;overflow:auto;margin:0">' +
        '<span style="color:#4a4a48">// POST /v1/decisions</span>\n{\n  <span style="color:#ffd97a">"merchant_id"</span>: <span style="color:#7ee787">"mrc_8H2KD"</span>,\n  <span style="color:#ffd97a">"channel"</span>: <span style="color:#7ee787">"marketplace"</span>,\n  <span style="color:#ffd97a">"basket"</span>: { <span style="color:#ffd97a">"total"</span>: 22000, <span style="color:#ffd97a">"currency"</span>: <span style="color:#7ee787">"SAR"</span> }\n}\n\n<span style="color:#4a4a48">// 200 OK — 212ms</span>\n{\n  <span style="color:#ffd97a">"decision"</span>: <span style="color:#7ee787">"partial"</span>,\n  <span style="color:#ffd97a">"approved_amount"</span>: 17800,\n  <span style="color:#ffd97a">"fee"</span>: { <span style="color:#ffd97a">"type"</span>: <span style="color:#7ee787">"murabaha_flat"</span>, <span style="color:#ffd97a">"amount"</span>: 214 },\n  <span style="color:#ffd97a">"due_date"</span>: <span style="color:#7ee787">"2027-03-12"</span>,\n  <span style="color:#ffd97a">"reason_codes"</span>: [<span style="color:#7ee787">"headroom_partial"</span>],\n  <span style="color:#ffd97a">"headroom_hint"</span>: <span style="color:#7ee787">"SAR 4,200 frees after Thursday"</span>\n}</pre></div>' +
        '<div class="u-grid3">' +
        '<div class="u-card flat"><div class="u-sec">Idempotent</div><p style="font-size:11.5px;color:var(--dim)">Reason codes + remediation in AR/UR/EN. Safe to retry.</p></div>' +
        '<div class="u-card flat"><div class="u-sec">Webhooks</div><p style="font-size:11.5px;color:var(--dim)">Settlement, repayment, limit-change, early-warning events.</p></div>' +
        '<div class="u-card flat"><div class="u-sec">Sandbox-first</div><p style="font-size:11.5px;color:var(--dim)">Certify on synthetic merchants before touching the rail.</p></div></div>' +
        '<button class="u-btn" style="max-width:380px" onclick="TP.tour(1)">Engine compounding → open Chapter 3 ▸</button>';
    }
  };

  /* ---------- ARM · DISTRIBUTOR (console) ---------- */
  S["arm/distributor/launcher"] = {
    title: "Launch your arm", url: "console.tradepay.sa/arm/new-program",
    render: function () {
      var st = STATE.armStep, a = STATE.arm;
      var steps = ["Brand", "Policy", "Shariah", "Go-live"];
      var dots = steps.map(function (s, i) {
        var cls = i < st ? "done" : (i === st ? "on" : "");
        return '<span class="' + cls + '"></span>';
      }).join("");
      var body;
      if (st === 0) body = '<div class="u-sec">1 · Brand your arm</div>' +
        '<label class="u-sec" style="color:var(--dim)">Program name</label><input class="u-input" id="armName" value="' + a.name + '" oninput="TP.armName(this.value)" style="margin-bottom:10px">' +
        '<label class="u-sec" style="color:var(--dim)">Accent colour</label><div style="display:flex;gap:8px;margin-top:6px">' +
        colorDot("#155e46", a.color) + colorDot("#3729a8", a.color) + colorDot("#b42318", a.color) + colorDot("#1f1f22", a.color) + "</div>";
      else if (st === 1) body = '<div class="u-sec">2 · Risk policy (inherits the engine)</div>' +
        '<div class="u-toggle"><div>Approval@loss frontier<div class="d">Run on Tradepay’s champion model</div></div><button class="sw on"></button></div>' +
        '<div class="u-toggle"><div>Vintage caps + circuit breakers<div class="d">Mandatory — non-removable</div></div><button class="sw on"></button></div>' +
        '<div class="u-toggle"><div>Your own loss budget<div class="d">Set quarterly, inside Tradepay guardrails</div></div><button class="sw on"></button></div>' +
        '<div class="u-note">Tenants get decisions, rails and governance — never features, weights or pooled cohort data.</div>';
      else if (st === 2) body = '<div class="u-sec">3 · Shariah governance</div>' +
        '<div class="u-kv"><span class="k">Structure</span><span class="v">Murabaha / Tawarruq</span></div>' +
        '<div class="u-kv"><span class="k">Scholar board</span><span class="v ok">Shared, certified</span></div>' +
        '<div class="u-kv"><span class="k">Late fees</span><span class="v ok">None</span></div>' +
        '<div class="u-kv"><span class="k">Model cards / lineage</span><span class="v ok">Auto, SAMA-ready</span></div>';
      else body = '<div class="u-center"><div class="big">🚀</div><h3>' + a.name + ' is live</h3><p>Branded arm on Tradepay’s rail, engine, Shariah governance and capital — in six weeks, not a 24-month build.</p></div>';

      return '<div class="u-h"><div><h2>White-label program console</h2><div class="sub">The named threat becomes the customer — your brand, our machine</div></div>' + chip("● CHAPTER 3 / 2029–31", "amber") + "</div>" +
        '<div class="u-grid2" style="align-items:start"><div class="u-card"><div class="u-steps">' + dots + "</div>" + body +
        '<div style="display:flex;gap:8px;margin-top:14px">' +
        (st > 0 ? '<button class="u-btn ghost sm" onclick="TP.armStep(' + (st - 1) + ')">← Back</button>' : "") +
        (st < 3 ? '<button class="u-btn sm" onclick="TP.armStep(' + (st + 1) + ')">Continue →</button>'
          : '<button class="u-btn sm" onclick="TP.go(\'arm/distributor/tenant\')">Open the portfolio ▸</button>') + "</div></div>" +
        '<div class="u-card"><div class="u-sec">Live preview — tenant merchant app</div>' +
        '<div class="brandprev" id="brandPrev" style="background:' + a.color + '"><div class="lbl">' + a.name + '</div><div class="amt">SAR 45,000</div>' +
        '<div class="pw">POWERED BY TRADEPAY</div></div>' +
        '<p style="font-size:11px;color:var(--dim);margin-top:10px">Tenant zero is our own book — two years of receipts, not a pitch. Every tenant’s consented outcomes widen the engine’s lead over any build-it-yourself attempt.</p></div></div>';
    },
    init: function () { /* preview wired via oninput */ }
  };
  function colorDot(c, cur) {
    return '<button onclick="TP.armColor(\'' + c + '\')" style="width:30px;height:30px;border-radius:8px;background:' + c + ';border:2px solid ' + (c === cur ? "#181815" : "transparent") + '"></button>';
  }
  S["arm/distributor/tenant"] = {
    title: "Tenant portfolio", url: "console.watania-capital.sa/portfolio",
    render: function () {
      return '<div class="u-h"><div><h2>Watania Capital — portfolio</h2><div class="sub">Running on Tradepay · powered by, not built by</div></div>' + chip("TENANT · LIVE", "ok") + "</div>" +
        '<div class="u-grid4">' +
        statTile("FINANCED GMV", "SAR 84M", "this quarter", "▲ 22%", "up") +
        statTile("APPROVAL @ LOSS", "70% / 2.4%", "frontier", "engine-set", "up") +
        statTile("ACTIVE MERCHANTS", "6,300", "their brand", "portable record", "up") +
        statTile("NPL 90+", "0.6%", "budget < 2.5%", "guardrails on", "up") + "</div>" +
        '<div class="u-grid2">' +
        '<div class="u-chart"><div class="u-sec">Vintage performance — seasoning inside budget</div>' +
        spark([0.2, 0.4, 0.7, 1.1, 1.5, 1.9, 2.1, 2.3, 2.4, 2.4], 600, 80, "#b54708", "rgba(181,71,8,.08)") +
        '<div class="u-legend"><span>cumulative loss % by month-on-book · plateaus under the 2.5% cap</span></div></div>' +
        '<div class="u-card"><div class="u-sec">Early-warning cockpit</div>' +
        row("Market A", "Settlement stutter cluster", chip("WATCH", "amber")) +
        row("Cohort 2029-Q3", "Near vintage cap", chip("THROTTLE", "amber")) +
        row("All other markets", "Within budget", chip("NOMINAL", "ok")) + "</div></div>" +
        '<div class="u-note">Infrastructure revenue is additive, not substitutive: Tradepay’s own book keeps the highest-margin relationships and keeps seasoning the engine, while the Arm monetizes flow we’d never originate directly — the giants who’d otherwise build alone.</div>';
    }
  };

  /* ---------- ARM · FUNDER (console) ---------- */
  S["arm/funder/warehouse"] = {
    title: "Warehouse facility", url: "console.tradepay.sa/capital/warehouse",
    render: function () {
      var drawn = STATE.draw, cap = 500, util = drawn / cap * 100, advance = drawn * 0.85;
      return '<div class="u-h"><div><h2>Bank warehouse line</h2><div class="sub">The Lendo playbook — Saudi banks fund seasoned SME receivables</div></div>' + chip("FUNDER VIEW", "dim") + "</div>" +
        '<div class="u-grid3">' +
        statTile("FACILITY", "SAR 500M", "committed", "", "up") +
        statTile("ADVANCE RATE", "85%", "of eligible", "clean tape", "up") +
        statTile("BLENDED CoF", "9.2%", "falling", "→ securitization", "mid") + "</div>" +
        '<div class="u-card"><div class="u-sec">Drawdown against the book</div>' +
        '<input class="u-slider" type="range" min="50" max="500" step="10" value="' + drawn + '" oninput="TP.draw(this.value)">' +
        '<div class="u-barlbl"><span>SAR 50M</span><span id="drawVal">Drawn SAR ' + drawn + 'M · advance SAR ' + advance.toFixed(0) + 'M</span><span>SAR 500M</span></div>' +
        '<div class="u-bar" style="margin-top:12px"><i id="drawBar" style="width:' + util + '%"></i></div>' +
        '<div class="u-barlbl"><span>Utilization</span><span id="utilVal">' + util.toFixed(0) + '%</span></div></div>' +
        '<div class="u-card"><div class="u-sec">Covenant pack — green by construction</div>' +
        '<div class="u-kv"><span class="k">Eligibility rules</span><span class="v ok">✓ enforced at origination</span></div>' +
        '<div class="u-kv"><span class="k">Concentration limits</span><span class="v ok">✓ within</span></div>' +
        '<div class="u-kv"><span class="k">Reporting cadence</span><span class="v ok">✓ daily tape</span></div></div>' +
        '<div class="u-note">Underwriting and capital strategy were designed as one system from day one (A6). Capital stops being the growth ceiling — and cost of funds becomes a widening advantage.</div>';
    }
  };
  S["arm/funder/securitization"] = {
    title: "Securitization", url: "console.tradepay.sa/capital/abs",
    render: function () {
      var t = STATE.tranche;
      var cof = 0; var any = false;
      /* blended cost of funds depending on structure */
      var base = { senior: 6.4, mezz: 9.5, equity: 14 };
      var w = { senior: 0.75, mezz: 0.15, equity: 0.10 };
      var num = 0, den = 0;
      ["senior", "mezz", "equity"].forEach(function (k) { if (t[k]) { num += base[k] * w[k]; den += w[k]; any = true; } });
      cof = any ? (num / den) : 0;
      return '<div class="u-h"><div><h2>Murabaha securitization</h2><div class="sub">Originate-to-distribute · the Tamara / Lendo capital-markets path</div></div>' + chip("CHAPTER 3", "amber") + "</div>" +
        '<div class="u-card"><div class="u-sec">Structure the sale-down of seasoned receivables</div>' +
        tranToggle("senior", "Senior tranche — 75%", "Rated, Shariah-structured · 6.4%", t.senior) +
        tranToggle("mezz", "Mezzanine — 15%", "Higher yield · 9.5%", t.mezz) +
        tranToggle("equity", "First-loss / equity — 10%", "Retained skin-in-the-game · 14%", t.equity) +
        "</div>" +
        '<div class="u-grid2">' +
        '<div class="u-stat"><div class="lbl">BLENDED COST OF FUNDS</div><div class="num" id="cofVal">' + cof.toFixed(1) + '%</div><div class="delta up">vs 9.2% warehouse</div></div>' +
        '<div class="u-stat"><div class="lbl">CAPITAL RECYCLED</div><div class="num">SAR 380M</div><div class="delta up">re-deployable</div></div></div>' +
        '<div class="u-note">First-loss retention keeps incentives honest; selling senior risk to the market recycles capital and drops cost of funds. The model only works while banks stay funders — managed as a strategic account, never assumed.</div>';
    }
  };
  function tranToggle(id, t, d, on) {
    return '<div class="u-toggle"><div>' + t + '<div class="d">' + d + '</div></div><button class="sw ' + (on ? "on" : "") + '" onclick="TP.tranche(\'' + id + '\')"></button></div>';
  }

  /* ---------- ARM · BRAND (console) ---------- */
  S["arm/brand/intelligence"] = {
    title: "Trade intelligence", url: "console.tradepay.sa/intel/fmcg",
    render: function () {
      return '<div class="u-h"><div><h2>Traditional-trade intelligence</h2><div class="sub">The Y4 option — a channel FMCG brands plan blind on, now visible</div></div>' + chip("PDPL-CLEAN · k≥50", "ok") + "</div>" +
        '<div class="u-banner"><span class="ic">🔒</span><div>Aggregated and anonymized only. <b>Never an individual shop.</b> The consent groundwork laid in 2026 is what makes this option exist at all.</div></div>' +
        '<div class="u-grid2">' +
        '<div class="u-chart"><div class="u-sec">SKU velocity — beverages, by district</div>' +
        bars([62, 78, 54, 91, 70, 83, 49], ["Olaya", "Malaz", "Naseem", "Suwaidi", "Rawda", "Shifa", "Aziz."], "#3729a8", 90) +
        '<div class="u-legend"><span>units/shop/week, indexed · district-level demand brands can’t see today</span></div></div>' +
        '<div class="u-chart"><div class="u-sec">Category reorder cadence</div>' +
        spark([40, 52, 48, 61, 70, 66, 78, 84, 80, 88], 600, 90, "#155e46", "rgba(21,94,70,.08)") +
        '<div class="u-legend"><span>weekly reorder index · st-out risk windows surfaced ahead of time</span></div></div></div>' +
        '<div class="u-grid3">' +
        statTile("DISTRICTS COVERED", "34", "density unlocked", "", "up") +
        statTile("SHOPS AGGREGATED", "41,200", "k-anonymized", "", "up") +
        statTile("MARGIN PROFILE", "High", "rights-cleared data", "the franchise is trust", "up") + "</div>" +
        '<div class="u-note">Exercised only at density, on rights-cleared data — the high-margin layer the day-one consent made possible. The loan tape, feature store and consent ledger are the company’s three crown jewels.</div>' +
        '<button class="u-btn" style="max-width:360px" onclick="TP.openDrawer()">Why did it evolve like this? ▸</button>';
    }
  };

  /* ---------- RAIL · REP · onboard ---------- */
  S["rail/rep/onboard"] = {
    head: { t: "Onboard a shop", sub: "Basmah Mini-market" },
    render: function () {
      return '<div class="u-banner"><span class="ic">🪪</span><div>One stop, on the counter. No forms — you already know this shop.</div></div>' +
        '<div class="u-card"><div class="u-sec">Captured in one visit</div>' +
        row("Nafath identity", "Merchant taps their own phone", chip("✓", "ok")) +
        row("Shop & CR", "Pre-filled from your sales history", chip("✓", "ok")) +
        row("Consent & terms", "Murabaha one-pager, read aloud", chip("✓", "ok")) + "</div>" +
        '<div class="u-dark"><div class="lbl">Pre-scored from your route history</div><div class="amt">SAR <span>12,000</span></div>' +
        '<div class="ft"><span>STARTER LIMIT</span><span class="amber">grows with ZATCA</span></div></div>' +
        '<div class="u-note">First limits are sized by the anchor distributor’s sales history with the shop — the Tienda Pago mechanic. The relationship is priced in while the rail’s own data forms.</div>' +
        '<button class="u-btn" onclick="TP.go(\'rail/rep/approve\')">Activate &amp; take first order →</button>';
    }
  };

  /* ---------- RAIL · DISTRIBUTOR · go-live ---------- */
  S["rail/distributor/golive"] = {
    title: "Onboarding & go-live", url: "console.tradepay.sa/rail/onboarding",
    render: function () {
      return '<div class="u-h"><div><h2>Bring Al Noor Distribution onto the rail</h2><div class="sub">Two anchor distributors, one city — the wedge</div></div>' + chip("SETUP · 4 OF 5", "amber") + "</div>" +
        '<div class="u-grid2" style="align-items:start">' +
        '<div class="u-card"><div class="u-sec">Integration checklist</div>' +
        row("Connect DMS / ERP", "SAP B1 · van-sales API", chip("✓ LINKED", "ok")) +
        row("Map SKUs & price lists", "1,240 SKUs reconciled", chip("✓ DONE", "ok")) +
        row("sarie settlement account", "T+1 payouts verified", chip("✓ DONE", "ok")) +
        row("Pre-score merchant base", "~3,000 shops, sales history", chip("✓ DONE", "ok")) +
        row("Train the route reps", "12 reps · tablet SDK", chip("IN PROGRESS", "amber")) + "</div>" +
        '<div class="u-card"><div class="u-sec">Anchor terms — honest, no coercive lock</div>' +
        '<div class="u-kv"><span class="k">Co-branding</span><span class="v">Al Noor × Tradepay</span></div>' +
        '<div class="u-kv"><span class="k">Launch economics</span><span class="v ok">Anchor rate</span></div>' +
        '<div class="u-kv"><span class="k">Credit risk</span><span class="v">Carried by Tradepay</span></div>' +
        '<div class="u-kv"><span class="k">Settlement</span><span class="v">T+1 on-rail</span></div>' +
        '<div class="u-kv"><span class="k">Exclusivity</span><span class="v">None — earned, not forced</span></div>' +
        '<div class="u-note ok" style="margin-bottom:0">The lock that matters is settlement reliability and approval uplift — not a contract clause.</div></div></div>' +
        '<div class="u-note">A distributor goes live in under six weeks: connect the system they already run, price in their relationship knowledge, and the rail starts capturing repayment from the first financed order.</div>' +
        '<button class="u-btn" style="max-width:340px" onclick="TP.go(\'rail/distributor/dashboard\')">Go live → open settlement ▸</button>';
    }
  };

  /* ---------- ENGINE · MERCHANT · limit up ---------- */
  S["engine/merchant/limitup"] = {
    head: { t: "Limit up", sub: "زيادة الحد" },
    render: function () {
      if (STATE.limitup) {
        return '<div class="u-center u-pop"><div class="big">📈</div><h3>Limit raised to SAR 38,000</h3><p>The engine re-priced your headroom on a strong ZATCA month and 22 on-time cycles — instantly.</p></div>' +
          '<div class="u-dark"><div class="lbl">New buying limit</div><div class="amt">SAR <span>38,000</span></div>' +
          '<div class="ft"><span>WAS 32,000</span><span class="amber">+6,000</span></div></div>' +
          '<button class="u-btn ghost" onclick="TP.limitReset()">↺ Replay</button>';
      }
      return '<div class="u-dark"><div class="lbl">Current buying limit</div><div class="amt">SAR <span>32,000</span></div>' +
        '<div class="bar"><i style="width:44%"></i></div><div class="ft"><span>USED 14,200</span><span>FREE 17,800</span></div></div>' +
        '<div class="u-card"><div class="u-sec">Why you qualify for more</div>' +
        row("ZATCA sales", "Strong month, +18% vs avg", chip("+SAR 4k", "ok")) +
        row("On-time cycles", "22 in a row", chip("+SAR 2k", "ok")) +
        row("Settlement behaviour", "No stutters on-rail", chip("CLEAN", "dim")) + "</div>" +
        '<div class="u-note">Limits breathe with the flow — a strong ZATCA month raises headroom, a settlement stutter trims it. Shopify Capital’s performance-scaled mechanic, applied to inventory cycles.</div>' +
        '<button class="u-btn" onclick="TP.limitUp()">Raise my limit →</button>';
    }
  };

  /* ---------- ENGINE · RISK · fraud graph ---------- */
  S["engine/risk/fraud"] = {
    title: "Fraud & risk", url: "console.tradepay.sa/engine/fraud",
    render: function () {
      return '<div class="u-h"><div><h2>The rail sees what bolt-on lenders can’t</h2><div class="sub">Merchant · supplier · rep network graph</div></div>' + chip("AML / TM", "dim") + "</div>" +
        '<div class="u-grid4">' +
        statTile("FINANCE-ON-DELIVERY", "100%", "release on confirm", "phantom orders closed", "up") +
        statTile("BUST-OUT RINGS", "3", "flagged this week", "graph-detected", "mid") +
        statTile("NEW-MERCHANT VELOCITY", "capped", "step-up on anomaly", "fraud magnet guarded", "up") +
        statTile("FALSE-POSITIVE RATE", "1.2%", "honest shops ride free", "friction budget", "up") + "</div>" +
        '<div class="u-grid2" style="align-items:start">' +
        '<div class="u-chart"><div class="u-sec">Collusion graph — a diversion ring, isolated</div>' + fraudGraph() +
        '<div class="u-legend"><span><i style="background:#1e7f4f"></i>normal</span><span><i style="background:#b42318"></i>flagged ring</span><span><i style="background:#FFC53D"></i>shared rep</span></div></div>' +
        '<div class="u-card"><div class="u-sec">Signals only the rail generates</div>' +
        row("ZATCA cross-check", "Invoice reality vs financed order", chip("MATCH", "ok")) +
        row("Resale-pattern baskets", "SKU mix flags diversion", chip("WATCH", "amber")) +
        row("Device & number binding", "Merchant-own OTP", chip("BOUND", "dim")) +
        row("Delivery confirmation", "Funds release on confirm", chip("ENFORCED", "ok")) + "</div></div>" +
        '<div class="u-note">Funds release against delivery confirmation; merchant-supplier-rep graphs expose bust-out rings a single-relationship view misses. The Capiter file is also a fraud-governance file.</div>';
    }
  };
  function fraudGraph() {
    return '<svg viewBox="0 0 300 150" style="width:100%;height:auto">' +
      /* normal cluster edges */
      '<line x1="70" y1="48" x2="120" y2="80" stroke="#cfcabb" stroke-width="1.5"/>' +
      '<line x1="120" y1="80" x2="70" y2="112" stroke="#cfcabb" stroke-width="1.5"/>' +
      '<line x1="120" y1="80" x2="40" y2="80" stroke="#cfcabb" stroke-width="1.5"/>' +
      /* shared rep bridge */
      '<line x1="120" y1="80" x2="190" y2="80" stroke="#FFC53D" stroke-width="2" stroke-dasharray="4 3"/>' +
      /* flagged ring edges */
      '<line x1="190" y1="80" x2="240" y2="50" stroke="#e7b4ad" stroke-width="1.5"/>' +
      '<line x1="240" y1="50" x2="265" y2="95" stroke="#e7b4ad" stroke-width="1.5"/>' +
      '<line x1="265" y1="95" x2="210" y2="115" stroke="#e7b4ad" stroke-width="1.5"/>' +
      '<line x1="210" y1="115" x2="190" y2="80" stroke="#e7b4ad" stroke-width="1.5"/>' +
      /* normal nodes */
      '<circle cx="70" cy="48" r="9" fill="#1e7f4f"/><circle cx="40" cy="80" r="9" fill="#1e7f4f"/>' +
      '<circle cx="70" cy="112" r="9" fill="#1e7f4f"/><circle cx="120" cy="80" r="11" fill="#181815"/>' +
      /* shared rep node */
      '<circle cx="190" cy="80" r="10" fill="#FFC53D"/>' +
      /* flagged nodes */
      '<circle cx="240" cy="50" r="9" fill="#b42318"/><circle cx="265" cy="95" r="9" fill="#b42318"/>' +
      '<circle cx="210" cy="115" r="9" fill="#b42318"/>' +
      '<text x="120" y="83" font-size="7" fill="#fff" text-anchor="middle" font-family="JetBrains Mono">D</text>' +
      '<text x="238" y="20" font-size="7.5" fill="#b42318" text-anchor="middle" font-family="JetBrains Mono">bust-out ring</text>' +
      "</svg>";
  }

  /* ===================================================================
     CONTEXT PANELS  — what + why-now per screen
     =================================================================== */
  var CTX = {
    "rail/merchant/onboard": { title: "Dignity-first onboarding", body: "The rep introduces it on a normal route visit — Nafath, consent and one-page Murabaha terms in one assisted session. The merchant never travels, never queues, never feels assessed by a bank.", why: "Acquisition is the channel’s strength, not ours. Borrowing the distributor’s trusted relationship solves cold-start that no thin-file credit score could.", chips: ["Nafath", "PDPL", "Murabaha"] },
    "rail/merchant/identity": { title: "Identity, in one tap", body: "Nafath is the Kingdom's national digital identity. Auth happens on Nafath's side — Tradepay never sees or stores a password.", why: "Bank-grade KYC without a branch visit or paperwork theatre. The merchant uses their own phone.", chips: ["Nafath", "No password stored"] },
    "rail/merchant/business": { title: "Your shop, pre-filled", body: "Shop name, CR and a geo-tagged shopfront photo — pulled from the distributor's records so the merchant confirms rather than fills.", why: "The channel already knows this shop. Onboarding borrows that knowledge instead of starting cold.", chips: ["Pre-filled", "Channel knowledge"] },
    "rail/merchant/consent": { title: "Consent as a fair trade", body: "Honest, reversible choices: connect ZATCA and the limit grows faster; share aggregated data, never your identifiable shop. Toggle them to watch the indicative limit move.", why: "Informed, reciprocal, PDPL-clean — and it keeps the Year-4 data option alive without retrofitting.", chips: ["PDPL", "Reversible", "Interactive"] },
    "rail/merchant/terms": { title: "Terms you can read", body: "The whole Murabaha contract on one screen: flat fee in riyals, no late fees, rebate for early settlement, a restructure (not a charge) on a bad month.", why: "Genuine structure is the easiest thing to be transparent about. Comprehension is the compliance.", chips: ["Murabaha", "No late fees"] },
    "rail/merchant/activate": { title: "A limit that lives in the flow", body: "Buying power denominated in goods and trust — sized from the distributor's sales history with this shop, the Tienda Pago mechanic.", why: "The partner's relationship knowledge is priced in while the rail's own data forms. The whole setup took one visit.", chips: ["Cold-start solved", "Live"] },
    "rail/merchant/statement": { title: "The statement is a gift", body: "A monthly activity view that doubles as a cash-flow mirror — money in vs out, safe-to-stock windows, limit growth.", why: "Operational intelligence given, not sold — it deepens the rail and earns trust. The Y1–2 free data product.", chips: ["Cash-flow mirror"] },
    "rail/rep/onboard": { title: "One stop, no forms", body: "The rep onboards a shop on a normal route visit — Nafath, pre-filled shop, consent and a starter limit sized from sales history.", why: "Activation comp is tied to the second financed order and on-time first repayment, not signups. Quality over logos.", chips: ["Tienda Pago mechanic"] },
    "rail/distributor/golive": { title: "Live in under six weeks", body: "A distributor connects the DMS it already runs, reconciles SKUs, verifies sarie settlement and pre-scores its base — then trains the route reps.", why: "Speed comes from meeting the distributor inside their existing system; the rail starts capturing repayment from the first financed order.", chips: ["DMS", "Anchor terms", "No coercive lock"] },
    "engine/merchant/limitup": { title: "Limits that breathe", body: "Headroom steps with observed on-rail behaviour and live signals — a strong ZATCA month raises it; a settlement stutter trims it.", why: "Shopify Capital's performance-scaled mechanic, applied to inventory cycles. The data the rail generates re-prices risk in real time.", chips: ["Performance-scaled", "Interactive"] },
    "engine/risk/fraud": { title: "The rail sees the network", body: "Funds release on delivery confirmation; merchant-supplier-rep graphs expose bust-out rings and diversion baskets single-relationship views miss.", why: "Fast-growing lenders are fraud magnets — the Capiter file is also a fraud-governance file. Controls fire on anomalies; honest shops ride invisibly.", chips: ["Graph", "Finance-on-delivery"] },
    "rail/merchant/order": { title: "Approve inside the order", body: "Credit is experienced as ‘the order went through.’ Partial approval is the highest-leverage UX moment in the segment — it rescues the basket instead of declining it.", why: "Drag the basket past your headroom to see the partial split and the path to more.", chips: ["<300ms", "Partial = rescue"] },
    "rail/merchant/repay": { title: "Repayment rides the cash", body: "One netted due date across all suppliers, collected where the merchant’s money already moves. No late fees — lateness triggers help, not charges.", why: "Repayment captured at the source is the structural answer to collections, the category’s true loss driver.", chips: ["sarie", "One date", "Rebates"] },
    "rail/rep/route": { title: "The field surface", body: "The rep’s route is the go-to-market. Onboarding, approvals and cash-in all happen on stops they already make.", why: "Distribution rides existing infrastructure — the cheapest channel in the segment.", chips: ["Channel-led"] },
    "rail/rep/approve": { title: "Same decision, every channel", body: "The rep tablet calls the identical decision endpoint as the app and the marketplace will. Approve / partial / decline in <300ms.", why: "One engine under every surface means consistency now and reuse later.", chips: ["Tablet SDK"] },
    "rail/rep/cashin": { title: "Collections as a property", body: "Rep cash-in is one of three capture rails. Posted to the rail instantly, it keeps the account current.", why: "This capture number prices everything downstream — it’s the Q2 deliverable, not GMV.", chips: ["Capture rail"] },
    "rail/distributor/dashboard": { title: "The distributor’s pitch, proven", body: "Settled on time, zero credit risk carried, DSO collapsed. The rail working is visible on the first transaction.", why: "%GMV settled on-rail is the position metric — the wedge, and the future Arm’s addressable base.", chips: ["T+1", "Zero risk", "%GMV on-rail"] },
    "rail/distributor/collections": { title: "Recovery as product", body: "The A10 collections workflow, shipped as a free rail module. Restructure offers fire before any human chase.", why: "The deepest part of a competitor’s lock-in, delivered in Year 1 instead of as a five-year standalone bet.", chips: ["A10 module", "Restructure-first"] },
    "rail/distributor/uplift": { title: "Software they want", body: "Genuine operational analytics that happen to deepen the rail — and feed the Engine arriving next year.", why: "Year 1 exit criteria met here unlock Chapter 2. Nothing ships ahead of its evidence.", chips: ["Attribution", "→ Chapter 2"] },

    "engine/merchant/home": { title: "The app, after trust", body: "Sequenced correctly: merchants meet Tradepay through the rep, then get the app as the retention and transparency surface once transacting.", why: "Trust precedes surface. An app-first acquisition bet would antagonize the channel that drives distribution.", chips: ["2027", "Retention surface"] },
    "engine/merchant/netting": { title: "Cross-supplier netting", body: "One limit across five suppliers, one due date — and cross-supplier signal no captive distributor arm can ever see.", why: "The rail’s structural advantage made legible to the merchant and to the engine simultaneously.", chips: ["Portable line"] },
    "engine/merchant/repay": { title: "One tap, cash-rhythm aware", body: "sarie, auto-debit and rebates — salary-cycle and Ramadan-adjusted.", why: "Friction-default designed out: this removes ‘forgot to pay’ as a category rather than monetizing it.", chips: ["Auto-debit"] },
    "engine/merchant/record": { title: "The merchant’s asset", body: "Repaying well builds a portable, SIMAH-reported record the merchant owns and can carry across the rail.", why: "Transparency that doubles as the retention asset — and keeps the merchant on-rail under any future brand.", chips: ["SIMAH", "Portable"] },
    "engine/risk/frontier": { title: "Approval@loss is the weapon", body: "Risk and Finance set the loss budget; the engine’s sole job is to push approvals to the frontier inside it.", why: "Move the slider: more loss tolerance buys more approvals with diminishing returns. The +15pp gap over a credit desk is the commercial argument.", chips: ["The frontier", "Interactive"] },
    "engine/risk/challenger": { title: "Challenger or it didn’t ship", body: "Every policy change must beat champion on both approval and loss in the same vintage before promotion.", why: "Discipline that compounds the moat vintage over vintage while rivals copy last year’s model.", chips: ["Champion/challenger"] },
    "engine/risk/guardrails": { title: "Discipline in peacetime", body: "Vintage caps, circuit breakers and velocity limits installed before growth pressure exists. Risk can brake the company.", why: "Retrofitting discipline during a growth phase is how Capiter died. Trip the breaker to see the brake.", chips: ["A9 guardrails", "Anti-Capiter"] },
    "engine/partner/uplifttest": { title: "Proof, not a pitch", body: "Replay a partner’s own historical decisions through the engine; compare approvals at their realized loss rate.", why: "Converts the build-an-arm impulse into a license-the-engine conversation — the answer to the named threat.", chips: ["+15pp", "Audited"] },
    "engine/partner/checkout": { title: "Beneath every surface", body: "‘Pay later with Tradepay’ inside any marketplace checkout — instant decisions without competing for GMV.", why: "The finance layer is the margin; the logistics layer bleeds. Power it, don’t fight it.", chips: ["Marketplace", "Widget"] },
    "engine/partner/api": { title: "Integrate once, compound under", body: "The same decision endpoint powers every surface, including future Arm tenants.", why: "Reuse is the bridge to Chapter 3 — the API that serves partners today serves white-label tenants tomorrow.", chips: ["One API", "→ Chapter 3"] },

    "arm/distributor/launcher": { title: "Threat becomes customer", body: "A distributor launches its branded financing arm on Tradepay’s rail, engine, Shariah governance and capital — in six weeks.", why: "The arms get built either way; the only question is on whose machine. Tenant zero is our own two-year-old book.", chips: ["2029", "White-label"] },
    "arm/distributor/tenant": { title: "Additive, not substitutive", body: "The tenant runs their own portfolio on the stack; their consented outcomes widen our engine’s lead.", why: "Monetizes flow we’d never originate directly while the own book keeps the highest-margin relationships.", chips: ["Tenant", "Engine widens"] },
    "arm/funder/warehouse": { title: "Capital as a system", body: "Clean, seasoned tape draws a bank warehouse line. Drag the drawdown to see advance and utilization.", why: "Underwriting and capital designed as one system — capital stops being the growth ceiling.", chips: ["Lendo playbook"] },
    "arm/funder/securitization": { title: "Originate-to-distribute", body: "Sell senior risk, retain first-loss. Toggle the tranches to watch blended cost of funds fall.", why: "Recycling capital turns cost of funds into a widening advantage as the book seasons.", chips: ["Murabaha ABS"] },
    "arm/brand/intelligence": { title: "The crown-jewel option", body: "Aggregated, anonymized trade intelligence for FMCG brands — exercised only at density, on rights-cleared data.", why: "Impossible to retrofit; only possible because consent and lineage were built on day one. The franchise is trust.", chips: ["k≥50", "PDPL-clean", "Y4 option"] }
  };

  /* ===================================================================
     DRAWER — the evolution rationale
     =================================================================== */
  function drawerHTML() {
    return '<div class="eyebrow">The 2026 → 2031 rationale</div>' +
      '<h3>Why the product evolves in <em>exactly</em> this order.</h3>' +
      '<p>This is not a feature roadmap — it is a <b>dependency chain</b>. Each chapter manufactures the one asset the next chapter cannot exist without. Reorder it and the strategy breaks.</p>' +
      '<div class="chain"><span class="hot">Own the flow</span><b>→</b><span>Collections proof</span><b>→</b><span>Proprietary data</span><b>→</b><span>Engine edge</span><b>→</b><span>Funded track record</span><b>→</b><span class="hot">Rentable machine</span></div>' +

      '<h5>Chapter 1 · 2026 — The Rail · why first</h5>' +
      '<p><b>Collections is the binding constraint</b> of the entire category — not demand, not data, not capital. Square lent $22B+ at under 3% loss only because repayment rides its own rail; Capiter blitz-scaled credit it couldn’t collect and collapsed in 2022. Until repayment capture is structurally solved, every later product is a liability multiplier.</p>' +
      '<div class="ev"><b>Exit gate → unlocks Chapter 2:</b><ul><li class="done">≥60% of repayment captured on-rail</li><li class="done">DPD better than field baseline</li><li class="done">Audited approval@loss vs an anchor’s book</li><li class="done">Institutional-grade loan tape</li></ul></div>' +

      '<h5>Chapter 2 · 2027–28 — The Engine · why second</h5>' +
      '<p>The rail’s Year-1 exhaust — settlement truth, repayment behaviour, ZATCA flows — is the feature set <b>no off-rail lender can copy</b>. The cheapest growth is not more cities; it is approving more of the same flow at the same loss. Approval-at-constant-loss becomes a provable weapon (‘+15pp or you don’t pay’), and a clean seasoned tape makes banks fund the book — so capital stops being the ceiling.</p>' +
      '<div class="ev"><b>Why the app arrives second, not first:</b> trust precedes surface. App-first acquisition would antagonise the channel that drives distribution. The app is the retention layer once merchants already transact.</div>' +
      '<div class="ev"><b>Exit gate → unlocks Chapter 3:</b><ul><li class="done">Two years of seasoned vintages inside budget</li><li class="done">Warehouse drawn, covenants green</li><li class="done">Uplift verified on a book we don’t own</li><li class="done">Multi-distributor netting live</li></ul></div>' +

      '<h5>Chapter 3 · 2029–31 — The Arm · why last, why inevitable</h5>' +
      '<p>Distributor in-house arms get built either way; the only question is <b>on whose machine</b>. By 2029 Tradepay holds what no in-house build can match: two years of audited collections, a measured approval edge, and funded vintages. Tenants get decisions, rails and governance — never features, weights or pooled cohort data — so every tenant <b>widens</b> the engine’s lead instead of arming a rival. Lead with the Arm and you sell an unproven machine; lead with the Engine alone and you’re a swappable vendor; lead with the Rail and every later layer inherits a structural position.</p>' +
      '<div class="ev">The brief’s own vision is infrastructure. The Arm is that vision <b>with a two-year track record under it</b> — and the named threat converted into the TAM.</div>' +

      '<h5>The two north stars that contain the whole strategy</h5>' +
      '<div class="chain"><span class="hot">%GMV on-rail</span><b>×</b><span class="hot">approval@loss</span></div>' +
      '<p>Position × economics. Either alone can be gamed; together they describe a company that owns the flow <b>and</b> out-underwrites the field — at every step from 2026 to 2031.</p>' +
      '<p style="font-size:11px;color:var(--faint)" class="mono">Evidence: Square ($22B+, &lt;3% loss) · Tienda Pago (since 2013) · MaxAB-Wasoko (99% repayment) · Lendo / Tamara (Saudi capital depth) · Capiter (the anti-playbook). Figures are public benchmarks or modeling assumptions from the strategy brief.</p>';
  }

  /* ===================================================================
     ROUTER + RENDER
     =================================================================== */
  function currentRoute() {
    var h = location.hash.replace(/^#\/?/, "");
    return S[h] ? h : DEFAULT;
  }
  function parts(route) { var p = route.split("/"); return { era: p[0], persona: p[1], screen: p[2] }; }
  function personaDef(era, persona) {
    return NAV[era].filter(function (x) { return x.id === persona; })[0];
  }

  function paintEraTabs(era) {
    el("eraTabs").innerHTML = ERAS.map(function (e) {
      return '<button class="' + (e.id === era ? "on" : "") + '" onclick="TP.era(\'' + e.id + '\')">' +
        '<span class="y">' + e.y + '</span><span class="c">' + e.name + '</span></button>';
    }).join("");
  }
  function paintPersona(meta) {
    el("personaTabs").innerHTML = NAV[meta.era].map(function (p) {
      return '<button class="' + (p.id === meta.persona ? "on" : "") + '" onclick="TP.persona(\'' + p.id + '\')">' +
        '<span class="ic">' + p.ic + "</span>" + p.label + "</button>";
    }).join("");
    var pd = personaDef(meta.era, meta.persona);
    el("screenChips").innerHTML = pd.screens.map(function (s) {
      return '<button class="' + (s.id === meta.screen ? "on" : "") + '" onclick="TP.go(\'' + meta.era + "/" + meta.persona + "/" + s.id + '\')">' + s.label + "</button>";
    }).join("");
  }

  function frameHTML(meta, inner) {
    var pd = personaDef(meta.era, meta.persona);
    if (pd.frame === "phone") {
      var head = S[meta.era + "/" + meta.persona + "/" + meta.screen].head || { t: pd.label, sub: "" };
      var navItems = pd.tabs || pd.screens.slice(0, 4).map(function (s) { return { id: s.id, label: s.label, ic: "•" }; });
      var tabs = navItems.map(function (s) {
        return '<button class="' + (s.id === meta.screen ? "on" : "") + '" onclick="TP.go(\'' + meta.era + "/" + meta.persona + "/" + s.id + '\')"><span class="ic">' + (s.ic || "•") + "</span>" + s.label + "</button>";
      }).join("");
      return '<div class="phone"><div class="framelbl">' + pd.label + " APP · " + eraById(meta.era).y + "</div>" +
        '<div class="pscreen"><div class="p-status"><span>9:41</span><span>﷽&nbsp;&nbsp;5G ▮▮▮</span></div>' +
        '<div class="p-head"><div class="t">' + head.t + (head.sub ? "<small>" + head.sub + "</small>" : "") + "</div>" +
        '<div class="badge">' + eraById(meta.era).name + "</div></div>" +
        '<div class="p-body">' + inner + "</div>" +
        '<div class="p-tabbar">' + tabs + "</div></div></div>";
    }
    /* console */
    var sc = S[meta.era + "/" + meta.persona + "/" + meta.screen];
    var groups = NAV[meta.era].map(function (p) {
      var items = p.screens.map(function (s) {
        var on = (p.id === meta.persona && s.id === meta.screen);
        return '<button class="' + (on ? "on" : "") + '" onclick="TP.go(\'' + meta.era + "/" + p.id + "/" + s.id + '\')"><span class="ic">' + p.ic + "</span>" + s.label + "</button>";
      }).join("");
      return '<div class="grp">' + p.label + "</div>" + items;
    }).join("");
    return '<div class="console"><div class="c-chrome"><div class="dots"><i></i><i></i><i></i></div>' +
      '<div class="url">' + (sc.url || "console.tradepay.sa") + '</div></div>' +
      '<div class="c-body"><aside class="c-side"><div class="c-logo"><span class="mk"></span><span class="tp">Tradepay</span><small>' + eraById(meta.era).name + " console</small></div>" +
      '<div class="c-nav">' + groups + "</div>" +
      '<div class="c-user"><div class="av">TP</div><div class="nm">Operator<small>' + eraById(meta.era).y + " · " + meta.persona + "</small></div></div></aside>" +
      '<main class="c-main">' + inner + "</main></div></div>";
  }
  function eraById(id) { return ERAS.filter(function (e) { return e.id === id; })[0]; }

  function paintCtx(route) {
    var c = CTX[route] || { title: "", body: "", chips: [], why: "" };
    var ti = TOUR.indexOf(route);
    var nextRoute = ti >= 0 && ti < TOUR.length - 1 ? TOUR[ti + 1] : null;
    var html = '<div class="ctitle">What you’re looking at</div><h4>' + c.title + "</h4>" +
      "<p>" + c.body + "</p>" +
      (c.why ? '<div class="ctitle">Why now</div><p>' + c.why + "</p>" : "") +
      '<div class="chips">' + (c.chips || []).map(function (x) { return '<span class="chip">' + x + "</span>"; }).join("") + "</div>";
    if (nextRoute) {
      var np = parts(nextRoute), npd = personaDef(np.era, np.persona);
      var nlabel = npd.screens.filter(function (s) { return s.id === np.screen; })[0].label;
      html += '<button class="nextbtn" onclick="TP.go(\'' + nextRoute + '\')">NEXT IN TOUR →<span>' + eraById(np.era).y + " · " + npd.label + " · " + nlabel + "</span></button>";
    } else if (ti === TOUR.length - 1) {
      html += '<button class="nextbtn" onclick="TP.openDrawer()">▸ READ THE FULL RATIONALE<span>Why it evolved 2026 → 2031</span></button>';
    }
    if (ti >= 0) html += '<div class="tourpos">Guided tour · ' + (ti + 1) + " / " + TOUR.length + "</div>";
    el("ctx").innerHTML = html;
  }

  function render() {
    var route = currentRoute();
    var meta = parts(route);
    paintEraTabs(meta.era);
    paintPersona(meta);
    var sc = S[route];
    el("stage").innerHTML = frameHTML(meta, sc.render());
    paintCtx(route);
    if (sc.init) sc.init();
    window.scrollTo(0, 0);
  }

  /* ===================================================================
     PUBLIC HANDLERS
     =================================================================== */
  function go(route) {
    if (currentRoute() === route) { render(); }
    else location.hash = "#/" + route;
    closeCtxModal();
  }
  var TP = {
    go: go,
    era: function (id) { var p = NAV[id][0]; go(id + "/" + p.id + "/" + p.screens[0].id); },
    persona: function (pid) { var m = parts(currentRoute()); var pd = personaDef(m.era, pid); go(m.era + "/" + pid + "/" + pd.screens[0].id); },
    tour: function (dir) {
      var ti = TOUR.indexOf(currentRoute());
      if (ti < 0) { go(TOUR[0]); return; }
      var n = ti + dir;
      if (n >= 0 && n < TOUR.length) go(TOUR[n]);
    },
    openDrawer: function () { el("drawerBody").innerHTML = drawerHTML(); el("drawer").classList.add("open"); el("backdrop").classList.add("open"); },
    closeDrawer: function () { el("drawer").classList.remove("open"); el("backdrop").classList.remove("open"); },
    /* order */
    basket: function (v) { STATE.order.basket = Number(v); var d = el("decision"); if (d) d.innerHTML = decisionBlock(STATE.order.basket); var bk = el("bkVal"); if (bk) bk.textContent = "SAR " + money(STATE.order.basket); },
    basketSet: function (v) { STATE.order.basket = Number(v); render(); },
    placeOrder: function () { STATE.order.placed = true; render(); },
    resetOrder: function () { STATE.order.placed = false; render(); },
    repay: function () { STATE.repay.paid = true; render(); },
    repayReset: function () { STATE.repay.paid = false; render(); },
    repApprove: function () { STATE.rep.decided = true; render(); },
    /* onboarding */
    onbId: function () { STATE.onb.id = true; render(); },
    consent: function (id) { STATE.consent[id] = !STATE.consent[id]; render(); },
    limitUp: function () { STATE.limitup = true; render(); },
    limitReset: function () { STATE.limitup = false; render(); },
    /* engine */
    frontier: function (v) { STATE.lossBudget = Number(v); var lb = el("lbVal"); if (lb) lb.textContent = Number(v).toFixed(1) + "%"; paintFrontier(); },
    promote: function () { STATE.promoted = true; render(); },
    guard: function (id) { STATE.guards[id] = !STATE.guards[id]; render(); },
    tripBreaker: function () { STATE.breakerTripped = true; render(); },
    resetBreaker: function () { STATE.breakerTripped = false; render(); },
    runUplift: function () {
      var box = el("upliftRun"); if (!box) return;
      box.innerHTML = '<div class="u-center" style="padding:18px"><div class="u-spin"></div><p style="margin-top:12px">Replaying 42,800 decisions at your realized loss rate…</p></div>';
      setTimeout(function () { STATE.upliftRun = true; render(); }, 1400);
    },
    resetUplift: function () { STATE.upliftRun = false; render(); },
    /* arm */
    armStep: function (n) { STATE.armStep = n; render(); },
    armName: function (v) { STATE.arm.name = v || "Your Arm"; var p = el("brandPrev"); if (p) p.querySelector(".lbl").textContent = STATE.arm.name; },
    armColor: function (c) { STATE.arm.color = c; render(); },
    draw: function (v) {
      STATE.draw = Number(v);
      var adv = STATE.draw * 0.85, util = STATE.draw / 500 * 100;
      var d = el("drawVal"); if (d) d.textContent = "Drawn SAR " + STATE.draw + "M · advance SAR " + adv.toFixed(0) + "M";
      var b = el("drawBar"); if (b) b.style.width = util + "%";
      var u = el("utilVal"); if (u) u.textContent = util.toFixed(0) + "%";
    },
    tranche: function (id) { STATE.tranche[id] = !STATE.tranche[id]; render(); }
  };
  function closeCtxModal() { var c = el("ctx"); if (c) c.classList.remove("modal"); }

  window.TP = TP;

  /* events */
  window.addEventListener("hashchange", render);
  document.addEventListener("keydown", function (e) {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === "ArrowRight") { e.preventDefault(); TP.tour(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); TP.tour(-1); }
  });
  document.addEventListener("DOMContentLoaded", function () {
    el("whyBtn").addEventListener("click", TP.openDrawer);
    el("drawerClose").addEventListener("click", TP.closeDrawer);
    el("backdrop").addEventListener("click", TP.closeDrawer);
    var fab = el("ctxFab");
    if (fab) fab.addEventListener("click", function () { el("ctx").classList.toggle("modal"); });
    if (!location.hash) location.hash = "#/" + DEFAULT;
    render();
  });
})();
