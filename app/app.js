/* Tulpar web app. Chat runs on Firebase (Auth + Firestore) when app/firebase-config.js is filled in;
   everything else works without it. Text lives in i18n.js. */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const T = window.TULPAR || {};
const LANG = document.documentElement.getAttribute("data-lang") || "en";
const LOCALE = { en: "en-GB", ir: "ky-KG", ru: "ru-RU" }[LANG] || "en-GB";
const STR = window.TP_STR || { en: {} };
function t(k, vars) {
  let s = (STR[LANG] && STR[LANG][k]) || STR.en[k] || k;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, v) => (v in vars ? vars[v] : m));
  return s;
}

const ROOMS = [
  { id: "talas", e: "🏙️" }, { id: "nurzhan", e: "🏭" }, { id: "valleys", e: "⛰️" }, { id: "horses", e: "🐎" },
  { id: "football", e: "⚽" }, { id: "diaspora", e: "✈️" }, { id: "tulparcoin", e: "🪙" }, { id: "chaikhana", e: "🫖" }
];
const roomName = id => t("room_" + id), roomDesc = id => t("roomd_" + id);
const STICKERS = ["salam", "rahmat", "jakshi", "kosh", "chai", "nan", "kalpak", "horse_love", "tlpr_up", "tlpr_down", "jailoo", "gol", "bee", "marshrutka", "haha", "bilbeim"];
const REACT = { like: "👍", heart: "❤️", laugh: "😂", wow: "😮", sad: "😢", horse: "🐎" };
const FILTER = /\b(fuck\w*|shit\w*|cunt\w*|nigg\w*|fagg?ot\w*|бля\w*|сук[аи]\w*|хуй\w*|пизд\w*|еба\w*)\b/giu;
const SOM = 8.4;

/* ---------- helpers ---------- */
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function clean(s) { FILTER.lastIndex = 0; return String(s).replace(FILTER, m => m[0] + "•".repeat(Math.max(2, m.length - 1))); }
let toastTimer;
function toast(s) { const el = $("#toast"); el.textContent = s; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.hidden = true), 3200); }
function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
function hhmm(d) { return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
function dayLabel(d) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  const diff = Math.round((today - x) / 864e5);
  if (diff === 0) return t("today");
  if (diff === 1) return t("yesterday");
  return fmtD(d, { day: "numeric", month: "long" });
}
function fmtD(d, o) {
  if (LANG !== "ir") return d.toLocaleDateString(LOCALE, o);
  const utc = o.timeZone === "UTC", S = (window.TULPAR_STR || {}).ir || {};
  const day = utc ? d.getUTCDate() : d.getDate(), mo = utc ? d.getUTCMonth() : d.getMonth(), y = utc ? d.getUTCFullYear() : d.getFullYear(), wd = utc ? d.getUTCDay() : d.getDay();
  const months = (o.month === "short" ? S.monthsShort : S.monthsLong) || [];
  let out = "";
  if (o.day) out = day + "-" + (months[mo] || "");
  if (o.year) out += " " + y;
  if (o.weekday) { const w = (STR.ir[o.weekday === "short" ? "wdShort" : "wdLong"] || "").split(",")[wd] || ""; out = o.day ? out + ", " + w : w; }
  return out.trim();
}
function fmtWhen(d) { return isNaN(d) ? "" : fmtD(d, { day: "numeric", month: "long" }) + ", " + hhmm(d); }
function tsDate(x) { return x && x.toDate ? x.toDate() : (x instanceof Date ? x : null); }
function tsMs(x) { const d = tsDate(x); return d ? d.getTime() : 0; }
function num(n, dp = 2) { return Number(n).toLocaleString(LOCALE, { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
function preview(m) {
  if (m.sticker) return t("stickerPreview");
  if (m.poll) return "📊 " + m.poll.q;
  return m.text || "";
}
function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
}

/* ---------- static text ---------- */
function applyStatic() {
  $$("[data-t]").forEach(el => (el.textContent = t(el.dataset.t)));
  $$("[data-ta]").forEach(el => el.setAttribute("aria-label", t(el.dataset.ta)));
  $$("[data-tp]").forEach(el => el.setAttribute("placeholder", t(el.dataset.tp)));
  $$("#langSeg [data-lang]").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === LANG ? "true" : "false"));
}
$("#langSeg").addEventListener("click", e => {
  const b = e.target.closest("[data-lang]"); if (!b || b.dataset.lang === LANG) return;
  store("tp_lang", b.dataset.lang); location.hash = "profile"; location.reload();
});

/* ---------- navigation ---------- */
let current = "chats";
function go(tab) {
  current = tab;
  $$(".tab").forEach(s => (s.hidden = s.dataset.tab !== tab));
  const navTab = tab === "room" ? "chats" : tab === "svc" ? "services" : tab;
  $$(".tabs button").forEach(b => { if (b.dataset.go === navTab) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  if (tab !== "room") { stopConv(); hideTray(); conv = null; }
  if (tab === "channels") loadFeed(feedNow);
  if (tab === "services") renderServices();
  if (tab === "wallet") drawWallet();
  if (tab === "profile") renderProfile();
  if (tab === "chats") renderChats();
  if (tab !== "room" && tab !== "svc") history.replaceState(null, "", "#" + tab);
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-go]");
  if (b) { e.preventDefault(); go(b.dataset.go); }
});

