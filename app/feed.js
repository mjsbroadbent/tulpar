/* Tulpar channels: in-world accounts (businesses, news, sport, institutions), their posts, the Discover timeline
   ("For you"), Channels (your subscriptions), channel profiles (#@handle) and single posts (#post=<id>).
   Posts come from feed/posts.json, then the day's posts at iradone.com/data/tulpar-feed.json, then the live IradOne,
   Herald and official Tulpar feeds. Likes, reposts, saves and subscriptions are kept per user (Firestore when
   signed in, always mirrored to this device). Subscribe links from the sites (#sub=<handle>) open the channel with a
   "Subscribe to … on Tulpar?" sheet, shown once the start-up screen is out of the way. */

const DESK_FEED = "https://iradone.com/data/tulpar-feed.json";
const IRADONE_INDEX = "https://iradone.com/news/index.json";
const HERALD_RSS = "https://talasherald.com/feed.xml";
const DEFAULT_SUBS = ["iradone", "talasherald", "tulpar"];
const PAGE = 30;
const KINDS = { news: ["news", "government"], sport: ["sport"], business: ["business", "service"] };
const LIMITS = { subs: 200, likes: 1000, saves: 500, reposts: 500 };

export function createFeed(ctx) {
  const { $, $$, t, esc, LANG, LOCALE, fmtD, hhmm, toast, store, go } = ctx;
  const ACC = new Map();
  let POSTS = [];                     // every known post, normalised
  const byId = new Map();
  const sources = { seed: [], desk: [], iradone: [], herald: [], official: [] };
  let filter = "foryou", chView = "posts", shown = 0, list = [], lastTab = "discover", accNow = null, postNow = null;
  let ready = false, readyP = null, rerenderTimer = null;

  /* ---------- per-user state ---------- */
  const blank = () => ({ subs: DEFAULT_SUBS.slice(), likes: [], saves: [], reposts: [] });
  function clean(p) {
    const o = blank();
    if (p && typeof p === "object") for (const k of Object.keys(LIMITS)) if (Array.isArray(p[k])) o[k] = p[k].filter(x => typeof x === "string" && x.length <= 80).slice(-LIMITS[k]);
    return o;
  }
  let prefs = clean(store("tp_feed") || blank());
  const sets = () => ({ subs: new Set(prefs.subs), likes: new Set(prefs.likes), saves: new Set(prefs.saves), reposts: new Set(prefs.reposts) });
  let S = sets();
  const remote = { ref: null, off: false, timer: null };
  let syncedFor = null;               // whose subscriptions are loaded: null (not yet), "anon" or the signed-in uid
  function savePrefs() {
    store("tp_feed", prefs); S = sets();
    if (remote.ref && !remote.off) { clearTimeout(remote.timer); remote.timer = setTimeout(pushRemote, 1200); }
  }
  function pushRemote() {
    const F = ctx.FB.F; if (!F || !remote.ref) return;
    F.setDoc(remote.ref, { ...prefs, updatedAt: F.serverTimestamp() }).catch(e => { remote.off = true; console.warn("feed prefs not synced:", e.code || e.message); });
  }
  async function onAuth() {
    const FB = ctx.FB; remote.ref = null; remote.off = false; syncedFor = null;
    if (!FB.ready || !FB.user) { syncedFor = "anon"; trySub(); return; }
    const F = FB.F, uid = FB.user.uid;
    try {
      remote.ref = F.doc(FB.db, "users", uid, "private", "feed");
      const d = await F.getDoc(remote.ref);
      if (d.exists()) { prefs = clean(d.data()); store("tp_feed", prefs); S = sets(); rerender(); }
      else pushRemote();
    } catch (e) { remote.off = true; console.warn("feed prefs: device only (" + (e.code || e.message) + ")"); }
    if (FB.user && FB.user.uid === uid) syncedFor = uid;
    watchOfficial();
    trySub();
  }
  function toggle(key, id) {
    const on = !S[key].has(id);
    prefs[key] = on ? prefs[key].concat(id).slice(-LIMITS[key]) : prefs[key].filter(x => x !== id);
    savePrefs();
    return on;
  }

  /* ---------- helpers ---------- */
  const loc = o => (o ? (typeof o === "string" ? o : o[LANG] || o.en || "") : "");
  const hashN = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  function compact(n) {
    n = Math.max(0, Math.round(n || 0));
    if (n < 1000) return String(n);
    const unit = n >= 1e6 ? 1e6 : 1e3, v = n / unit, s = (v >= 100 ? Math.round(v) : Math.round(v * 10) / 10).toString();
    const x = LANG === "en" ? s : s.replace(".", ",");
    if (LANG === "ru") return x + (unit === 1e6 ? " млн" : " тыс.");
    if (LANG === "ir") return x + (unit === 1e6 ? " mln" : " miñ");
    return x + (unit === 1e6 ? "M" : "K");
  }
  function ago(ms) {
    const s = (Date.now() - ms) / 1000;
    if (s < 60) return t("fNow");
    if (s < 3600) return t("fMins", { n: Math.floor(s / 60) });
    if (s < 86400) return t("fHours", { n: Math.floor(s / 3600) });
    const d = new Date(ms), same = d.getFullYear() === new Date().getFullYear();
    return fmtD(d, same ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
  }
  function monthYear(ym) {
    const [y, m] = ym.split("-").map(Number);
    if (LANG === "ir") { const M = ((window.TULPAR_STR || {}).ir || {}).monthsLong || []; return (M[m - 1] || "") + " " + y; }
    return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString(LOCALE, { month: "long", year: "numeric", timeZone: "UTC" });
  }
  const fullTime = ms => { const d = new Date(ms); return hhmm(d) + " · " + fmtD(d, { day: "numeric", month: "long", year: "numeric" }); };
  const TICK = `<svg class="tick" viewBox="0 0 24 24" aria-hidden="true"><path fill="#f5b018" d="M12 1.5l2.6 3.2 4-.9.6 4.1 3.6 2.1-2 3.6 1.3 3.9-4 1.2-1.4 3.9-3.8-1.6L9 22.6l-2-3.6-4.1-.4.3-4.1L.2 11.9l3-2.8-.4-4.1 4.1-.5L9 .9z"/><path fill="none" stroke="#054a60" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M7.6 12.3l3 3 5.8-6.2"/></svg>`;
  const ICON = {
    reply: `<svg viewBox="0 0 24 24"><path d="M4 5.5h16v10H9.5L5.5 19v-3.5H4z"/></svg>`,
    repost: `<svg viewBox="0 0 24 24"><path d="M6 9V7.5A2.5 2.5 0 0 1 8.5 5H18m0 0-2.5-2.5M18 5l-2.5 2.5M18 15v1.5a2.5 2.5 0 0 1-2.5 2.5H6m0 0 2.5 2.5M6 19l2.5-2.5"/></svg>`,
    like: `<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.1A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/></svg>`,
    save: `<svg viewBox="0 0 24 24"><path d="M6.5 3.5h11v17L12 16.6l-5.5 3.9z"/></svg>`,
    share: `<svg viewBox="0 0 24 24"><path d="M12 15V3.5m0 0L8 7.5m4-4 4 4M5 12v7.5h14V12"/></svg>`,
    search: `<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>`
  };
  const initials = a => loc(a.name).replace(/[^\p{L}\p{N} ]/gu, "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "T";
  function avatar(a, cls = "") {
    return a.avatar ? `<span class="fav ${cls}"><img src="${esc(a.avatar)}" alt="" loading="lazy"></span>`
      : `<span class="fav ini ${cls}" style="background:${esc(a.banner || "#00728c")}">${esc(initials(a))}</span>`;
  }
  const nameLine = a => `<b>${esc(loc(a.name))}</b>${a.verified ? TICK : ""}`;
  const subCount = a => (a.followers || 0) + (S.subs.has(a.handle) ? 1 : 0);
  function richText(s) {
    let h = esc(s);
    h = h.replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)»”]/g, u => `<a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a>`);
    h = h.replace(/(^|[^\w/&])@([a-z0-9_]{2,24})\b/g, (m, pre, hd) => ACC.has(hd) ? `${pre}<a href="#@${hd}" data-acct="${hd}">@${hd}</a>` : m);
    h = h.replace(/(^|[\s(«“])#([\p{L}\p{N}_]{2,40})/gu, (m, pre, tag) => `${pre}<a href="#tag=${encodeURIComponent(tag)}" data-tag="${esc(tag)}">#${tag}</a>`);
    return h.replace(/\n/g, "<br>");
  }

  /* ---------- loading ---------- */
  function getJSON(url, ms, as = "json") {
    const ctl = typeof AbortController !== "undefined" ? new AbortController() : null, timer = setTimeout(() => ctl && ctl.abort(), ms);
    const limit = new Promise((_, no) => setTimeout(() => no(new Error("timeout")), ms + 50));
    return Promise.race([fetch(url, { cache: "no-cache", signal: ctl ? ctl.signal : undefined }).then(r => { if (!r.ok) throw new Error(url + " " + r.status); return as === "text" ? r.text() : r.json(); }), limit])
      .finally(() => clearTimeout(timer));
  }
  function norm(p, src) {
    if (!p || typeof p.id !== "string" || !ACC.has(p.handle)) return null;
    const ms = Date.parse(p.time); if (isNaN(ms)) return null;
    const text = typeof p.text === "string" ? { en: p.text } : (p.text && typeof p.text.en === "string" ? p.text : null);
    if (!text) return null;
    return { id: p.id, handle: p.handle, t: ms, text, image: p.image || null, link: p.link && p.link.url ? p.link : null, quote: p.quote || null,
      thread: p.thread || null, article: p.article || null, stats: p.stats || fakeStats(p.id, p.handle, ms), src };
  }
  function fakeStats(id, handle, ms) {
    const a = ACC.get(handle) || { followers: 1000 }, h = hashN(id), age = Math.min(1, Math.max(0.05, (Date.now() - ms) / 432e5));
    const likes = Math.round(a.followers * (0.002 + (h % 900) / 1e5) * age);
    return { replies: Math.round(likes * (0.03 + (h % 7) / 100)), reposts: Math.round(likes * (0.06 + (h % 13) / 100)), likes };
  }
  const linkKey = u => (u || "").replace(/^https?:\/\//, "").replace(/[#?].*$/, "").replace(/\/$/, "").toLowerCase();
  function merge() {
    const seen = new Map(), links = new Set();
    const add = (p, dedupeLink) => {
      if (!p || seen.has(p.id)) return;
      if (dedupeLink && p.link && links.has(linkKey(p.link.url))) return;
      seen.set(p.id, p); if (p.link) links.add(linkKey(p.link.url));
    };
    sources.seed.forEach(p => add(p)); sources.desk.forEach(p => add(p));
    ["iradone", "herald", "official"].forEach(k => sources[k].forEach(p => add(p, true)));
    POSTS = Array.from(seen.values()).sort((a, b) => b.t - a.t);
    byId.clear(); POSTS.forEach(p => byId.set(p.id, p));
  }
  function load() {
    if (readyP) return readyP;
    readyP = Promise.all([fetch("feed/accounts.json").then(r => r.json()), fetch("feed/posts.json").then(r => r.json())]).then(([a, p]) => {
      (a.accounts || []).forEach(x => ACC.set(x.handle, x));
      sources.seed = (p.posts || []).map(x => norm(x, "seed")).filter(Boolean);
      merge(); ready = true; rerender(true);
      refresh(); trySub();
    }).catch(e => { console.warn("feed:", e.message); readyP = null; const b = $("#feedList"); if (b) b.innerHTML = `<p class="empty">${esc(t("feedFail"))}</p>`; });
    return readyP;
  }
  function refresh() {
    const jobs = [
      getJSON(DESK_FEED, 8000).then(j => { sources.desk = (j.posts || []).map(x => norm(x, "desk")).filter(Boolean); }).catch(() => {}),
      getJSON(IRADONE_INDEX, 8000).then(items => {
        sources.iradone = (items || []).slice(0, 30).map(n => norm({ id: "live-io-" + n.slug, handle: "iradone", time: n.published, text: { en: n.ticker || n.headline },
          link: { url: "https://iradone.com/news/" + n.slug + ".html", site: "iradone.com", title: n.headline, desc: n.dek, image: n.image ? "https://iradone.com/" + n.image : null } }, "live")).filter(Boolean);
      }).catch(() => {}),
      getJSON(HERALD_RSS, 8000, "text").then(txt => {
        const xml = new DOMParser().parseFromString(txt, "text/xml");
        sources.herald = Array.from(xml.querySelectorAll("item")).slice(0, 30).map(it => {
          const g = s => (it.querySelector(s) || {}).textContent || "";
          return norm({ id: "live-th-" + linkKey(g("link")).split("/").pop(), handle: "talasherald", time: new Date(g("pubDate")).toISOString(), text: { en: g("title") },
            link: { url: g("link"), site: "talasherald.com", title: g("title"), desc: g("description") } }, "live");
        }).filter(Boolean);
      }).catch(() => {})
    ];
    return Promise.all(jobs).then(() => { merge(); rerender(); });
  }
  let offUnsub = null;
  function watchOfficial() {
    const FB = ctx.FB; if (!FB.ready || offUnsub) return;
    const F = FB.F;
    try {
      offUnsub = F.onSnapshot(F.query(F.collection(FB.db, "rooms", "official", "messages"), F.orderBy("createdAt", "desc"), F.limit(30)), snap => {
        sources.official = snap.docs.map(d => { const m = d.data({ serverTimestamps: "estimate" }), at = m.createdAt && m.createdAt.toDate ? m.createdAt.toDate() : null;
          if (!at) return null;
          const txt = m.sticker ? "" : m.poll ? "📊 " + m.poll.q : m.text || "";
          return norm({ id: "off-" + d.id, handle: "tulpar", time: at.toISOString(), text: { en: txt }, image: m.sticker ? "stickers/" + m.sticker + ".svg" : null }, "live"); }).filter(Boolean);
        merge(); rerender();
      }, err => console.warn("official channel:", err.code || err.message));
    } catch (e) { console.warn(e); }
  }

  /* ---------- timeline ---------- */
  const visible = () => { const now = Date.now() + 60e3; return POSTS.filter(p => p.t <= now); };
  const isChild = p => p.thread && byId.has(p.thread) && byId.get(p.thread).handle === p.handle;
  function rank(ps) {
    return ps.map(p => {
      const a = ACC.get(p.handle) || {}, boost = (S.subs.has(p.handle) ? 4 : 0) + (a.verified ? 1.5 : 0) + Math.min(6, Math.log10(1 + p.stats.likes) * 1.5);
      return { p, s: p.t + boost * 36e5 };
    }).sort((a, b) => b.s - a.s).map(x => x.p);
  }
  function timeline(kind) {
    let ps = visible().filter(p => !isChild(p));
    if (kind === "subs") return ps.filter(p => S.subs.has(p.handle));
    if (kind === "saved") return prefs.saves.map(id => byId.get(id)).filter(Boolean).reverse();
    if (KINDS[kind]) ps = ps.filter(p => KINDS[kind].includes((ACC.get(p.handle) || {}).kind));
    return kind === "foryou" ? rank(ps) : ps;
  }
  function children(p) { return visible().filter(x => x.thread === p.id && x.handle === p.handle).sort((a, b) => a.t - b.t); }

  function card(p, opts = {}) {
    const a = ACC.get(p.handle); if (!a) return "";
    const txt = loc(p.text), st = p.stats, liked = S.likes.has(p.id), rep = S.reposts.has(p.id), saved = S.saves.has(p.id);
    let body = txt ? `<div class="pc-text">${richText(txt)}</div>` : "";
    if (p.article) body += articleCard(p.article);
    if (p.image) body += `<div class="pc-media${p.image.startsWith("stickers/") ? " stk-media" : ""}"><img src="${esc(p.image)}" alt="" loading="lazy"></div>`;
    if (p.link) body += linkCard(p.link);
    if (p.quote && !opts.noQuote) { const q = byId.get(p.quote); if (q) body += quoteCard(q); }
    const kids = opts.thread ? [] : children(p);
    const threadLink = !opts.inThread && kids.length ? `<button type="button" class="pc-thread" data-post="${esc(p.id)}">${esc(t("fThread"))} · ${kids.length + 1}</button>` : "";
    const n = (k, on) => compact(st[k] + (on ? 1 : 0));
    return `<article class="pc${opts.big ? " big" : ""}${opts.cls ? " " + opts.cls : ""}" data-pid="${esc(p.id)}">
      <a class="pc-av" href="#@${a.handle}" data-acct="${a.handle}" aria-label="${esc(loc(a.name))}">${avatar(a)}</a>
      <div class="pc-main">
        <div class="pc-head"><a href="#@${a.handle}" data-acct="${a.handle}" class="pc-name">${nameLine(a)}</a><span class="pc-h">@${a.handle}</span>${opts.big ? "" : `<span class="pc-dot">·</span><time datetime="${new Date(p.t).toISOString()}" title="${esc(fullTime(p.t))}">${esc(ago(p.t))}</time>`}</div>
        ${body}
        ${opts.big ? `<p class="pc-full">${esc(fullTime(p.t))}</p>` : ""}
        ${threadLink}
        <div class="pc-acts" role="group">
          <button type="button" data-pact="reply" aria-label="${esc(t("fReply"))}">${ICON.reply}<span>${n("replies")}</span></button>
          <button type="button" data-pact="repost" class="${rep ? "on rp" : ""}" aria-pressed="${rep}" aria-label="${esc(t("fRepost"))}">${ICON.repost}<span>${n("reposts", rep)}</span></button>
          <button type="button" data-pact="like" class="${liked ? "on lk" : ""}" aria-pressed="${liked}" aria-label="${esc(t("fLike"))}">${ICON.like}<span>${n("likes", liked)}</span></button>
          <button type="button" data-pact="save" class="${saved ? "on sv" : ""}" aria-pressed="${saved}" aria-label="${esc(t("fSave"))}">${ICON.save}</button>
          <button type="button" data-pact="share" aria-label="${esc(t("shareArticle"))}">${ICON.share}</button>
        </div>
      </div></article>`;
  }
  function linkCard(l) {
    const img = l.image ? `<span class="pl-img"><img src="${esc(l.image)}" alt="" loading="lazy"></span>` : "";
    return `<a class="pc-link${img ? " has-img" : ""}" href="${esc(l.url)}" target="_blank" rel="noopener">${img}<span class="pl-txt"><small>${esc(l.site || linkKey(l.url).split("/")[0])}</small><b>${esc(loc(l.title))}</b>${l.desc ? `<span>${esc(loc(l.desc))}</span>` : ""}</span></a>`;
  }
  function quoteCard(q) {
    const a = ACC.get(q.handle);
    return `<div class="pc-quote" data-post="${esc(q.id)}" role="link" tabindex="0"><div class="pc-head">${avatar(a, "sm")}<span class="pc-name">${nameLine(a)}</span><span class="pc-h">@${a.handle}</span><span class="pc-dot">·</span><time>${esc(ago(q.t))}</time></div>
      <div class="pc-text">${esc(loc(q.text))}</div>${q.image ? `<div class="pc-media sm"><img src="${esc(q.image)}" alt="" loading="lazy"></div>` : q.link ? `<small class="pq-link">🔗 ${esc(loc(q.link.title))}</small>` : ""}</div>`;
  }
  function articleCard(id) {
    const A = (window.TP_DISCOVER || []).find(x => x.id === id); if (!A) return "";
    const L = A[LANG] || A.en;
    return `<button type="button" class="pc-art" data-art="${esc(id)}"><span class="art-col">${esc(t(A.column === "headstart" ? "headStart" : "fromTeam"))}</span><b>${esc(L.title)}</b><span>${esc(L.dek)}</span><small>${esc(t("readMins", { n: A.mins }))}</small></button>`;
  }

  function hero() {
    const name = ctx.FB.profile && ctx.FB.profile.name ? ", " + ctx.FB.profile.name : "";
    const days = Math.max(0, Math.ceil((Date.UTC(2026, 11, 31, 18) - Date.now()) / 864e5));
    return `<div class="disc-hero mini"><p class="hi">${esc(ctx.greeting() + name)}</p><div class="hero-row">
      <button type="button" class="hero-chip" data-go="wallet"><small>TLPR</small><b data-tlpr="px">—</b><span data-tlpr="chg"></span></button>
      <div class="hero-count"><b>${days}</b><span>${esc(t("untilPay", { n: days }))}</span></div></div></div>`;
  }
  function renderDiscover() {
    $$("#ftabs [data-f]").forEach(b => b.setAttribute("aria-selected", b.dataset.f === filter ? "true" : "false"));
    const box = $("#discoverBody");
    if (!box.querySelector("#feedList")) box.innerHTML = `<div class="ptr" id="ptr" aria-hidden="true"><img src="icon.svg" alt=""><span></span></div><div id="feedTop"></div><div id="feedList" class="tl"></div><div id="feedMore" class="tl-more"></div>`;
    $("#feedTop").innerHTML = filter === "foryou" ? hero() : "";
    document.dispatchEvent(new CustomEvent("tlpr:tick"));
    if (!ready) { $("#feedList").innerHTML = `<p class="empty">${esc(t("loading"))}</p>`; load(); return; }
    list = timeline(filter); shown = 0; $("#feedList").innerHTML = ""; more("#feedList");
    side();
  }
  function more(sel) {
    const box = $(sel); if (!box) return;
    const next = list.slice(shown, shown + PAGE); shown += next.length;
    box.insertAdjacentHTML("beforeend", next.map(p => card(p)).join("") || (shown ? "" : `<p class="empty">${esc(t("fNoPosts"))}</p>`));
    const m = box.nextElementSibling; if (m && m.classList.contains("tl-more")) m.dataset.more = shown < list.length ? "1" : "";
  }
  const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && e.target.dataset.more === "1") more("#" + e.target.previousElementSibling.id);
  }), { rootMargin: "600px" }) : null;
  function observeMore() { if (io) $$(".tl-more").forEach(m => io.observe(m)); }

  /* ---------- Channels ---------- */
  function renderChannels() {
    if (!ready) { $("#chBody").innerHTML = `<p class="empty">${esc(t("loading"))}</p>`; load(); return; }
    const subs = prefs.subs.map(h => ACC.get(h)).filter(Boolean);
    $("#subsRow").innerHTML = subs.map(a => `<a href="#@${a.handle}" data-acct="${a.handle}" class="sr-i">${avatar(a)}<small>${esc(loc(a.name))}</small></a>`).join("")
      || `<p class="small pad">${esc(t("fNoSubs"))}</p>`;
    $$("#chSeg [data-ch]").forEach(b => b.setAttribute("aria-pressed", b.dataset.ch === chView ? "true" : "false"));
    $("#chSubsN").textContent = subs.length;
    const body = $("#chBody");
    if (chView === "posts") {
      body.innerHTML = `<div id="chList" class="tl"></div><div class="tl-more" id="chMore"></div>`;
      list = timeline("subs"); shown = 0; more("#chList"); observeMore();
      if (!subs.length) $("#chList").innerHTML = `<p class="empty">${esc(t("fNoSubs"))}</p>`;
    } else if (chView === "list") {
      const sugg = Array.from(ACC.values()).filter(a => !S.subs.has(a.handle)).sort((a, b) => (b.verified - a.verified) || b.followers - a.followers).slice(0, 12);
      body.innerHTML = `<div class="acc-list">${subs.map(accRow).join("")}</div><h2 class="list-h">${esc(t("fSuggested"))}</h2><div class="acc-list">${sugg.map(accRow).join("")}</div>`;
    } else {
      body.innerHTML = `<div id="svList" class="tl"></div><div class="tl-more"></div>`;
      list = timeline("saved"); shown = 0; more("#svList");
      if (!list.length) $("#svList").innerHTML = `<p class="empty">${esc(t("fNoSaved"))}</p>`;
    }
  }
  function subBtn(a, big) {
    const on = S.subs.has(a.handle);
    return `<button type="button" class="sub-btn${on ? " on" : ""}${big ? " big" : ""}" data-sub="${a.handle}" aria-pressed="${on}"><span class="s-on">${esc(t("fSubscribed"))}</span><span class="s-off">${esc(t("fSubscribe"))}</span><span class="s-un">${esc(t("fUnsub"))}</span></button>`;
  }
  function accRow(a) {
    return `<div class="acc-row"><a href="#@${a.handle}" data-acct="${a.handle}" class="acc-a">${avatar(a)}<span class="acc-t"><span class="pc-name">${nameLine(a)}</span><small>@${a.handle} · ${esc(t("fFollowers", { n: compact(subCount(a)) }))}</small><span class="acc-bio">${esc(loc(a.bio))}</span></span></a>${subBtn(a)}</div>`;
  }
  function findAccounts(q) {
    const s = q.replace(/^@/, "").toLowerCase(), fold = x => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");
    const fs = fold(s);
    if (!s) return [];
    return Array.from(ACC.values()).map(a => {
      const names = ["en", "ir", "ru"].map(k => a.name[k]).filter(Boolean).map(fold);
      let score = a.handle === s ? 100 : a.handle.startsWith(s) ? 60 : a.handle.includes(s) ? 40 : names.some(n => n.startsWith(fs)) ? 50 : names.some(n => n.includes(fs)) ? 30 : 0;
      return { a, score: score && score + (a.verified ? 2 : 0) + Math.log10(1 + a.followers) / 10 };
    }).filter(x => x.score).sort((x, y) => y.score - x.score).map(x => x.a);
  }
  function search(q) {
    const res = $("#chResults"), main = $("#chMain");
    q = (q || "").trim();
    if (!q) { res.hidden = true; main.hidden = false; return; }
    res.hidden = false; main.hidden = true;
    if (q[0] === "#") {
      const tag = q.slice(1).toLowerCase();
      const ps = visible().filter(p => Object.values(p.text).some(s => typeof s === "string" && s.toLowerCase().includes("#" + tag)));
      res.innerHTML = `<h2 class="list-h">#${esc(q.slice(1))}</h2><div id="tagList" class="tl"></div><div class="tl-more"></div>`;
      list = ps; shown = 0; more("#tagList");
      if (!ps.length) $("#tagList").innerHTML = `<p class="empty">${esc(t("fNoResults"))}</p>`;
      return;
    }
    const hits = findAccounts(q);
    res.innerHTML = hits.length ? `<div class="acc-list">${hits.map(accRow).join("")}</div>` : `<p class="empty">${esc(t("fNoResults"))}</p>`;
  }

  /* ---------- profile, single post ---------- */
  function openAccount(h, push = true) {
    const a = ACC.get(h);
    if (!ready) { load().then(() => openAccount(h, push)); return; }
    if (!a) { notFound(h); return; }
    if (ctx.current() !== "account" && ctx.current() !== "post") lastTab = ctx.current();
    accNow = h; go("account");
    history.replaceState(null, "", "#@" + h);
    $("#acName").innerHTML = nameLine(a);
    const ps = visible().filter(p => p.handle === h);
    $("#acCount").textContent = t("fPostsN", { n: ps.length });
    const joined = a.joined ? monthYear(a.joined) : "";
    const site = a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">🔗 ${esc(a.url.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>` : "";
    const official = h === "tulpar" ? `<button class="btn line" type="button" id="openOfficial">${esc(t(ctx.FB.admin ? "postAsTulpar" : "openChannel"))}</button>` : "";
    $("#acBody").innerHTML = `<div class="ac-banner" style="background:linear-gradient(135deg, ${esc(a.banner || "#00728c")}, #054a60)"></div>
      <div class="ac-top">${avatar(a, "xl")}${subBtn(a, true)}</div>
      <div class="ac-info"><h2>${nameLine(a)}</h2><p class="pc-h">@${a.handle}</p><p class="ac-bio">${richText(loc(a.bio))}</p>
      <p class="ac-meta">${site}${joined ? `<span>📅 ${esc(t("fJoined", { d: joined }))}</span>` : ""}</p>
      <p class="ac-meta"><b>${esc(compact(subCount(a)))}</b> ${esc(t("fFollowersW"))}${a.verified ? ` · <span class="ac-ver">${TICK} ${esc(t("fVerified"))}</span>` : ""}</p>${official}</div>
      <h2 class="list-h">${esc(t("fPosts"))}</h2><div id="acList" class="tl"></div><div class="tl-more"></div>`;
    const po = $("#openOfficial"); if (po) po.onclick = () => ctx.openRoom("official");
    list = ps; shown = 0; more("#acList"); observeMore();
    if (!ps.length) $("#acList").innerHTML = `<p class="empty">${esc(t("fNoPosts"))}</p>`;
    $("#tab-account").scrollTop = 0;
  }
  function openPost(id) {
    if (!ready) { load().then(() => openPost(id)); return; }
    let p = byId.get(id); if (!p) { toast(t("fNoPost")); return; }
    if (isChild(p)) p = byId.get(p.thread);
    if (ctx.current() !== "account" && ctx.current() !== "post") lastTab = ctx.current();
    postNow = p.id; go("post"); history.replaceState(null, "", "#post=" + encodeURIComponent(id));
    const kids = children(p);
    $("#postBody").innerHTML = card(p, { big: true, inThread: true }) + kids.map(k => card(k, { inThread: true, cls: "in-thread" })).join("")
      + (p.quote && byId.get(p.quote) ? "" : "");
    $("#tab-post").scrollTop = 0;
  }
  function back() { go(lastTab || "discover"); }

  /* ---------- subscribe links: #sub=<handle> (also #sub=@handle) ---------- */
  // The intent is kept on the device for half an hour so it survives the start-up screen (sign-in, name, install)
  // and a language switch there; the sheet shows once the screen is gone and the visitor's subscriptions are loaded.
  const PEND = "tp_pending_sub", PEND_MS = 30 * 60e3;
  const normHandle = raw => { let x = String(raw || ""); try { x = decodeURIComponent(x); } catch (e) {} return x.trim().replace(/^@+/, "").toLowerCase().slice(0, 60); };
  let pending = (() => { const p = store(PEND); return p && typeof p.h === "string" && Date.now() - (p.at || 0) < PEND_MS ? p.h : null; })();
  function subIntent(raw) {
    const h = normHandle(raw);
    if (!h) { notFound(""); return; }
    pending = h; store(PEND, { h, at: Date.now() });
    trySub();
  }
  const canShowSub = () => {
    const FB = ctx.FB;
    if (ctx.gateOpen()) return false;
    return !FB.ready || !FB.user || syncedFor === FB.user.uid;
  };
  function trySub() {
    if (!pending) return;
    if (!ready) { load(); return; }             // load() calls trySub when the channels are in
    const h = pending, a = ACC.get(h);
    gateNoteRefresh();
    if (!canShowSub()) {                       // wait, but put the channel underneath the start-up screen already
      if (a && !(ctx.current() === "account" && accNow === h)) openAccount(h);
      return;
    }
    pending = null; store(PEND, null);
    if (!a) { notFound(h); return; }
    openAccount(h);
    if (S.subs.has(h)) toast(t("fAlreadySub", { n: loc(a.name) }));
    else subSheet(a);
  }
  function subSheet(a) {
    const bio = loc(a.bio);
    ctx.dialog(`<div class="subq">
      <div class="subq-av" style="--bn:${esc(a.banner || "#00728c")}">${avatar(a, "xl")}</div>
      <h3>${esc(t("fSubAsk", { n: loc(a.name) }))}</h3>
      <p class="subq-who">${nameLine(a)} <span class="pc-h">@${a.handle}</span></p>
      ${bio ? `<p class="subq-bio">${esc(bio)}</p>` : ""}
      <p class="subq-n"><b>${esc(compact(subCount(a)))}</b> ${esc(t("fFollowersW"))}${a.verified ? ` · <span class="ac-ver">${TICK} ${esc(t("fVerified"))}</span>` : ""}</p>
      <button type="button" class="btn wide" id="subYes">${esc(t("fSubscribe"))}</button>
      <button type="button" class="btn wide line" data-dclose>${esc(t("notNow"))}</button></div>`, { noClose: true });
    $("#subYes").onclick = () => {
      ctx.closeDialog();
      if (!S.subs.has(a.handle)) toggle("subs", a.handle);
      toast(t("fSubToast", { n: loc(a.name) }));
      if (ctx.current() === "account" && accNow === a.handle) openAccount(a.handle, false);
      side();
    };
    setTimeout(() => { const b = $("#subYes"); if (b) b.focus(); }, 30);
  }
  function notFound(h) {
    const near = h ? findAccounts(h).slice(0, 3) : [];
    const shown = h.length > 30 ? h.slice(0, 30) + "…" : h;
    ctx.dialog(`<div class="subq nf"><div class="nf-ico" aria-hidden="true">${ICON.search}</div>
      <h3>${esc(t("fNotFound"))}</h3>
      <p class="small">${esc(h ? t("fNotFoundText", { h: "@" + shown }) : t("fNotFoundBare"))}</p>
      <form id="nfForm" class="nf-form" role="search"><label class="side-search">${ICON.search}<input type="search" id="nfQ" value="${esc(h)}" placeholder="${esc(t("fSearchPh"))}" aria-label="${esc(t("fSearch"))}"></label>
      <button type="submit" class="btn">${esc(t("fSearchBtn"))}</button></form>
      ${near.length ? `<h4 class="nf-h">${esc(t("fDidYouMean"))}</h4><div class="acc-list nf-list">${near.map(accRow).join("")}</div>` : ""}</div>`);
    $("#nfForm").onsubmit = e => {
      e.preventDefault(); const v = $("#nfQ").value.trim(); ctx.closeDialog();
      go("channels"); const i = $("#chSearch"); i.value = v; search(v); observeMore();
    };
    if (["discover", "chats", "channels", "services", "wallet", "profile"].includes(ctx.current())) history.replaceState(null, "", "#" + ctx.current());
  }
  // a line on the sign-in screen: "Sign in to subscribe to Jarysh"
  function gateNote() {
    if (!pending) return "";
    const a = ACC.get(pending);
    return `<p class="g-sub" id="gSub">${a ? avatar(a, "sm") : ""}<span>${esc(t("fSignInToSub", { n: a ? loc(a.name) : "@" + pending }))}</span></p>`;
  }
  function gateNoteRefresh() { const el = $("#gSub"); if (el) el.outerHTML = gateNote(); }

  /* ---------- desktop side column ---------- */
  function side() {
    const el = $("#feedSide"); if (!el || !ready) return;
    const sugg = Array.from(ACC.values()).filter(a => !S.subs.has(a.handle)).sort((a, b) => (b.verified - a.verified) || b.followers - a.followers).slice(0, 5);
    const tags = {}, since = Date.now() - 7 * 864e5;
    visible().filter(p => p.t > since).forEach(p => (loc(p.text).match(/#[\p{L}\p{N}_]{2,40}/gu) || []).forEach(x => (tags[x] = (tags[x] || 0) + 1 + p.stats.likes / 2000)));
    const top = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 6);
    el.innerHTML = `<label class="side-search">${ICON.search}<input type="search" id="sideSearch" placeholder="${esc(t("fSearchPh"))}" aria-label="${esc(t("fSearch"))}"></label>
      <div class="side-card"><h3>${esc(t("fSuggested"))}</h3>${sugg.map(a => `<div class="acc-row sm"><a href="#@${a.handle}" data-acct="${a.handle}" class="acc-a">${avatar(a)}<span class="acc-t"><span class="pc-name">${nameLine(a)}</span><small>@${a.handle}</small></span></a>${subBtn(a)}</div>`).join("")}</div>
      ${top.length ? `<div class="side-card"><h3>${esc(t("fTrending"))}</h3>${top.map(([tag]) => `<a class="trend" href="#tag=${encodeURIComponent(tag.slice(1))}" data-tag="${esc(tag.slice(1))}">${esc(tag)}<small>${esc(t("fPostsN", { n: visible().filter(p => loc(p.text).includes(tag)).length }))}</small></a>`).join("")}</div>` : ""}`;
  }

  /* ---------- re-render whatever is on screen ---------- */
  function rerender(now) {
    clearTimeout(rerenderTimer);
    const run = () => {
      const c = ctx.current(), keep = scrollOf(c);
      if (c === "discover") renderDiscover(); else if (c === "channels") { if ($("#chSearch").value.trim()) search($("#chSearch").value); else renderChannels(); }
      else if (c === "account" && accNow) openAccount(accNow, false); else if (c === "post" && postNow) openPost(postNow);
      side(); observeMore(); restore(c, keep);
    };
    if (now) run(); else rerenderTimer = setTimeout(run, 250);
  }
  const scrollOf = c => { const el = $("#tab-" + c); return el ? el.scrollTop : 0; };
  const restore = (c, y) => { const el = $("#tab-" + c); if (el && y) el.scrollTop = y; };
  function patchCard(id) {          // update the action row of every visible copy of a post
    $$(`.pc[data-pid="${CSS.escape(id)}"]`).forEach(el => {
      const p = byId.get(id); if (!p) return;
      const tmp = document.createElement("div"); tmp.innerHTML = card(p, { big: el.classList.contains("big"), inThread: el.classList.contains("in-thread") || el.classList.contains("big"), cls: el.classList.contains("in-thread") ? "in-thread" : "" });
      el.querySelector(".pc-acts").replaceWith(tmp.querySelector(".pc-acts"));
    });
  }

  /* ---------- events ---------- */
  const roomFor = p => {
    const a = ACC.get(p.handle) || {}, txt = loc(p.text);
    if (["jarysh", "aigyr", "akyel"].includes(a.handle) || /#Ulak/.test(txt)) return "horses";
    if (a.kind === "sport") return "football";
    if (a.handle === "tulpar" && /Tulparcoin|Tulpar Pay|TLPR/.test(txt)) return "tulparcoin";
    if (["neftchi", "temirjolchu", "dastgoh", "nurgaz", "chuybank", "jildiz", "iradodin"].includes(a.handle)) return "nurzhan";
    if (["kochaudio", "pochtasy"].includes(a.handle)) return "diaspora";
    if (a.kind === "culture") return "chaikhana";
    return "talas";
  };
  document.addEventListener("click", e => {
    const ac = e.target.closest("[data-acct]");
    if (ac) { e.preventDefault(); if (ac.closest("#dlg")) ctx.closeDialog(); openAccount(ac.dataset.acct); return; }
    const tg = e.target.closest("[data-tag]");
    if (tg) { e.preventDefault(); openTag(tg.dataset.tag); return; }
    const sb = e.target.closest("[data-sub]");
    if (sb) {
      const h = sb.dataset.sub, a = ACC.get(h), on = toggle("subs", h);
      toast(t(on ? "fSubToast" : "fUnsubToast", { n: loc(a.name) }));
      $$(`[data-sub="${h}"]`).forEach(b => { b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
      if (ctx.current() === "channels" && chView !== "list" && !$("#chSearch").value.trim()) renderChannels();
      if (ctx.current() === "account") { const m = $("#acBody .ac-meta b"); if (m) m.textContent = compact(subCount(a)); }
      side();
      return;
    }
    const pa = e.target.closest("[data-pact]");
    if (pa) {
      const el = pa.closest(".pc"), id = el && el.dataset.pid, p = id && byId.get(id); if (!p) return;
      const act = pa.dataset.pact;
      if (act === "like" || act === "repost" || act === "save") {
        const key = act === "like" ? "likes" : act === "repost" ? "reposts" : "saves", on = toggle(key, id);
        if (act === "repost" && on) toast(t("fReposted"));
        if (act === "save") toast(t(on ? "fSavedToast" : "fUnsavedToast"));
        patchCard(id);
        if (act === "like" && on) { const b = el.querySelector('[data-pact="like"]'); if (b) { b.classList.add("pop"); setTimeout(() => b.classList.remove("pop"), 400); } }
      } else if (act === "share") sharePost(p);
      else if (act === "reply") replyDialog(p);
      return;
    }
    const ar = e.target.closest("[data-art]");
    if (ar && ar.closest(".pc")) { e.preventDefault(); ctx.openArticle(ar.dataset.art); return; }
    const th = e.target.closest("[data-post]");
    if (th) { e.preventDefault(); openPost(th.dataset.post); return; }
    const fb = e.target.closest("[data-fback]");
    if (fb) { e.preventDefault(); back(); return; }
    const pc = e.target.closest(".pc");
    if (pc && !e.target.closest("a, button, .pc-media") && !pc.classList.contains("big") && !getSelection().toString()) openPost(pc.dataset.pid);
  });
  document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches(".pc-quote")) openPost(e.target.dataset.post); });
  document.addEventListener("error", e => {                    // images on other sites may be unreachable: drop the frame
    const img = e.target; if (!img || img.tagName !== "IMG") return;
    const m = img.closest(".pc-media, .pl-img"); if (m) { const l = m.closest(".pc-link"); m.remove(); if (l) l.classList.remove("has-img"); }
    else if (img.closest(".fav")) { const f = img.closest(".fav"); f.classList.add("ini"); f.textContent = "•"; }
  }, true);
  function sharePost(p) {
    const url = location.origin + location.pathname + "#post=" + encodeURIComponent(p.id), a = ACC.get(p.handle);
    (async () => {
      try { if (navigator.share) { await navigator.share({ title: loc(a.name), text: loc(p.text).slice(0, 120), url }); return; } } catch (e) { return; }
      try { await navigator.clipboard.writeText(url); toast(t("linkCopied")); } catch (e) { toast(url); }
    })();
  }
  function replyDialog(p) {
    const room = roomFor(p), a = ACC.get(p.handle);
    ctx.dialog(`<h3>${esc(t("fReplyTitle"))}</h3><p class="small">${esc(t("fReplyText"))}</p>
      <div class="pc-quote static"><div class="pc-head">${avatar(a, "sm")}<span class="pc-name">${nameLine(a)}</span></div><div class="pc-text">${esc(loc(p.text).slice(0, 180))}</div></div>
      <button type="button" class="btn wide" id="replyRoom">💬 ${esc(t("fDiscussIn", { r: t("room_" + room) }))}</button>`);
    $("#replyRoom").onclick = () => { ctx.closeDialog(); ctx.openRoom(room); };
  }
  function openTag(tag) {
    go("channels"); const i = $("#chSearch"); i.value = "#" + tag; search(i.value); observeMore();
    history.replaceState(null, "", "#tag=" + encodeURIComponent(tag));
  }

  // Discover filter tabs, Channels segments and search
  $("#ftabs").addEventListener("click", e => { const b = e.target.closest("[data-f]"); if (!b) return; filter = b.dataset.f; renderDiscover(); observeMore(); $("#tab-discover").scrollTop = 0; });
  $("#chSeg").addEventListener("click", e => { const b = e.target.closest("[data-ch]"); if (!b) return; chView = b.dataset.ch; renderChannels(); });
  let sTimer;
  $("#chSearch").addEventListener("input", e => { clearTimeout(sTimer); sTimer = setTimeout(() => { search(e.target.value); observeMore(); }, 120); });
  $("#chSearch").addEventListener("keydown", e => { if (e.key === "Escape") { e.target.value = ""; search(""); } });
  $("#discSearch").addEventListener("click", () => { go("channels"); setTimeout(() => $("#chSearch").focus(), 30); });
  document.addEventListener("keydown", e => {
    if (e.target.id === "sideSearch" && e.key === "Enter") { const v = e.target.value; go("channels"); const i = $("#chSearch"); i.value = v; search(v); observeMore(); }
  });
  document.addEventListener("input", e => {
    if (e.target.id !== "sideSearch") return;
    if (ctx.current() === "channels") { const i = $("#chSearch"); i.value = e.target.value; search(i.value); observeMore(); }
  });

  // pull to refresh (touch, top of Discover)
  (() => {
    const sc = $("#tab-discover"); let y0 = null, dy = 0, busy = false;
    sc.addEventListener("touchstart", e => { if (sc.scrollTop <= 0 && !busy) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
    sc.addEventListener("touchmove", e => {
      if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0);
      const p = $("#ptr"); if (!p) return;
      if (dy > 4 && sc.scrollTop <= 0) { p.style.height = Math.min(70, dy * 0.5) + "px"; p.classList.toggle("ready", dy > 110); p.querySelector("span").textContent = t(dy > 110 ? "fRelease" : "fPull"); p.querySelector("img").style.transform = `rotate(${dy * 1.5}deg)`; }
    }, { passive: true });
    sc.addEventListener("touchend", () => {
      const p = $("#ptr"); if (y0 === null || !p) return; y0 = null;
      if (dy > 110) { busy = true; p.classList.add("busy"); p.style.height = "52px"; p.querySelector("span").textContent = t("fRefreshing");
        Promise.all([refresh(), new Promise(r => setTimeout(r, 700))]).finally(() => { busy = false; p.classList.remove("busy", "ready"); p.style.height = "0"; });
      } else { p.style.height = "0"; p.classList.remove("ready"); }
    });
  })();

  // keep relative times fresh
  setInterval(() => $$(".pc time[datetime]").forEach(el => { el.textContent = ago(Date.parse(el.getAttribute("datetime"))); }), 60e3);

  return {
    load, refresh, onAuth, openAccount, openPost, openTag, back, gateNote,
    gateClosed: trySub, hasPending: () => !!pending,
    renderDiscover: () => { renderDiscover(); observeMore(); }, renderChannels: () => { renderChannels(); observeMore(); },
    navFor: () => lastTab === "channels" ? "channels" : "discover",
    handleHash(h) {
      let m;
      if ((m = h.match(/^#sub=(.*)$/i))) { subIntent(m[1]); return true; }
      if ((m = h.match(/^#(?:@|%40)([A-Za-z0-9_]{2,24})$/))) { openAccount(m[1].toLowerCase()); return true; }
      if ((m = h.match(/^#post=([\w.-]{1,120})$/))) { openPost(decodeURIComponent(m[1])); return true; }
      if ((m = h.match(/^#tag=(.{1,80})$/))) { openTag(decodeURIComponent(m[1])); return true; }
      return false;
    }
  };
}
