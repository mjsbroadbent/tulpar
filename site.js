/* Tulpar site: shared header and footer, Tulparcoin price engine, countdown. */
(function () {
  "use strict";
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  var LOGO = '<svg viewBox="0 0 512 512" aria-hidden="true"><defs><linearGradient id="tlpg" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#00b4b7"/><stop offset="1" stop-color="#00628a"/></linearGradient></defs>' +
    '<rect width="512" height="512" rx="124" fill="url(#tlpg)"/>' +
    '<path fill="#fff" d="M255 310C254 311 254 312 254 313C255 315 256 319 258 321C259 324 261 326 262 328C264 330 265 331 266 333C269 335 271 337 274 339C278 341 284 344 288 346C291 347 293 349 295 350C298 352 299 354 301 356C303 360 305 364 307 368C308 371 310 375 311 379C312 384 312 390 313 394C313 398 314 401 316 403C316 404 317 405 318 407C320 408 322 411 324 412C326 413 327 414 329 415C330 415 331 415 332 415C333 414 333 412 333 410C334 407 334 401 334 398C333 397 333 396 332 396C331 395 328 397 327 396C327 396 326 396 326 396C325 394 326 389 325 386C324 381 318 375 316 369C314 363 312 356 311 352C310 350 309 349 308 347C307 346 306 346 305 345C302 343 297 342 294 340C291 339 289 337 286 335C284 333 281 331 279 328C277 325 276 322 274 320C272 317 270 315 268 314C266 312 262 311 260 310C258 310 256 310 255 310ZM198 173C197 174 198 174 198 175C198 176 199 176 200 177C202 179 208 182 212 184C216 187 220 192 222 193C223 193 223 193 224 193C224 192 224 190 224 189C223 187 222 183 220 181C219 179 218 178 216 177C215 176 212 174 210 173C208 173 207 173 205 173C203 172 198 172 198 173ZM190 154C190 155 192 158 194 160C196 163 204 165 209 167C213 169 220 174 221 173C222 173 221 170 220 169C220 167 219 165 218 164C216 162 214 160 212 158C209 156 206 155 204 154C201 154 198 153 196 153C194 153 191 153 190 154ZM179 134C179 135 180 136 181 138C182 139 183 141 185 142C189 145 197 144 203 146C208 148 217 156 218 155C219 154 218 152 218 150C217 149 216 147 216 146C215 144 213 143 212 141C211 140 210 140 208 139C206 138 204 137 202 136C198 135 194 135 191 134C188 134 186 133 184 133C182 134 180 133 179 134ZM120 103C120 103 120 103 121 104C122 104 128 104 131 104C136 105 140 107 145 109C150 111 155 113 159 116C164 119 166 124 171 126C177 128 186 126 192 127C195 127 197 128 200 129C203 130 208 132 210 132C210 132 210 132 211 132C211 131 210 128 209 127C208 125 206 123 204 121C203 120 201 118 199 117C198 116 196 115 194 114C191 113 186 112 181 111C175 111 162 113 162 112C162 112 163 111 164 110C165 109 168 108 171 107C175 106 184 106 185 104C185 104 185 104 184 103C184 102 183 102 181 101C179 100 175 98 172 98C171 97 170 96 168 96C164 96 160 96 156 96C150 97 138 102 137 101C137 101 137 101 137 100C138 99 144 97 144 96C144 96 141 96 139 96C135 97 130 98 126 100C124 101 120 102 120 103ZM425 90C423 90 414 100 410 104C406 107 402 109 399 112C395 115 391 118 386 120C380 124 374 128 367 132C359 136 351 139 341 143C329 148 309 153 300 157C296 159 294 161 291 163C288 165 285 168 282 170C281 172 279 174 278 177C276 179 275 182 273 185C271 189 268 197 266 201C265 203 264 205 263 206C262 207 260 208 259 209C258 210 257 210 255 210C253 211 250 211 248 210C245 210 243 210 240 208C235 207 228 204 223 202C218 199 210 193 208 193C207 192 207 192 207 192C206 193 206 194 205 194C203 194 198 194 196 191C190 186 187 168 183 160C181 156 180 152 177 149C175 145 172 140 169 137C166 133 162 129 158 126C155 123 152 121 149 119C145 118 142 116 138 115C134 113 128 114 124 112C120 110 118 104 115 102C113 100 111 98 109 98C108 97 106 96 106 96C105 97 105 98 105 98C105 100 106 102 107 104C108 108 113 112 113 116C113 119 110 120 108 124C105 129 101 137 98 144C95 150 90 156 89 160C88 162 87 164 87 166C87 167 87 170 88 172C89 174 92 177 94 178C95 178 96 178 97 178C98 179 99 179 101 178C103 178 105 177 107 175C109 173 111 168 113 166C114 164 115 164 117 163C120 161 126 160 130 159C132 158 135 158 137 158C139 159 140 160 142 161C143 162 144 163 144 164C146 166 147 169 148 172C148 174 149 176 149 180C150 185 149 193 148 200C148 208 145 219 144 226C143 230 143 234 143 237C143 240 143 243 144 244C144 245 144 246 145 246C145 247 146 247 147 246C148 246 152 244 153 244C153 244 154 245 154 245C154 246 151 247 149 248C146 249 143 250 140 251C137 252 135 253 131 254C125 254 113 255 109 257C108 257 107 258 106 259C104 260 103 262 103 264C102 267 102 270 103 273C104 275 105 276 106 278C108 281 112 285 114 288C116 291 116 293 117 296C118 299 118 303 120 306C121 309 122 311 124 313C127 317 133 322 137 325C140 327 142 329 144 330C145 330 146 330 147 330C148 328 147 321 146 318C146 315 145 313 144 311C144 310 143 309 142 309C141 309 139 310 138 310C138 310 137 310 137 310C137 309 137 306 136 304C135 301 130 298 128 294C127 292 126 289 125 286C124 283 121 277 121 275C121 273 122 273 122 272C123 271 124 271 125 271C128 271 135 273 142 274C150 276 161 280 169 282C174 284 179 284 182 285C185 285 185 286 187 286C191 288 199 293 204 296C210 298 214 299 219 300C224 302 229 302 234 303C241 303 250 302 255 302C258 302 260 302 263 304C266 305 270 308 273 311C278 315 282 322 286 326C289 330 292 332 294 334C296 336 298 337 301 338C305 341 314 345 319 347C321 348 322 349 324 350C328 353 334 358 338 362C340 364 342 367 344 370C346 374 348 378 349 381C349 383 350 384 350 387C351 391 350 400 351 404C351 405 351 406 352 407C353 408 354 410 355 411C357 414 360 416 362 418C364 420 366 421 367 421C367 422 368 422 368 422C370 421 370 413 370 410C370 406 370 402 369 400C368 399 368 399 367 399C367 398 365 400 364 399C363 399 363 399 362 398C362 397 363 393 363 391C363 389 363 388 362 387C361 384 358 379 356 374C353 367 351 355 348 349C347 346 346 345 344 342C340 338 333 333 330 329C328 327 327 324 327 323C326 321 326 320 326 318C325 315 326 308 326 303C326 298 327 292 327 287C327 283 326 277 326 276C327 275 327 275 328 275C328 275 329 275 330 276C331 277 334 280 336 282C338 285 339 287 340 290C341 294 342 299 344 303C345 307 347 310 349 314C351 319 355 324 358 328C361 331 364 333 367 336C370 338 376 342 380 344C384 345 388 346 392 346C396 347 401 347 405 346C408 346 413 345 414 344C415 344 415 343 415 342C415 341 407 338 404 335C400 332 396 328 394 324C391 320 389 317 387 312C384 306 381 297 379 291C377 287 375 283 373 280C371 276 368 273 366 270C364 268 361 266 359 264C356 262 352 260 349 259C347 258 345 258 342 258C339 257 336 257 333 258C329 258 323 262 319 262C313 261 308 254 303 252C299 250 296 250 292 248C286 246 271 244 268 242C266 242 265 242 265 241C266 240 297 239 306 238C311 237 313 237 317 236C322 235 328 233 332 232C335 230 338 229 340 228C341 228 342 227 341 226C341 225 326 225 321 224C318 223 315 222 313 222C312 221 311 221 311 220C311 219 325 219 332 218C339 217 346 216 353 214C359 212 364 210 370 207C376 204 384 199 387 196C389 194 391 192 391 191C389 189 358 198 346 200C338 201 331 202 326 202C323 202 320 201 320 201C319 200 323 200 325 199C331 197 345 195 354 192C361 190 368 188 374 186C379 184 384 181 387 179C390 178 391 177 393 175C397 172 402 168 406 164C409 161 414 155 415 153C416 152 416 151 416 151C414 150 401 157 393 161C383 165 371 170 361 173C352 176 343 179 337 180C334 181 331 181 330 181C329 181 328 181 328 181C328 180 329 180 331 179C336 176 360 167 371 162C379 158 385 154 390 150C395 147 400 144 403 140C407 137 410 134 412 130C414 127 416 124 418 120C420 115 422 107 424 102C424 99 425 97 425 94C425 93 426 91 425 90Z"/></svg>';

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
        '<div class="legal"><p>' + T("legal1") + "</p><p>" + T("legal2") + "</p>" +
          '<p>Part of the Irad worldbuilding project: Irad and Tulpar are fictional. See <a href="https://irad.wiki/wiki/Tulpar_(app)">Tulpar on Irad Wiki</a>.</p></div>' +
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


  /* ---------- store buttons: "not available in your region" ---------- */
  function notAvailable() {
    var m = $("#naModal");
    if (!m) {
      var web = document.documentElement.getAttribute("data-lang") ? "../app/" : "app/";
      m = document.createElement("div"); m.id = "naModal"; m.className = "na-modal"; m.hidden = true;
      m.innerHTML = '<div class="na-bg" data-na-close></div><div class="na-card" role="alertdialog" aria-modal="true" aria-labelledby="naT" aria-describedby="naB">' +
        '<div class="na-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/></svg></div>' +
        '<h3 id="naT">' + T("naTitle") + '</h3><p id="naB">' + T("naBody") + '</p>' +
        '<div class="na-row"><a class="na-web" href="' + web + '">' + T("naWeb") + '</a><button type="button" class="na-ok" data-na-close>' + T("naOk") + '</button></div></div>';
      document.body.appendChild(m);
      m.addEventListener("click", function (e) { if (e.target.closest("[data-na-close]")) m.hidden = true; });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") m.hidden = true; });
    }
    var t = $("#toast"); if (t) t.hidden = true;
    m.hidden = false; $(".na-ok", m).focus();
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
      '<defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00728c" stop-opacity=".18"/><stop offset="1" stop-color="#00728c" stop-opacity="0"/></linearGradient></defs>' +
      grid + '<path class="area" d="' + area + '"/><path class="line" d="' + line + '"/>' +
      '<circle class="dot" r="5" cx="' + X(last[0]).toFixed(1) + '" cy="' + Y(last[1]).toFixed(1) + '"/>' + lbl + "</svg>";
  }

  function change24() {
    var now = Date.now(), p = livePrice(), prev = priceAt(now - DAY) || p;
    return (p - prev) / prev;
  }

  window.TULPAR = {
    notAvailable: notAvailable,
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