/* ---------- Firebase (optional) ---------- */
const FB = { ready: false, user: null, profile: null, admin: false };
const CFG = window.TULPAR_FIREBASE;
const V = "10.12.2";
async function initFirebase() {
  if (!CFG && !window.__TP_FAKE) { setBanner(t("chatSetup")); return; }
  showGate("splash");
  try {
    const [{ initializeApp }, A, F] = window.__TP_FAKE ? window.__TP_FAKE.modules() : await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`)
    ]);
    const app = initializeApp(CFG);
    FB.A = A; FB.F = F; FB.auth = A.getAuth(app); FB.db = F.getFirestore(app); FB.ready = true;
    A.onAuthStateChanged(FB.auth, async user => {
      FB.user = user; FB.profile = null; FB.admin = false;
      stopDMs();
      if (user) {
        try {
          const p = await F.getDoc(F.doc(FB.db, "users", user.uid));
          FB.profile = p.exists() ? p.data() : null;
          const a = await F.getDoc(F.doc(FB.db, "admins", user.uid));
          FB.admin = a.exists();
        } catch (e) { console.warn(e); }
        if (FB.profile) startDMs();
      }
      updateComposer(); renderChats();
      gateFromState();
      if (current === "profile") renderProfile();
      if (current === "room" && conv) reopenConv();
      if (current === "channels" && feedNow === "official") loadFeed("official");
      handleDeepLink();
    });
    setBanner("");
  } catch (e) {
    console.error(e);
    setBanner(t("chatOffline"));
    hideGate();
  }
}
function setBanner(s) { const b = $("#chatBanner"); b.textContent = s; b.hidden = !s; }

/* ---------- chats list ---------- */
let dmDocs = [], dmUnsub = null, dmFirst = true;
function renderChats() {
  $("#roomList").innerHTML = ROOMS.map(r =>
    `<li><button type="button" data-room="${r.id}"><span class="ava">${r.e}</span><span class="txt"><b>${esc(roomName(r.id))}</b><small>${esc(roomDesc(r.id))}</small></span></button></li>`
  ).join("");
  const sec = $("#dmSection"), me = FB.user && FB.user.uid;
  $("#newChatBtn").hidden = !(FB.ready && FB.profile);
  if (!me || !FB.profile) { sec.hidden = true; updateBadge(); return; }
  const blocked = store("tp_blocked") || [], seen = store("tp_seen") || {};
  const list = dmDocs.filter(d => !blocked.includes(otherOf(d))).sort((a, b) => tsMs(b.updatedAt) - tsMs(a.updatedAt));
  sec.hidden = false;
  $("#dmList").innerHTML = list.length ? list.map(d => {
    const o = otherOf(d), nm = (d.names && d.names[o]) || "…", last = d.last || {};
    const unread = isUnread(d, seen), when = tsDate(last.at);
    return `<li><button type="button" data-dm="${esc(o)}" data-dmname="${esc(nm)}" class="${unread ? "unread" : ""}"><span class="ava ini">${esc(initials(nm))}</span>
      <span class="txt"><b>${esc(nm)}</b><small>${last.uid === me ? esc(t("you")) + ": " : ""}${esc(clean(last.text || ""))}</small></span>
      <span class="meta">${when ? esc(sameDay(when) ? hhmm(when) : fmtD(when, { day: "numeric", month: "short" })) : ""}${unread ? '<i class="dot"></i>' : ""}</span></button></li>`;
  }).join("") : `<li class="empty-li">${esc(t("noDMs"))}</li>`;
  updateBadge();
}
function sameDay(d) { const n = new Date(); return d.toDateString() === n.toDateString(); }
function initials(n) { return String(n).trim().split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase() || "?"; }
function otherOf(d) { const me = FB.user && FB.user.uid; return (d.members || []).find(x => x !== me) || me; }
function isUnread(d, seen) { const l = d.last; return l && l.uid !== FB.user.uid && tsMs(l.at) > ((seen || store("tp_seen") || {})[d.id] || 0); }
function updateBadge() {
  const b = $("#chatBadge");
  if (!FB.user || !FB.profile) { b.hidden = true; return; }
  const seen = store("tp_seen") || {}, blocked = store("tp_blocked") || [];
  const n = dmDocs.filter(d => !blocked.includes(otherOf(d)) && isUnread(d, seen)).length;
  b.hidden = !n; b.textContent = n > 9 ? "9+" : n;
}
function markSeen(id) { const s = store("tp_seen") || {}; s[id] = Date.now() + 1000; store("tp_seen", s); }

function startDMs() {
  const F = FB.F; dmFirst = true;
  dmUnsub = F.onSnapshot(F.query(F.collection(FB.db, "dms"), F.where("members", "array-contains", FB.user.uid)), snap => {
    const prev = new Map(dmDocs.map(d => [d.id, tsMs(d.last && d.last.at)]));
    dmDocs = snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) }));
    if (!dmFirst) dmDocs.forEach(d => {
      const at = tsMs(d.last && d.last.at);
      if (d.last && d.last.uid !== FB.user.uid && at > (prev.get(d.id) || 0)) notifyDM(d);
    });
    dmFirst = false;
    if (conv && conv.kind === "dm") markSeen(conv.id);
    if (current === "chats") renderChats(); else updateBadge();
  }, err => console.warn(err));
}
function stopDMs() { if (dmUnsub) { dmUnsub(); dmUnsub = null; } dmDocs = []; }
function notifyDM(d) {
  const blocked = store("tp_blocked") || [], o = otherOf(d);
  if (blocked.includes(o)) return;
  const viewing = current === "room" && conv && conv.id === d.id && !document.hidden;
  if (viewing) return;
  const nm = (d.names && d.names[o]) || "Tulpar", body = clean(d.last.text || "");
  if (!document.hidden) toast(t("newMsgFrom", { n: nm }));
  if (document.hidden && store("tp_notify") && "Notification" in window && Notification.permission === "granted" && navigator.serviceWorker) {
    navigator.serviceWorker.ready.then(r => r.showNotification(nm, { body, icon: "icon-192.png", tag: d.id, data: { url: location.pathname + "#u=" + o } })).catch(() => {});
  }
}

$("#roomList").addEventListener("click", e => { const b = e.target.closest("[data-room]"); if (b) openRoom(b.dataset.room); });
$("#dmList").addEventListener("click", e => { const b = e.target.closest("[data-dm]"); if (b) openDM(b.dataset.dm, b.dataset.dmname); });

/* ---------- conversations ---------- */
let conv = null, unsub = null, lastMsgs = [], replyTo = null;
function stopConv() { if (unsub) { unsub(); unsub = null; } }
function msgCol() { const F = FB.F; return conv.kind === "dm" ? F.collection(FB.db, "dms", conv.id, "messages") : F.collection(FB.db, "rooms", conv.id, "messages"); }
function openRoom(id) {
  const official = id === "official";
  conv = { kind: "room", id, name: official ? "Tulpar" : roomName(id), desc: official ? t("officialDesc") : roomDesc(id) };
  showConv();
}
async function openDM(other, name) {
  if (!FB.ready || !FB.user) { toast(t("signInToDM")); go("profile"); return; }
  if (!FB.profile) { toast(t("profileToDM")); go("profile"); return; }
  const me = FB.user.uid;
  if (other === me) { toast(t("cantDMSelf")); return; }
  const F = FB.F;
  try {
    if (!name) {
      const p = await F.getDoc(F.doc(FB.db, "users", other));
      if (!p.exists()) { toast(t("noSuchUser")); return; }
      name = p.data().name;
    }
    const id = [me, other].sort().join("_");
    const d = await F.getDoc(F.doc(FB.db, "dms", id));
    conv = { kind: "dm", id, other, name, exists: d.exists() };
    markSeen(id); showConv();
  } catch (e) { console.warn(e); toast(t("tryAgain")); }
}
function showConv() {
  $("#roomName").textContent = conv.name; $("#roomDesc").textContent = conv.kind === "dm" ? t("privateChat") : conv.desc;
  $("#roomPinned").textContent = conv.kind === "dm" ? t("pinnedDM") : t("pinned");
  $("#msgs").dataset.init = ""; clearReply();
  go("room"); updateComposer(); reopenConv();
}
function reopenConv() {
  if (!FB.ready) { lastMsgs = []; renderMsgs(); return; }
  if (conv.kind === "dm" && (!FB.user || !FB.user.uid || !conv.id.split("_").includes(FB.user.uid))) { go("chats"); return; }
  $("#msgs").innerHTML = `<p class="empty">${esc(t("loading"))}</p>`;
  const F = FB.F;
  stopConv();
  unsub = F.onSnapshot(F.query(msgCol(), F.orderBy("createdAt"), F.limitToLast(100)), snap => {
    lastMsgs = snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) }));
    if (conv.kind === "dm") { conv.exists = conv.exists || lastMsgs.length > 0; markSeen(conv.id); updateBadge(); }
    renderMsgs();
  }, err => { console.error(err); $("#msgs").innerHTML = `<p class="empty">${esc(t("loadFail"))}</p>`; });
}

/* room history from seed.js, shown before live messages */
const seedCache = {};
function seedMsgs(room) {
  if (seedCache[room]) return seedCache[room];
  const src = (window.TP_SEED || {})[room] || [];
  const out = src.map((m, i) => {
    const o = { id: `seed-${room}-${i}`, seed: true, uid: "seed:" + m.u, name: m.u, createdAt: new Date(m.at + ":00+06:00") };
    if (m.t !== undefined) o.text = m.t; else if (m.s) o.sticker = m.s;
    else if (m.poll) { o.poll = { q: m.poll.q, opts: m.poll.opts }; o.v = {}; let k = 0; m.poll.votes.forEach((n, j) => { for (let x = 0; x < n; x++) o.v["s" + k++] = j; }); }
    if (m.r) { o.r = {}; let k = 0; for (const key in m.r) for (let x = 0; x < m.r[key]; x++) o.r["s" + k++] = key; }
    return o;
  });
  src.forEach((m, i) => { if (m.re !== undefined && out[m.re]) out[i].replyTo = { id: out[m.re].id, name: out[m.re].name, text: preview(out[m.re]).slice(0, 140) }; });
  return (seedCache[room] = out);
}
let shownMsgs = [];
function renderMsgs() {
  const box = $("#msgs"), atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  const blocked = store("tp_blocked") || [];
  const mine = FB.user && FB.user.uid, isDM = conv.kind === "dm";
  let lastDay = "", html = "";
  shownMsgs = (conv.kind === "room" && conv.id !== "official" ? seedMsgs(conv.id) : []).concat(lastMsgs);
  shownMsgs.filter(m => !blocked.includes(m.uid)).forEach(m => {
    const d = tsDate(m.createdAt) || new Date(), dl = dayLabel(d);
    if (dl !== lastDay) { html += `<div class="day">${esc(dl)}</div>`; lastDay = dl; }
    const me = m.uid === mine, name = m.name || (me ? "" : conv.name);
    let body = "";
    if (m.replyTo) body += `<div class="quote"><b>${esc(m.replyTo.name)}</b><span>${esc(clean(m.replyTo.text))}</span></div>`;
    if (m.sticker) body += `<img class="stk" src="stickers/${esc(m.sticker)}.svg" alt="${esc(t("stk_" + m.sticker))}" width="140" height="140">`;
    else if (m.poll) body += pollHTML(m);
    else body += `<span class="txt">${esc(clean(m.text || ""))}</span>`;
    const cls = ["msg", me ? "me" : "", m.admin ? "admin" : "", m.sticker ? "sticker" : "", m.poll ? "pollmsg" : ""].filter(Boolean).join(" ");
    html += `<div class="${cls}" data-id="${esc(m.id)}" data-uid="${esc(m.uid)}" data-name="${esc(name)}" tabindex="0">` +
      (me || isDM ? "" : `<span class="who">${esc(name)}</span>`) + body + `<time>${hhmm(d)}</time>` + reactHTML(m) + `</div>`;
  });
  box.innerHTML = html || `<p class="empty">${esc(t(isDM ? "dmEmpty" : "roomEmpty"))}</p>`;
  if (atBottom || !box.dataset.init) { box.scrollTop = box.scrollHeight; box.dataset.init = "1"; }
}
function pollHTML(m) {
  const votes = m.v || {}, mine = FB.user && votes[FB.user.uid];
  const counts = m.poll.opts.map((_, i) => Object.values(votes).filter(x => x === i).length);
  const total = counts.reduce((a, b) => a + b, 0);
  return `<div class="poll"><b class="pq">📊 ${esc(clean(m.poll.q))}</b>` + m.poll.opts.map((o, i) => {
    const pct = total ? Math.round(counts[i] * 100 / total) : 0;
    return `<button type="button" class="opt${mine === i ? " picked" : ""}" data-vote="${i}"><span class="fill" style="width:${pct}%"></span><span class="ol">${esc(clean(o))}</span><span class="oc">${total ? pct + "%" : ""}</span></button>`;
  }).join("") + `<small class="pt">${esc(total === 1 && LANG === "en" ? "1 vote" : t("votes", { n: total }))}</small></div>`;
}
function reactHTML(m) {
  const r = m.r || {}, mine = FB.user && r[FB.user.uid], tally = {};
  Object.values(r).forEach(k => { if (REACT[k]) tally[k] = (tally[k] || 0) + 1; });
  const keys = Object.keys(REACT).filter(k => tally[k]);
  if (!keys.length) return "";
  return `<div class="rx">` + keys.map(k => `<button type="button" class="rxb${mine === k ? " on" : ""}" data-react="${k}">${REACT[k]} ${tally[k]}</button>`).join("") + `</div>`;
}

function updateComposer() {
  const off = $("#composerOff"), form = $("#composer");
  let msg = "";
  if (!FB.ready) msg = esc(t("chatSetupShort"));
  else if (!FB.user) msg = `${esc(t("signInToPost"))} <button class="btn" type="button" data-go="profile">${esc(t("signIn"))}</button>`;
  else if (!FB.profile) msg = `${esc(t("nameToPost"))} <button class="btn" type="button" data-go="profile">${esc(t("setUpProfile"))}</button>`;
  else if (FB.profile.banned) msg = esc(t("banned"));
  else if (conv && conv.id === "official" && !FB.admin) msg = esc(t("onlyTulpar"));
  off.innerHTML = msg; off.hidden = !msg; form.hidden = !!msg;
  if (msg) { hideTray(); $("#replyBar").hidden = true; }
}

/* sending */
let sending = false;
async function sendContent(content) {
  if (sending || !FB.profile || !conv) return false;
  sending = true; $(".send").disabled = true;
  const F = FB.F, uid = FB.user.uid;
  try {
    const batch = F.writeBatch(FB.db);
    const ref = F.doc(msgCol());
    const data = { uid, ...content, createdAt: F.serverTimestamp() };
    if (replyTo) data.replyTo = replyTo;
    if (conv.kind === "room") { data.name = FB.profile.name; if (FB.admin) data.admin = true; }
    batch.set(ref, data);
    batch.update(F.doc(FB.db, "users", uid), { lastPostAt: F.serverTimestamp() });
    if (conv.kind === "dm") {
      const last = { uid, text: preview(content).slice(0, 80), at: F.serverTimestamp() };
      const dref = F.doc(FB.db, "dms", conv.id);
      if (conv.exists) batch.update(dref, { last, updatedAt: F.serverTimestamp() });
      else batch.set(dref, { members: [uid, conv.other].sort(), names: { [uid]: FB.profile.name, [conv.other]: conv.name }, last, updatedAt: F.serverTimestamp() });
    }
    await batch.commit();
    if (conv.kind === "dm") conv.exists = true;
    clearReply();
    return true;
  } catch (err) {
    console.warn(err);
    if (conv.kind === "dm" && !conv.exists && String(err.code || "").includes("permission")) {
      // someone else may have created the chat in the meantime
      try { const d = await F.getDoc(F.doc(FB.db, "dms", conv.id)); conv.exists = d.exists(); } catch (e) {}
    }
    toast(String(err.code || "").includes("permission") ? t("slowDown") : t("notSent"));
    return false;
  } finally { sending = false; $(".send").disabled = false; }
}
$("#composer").addEventListener("submit", async e => {
  e.preventDefault();
  const input = $("#msgInput"), text = input.value.trim();
  if (!text) return;
  if (await sendContent({ text: text.slice(0, 500) })) input.value = "";
  input.focus();
});

/* reply */
function setReply(m) {
  replyTo = { id: m.id, name: (m.name || (FB.user && m.uid === FB.user.uid ? FB.profile.name : conv.name) || "").slice(0, 24), text: preview(m).slice(0, 140) };
  $("#replyName").textContent = replyTo.name; $("#replyText").textContent = clean(replyTo.text);
  $("#replyBar").hidden = false; $("#msgInput").focus();
}
function clearReply() { replyTo = null; $("#replyBar").hidden = true; }
$("#replyCancel").addEventListener("click", clearReply);

/* stickers */
function hideTray() { $("#stickerTray").hidden = true; }
$("#stickerBtn").addEventListener("click", () => {
  const tray = $("#stickerTray");
  if (!tray.innerHTML) tray.innerHTML = STICKERS.map(s => `<button type="button" data-stk="${s}" aria-label="${esc(t("stk_" + s))}"><img src="stickers/${s}.svg" alt="" width="72" height="72" loading="lazy"></button>`).join("");
  tray.hidden = !tray.hidden;
});
$("#stickerTray").addEventListener("click", async e => {
  const b = e.target.closest("[data-stk]"); if (!b) return;
  if (await sendContent({ sticker: b.dataset.stk })) hideTray();
});

/* plus menu: poll (rooms), QR (private chats) */
$("#plusBtn").addEventListener("click", () => {
  if (conv.kind === "dm") { dialog(`<h3>${esc(conv.name)}</h3><button type="button" class="dl-opt" data-dact="stickers">😊 ${esc(t("stickers"))}</button><button type="button" class="dl-opt" data-dact="myqr">🔳 ${esc(t("myQR"))}</button>`); return; }
  dialog(`<h3>${esc(t("addToChat"))}</h3><button type="button" class="dl-opt" data-dact="poll">📊 ${esc(t("newPoll"))}</button><button type="button" class="dl-opt" data-dact="stickers">😊 ${esc(t("stickers"))}</button>`);
});

/* message tap: votes, reactions, actions sheet */
let sheetMsg = null;
$("#msgs").addEventListener("click", e => {
  const vote = e.target.closest("[data-vote]"), rx = e.target.closest("[data-react]");
  const m = e.target.closest(".msg"); if (!m) return;
  const msg = shownMsgs.find(x => x.id === m.dataset.id); if (!msg) return;
  if (msg.seed && vote) { toast(t("pollClosed")); return; }
  if (msg.seed && rx) return;
  if (vote) { castVote(msg, +vote.dataset.vote); return; }
  if (rx) { react(msg, rx.dataset.react); return; }
  openSheet(msg, m.dataset.name);
});
function needProfile() {
  if (!FB.ready) { toast(t("chatSetupShort")); return false; }
  if (!FB.user || !FB.profile) { toast(t("signInToReact")); return false; }
  if (FB.profile.banned) { toast(t("banned")); return false; }
  return true;
}
async function react(msg, key) {
  if (!needProfile()) return;
  const F = FB.F, uid = FB.user.uid, cur = (msg.r || {})[uid];
  try { await F.updateDoc(F.doc(msgCol(), msg.id), { ["r." + uid]: cur === key ? F.deleteField() : key }); }
  catch (e) { console.warn(e); toast(t("tryAgain")); }
}
async function castVote(msg, i) {
  if (!needProfile()) return;
  const F = FB.F, uid = FB.user.uid, cur = (msg.v || {})[uid];
  try { await F.updateDoc(F.doc(msgCol(), msg.id), { ["v." + uid]: cur === i ? F.deleteField() : i }); }
  catch (e) { console.warn(e); toast(t("tryAgain")); }
}
function openSheet(msg, name) {
  sheetMsg = { ...msg, name };
  const mine = FB.user && msg.uid === FB.user.uid, isDM = conv.kind === "dm", canAct = FB.ready && FB.user && FB.profile;
  $("#sheetWho").textContent = mine ? t("yourMessage") : name;
  $("#reactRow").innerHTML = Object.entries(REACT).map(([k, e]) => `<button type="button" data-rk="${k}" class="${(msg.r || {})[FB.user && FB.user.uid] === k ? "on" : ""}" aria-label="${esc(t("react_" + k))}">${e}</button>`).join("");
  $("#reactRow").hidden = !canAct || !!msg.seed;
  const show = (act, on) => ($(`#sheet [data-act="${act}"]`).hidden = !on);
  show("reply", canAct && !(conv.id === "official" && !FB.admin));
  show("dm", canAct && !isDM && !mine && conv.id !== "official" && !msg.seed);
  show("copy", !!msg.text);
  show("report", !mine && FB.ready && !msg.seed);
  show("block", !mine);
  show("delete", FB.ready && !msg.seed && (mine || (FB.admin && !isDM)));
  show("ban", FB.admin && !mine && !isDM && !msg.seed);
  $("#sheet").hidden = false;
}
$("#sheet").addEventListener("click", async e => {
  if (e.target.closest("[data-close]")) { $("#sheet").hidden = true; return; }
  const rk = e.target.closest("[data-rk]");
  if (rk && sheetMsg) { $("#sheet").hidden = true; react(sheetMsg, rk.dataset.rk); return; }
  const b = e.target.closest("[data-act]"); if (!b || !sheetMsg) return;
  $("#sheet").hidden = true;
  const F = FB.F, act = b.dataset.act;
  try {
    if (act === "reply") setReply(sheetMsg);
    else if (act === "dm") openDM(sheetMsg.uid, sheetMsg.name);
    else if (act === "copy") { await navigator.clipboard.writeText(sheetMsg.text); toast(t("copied")); }
    else if (act === "block") {
      const list = store("tp_blocked") || []; if (!list.includes(sheetMsg.uid)) list.push(sheetMsg.uid); store("tp_blocked", list);
      renderMsgs(); toast(t("hidden", { n: sheetMsg.name }));
    } else if (act === "report") {
      if (!FB.user || !FB.profile) { toast(t("signInToReport")); return; }
      await F.addDoc(F.collection(FB.db, "reports"), {
        room: conv.kind === "dm" ? "dm" : conv.id, msgId: sheetMsg.id, msgUid: sheetMsg.uid, msgName: (sheetMsg.name || "").slice(0, 24),
        text: preview(sheetMsg).slice(0, 500), reporter: FB.user.uid, createdAt: F.serverTimestamp()
      });
      toast(t("reported"));
    } else if (act === "delete") {
      await F.deleteDoc(F.doc(msgCol(), sheetMsg.id)); toast(t("deleted"));
    } else if (act === "ban") {
      await F.updateDoc(F.doc(FB.db, "users", sheetMsg.uid), { banned: true }); toast(t("bannedDone", { n: sheetMsg.name }));
    }
  } catch (err) { console.warn(err); toast(t("didntWork")); }
});

/* ---------- dialog (new chat, poll, QR, scanner) ---------- */
let scanStop = null;
function dialog(html) { $("#dlgCard").innerHTML = html + `<button type="button" class="dl-cancel" data-dclose>${esc(t("close"))}</button>`; $("#dlg").hidden = false; }
function closeDialog() { $("#dlg").hidden = true; if (scanStop) { scanStop(); scanStop = null; } }
$("#dlg").addEventListener("click", e => {
  if (e.target.closest("[data-dclose]")) { closeDialog(); return; }
  const a = e.target.closest("[data-dact]"); if (!a) return;
  const act = a.dataset.dact;
  if (act === "poll") pollDialog();
  else if (act === "stickers") { closeDialog(); $("#stickerBtn").click(); }
  else if (act === "myqr") qrDialog();
  else if (act === "scan") scanDialog();
  else if (act === "byid") {
    const v = ($("#idIn").value || "").trim().replace(/^.*#u=/, "");
    if (!/^[A-Za-z0-9]{6,64}$/.test(v)) { toast(t("badId")); return; }
    closeDialog(); openDM(v);
  } else if (act === "addopt") {
    const box = $("#pollOpts"); if (box.children.length >= 4) return;
    box.insertAdjacentHTML("beforeend", `<input maxlength="60" class="popt" placeholder="${esc(t("option", { n: box.children.length + 1 }))}">`);
    if (box.children.length >= 4) a.hidden = true;
  } else if (act === "sendpoll") {
    const q = $("#pollQ").value.trim(), opts = $$(".popt").map(i => i.value.trim()).filter(Boolean);
    if (!q || opts.length < 2) { toast(t("pollNeeds")); return; }
    closeDialog(); sendContent({ poll: { q: q.slice(0, 140), opts: opts.slice(0, 4).map(o => o.slice(0, 60)) } });
  } else if (act === "share") {
    const url = myLink();
    if (navigator.share) navigator.share({ title: "Tulpar", text: t("shareText"), url }).catch(() => {});
    else navigator.clipboard.writeText(url).then(() => toast(t("linkCopied")));
  } else if (act === "copyid") navigator.clipboard.writeText(FB.user.uid).then(() => toast(t("copied")));
});
$("#newChatBtn").addEventListener("click", () => {
  dialog(`<h3>${esc(t("newChat"))}</h3>
    <button type="button" class="dl-opt" data-dact="scan">📷 ${esc(t("scanQR"))}</button>
    <button type="button" class="dl-opt" data-dact="myqr">🔳 ${esc(t("myQR"))}</button>
    <label class="dl-lab">${esc(t("orEnterId"))}<input id="idIn" autocomplete="off" spellcheck="false" placeholder="${esc(t("tulparId"))}"></label>
    <button type="button" class="btn wide" data-dact="byid">${esc(t("startChat"))}</button>
    <p class="small">${esc(t("dmHint"))}</p>`);
});
function pollDialog() {
  dialog(`<h3>${esc(t("newPoll"))}</h3>
    <label class="dl-lab">${esc(t("question"))}<input id="pollQ" maxlength="140" placeholder="${esc(t("pollQEx"))}"></label>
    <div id="pollOpts"><input maxlength="60" class="popt" placeholder="${esc(t("option", { n: 1 }))}"><input maxlength="60" class="popt" placeholder="${esc(t("option", { n: 2 }))}"></div>
    <button type="button" class="btn line" data-dact="addopt">＋ ${esc(t("addOption"))}</button>
    <button type="button" class="btn wide" data-dact="sendpoll">${esc(t("postPoll"))}</button>`);
  setTimeout(() => $("#pollQ").focus(), 50);
}
function myLink() { return location.origin + location.pathname + "#u=" + FB.user.uid; }
async function qrDialog() {
  if (!FB.user || !FB.profile) { toast(t("profileToDM")); return; }
  dialog(`<h3>${esc(t("myQR"))}</h3><div class="qr" id="qrBox">${esc(t("loading"))}</div>
    <p class="qr-name"><b>${esc(FB.profile.name)}</b></p><p class="small center">${esc(t("qrHint"))}</p>
    <div class="row center"><button type="button" class="btn" data-dact="share">${esc(t("shareLink"))}</button><button type="button" class="btn line" data-dact="copyid">${esc(t("copyId"))}</button></div>`);
  try {
    if (!window.qrcode) await loadScript("vendor/qrcode.js");
    const qr = window.qrcode(0, "M"); qr.addData(myLink()); qr.make();
    $("#qrBox").innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true }) + `<img class="qr-logo" src="icon.svg" alt="">`;
  } catch (e) { console.warn(e); $("#qrBox").textContent = t("loadFail"); }
}
async function scanDialog() {
  dialog(`<h3>${esc(t("scanQR"))}</h3><div class="scan"><video id="scanV" playsinline muted></video><span class="scan-frame"></span></div><p class="small center" id="scanMsg">${esc(t("scanHint"))}</p>`);
  const msg = $("#scanMsg");
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { msg.textContent = t("noCamera"); return; }
  try {
    if (!window.jsQR) await loadScript("vendor/jsQR.js");
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    const v = $("#scanV"); v.srcObject = stream; await v.play();
    const c = document.createElement("canvas"), ctx = c.getContext("2d", { willReadFrequently: true });
    let alive = true;
    scanStop = () => { alive = false; stream.getTracks().forEach(tr => tr.stop()); };
    const tick = () => {
      if (!alive) return;
      if (v.videoWidth) {
        const w = 360, h = Math.round(v.videoHeight * w / v.videoWidth);
        c.width = w; c.height = h; ctx.drawImage(v, 0, 0, w, h);
        const code = window.jsQR(ctx.getImageData(0, 0, w, h).data, w, h);
        const m = code && code.data.match(/#u=([A-Za-z0-9]{6,64})/);
        if (m) { closeDialog(); openDM(m[1]); return; }
        if (code) msg.textContent = t("notTulparQR");
      }
      setTimeout(tick, 200);
    };
    tick();
  } catch (e) { console.warn(e); msg.textContent = t("cameraDenied"); }
}

/* deep link: #u=<uid> opens a private chat */
let pendingDM = null;
function readHash() { const m = location.hash.match(/^#u=([A-Za-z0-9]{6,64})$/); if (m) pendingDM = m[1]; }
function handleDeepLink() {
  if (!pendingDM || !FB.ready) return;
  if (!FB.user || !FB.profile || !$("#gate").hidden) return;
  const u = pendingDM; pendingDM = null; openDM(u);
}
window.addEventListener("hashchange", () => { readHash(); handleDeepLink(); });


/* ---------- start-up screen ---------- */
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
let gateStep = null;
function gateFromState() {
  if (!FB.user) showGate("signin");
  else if (!FB.profile) showGate("profile");
  else if (!isStandalone() && !store("tp_install_asked")) showGate("install");
  else hideGate();
}
function hideGate() {
  const was = !$("#gate").hidden;
  $("#gate").hidden = true; gateStep = null;
  if (was) { if (current === "chats") renderChats(); handleDeepLink(); }
}
function gateLangs() {
  return `<div class="g-lang" id="gLang">` + [["ir", "Iradcha"], ["ru", "Русский"], ["en", "English"]].map(([l, n]) =>
    `<button type="button" data-glang="${l}" aria-pressed="${l === LANG}">${n}</button>`).join("") + `</div>`;
}
function showGate(step) {
  gateStep = step; $("#gate").hidden = false;
  const box = $("#gateBody"), logo = `<img class="g-logo" src="icon.svg" alt="" width="84" height="84">`;
  if (step === "splash") {
    box.innerHTML = `<div class="g-center">${logo}<div class="g-word">tulpar</div><div class="g-spin" aria-label="${esc(t("loading"))}"></div></div>`;
  } else if (step === "signin") {
    box.innerHTML = gateLangs() + `<div class="g-center">${logo}<div class="g-word">tulpar</div>
      <h1 class="g-h">${esc(t("gateHead"))}</h1><p class="g-p">${esc(t("gateSub"))}</p></div>
      <div class="g-foot"><button class="btn wide g-google" type="button" id="gGoogle"><span class="g-gl" aria-hidden="true">G</span>${esc(t("google"))}</button>
      <button class="btn wide line" type="button" id="gSms">${esc(t("gateSms"))}</button>
      <p class="err" id="gErr" hidden></p>
      <p class="g-terms">${t("gateTerms").replace("{terms}", `<a href="../legal.html" target="_blank" rel="noopener">${esc(t("privacy"))}</a>`)}</p></div>`;
    $("#gGoogle").onclick = async () => {
      const err = $("#gErr"); err.hidden = true;
      try { await FB.A.signInWithPopup(FB.auth, new FB.A.GoogleAuthProvider()); }
      catch (e) { err.hidden = false; err.textContent = e.code === "auth/unauthorized-domain" ? t("badDomain") : t("signInFail"); }
    };
    $("#gSms").onclick = () => { const err = $("#gErr"); err.hidden = false; err.textContent = t("gateSmsNo"); };
  } else if (step === "profile") {
    box.innerHTML = `<div class="g-top"><span class="g-step">1 / 2</span><button type="button" class="g-link" id="gOut">${esc(t("signOut"))}</button></div>
      <div class="g-form"><h1 class="g-h">${esc(t("chooseName"))}</h1><p class="g-p">${esc(t("chooseNameText"))}</p>
      <label class="fld"><span>${esc(t("name"))}</span><input type="text" id="nameIn" maxlength="24" autocomplete="nickname" placeholder="${esc(t("nameEx"))}"></label>
      <label class="check"><input type="checkbox" id="ageIn"> ${esc(t("age13"))}</label>
      <label class="check"><input type="checkbox" id="rulesIn"> ${esc(t("rulesBox"))}</label>
      <p class="err" id="profErr" hidden></p></div>
      <div class="g-foot"><button class="btn wide" type="button" id="saveProfile">${esc(t("continue"))}</button></div>`;
    $("#gOut").onclick = () => FB.A.signOut(FB.auth);
    wireProfile();
    setTimeout(() => $("#nameIn") && $("#nameIn").focus(), 60);
  } else if (step === "install") {
    let how;
    if (installEvt) how = `<button class="btn wide" type="button" id="gInstall">${esc(t("install"))}</button>`;
    else if (isIOS()) how = `<ol class="g-steps"><li>${t("iosStep1")}</li><li>${t("iosStep2")}</li><li>${esc(t("iosStep3"))}</li></ol>`;
    else how = `<p class="g-p">${esc(t("installMenu"))}</p>`;
    box.innerHTML = `<div class="g-top"><span class="g-step">2 / 2</span></div>
      <div class="g-center"><div class="g-phone"><img src="icon.svg" alt="" width="64" height="64"><span>Tulpar</span></div>
      <h1 class="g-h">${esc(t("installTitle"))}</h1><p class="g-p">${esc(t("gateInstallText"))}</p></div>
      <div class="g-foot">${how}<button class="btn wide line" type="button" id="gSkip">${esc(installEvt || isIOS() ? t("notNow") : t("continue"))}</button></div>`;
    const done = () => { store("tp_install_asked", true); hideGate(); go("chats"); };
    $("#gSkip").onclick = done;
    const gi = $("#gInstall");
    if (gi) gi.onclick = async () => { installEvt.prompt(); const c = await installEvt.userChoice; installEvt = null; if (c.outcome === "accepted") toast(t("installed")); done(); };
  }
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-glang]"); if (!b || b.dataset.glang === LANG) return;
  store("tp_lang", b.dataset.glang); location.reload();
});

/* ---------- profile ---------- */
let installEvt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; if (gateStep === "install") showGate("install"); else if (current === "profile") renderProfile(); });
window.addEventListener("appinstalled", () => { store("tp_install_asked", true); if (gateStep === "install") { hideGate(); go("chats"); } });

