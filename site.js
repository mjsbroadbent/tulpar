/* Tulpar site: shared header and footer, Tulparcoin price engine, countdown. */
(function () {
  "use strict";
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  var LOGO = '<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#1f3a93"/>' +
    '<path d="M9 27C16.5 26 22.5 21 26.5 10.5" stroke="#fff" stroke-width="3.2" stroke-linecap="round" fill="none"/>' +
    '<path d="M12.5 30.5C20 30.5 26 26.5 30 18" stroke="#fff" stroke-width="3.2" stroke-linecap="round" fill="none"/>' +
    '<path d="M17 33C23.5 33.5 28.5 31 31.5 26" stroke="#f5b018" stroke-width="3.2" stroke-linecap="round" fill="none"/></svg>';

  /* ---------- language ---------- */
  var LANG = document.documentElement.getAttribute("data-lang") || "en";
  var STR = (window.TULPAR_STR || {});
  function T(k, vars) {
    var d = STR[LANG] || {}, v = k in d ? d[k] : (STR.en || {})[k];
    if (v === undefined) return k;
    if (vars && typeof v === "string") v = v.replace(/\{(\w+)\}/g, function (m, n) { return vars[n] !== undefined ? vars[n] : m; });
    return v;
  }
  function fmtDate(iso) {
    var x = new Date(iso + "T12:00:00Z");
    return T("dateFmt", { d: x.getUTCDate(), m: T("monthsLong")[x.getUTCMonth()], y: x.getUTCFullYear() });
  }
  var file = (location.pathname.split("/").pop() || "index.html");
  if (!/\.html$/.test(file)) file = "index.html";
  var LANG_LINKS = LANG === "en"
    ? { en: file, ir: "ir/" + file, ru: "ru/" + file }
    : { en: "../" + file, ir: (LANG === "ir" ? "" : "../ir/") + file, ru: (LANG === "ru" ? "" : "../ru/") + file };
  var LANG_NAMES = { en: "English", ir: "Irad tili", ru: "Русский" };

  /* ---------- header & footer ---------- */
  var page = document.body.dataset.page || "";
  function cur(ids) { return ids.indexOf(page) > -1 ? ' aria-current="page"' : ""; }
  var langSwitch = '<div class="langs" role="group" aria-label="' + T("lang") + '">' +
    ["ir", "ru", "en"].map(function (l) {
      return '<a href="' + LANG_LINKS[l] + location.hash + '" hreflang="' + (l === "ir" ? "ky" : l) + '"' + (l === LANG ? ' aria-current="true"' : "") + ">" + LANG_NAMES[l] + "</a>";
    }).join("") + "</div>";
  var head = $("#siteHead");
  if (head) {
    head.className = "site-head";
    head.innerHTML =
      '<div class="wrap head-inner">' +
        '<a class="brand" href="index.html" aria-label="' + T("home") + '">' + LOGO + "tulpar</a>" +
        '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">' + T("menu") + "</button>" +
        '<nav class="nav" id="nav" aria-label="Main">' +
          '<a href="index.html#app"' + cur(["home"]) + ">" + T("navApp") + "</a>" +
          '<a href="coin.html"' + cur(["coin"]) + ">" + T("navCoin") + "</a>" +
          '<a href="news.html"' + cur(["news"]) + ">" + T("navNews") + "</a>" +
          '<a href="about.html"' + cur(["about", "letter", "careers"]) + ">" + T("navAbout") + "</a>" +
        "</nav>" + langSwitch +
        '<a class="btn btn-act" href="index.html#download">' + T("getApp") + "</a>" +
      "</div>";
    var mb = $(".menu-btn", head), nav = $("#nav", head);
    mb.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      mb.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  var foot = $("#siteFoot");
  if (foot) {
    foot.className = "site-foot";
    function li(href, k) { return '<li><a href="' + href + '">' + T(k) + "</a></li>"; }
    foot.innerHTML =
      '<div class="wrap">' +
        '<div class="foot-grid">' +
          '<div><a class="brand" href="index.html">' + LOGO + "tulpar</a>" +
            '<p style="margin-top:14px;max-width:22em">' + T("footTag") + "</p></div>" +
          "<div><h4>" + T("fProduct") + "</h4><ul>" + li("index.html#app", "fFeatures") + li("index.html#download", "fDownload") + li("coin.html", "fCoin") + li("coin.html#points", "fPoints") + "</ul></div>" +
          "<div><h4>" + T("fCompany") + "</h4><ul>" + li("about.html", "fAbout") + li("letter.html", "fLetter") + li("careers.html", "fCareers") + li("news.html", "fNews") + li("news.html#press", "fPress") + "</ul></div>" +
          "<div><h4>" + T("fHelp") + "</h4><ul>" + li("help.html", "fHelpCentre") + li("coin.html#faq", "fFaq") + li("legal.html#privacy", "fPrivacy") + li("legal.html#terms", "fTerms") + "</ul></div>" +
        "</div>" +
        '<div class="legal"><p>' + T("legal1") + "</p><p>" + T("legal2") + "</p></div>" +
      "</div>";
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-soon]");
    if (a) { e.preventDefault(); toast(T("soon")); }
  });

  var toastTimer;
  function toast(text) {
    var t = $("#toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = text; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
  }

  /* ---------- countdown to Tulpar Pay going TLPR-only (1 Jan 2027, Irad Time, UTC+6) ---------- */
  var SWITCH = Date.UTC(2026, 11, 31, 18, 0, 0);
  function tickCount() {
    var el = $("#count"); if (!el) return;
    var ms = Math.max(0, SWITCH - Date.now());
    var d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
    var v = { d: d, h: h, m: m, s: s };
    $$("[data-u]", el).forEach(function (b) { var n = v[b.dataset.u]; b.textContent = b.dataset.u === "d" ? n : ("0" + n).slice(-2); });
  }
  if ($("#count")) { tickCount(); setInterval(tickCount, 1000); }

  /* ---------- Tulparcoin price engine ----------
     A fixed history that follows reported prices (opened at 4¢ on 22 Sep 2026, peaked near 7¢,
     fell to about 3¢ after the 8 Oct block), then a deterministic drift so every visitor sees the
     same chart, plus a small live wobble. Prices stay between 3 and 7 US cents. */
  var DAY = 864e5, HOUR = 36e5;
  var LAUNCH = Date.UTC(2026, 8, 22, 12, 0, 0);
  var KEYS = [
    ["2026-09-22", 0.0400], ["2026-09-23", 0.0688], ["2026-09-24", 0.0640], ["2026-09-25", 0.0492],
    ["2026-09-26", 0.0612], ["2026-09-28", 0.0570], ["2026-09-30", 0.0521], ["2026-10-02", 0.0503],
    ["2026-10-05", 0.0488], ["2026-10-08", 0.0462], ["2026-10-09", 0.0312], ["2026-10-12", 0.0301], ["2026-10-13", 0.0336]
  ].map(function (k) { return [Date.parse(k[0] + "T12:00:00Z"), k[1]]; });
  var MIN = 0.030, MAX = 0.070;

  function hash(n) { /* deterministic 0..1 */
    var x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x);
  }
  function clamp(p) { return Math.min(MAX, Math.max(MIN, p)); }

  /* daily anchor after the last key: seeded mean-reverting walk around 3.6¢ */
  var dayCache = {};
  function dayAnchor(dayIdx) {
    var lastT = KEYS[KEYS.length - 1][0], lastIdx = Math.floor(lastT / DAY);
    if (dayIdx <= lastIdx) return null;
    if (dayCache[dayIdx]) return dayCache[dayIdx];
    var p = dayIdx - 1 === lastIdx ? KEYS[KEYS.length - 1][1] : dayAnchor(dayIdx - 1);
    var shock = (hash(dayIdx) - 0.5) * 0.16;          // up to ±8% a day
    var pull = (0.036 - p) * 0.18;                    // drift back toward 3.6¢
    var v = clamp(p * (1 + shock) + pull);
    dayCache[dayIdx] = v;
    return v;
  }
  function noonPrice(dayIdx) {
    return dayAnchor(dayIdx) || KEYS[KEYS.length - 1][1];
  }
  function anchorAt(t) {
    if (t <= KEYS[0][0]) return KEYS[0][1];
    for (var i = 1; i < KEYS.length; i++) {
      if (t <= KEYS[i][0]) {
        var a = KEYS[i - 1], b = KEYS[i], f = (t - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * f;
      }
    }
    /* after the last reported price: interpolate between seeded daily noon anchors */
    var d = Math.floor((t - DAY / 2) / DAY);            // the day whose noon is at or before t
    var f = (t - (d * DAY + DAY / 2)) / DAY;
    return noonPrice(d) + (noonPrice(d + 1) - noonPrice(d)) * f;
  }
  /* price at time t (with hourly and 15-minute texture) */
  function priceAt(t) {
    if (t < LAUNCH) return null;
    var h = Math.floor(t / HOUR), q = Math.floor(t / (HOUR / 4));
    var tex = (hash(h) - 0.5) * 0.05 + (hash(q * 7.1) - 0.5) * 0.02;
    return clamp(anchorAt(t) * (1 + tex));
  }

  var live = { wobble: 0 };
  function livePrice() { return clamp(priceAt(Date.now()) * (1 + live.wobble)); }
  setInterval(function () {
    live.wobble += (Math.random() - 0.5) * 0.008;
    live.wobble *= 0.9;                               // stays within about ±2%
    document.dispatchEvent(new CustomEvent("tlpr:tick"));
  }, 3500);

  function series(range) {
    var now = Date.now(), span, step;
    if (range === "1D") { span = DAY; step = HOUR / 4; }
    else if (range === "7D") { span = 7 * DAY; step = HOUR; }
    else { span = Math.max(DAY, now - LAUNCH); step = Math.max(HOUR, Math.round(span / 160 / HOUR) * HOUR); }
    var out = [], start = Math.max(LAUNCH, now - span);
    for (var t = start; t < now; t += step) out.push([t, priceAt(t)]);
    out.push([now, livePrice()]);
    return out;
  }

  function cents(p, dp) { return (p * 100).toFixed(dp === undefined ? 2 : dp) + "¢"; }
  function usd(p) { return "$" + p.toFixed(4); }

  /* draw an SVG line chart into el */
  function drawChart(el, range) {
    var data = series(range);
    var W = el.clientWidth || 600, H = el.clientHeight || 220, padL = 44, padR = 10, padT = 10, padB = 26;
    var ps = data.map(function (d) { return d[1]; });
    var lo = Math.min.apply(null, ps), hi = Math.max.apply(null, ps);
    var pad = (hi - lo) * 0.15 || 0.002; lo -= pad; hi += pad;
    var t0 = data[0][0], t1 = data[data.length - 1][0];
    function X(t) { return padL + (W - padL - padR) * (t1 === t0 ? 1 : (t - t0) / (t1 - t0)); }
    function Y(p) { return padT + (H - padT - padB) * (1 - (p - lo) / (hi - lo)); }
    var line = data.map(function (d, i) { return (i ? "L" : "M") + X(d[0]).toFixed(1) + " " + Y(d[1]).toFixed(1); }).join("");
    var area = line + "L" + X(t1).toFixed(1) + " " + (H - padB) + "L" + X(t0).toFixed(1) + " " + (H - padB) + "Z";
    var grid = "", lbl = "";
    for (var i = 0; i <= 3; i++) {
      var p = lo + (hi - lo) * i / 3, y = Y(p).toFixed(1);
      grid += '<line class="grid" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y + '" y2="' + y + '"/>';
      lbl += '<text class="lbl" x="' + (padL - 8) + '" y="' + (+y + 4) + '" text-anchor="end">' + cents(p, 1) + "</text>";
    }
    var months = T("monthsShort");
    for (var j = 0; j <= 3; j++) {
      var tt = t0 + (t1 - t0) * j / 3, dt = new Date(tt);
      var txt = range === "1D" ? ("0" + dt.getHours()).slice(-2) + ":00" : dt.getDate() + " " + months[dt.getMonth()];
      lbl += '<text class="lbl" x="' + X(tt).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + (j === 0 ? "start" : j === 3 ? "end" : "middle") + '">' + txt + "</text>";
    }
    var last = data[data.length - 1];
    el.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + T("chartLabel") + '">' +
      '<defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f3a93" stop-opacity=".18"/><stop offset="1" stop-color="#1f3a93" stop-opacity="0"/></linearGradient></defs>' +
      grid + '<path class="area" d="' + area + '"/><path class="line" d="' + line + '"/>' +
      '<circle class="dot" r="5" cx="' + X(last[0]).toFixed(1) + '" cy="' + Y(last[1]).toFixed(1) + '"/>' + lbl + "</svg>";
  }

  function change24() {
    var now = Date.now(), p = livePrice(), prev = priceAt(now - DAY) || p;
    return (p - prev) / prev;
  }

  window.TULPAR = {
    T: T, LANG: LANG, fmtDate: fmtDate, toast: toast, livePrice: livePrice, priceAt: priceAt, series: series, drawChart: drawChart,
    change24: change24, cents: cents, usd: usd, LAUNCH: LAUNCH, SOM_PER_USD: 8.4,
    SUPPLY: 900e6, CIRCULATING: 405e6
  };

  /* simple ticker binding: [data-tlpr="px|chg|cap|vol"] anywhere on the page */
  function paintTicker() {
    var p = livePrice(), c = change24();
    $$('[data-tlpr="px"]').forEach(function (el) { el.textContent = cents(p); });
    $$('[data-tlpr="usd"]').forEach(function (el) { el.textContent = usd(p); });
    $$('[data-tlpr="chg"]').forEach(function (el) {
      el.textContent = (c >= 0 ? "+" : "−") + Math.abs(c * 100).toFixed(2) + "% " + T("h24");
      el.className = "chg " + (c >= 0 ? "up" : "down");
    });
    $$('[data-tlpr="cap"]').forEach(function (el) { el.textContent = "$" + (p * window.TULPAR.CIRCULATING / 1e6).toFixed(1) + "m"; });
    $$('[data-tlpr="vol"]').forEach(function (el) {
      var v = 110000 + hash(Math.floor(Date.now() / HOUR)) * 90000;
      el.textContent = "$" + Math.round(v / 1000) + "k";
    });
  }
  paintTicker();
  document.addEventListener("tlpr:tick", paintTicker);
})();