function renderProfile() {
  const box = $("#profileBody");
  const install = installEvt ? `<div class="card"><h3>${esc(t("installTitle"))}</h3><p class="small">${esc(t("installText"))}</p><div class="row"><button class="btn alt" type="button" id="installBtn">${esc(t("install"))}</button></div></div>` : "";
  if (!FB.ready) {
    box.innerHTML = install + `<div class="card"><h3>${esc(t("signIn"))}</h3><p class="small">${esc(t("accountsSetup"))}</p></div>`;
  } else if (!FB.user) {
    box.innerHTML = install + `<div class="card"><h3>${esc(t("signInTitle"))}</h3>
      <p class="small">${esc(t("signInText"))}</p>
      <div class="row"><button class="btn" type="button" id="googleBtn">${esc(t("google"))}</button></div><p class="err" id="authErr" hidden></p></div>`;
  } else if (!FB.profile) {
    box.innerHTML = install + `<div class="card"><h3>${esc(t("chooseName"))}</h3>
      <p class="small">${esc(t("chooseNameText"))}</p>
      <label>${esc(t("name"))}<input type="text" id="nameIn" maxlength="24" placeholder="${esc(t("nameEx"))}"></label>
      <label class="check"><input type="checkbox" id="ageIn"> ${esc(t("age13"))}</label>
      <label class="check"><input type="checkbox" id="rulesIn"> ${esc(t("rulesBox"))}</label>
      <div class="row"><button class="btn" type="button" id="saveProfile">${esc(t("save"))}</button><button class="btn line" type="button" id="signOut">${esc(t("signOut"))}</button></div>
      <p class="err" id="profErr" hidden></p></div>`;
  } else {
    const canNotify = "Notification" in window;
    box.innerHTML = install + `<div class="card"><h3>${esc(FB.profile.name)}${FB.admin ? " · " + esc(t("admin")) : ""}</h3>
      <p class="small">${esc(FB.user.email ? t("signedInAs", { e: FB.user.email }) : t("signedIn"))}</p>
      <label>${esc(t("yourId"))}<span class="uid">${esc(FB.user.uid)}</span></label>
      <div class="row"><button class="btn" type="button" id="myQrBtn">🔳 ${esc(t("myQR"))}</button><button class="btn line" type="button" id="signOut">${esc(t("signOut"))}</button></div>
      ${canNotify ? `<label class="check"><input type="checkbox" id="notifyIn"${store("tp_notify") && Notification.permission === "granted" ? " checked" : ""}> ${esc(t("notifyBox"))}</label>` : ""}
      <div class="row"><button class="btn line" type="button" id="clearBlocks">${esc(t("showHidden"))}</button></div></div>`;
  }
  wireProfile();
  renderAdmin();
}
function wireProfile() {
  const ib = $("#installBtn"); if (ib) ib.onclick = async () => { installEvt.prompt(); await installEvt.userChoice; installEvt = null; renderProfile(); };
  const g = $("#googleBtn");
  if (g) g.onclick = async () => {
    try { await FB.A.signInWithPopup(FB.auth, new FB.A.GoogleAuthProvider()); }
    catch (e) { const el = $("#authErr"); el.hidden = false; el.textContent = e.code === "auth/unauthorized-domain" ? t("badDomain") : t("signInFail"); }
  };
  const so = $("#signOut"); if (so) so.onclick = () => FB.A.signOut(FB.auth);
  const qb = $("#myQrBtn"); if (qb) qb.onclick = qrDialog;
  const cb = $("#clearBlocks"); if (cb) cb.onclick = () => { store("tp_blocked", []); toast(t("allVisible")); renderChats(); };
  const ni = $("#notifyIn");
  if (ni) ni.onchange = async () => {
    if (!ni.checked) { store("tp_notify", false); return; }
    const p = await Notification.requestPermission();
    if (p === "granted") { store("tp_notify", true); toast(t("notifyOn")); } else { ni.checked = false; store("tp_notify", false); toast(t("notifyDenied")); }
  };
  const sp = $("#saveProfile");
  if (sp) sp.onclick = async () => {
    const name = $("#nameIn").value.trim().replace(/\s+/g, " "), err = $("#profErr");
    err.hidden = true;
    if (name.length < 2) { err.textContent = t("nameShort"); err.hidden = false; return; }
    FILTER.lastIndex = 0;
    if (FILTER.test(name)) { FILTER.lastIndex = 0; err.textContent = t("nameBad"); err.hidden = false; return; }
    if (!$("#ageIn").checked || !$("#rulesIn").checked) { err.textContent = t("tickBoth"); err.hidden = false; return; }
    const F = FB.F;
    try {
      await F.setDoc(F.doc(FB.db, "users", FB.user.uid), { name, age13: true, createdAt: F.serverTimestamp(), lastPostAt: F.serverTimestamp() });
      FB.profile = { name, age13: true };
      if (!gateStep) toast(t("welcome", { n: name })); updateComposer(); startDMs(); renderChats();
      if (gateStep) gateFromState(); else renderProfile();
      handleDeepLink();
    } catch (e) { console.warn(e); err.textContent = t("saveFail"); err.hidden = false; }
  };
}

/* admin: reports */
async function renderAdmin() {
  const box = $("#adminBody");
  if (!FB.admin) { box.hidden = true; return; }
  box.hidden = false; box.innerHTML = `<div class="card"><h3>${esc(t("reports"))}</h3><div id="reports" class="small">${esc(t("loading"))}</div></div>`;
  const F = FB.F;
  try {
    const snap = await F.getDocs(F.query(F.collection(FB.db, "reports"), F.orderBy("createdAt", "desc"), F.limit(50)));
    const el = $("#reports");
    if (snap.empty) { el.textContent = t("noReports"); return; }
    el.innerHTML = snap.docs.map(d => { const r = d.data(), dm = r.room === "dm"; return `<div class="report" data-rid="${d.id}" data-room="${esc(r.room)}" data-mid="${esc(r.msgId)}" data-uid="${esc(r.msgUid)}">
      <b>${esc(r.msgName)}</b> ${dm ? esc(t("inPrivate")) : "#" + esc(r.room)}<q>${esc(r.text)}</q>
      <div class="row">${dm ? "" : `<button class="btn" data-r="del">${esc(t("deleteMsg"))}</button>`}<button class="btn line" data-r="ban">${esc(t("ban"))}</button><button class="btn line" data-r="dismiss">${esc(t("dismiss"))}</button></div></div>`; }).join("");
  } catch (e) { console.warn(e); $("#reports").textContent = t("loadFail"); }
}
$("#adminBody").addEventListener("click", async e => {
  const b = e.target.closest("[data-r]"); if (!b) return;
  const r = b.closest(".report"), F = FB.F;
  try {
    if (b.dataset.r === "del") await F.deleteDoc(F.doc(FB.db, "rooms", r.dataset.room, "messages", r.dataset.mid)).catch(() => {});
    if (b.dataset.r === "ban") await F.updateDoc(F.doc(FB.db, "users", r.dataset.uid), { banned: true });
    await F.deleteDoc(F.doc(FB.db, "reports", r.dataset.rid));
    r.remove(); toast(t("done"));
  } catch (err) { console.warn(err); toast(t("didntWork")); }
});

/* ---------- channels ---------- */
let feedNow = "iradone", feedUnsub = null;
$$("[data-feed]").forEach(b => b.addEventListener("click", () => {
  $$("[data-feed]").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
  feedNow = b.dataset.feed; loadFeed(feedNow);
}));
async function loadFeed(which) {
  const box = $("#feed");
  if (feedUnsub) { feedUnsub(); feedUnsub = null; }
  box.innerHTML = `<p class="empty">${esc(t("loading"))}</p>`;
  try {
    if (which === "iradone") {
      const r = await fetch("https://iradone.com/news/index.json", { cache: "no-cache" });
      const items = await r.json();
      box.innerHTML = items.slice(0, 20).map(n => `<article class="post"><a href="https://iradone.com/news/${esc(n.slug)}.html" target="_blank" rel="noopener">
        <span class="src">IradOne · ${esc(n.category || "News")}</span><h3>${esc(n.headline)}</h3><p>${esc(n.dek || "")}</p><time>${fmtWhen(new Date(n.published))}</time></a></article>`).join("");
    } else if (which === "herald") {
      const r = await fetch("https://talasherald.com/feed.xml", { cache: "no-cache" });
      const xml = new DOMParser().parseFromString(await r.text(), "text/xml");
      box.innerHTML = Array.from(xml.querySelectorAll("item")).slice(0, 20).map(it => {
        const g = s => (it.querySelector(s) || {}).textContent || "";
        return `<article class="post"><a href="${esc(g("link"))}" target="_blank" rel="noopener"><span class="src">Talas Herald · ${esc(g("category") || "News")}</span>
          <h3>${esc(g("title"))}</h3><p>${esc(g("description"))}</p><time>${fmtWhen(new Date(g("pubDate")))}</time></a></article>`;
      }).join("");
    } else {
      if (!FB.ready) { box.innerHTML = officialFallback(); return; }
      const F = FB.F;
      feedUnsub = F.onSnapshot(F.query(F.collection(FB.db, "rooms", "official", "messages"), F.orderBy("createdAt", "desc"), F.limit(30)), snap => {
        box.innerHTML = (snap.empty ? officialFallback() : snap.docs.map(d => { const m = d.data({ serverTimestamps: "estimate" });
          const body = m.sticker ? `<img class="stk" src="stickers/${esc(m.sticker)}.svg" alt="" width="120" height="120">` : m.poll ? `<p>📊 ${esc(m.poll.q)}</p>` : `<p style="color:var(--ink)">${esc(m.text)}</p>`;
          return `<article class="post"><span class="src">Tulpar</span>${body}<time>${m.createdAt ? fmtWhen(tsDate(m.createdAt)) : ""}</time></article>`; }).join("")) +
          `<button class="btn" type="button" id="openOfficial">${esc(t(FB.admin ? "postAsTulpar" : "openChannel"))}</button>`;
        const po = $("#openOfficial"); if (po) po.onclick = () => openRoom("official");
      });
    }
  } catch (e) {
    console.warn(e);
    box.innerHTML = `<p class="empty">${esc(t("feedFail"))}</p>`;
  }
}
function officialFallback() {
  return `<article class="post"><span class="src">Tulpar</span><h3>${esc(t("off1t"))}</h3><p>${esc(t("off1p"))}</p></article>` +
    `<article class="post"><span class="src">Tulpar</span><h3>${esc(t("off2t"))}</h3><p>${esc(t("off2p"))}</p></article>`;
}

/* ---------- location lock ---------- */
/* Irad's rough outline: Talas and Jalal-Abad, the northern and eastern Fergana rim, parts of Turkistan and Jambyl (lon, lat) */
const IRAD = [[70.0, 41.0], [69.9, 42.5], [70.6, 43.4], [72.4, 43.4], [73.7, 42.7], [74.2, 41.7], [73.8, 40.9], [72.6, 40.75], [71.4, 40.85], [70.6, 40.9]];
function inIrad(lon, lat) {
  let inside = false;
  for (let i = 0, j = IRAD.length - 1; i < IRAD.length; j = i++) {
    const [xi, yi] = IRAD[i], [xj, yj] = IRAD[j];
    if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function checkLocation(msgEl, onInside) {
  if (!navigator.geolocation) { msgEl.textContent = t("noGeo"); return; }
  msgEl.textContent = t("checking");
  navigator.geolocation.getCurrentPosition(pos => {
    const { longitude: lon, latitude: lat } = pos.coords;
    if (inIrad(lon, lat)) onInside(); else msgEl.textContent = t("regionUnknown");
  }, () => { msgEl.textContent = t("geoDenied"); }, { timeout: 10000, maximumAge: 600000 });
}

/* ---------- services ---------- */
const SVC_PAY = [["bazar", "🛍️"], ["topup", "📱"], ["utilities", "💡"], ["taxi", "🚕"], ["food", "🍲"], ["installments", "🧾"], ["gov", "🏛️"], ["abroad", "💸"]];
const SVC_INFO = [["weather", "⛅"], ["rates", "💱"], ["buses", "🚌"], ["church", "⛪"], ["sport", "🏇"]];
function tiles(list) { return list.map(([id, e]) => `<button type="button" class="tile" data-svc="${id}"><span>${e}</span><b>${esc(t("svc_" + id))}</b></button>`).join(""); }
let svcDrawn = false;
function renderServices() {
  if (!svcDrawn) { $("#svcPay").innerHTML = tiles(SVC_PAY); $("#svcInfo").innerHTML = tiles(SVC_INFO); svcDrawn = true; }
  $("#rateNow").textContent = num(SOM) + " som";
  getWeather().then(w => { if (w && w[0] && w[0].ok) { $("#wxNow").textContent = wxIcon(w[0].code) + " " + Math.round(w[0].temp) + "°"; $("#wxWhere").textContent = "Talas"; } }).catch(() => {});
}
document.addEventListener("click", e => { const b = e.target.closest("[data-svc]"); if (b) openSvc(b.dataset.svc); });

function openSvc(id) {
  $("#svcName").textContent = t("svc_" + id); $("#svcDesc").textContent = t("svcd_" + id);
  const body = $("#svcBody"); body.innerHTML = (SVC[id] || (() => ""))();
  go("svc"); body.scrollTop = 0;
  const after = SVC_AFTER[id]; if (after) after(body);
}
function field(label, inner) { return `<label class="fld"><span>${esc(label)}</span>${inner}</label>`; }
function chips(name, opts, sel = 0) { return `<div class="chips svc-chips" data-chips="${name}">` + opts.map((o, i) => `<button type="button" data-v="${esc(o[0])}" aria-pressed="${i === sel}">${esc(o[1])}</button>`).join("") + `</div>`; }
function lockBtn(label) { return `<button type="button" class="btn wide" data-lock>${esc(label)}</button><div class="lock-note" hidden></div>`; }
document.addEventListener("click", e => {
  const c = e.target.closest("[data-chips] button");
  if (c) { $$("button", c.parentElement).forEach(b => b.setAttribute("aria-pressed", b === c ? "true" : "false")); c.parentElement.dispatchEvent(new Event("change", { bubbles: true })); }
  const l = e.target.closest("[data-lock]");
  if (l) {
    const note = l.nextElementSibling; note.hidden = false;
    note.innerHTML = `<b>📍 ${esc(t("iradOnly"))}</b><p>${esc(t("iradOnlyText"))}</p><button type="button" class="btn line" data-checkloc>${esc(t("checkLoc"))}</button><p class="small" data-locmsg></p>`;
  }
  const cl = e.target.closest("[data-checkloc]");
  if (cl) { const msg = cl.parentElement.querySelector("[data-locmsg]"); checkLocation(msg, () => { msg.textContent = t("zeroBalance"); }); }
});
const chipVal = (root, name) => { const b = $(`[data-chips="${name}"] [aria-pressed="true"]`, root); return b ? b.dataset.v : null; };

const RATES = { usd: 1, eur: 0.862, rub: 81.5, kzt: 522, kgs: 87.45, uzs: 12650, cny: 7.12 }; // units per US dollar
const SVC = {
  bazar: () => `<div class="locked"><div class="lock-e">📍</div><h2>${esc(t("bazarLocked"))}</h2><p>${esc(t("bazarLockedText"))}</p>
      <button class="btn" type="button" id="checkLoc">${esc(t("checkLoc"))}</button><p class="small" id="locMsg"></p></div><div class="bazar" id="bazarOpen" hidden></div>`,
  topup: () => field(t("phone"), `<div class="phone-in"><span>+996 39</span><input inputmode="numeric" maxlength="7" placeholder="000 0000"></div>`) +
    field(t("operator"), `<div class="static">Attelkom</div>`) +
    field(t("amount"), chips("amt", [["20", "20 som"], ["50", "50 som"], ["100", "100 som"], ["200", "200 som"]], 1)) +
    `<p class="small">${esc(t("topupNote"))}</p>` + lockBtn(t("payTulpar")),
  utilities: () => field(t("provider"), `<select>${["electricity", "water", "gas", "rubbish", "internet"].map(k => `<option>${esc(t("util_" + k))}</option>`).join("")}</select>`) +
    field(t("account"), `<input inputmode="numeric" maxlength="12" placeholder="${esc(t("accountEx"))}">`) +
    `<p class="small">${esc(t("utilNote"))}</p>` + lockBtn(t("findBill")),
  taxi: () => field(t("from"), `<div class="static">📍 ${esc(t("currentLoc"))}</div>`) +
    field(t("to"), `<input placeholder="${esc(t("toEx"))}">`) +
    field(t("tariff"), chips("tariff", [["e", t("econom") + " · 15 som"], ["c", t("comfort") + " · 22 som"], ["m", t("minivan") + " · 35 som"]])) +
    `<p class="small">${esc(t("taxiNote"))}</p>` + lockBtn(t("orderTaxi")),
  food: () => `<div class="shops">` + [["🍚", "food1"], ["🌮", "food2"], ["🍕", "food3"], ["🥖", "food4"], ["🍢", "food5"]].map(([e, k]) =>
    `<button type="button" class="shop" data-lock-shop><span>${e}</span><div><b>${esc(t(k))}</b><small>${esc(t(k + "d"))}</small></div></button>`).join("") + `</div>` + lockBtn(t("viewMenu")),
  installments: () => field(t("price"), `<input id="instPrice" inputmode="decimal" value="1200"> `) +
    field(t("term"), chips("months", [["3", t("months", { n: 3 })], ["6", t("months", { n: 6 })], ["12", t("months", { n: 12 })]], 1)) +
    `<div class="calc"><small>${esc(t("monthly"))}</small><b id="instOut">—</b><span id="instNote"></span></div>` +
    `<p class="small">${esc(t("instNote"))}</p>` + lockBtn(t("apply")),
  gov: () => `<div class="shops">` + ["passport", "fines", "address", "certs", "pension", "tax"].map(k =>
    `<button type="button" class="shop" data-lock-shop><span>${{ passport: "🛂", fines: "🚓", address: "🏠", certs: "📜", pension: "👵", tax: "🧮" }[k]}</span><div><b>${esc(t("gov_" + k))}</b><small>${esc(t("govd_" + k))}</small></div></button>`).join("") + `</div>` + lockBtn(t("continue")),
  abroad: () => field(t("country"), chips("cty", [["kgs", t("c_kg")], ["kzt", t("c_kz")], ["rub", t("c_ru")], ["uzs", t("c_uz")]])) +
    field(t("youSend"), `<div class="phone-in"><input id="sendAmt" inputmode="decimal" value="500"><span>som</span></div>`) +
    `<div class="calc"><small>${esc(t("theyGet"))}</small><b id="getAmt">—</b><span id="feeNote"></span></div>` +
    field(t("cardNo"), `<input inputmode="numeric" maxlength="19" placeholder="0000 0000 0000 0000">`) + lockBtn(t("sendMoney")),
  weather: () => `<div id="wxList" class="wx-list"><p class="empty">${esc(t("loading"))}</p></div><p class="small pad">${esc(t("wxSource"))}</p>`,
  rates: () => {
    const rows = [["USD", 1, "usd"], ["EUR", 1, "eur"], ["RUB", 100, "rub"], ["KZT", 100, "kzt"], ["KGS", 100, "kgs"], ["UZS", 1000, "uzs"], ["CNY", 1, "cny"]];
    const px = T.livePrice ? T.livePrice() : 0.034;
    return `<div class="card"><h3>${esc(t("official"))}</h3><p class="small">${esc(t("officialNote", { d: fmtD(new Date(), { day: "numeric", month: "long", year: "numeric" }) }))}</p>
      <table class="rates"><tbody>` + rows.map(([c, u, k]) => `<tr><td><b>${u === 1 ? "" : u + " "}${c}</b></td><td>${num(SOM * u / RATES[k], u >= 100 ? 2 : 2)} som</td></tr>`).join("") +
      `<tr><td><b>100 TLPR</b></td><td>${num(px * 100 * SOM)} som</td></tr></tbody></table></div>
      <div class="card"><h3>${esc(t("street"))}</h3><p class="small">${esc(t("streetNote"))}</p>
      <table class="rates"><thead><tr><th></th><th>${esc(t("buy"))}</th><th>${esc(t("sell"))}</th></tr></thead><tbody>
      <tr><td><b>USD</b></td><td>11.40</td><td>11.85</td></tr><tr><td><b>EUR</b></td><td>13.10</td><td>13.70</td></tr><tr><td><b>100 RUB</b></td><td>13.20</td><td>14.40</td></tr></tbody></table></div>
      <p class="small pad">${esc(t("ratesNote"))}</p>`;
  },
  buses: () => `<p class="small pad">${esc(t("busNote"))}</p><div id="busList"></div>`,
  church: () => `<div id="churchToday" class="card"></div><div class="card"><h3>${esc(t("comingUp"))}</h3><ul class="cal" id="calList"></ul></div><p class="small pad">${esc(t("churchNote"))}</p>`,
  sport: () => `<div class="card"><h3>⚽ ${esc(t("leagueTitle"))}</h3><div id="league"></div></div><div class="card"><h3>🏇 ${esc(t("horseTitle"))}</h3><ul class="cal" id="horseList"></ul></div>`
};
const SVC_AFTER = {
  bazar: body => {
    $("#checkLoc", body).onclick = () => checkLocation($("#locMsg", body), openBazar);
  },
  food: body => $$("[data-lock-shop]", body).forEach(b => (b.onclick = () => $("[data-lock]", body).click())),
  gov: body => $$("[data-lock-shop]", body).forEach(b => (b.onclick = () => $("[data-lock]", body).click())),
  installments: body => {
    const calc = () => {
      const p = parseFloat(($("#instPrice", body).value || "").replace(",", ".")) || 0, n = +chipVal(body, "months");
      const fee = n === 12 ? 0.06 : 0; const per = p * (1 + fee) / n;
      $("#instOut", body).textContent = p ? num(per) + " som × " + n : "—";
      $("#instNote", body).textContent = fee ? t("instFee") : t("instZero");
    };
    body.addEventListener("input", calc); body.addEventListener("change", calc); calc();
  },
  abroad: body => {
    const calc = () => {
      const s = parseFloat(($("#sendAmt", body).value || "").replace(",", ".")) || 0, c = chipVal(body, "cty");
      const fee = Math.max(2, s * 0.01), get = (s - fee) / SOM * RATES[c] * 0.985;
      $("#getAmt", body).textContent = s > fee ? Math.floor(get).toLocaleString(LOCALE) + " " + c.toUpperCase() : "—";
      $("#feeNote", body).textContent = t("fee", { f: num(fee) });
    };
    body.addEventListener("input", calc); body.addEventListener("change", calc); calc();
  },
  weather: async body => {
    const w = await getWeather().catch(() => null), box = $("#wxList", body);
    if (!box) return;
    if (!w) { box.innerHTML = `<p class="empty">${esc(t("feedFail"))}</p>`; return; }
    box.innerHTML = w.map(c => !c.ok ? "" : `<div class="card wx"><div class="wx-now"><span class="wx-i">${wxIcon(c.code)}</span><div><b>${esc(c.name)}</b><small>${esc(t("wx_" + wxKey(c.code)))}</small></div><strong>${Math.round(c.temp)}°</strong></div>
      <div class="wx-days">${c.days.map(d => `<div><small>${esc(fmtD(new Date(d.date + "T12:00"), { weekday: "short" }))}</small><span>${wxIcon(d.code)}</span><b>${Math.round(d.max)}°</b><small>${Math.round(d.min)}°</small></div>`).join("")}</div></div>`).join("");
  },
  buses: body => { const draw = () => ($("#busList", body).innerHTML = busHTML()); draw(); },
  church: body => churchFill(body),
  sport: body => sportFill(body)
};
function openBazar() {
  $(".locked", $("#svcBody")).hidden = true; const b = $("#bazarOpen"); b.hidden = false;
  const items = [["🐎", "bz1", "9 500 som", "Kara-Buura"], ["🚗", "bz2", "$2,300", "Kara-Buura"], ["🍯", "bz3", "60 som", "Kara-Köl"],
    ["🛏️", "bz4", "280 som", "Iyık Janyl"], ["🐑", "bz5", "900 som", "Kara-Köl"], ["📻", "bz6", "230 som", "Talas"]];
  b.innerHTML = `<div class="welcome">📍 ${esc(t("bazarWelcome"))}</div>` +
    items.map(i => `<div class="bz"><div class="pic">${i[0]}</div><div><b>${i[2]}</b>${esc(t(i[1]))}<br><span class="small">${i[3]}</span></div></div>`).join("");
}

/* weather: Open-Meteo, no key needed */
const WX_PLACES = [["Talas", 42.52, 72.24], ["Nurzhan", 43.25, 73.3], ["Iyık Janyl", 41.48, 72.38]];
let wxCache = null, wxAt = 0;
async function getWeather() {
  if (wxCache && Date.now() - wxAt < 15 * 60e3) return wxCache;
  const lat = WX_PLACES.map(p => p[1]).join(","), lon = WX_PLACES.map(p => p[2]).join(",");
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=4&timezone=Asia%2FBishkek`);
  if (!r.ok) throw new Error("weather " + r.status);
  let j = await r.json(); if (!Array.isArray(j)) j = [j];
  wxCache = WX_PLACES.map((p, i) => {
    const x = j[i]; if (!x || !x.current) return { ok: false };
    return { ok: true, name: p[0], temp: x.current.temperature_2m, code: x.current.weather_code,
      days: x.daily.time.slice(1, 4).map((d, k) => ({ date: d, code: x.daily.weather_code[k + 1], max: x.daily.temperature_2m_max[k + 1], min: x.daily.temperature_2m_min[k + 1] })) };
  });
  wxAt = Date.now();
  return wxCache;
}
function wxKey(c) { return c === 0 ? "clear" : c <= 2 ? "partly" : c === 3 ? "cloudy" : c <= 48 ? "fog" : c <= 57 ? "drizzle" : c <= 67 ? "rain" : c <= 77 ? "snow" : c <= 82 ? "showers" : c <= 86 ? "snow" : "storm"; }
function wxIcon(c) { return { clear: "☀️", partly: "⛅", cloudy: "☁️", fog: "🌫️", drizzle: "🌦️", rain: "🌧️", snow: "🌨️", showers: "🌦️", storm: "⛈️" }[wxKey(c)]; }

/* Irad Time is UTC+6 */
function iradNow() { const d = new Date(Date.now() + 6 * 3600e3); return { h: d.getUTCHours(), m: d.getUTCMinutes(), dow: d.getUTCDay(), y: d.getUTCFullYear(), mo: d.getUTCMonth(), day: d.getUTCDate(), date: d }; }

/* buses from Talas Central Bus Station */
const BUSES = [
  ["Nurzhan", "bus", ["06:30", "09:00", "12:00", "15:30", "18:00"], "4 h 20 min", 32],
  ["Nurzhan", "marsh", "every:40:06:00:20:00", "3 h 55 min", 38],
  ["Semiz", "marsh", "every:15:06:00:22:00", "25 min", 2],
  ["Kara-Bulak", "marsh", "every:30:06:30:21:00", "35 min", 3],
  ["Kyzyl-Adyr", "marsh", "every:60:07:00:19:00", "1 h 20 min", Date.now() >= Date.UTC(2026, 9, 18, 18) ? 30 : 24],
  ["Sary-Bulak", "marsh", ["07:15", "12:30", "17:00"], "1 h 30 min", 20],
  ["Tash-Kömür", "bus", ["06:30", "12:00"], "7 h", 40],
  ["Iyık Janyl", "bus", ["06:30", "12:00"], "6 h 50 min", 45]
];
function busTimes(spec) {
  if (Array.isArray(spec)) return spec;
  const [, step, h1, m1, h2, m2] = spec.split(":"), out = [];
  for (let x = +h1 * 60 + +m1; x <= +h2 * 60 + +m2; x += +step) out.push(("0" + Math.floor(x / 60)).slice(-2) + ":" + ("0" + (x % 60)).slice(-2));
  return out;
}
function busHTML() {
  const n = iradNow(), nowMin = n.h * 60 + n.m;
  return BUSES.map(([dest, kind, spec, dur, fare]) => {
    const times = busTimes(spec), mins = times.map(s => +s.slice(0, 2) * 60 + +s.slice(3));
    const nextI = mins.findIndex(x => x >= nowMin);
    const show = nextI === -1 ? times.slice(0, 3) : times.slice(nextI, nextI + 4);
    return `<div class="card bus"><div class="bus-h"><b>${esc(dest)}</b><span class="tag">${esc(t(kind === "bus" ? "bus" : "marshrutka"))}</span></div>
      <p class="small">${esc(dur)} · ${fare} som${dest === "Iyık Janyl" || dest === "Tash-Kömür" ? " · " + esc(t("idCheck")) : ""}</p>
      <div class="times">${nextI === -1 ? `<small>${esc(t("tomorrow"))}</small>` : ""}${show.map((s, i) => `<span class="${i === 0 && nextI !== -1 ? "next" : ""}">${s}</span>`).join("")}</div></div>`;
  }).join("");
}

/* church calendar (Syro-Iradi, Gregorian dates) */
const CAL = [
  ["2026-10-04", "season_moses"], ["2026-11-01", "season_dedication"], ["2026-11-01", "fallenRider"], ["2026-11-02", "allSouls"],
  ["2026-11-29", "season_subara"], ["2026-12-25", "nativity"], ["2027-01-06", "epiphany"], ["2027-01-18", "ninevites"],
  ["2027-02-08", "greatFast"], ["2027-03-11", "iradDay"], ["2027-03-25", "annunciation"], ["2027-03-28", "resurrection"],
  ["2027-04-23", "gewargis"], ["2027-08-24", "janyl"], ["2027-09-14", "cross"], ["2027-11-02", "allSouls"]
];
function churchFill(body) {
  const n = iradNow(), today = n.date.toISOString().slice(0, 10);
  const seasons = CAL.filter(c => c[1].startsWith("season_") && c[0] <= today);
  const season = seasons.length ? seasons[seasons.length - 1] : null;
  let week = "";
  if (season) week = t("week", { n: Math.floor((Date.parse(today) - Date.parse(season[0])) / (7 * 864e5)) + 1 });
  const todays = CAL.filter(c => c[0] === today && !c[1].startsWith("season_"));
  $("#churchToday", body).innerHTML = `<small class="small">${esc(fmtD(n.date, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }))}</small>
    <h3>${season ? esc(t("cal_" + season[1])) : ""}</h3><p class="small">${esc(week)}${todays.length ? " · " + todays.map(c => esc(t("cal_" + c[1]))).join(", ") : ""}</p>`;
  const up = CAL.filter(c => c[0] > today).slice(0, 8);
  $("#calList", body).innerHTML = up.map(c => `<li><time>${esc(fmtD(new Date(c[0] + "T12:00Z"), { day: "numeric", month: "short", year: c[0].slice(0, 4) !== today.slice(0, 4) ? "numeric" : undefined, timeZone: "UTC" }))}</time><div><b>${esc(t("cal_" + c[1]))}</b><small>${esc(t("cald_" + c[1]))}</small></div></li>`).join("");
}

/* sport: Irad League rounds on Saturdays (April to November), horse games on Sundays */
const CLUBS = ["Neftchi Nurzhan", "Tulpar Talas", "Temirjolchu Nurzhan", "Attelkom Talas", "Universitet Talas", "Surma Chatkal", "Dastgoh Nurzhan", "FC Iyık Janyl", "Kara-Buura", "Naryn Tash-Kömür"];
const VENUES = { "Neftchi Nurzhan": "NurGaz Stadium", "Tulpar Talas": "Silk Road Arena", "Temirjolchu Nurzhan": "Lokomotiv Stadium", "Attelkom Talas": "Attelkom Park", "Universitet Talas": "TSU Stadium", "Surma Chatkal": "Chatkal", "Dastgoh Nurzhan": "Dastgoh", "FC Iyık Janyl": "Iyık Janyl", "Kara-Buura": "Kyzyl-Adyr", "Naryn Tash-Kömür": "Tash-Kömür" };
function roundPairs(r) { // circle method
  const a = CLUBS.slice(), n = a.length, fixed = a[0], rest = a.slice(1), k = r % (n - 1);
  const rot = rest.slice(k).concat(rest.slice(0, k)), arr = [fixed].concat(rot), out = [];
  for (let i = 0; i < n / 2; i++) { const h = arr[i], aw = arr[n - 1 - i]; out.push(r % 2 ? [aw, h] : [h, aw]); }
  return out;
}
function nextDow(from, dow) { const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())); while (d.getUTCDay() !== dow) d.setUTCDate(d.getUTCDate() + 1); return d; }
function lastSat(y, m) { const d = new Date(Date.UTC(y, m + 1, 0)); while (d.getUTCDay() !== 6) d.setUTCDate(d.getUTCDate() - 1); return d; }
const FINAL = [["Neftchi Nurzhan", "Tulpar Talas"], ["Temirjolchu Nurzhan", "Attelkom Talas"], ["Universitet Talas", "Surma Chatkal"], ["Dastgoh Nurzhan", "FC Iyık Janyl"], ["Kara-Buura", "Naryn Tash-Kömür"]];
const isDerby = (h, a) => [h, a].includes("Neftchi Nurzhan") && [h, a].includes("Tulpar Talas");
/* Triple round robin (27 rounds); the last Saturday of October is round 27 (always the Kara-Ak derby),
   and the Saturday two weeks before it has no league round (Irad Cup semi-finals). */
function leagueRound(sat) {
  const end = lastSat(sat.getUTCFullYear(), 9), wk = Math.round((end - sat) / (7 * 864e5));
  if (wk < 0 || sat.getUTCMonth() < 3) return null;
  if (wk === 2) return { cup: true };
  const round = 27 - wk + (wk > 2 ? 1 : 0);
  if (round < 1) return null;
  if (round === 27) return { round, pairs: FINAL };
  let k = round, pairs = roundPairs(k);
  while (pairs.some(([h, a]) => isDerby(h, a))) pairs = roundPairs(++k);
  return { round, pairs };
}
function sportFill(body) {
  const n = iradNow(), sat = nextDow(n.date, 6);
  const fmt = d => fmtD(d, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  let html = "";
  for (let o = 0; o < 3 && (html.match(/<ul class="fx">/g) || []).length < 2; o++) {
    const d = new Date(sat.getTime() + o * 7 * 864e5), r = leagueRound(d);
    if (!r) continue;
    if (r.cup) { html += `<p class="small"><b>${esc(fmt(d))}</b> · ${esc(t("cupWeek"))}</p>`; continue; }
    html += `<p class="small"><b>${esc(t("round", { n: r.round }))}</b> · ${esc(fmt(d))}</p><ul class="fx">` + r.pairs.map(([h, a]) => {
      const derby = isDerby(h, a);
      return `<li${derby ? ' class="derby"' : ""}><span>${esc(h)}</span><b>${derby ? "18:00" : "17:00"}</b><span>${esc(a)}</span>${derby ? `<small>${esc(t("derby"))} · ${esc(VENUES[h])}</small>` : ""}</li>`;
    }).join("") + `</ul>`;
  }
  $("#league", body).innerHTML = html || `<p class="small">${esc(t("winterBreak"))}</p>`;
  const sun = nextDow(n.date, 0), events = [];
  for (let i = 0; i < 4; i++) {
    const d = new Date(sun.getTime() + i * 7 * 864e5), m = d.getUTCMonth(), wn = Math.floor(d.getTime() / (7 * 864e5));
    const summer = m >= 3 && m <= 9;
    const pool = summer ? ["ev_chabysh", "ev_kyzkuu", "ev_ulak", "ev_oodarysh"] : ["ev_winterUlak", "ev_burkut", "ev_winterUlak", "ev_oodarysh"];
    events.push([d, pool[wn % 4]]);
  }
  $("#horseList", body).innerHTML = events.map(([d, k]) => `<li><time>${esc(fmtD(d, { day: "numeric", month: "short", timeZone: "UTC" }))}</time><div><b>${esc(t(k))}</b><small>${esc(t(k + "d"))}</small></div></li>`).join("");
}

/* ---------- wallet ---------- */
function drawWallet() {
  if (!T.drawChart) return;
  T.drawChart($("#walChart"), "7D");
  $("#walBal").textContent = "0 TLPR"; $("#walVal").textContent = "≈ $0.00";
}
document.addEventListener("tlpr:tick", () => { if (current === "wallet") drawWallet(); });
$$("[data-locked]").forEach(b => b.addEventListener("click", () => toast(t(b.dataset.locked))));
$("#claimBtn").addEventListener("click", () => toast(t("claimLocked")));

/* ---------- start ---------- */
applyStatic();
readHash();
const start = location.hash.replace("#", "");
const startTab = start === "bazar" ? "services" : start;
go(["chats", "channels", "services", "wallet", "profile"].includes(startTab) ? startTab : "chats");
if (start === "bazar") openSvc("bazar");
initFirebase();
window.addEventListener("online", () => ($("#netNote").textContent = ""));
window.addEventListener("offline", () => ($("#netNote").textContent = t("offline")));
