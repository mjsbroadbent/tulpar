/* Tulpar web app. Chat runs on Firebase (Auth + Firestore) when app/firebase-config.js is filled in;
   everything else works without it. */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const T = window.TULPAR || {};

const ROOMS = [
  { id: "talas", e: "🏙️", name: "Talas", desc: "The capital: news, meetups, questions" },
  { id: "nurzhan", e: "🏭", name: "Nurzhan", desc: "Refinery city chat. Russian welcome" },
  { id: "valleys", e: "⛰️", name: "The valleys", desc: "Kara-Buura, Chu, Sary-Bulak, Toktogul and the rest" },
  { id: "horses", e: "🐎", name: "Horses", desc: "Racing, ulak tartysh, breeding" },
  { id: "football", e: "⚽", name: "Irad League", desc: "Tulpar Talas, Neftchi and everyone else" },
  { id: "diaspora", e: "✈️", name: "Iradis abroad", desc: "Moscow, Chicago, Almaty and beyond" },
  { id: "tulparcoin", e: "🪙", name: "Tulparcoin", desc: "Price talk. Not financial advice" },
  { id: "chaikhana", e: "🫖", name: "Chaikhana", desc: "Off-topic: tea, jokes, anything" }
];
const OFFICIAL = { id: "official", e: "🐎", name: "Tulpar", desc: "Official announcements" };
const FILTER = /\b(fuck\w*|shit\w*|cunt\w*|nigg\w*|fagg?ot\w*|бля\w*|сук[аи]\w*|хуй\w*|пизд\w*|еба\w*)\b/giu;

/* ---------- helpers ---------- */
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function clean(s) { return s.replace(FILTER, m => m[0] + "•".repeat(Math.max(2, m.length - 1))); }
let toastTimer;
function toast(t) { const el = $("#toast"); el.textContent = t; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.hidden = true), 3200); }
function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
function hhmm(d) { return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
function dayLabel(d) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  const diff = Math.round((today - x) / 864e5);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

/* ---------- navigation ---------- */
let current = "chats";
function go(tab) {
  current = tab;
  $$(".tab").forEach(s => (s.hidden = s.dataset.tab !== tab));
  const navTab = tab === "room" ? "chats" : tab;
  $$(".tabs button").forEach(b => { if (b.dataset.go === navTab) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  if (tab !== "room") stopRoom();
  if (tab === "channels") loadFeed(feedNow);
  if (tab === "wallet") drawWallet();
  if (tab === "profile") renderProfile();
  history.replaceState(null, "", "#" + tab);
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
  if (!CFG) { setBanner("Chat is being set up. Channels, Bazar and Wallet work already."); return; }
  try {
    const [{ initializeApp }, A, F] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`)
    ]);
    const app = initializeApp(CFG);
    FB.A = A; FB.F = F; FB.auth = A.getAuth(app); FB.db = F.getFirestore(app); FB.ready = true;
    A.onAuthStateChanged(FB.auth, async user => {
      FB.user = user; FB.profile = null; FB.admin = false;
      if (user) {
        try {
          const p = await F.getDoc(F.doc(FB.db, "users", user.uid));
          FB.profile = p.exists() ? p.data() : null;
          const a = await F.getDoc(F.doc(FB.db, "admins", user.uid));
          FB.admin = a.exists();
        } catch (e) { console.warn(e); }
      }
      updateComposer(); if (current === "profile") renderProfile();
      if (current === "room" && roomId) openRoom(roomId);
      if (current === "channels" && feedNow === "official") loadFeed("official");
    });
    setBanner("");
  } catch (e) {
    console.error(e);
    setBanner("Couldn't connect to Tulpar chat. Check your connection and try again.");
  }
}
function setBanner(t) { const b = $("#chatBanner"); b.textContent = t; b.hidden = !t; }

/* ---------- rooms ---------- */
function renderRooms() {
  $("#roomList").innerHTML = ROOMS.map(r =>
    `<li><button type="button" data-room="${r.id}"><span class="ava">${r.e}</span><span class="txt"><b>${esc(r.name)}</b><small>${esc(r.desc)}</small></span></button></li>`
  ).join("");
}
$("#roomList").addEventListener("click", e => { const b = e.target.closest("[data-room]"); if (b) openRoom(b.dataset.room); });

let roomId = null, unsub = null, lastMsgs = [];
function stopRoom() { if (unsub) { unsub(); unsub = null; } }
function openRoom(id) {
  const r = ROOMS.find(x => x.id === id) || OFFICIAL;
  roomId = r.id;
  $("#roomName").textContent = r.name; $("#roomDesc").textContent = r.desc;
  go("room");
  updateComposer();
  if (!FB.ready) { $("#msgs").innerHTML = `<p class="empty">Chat is being set up. Check back soon.</p>`; return; }
  $("#msgs").innerHTML = `<p class="empty">Loading…</p>`;
  const F = FB.F;
  const q = F.query(F.collection(FB.db, "rooms", r.id, "messages"), F.orderBy("createdAt"), F.limitToLast(100));
  stopRoom();
  unsub = F.onSnapshot(q, snap => {
    lastMsgs = snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) }));
    renderMsgs();
  }, err => { console.error(err); $("#msgs").innerHTML = `<p class="empty">Couldn't load messages.</p>`; });
}
function renderMsgs() {
  const box = $("#msgs"), atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  const blocked = store("tp_blocked") || [];
  const mine = FB.user && FB.user.uid;
  let lastDay = "", html = "";
  lastMsgs.filter(m => !blocked.includes(m.uid)).forEach(m => {
    const d = m.createdAt && m.createdAt.toDate ? m.createdAt.toDate() : new Date();
    const dl = dayLabel(d);
    if (dl !== lastDay) { html += `<div class="day">${dl}</div>`; lastDay = dl; }
    html += `<div class="msg${m.uid === mine ? " me" : ""}${m.admin ? " admin" : ""}" data-id="${m.id}" data-uid="${esc(m.uid)}" data-name="${esc(m.name)}" tabindex="0">` +
      (m.uid === mine ? "" : `<span class="who">${esc(m.name)}</span>`) + esc(clean(m.text)) + `<time>${hhmm(d)}</time></div>`;
  });
  box.innerHTML = html || `<p class="empty">No messages yet. Say salam!</p>`;
  if (atBottom || !box.dataset.init) { box.scrollTop = box.scrollHeight; box.dataset.init = "1"; }
}

function updateComposer() {
  const off = $("#composerOff"), form = $("#composer");
  let msg = "";
  if (!FB.ready) msg = "Chat is being set up.";
  else if (!FB.user) msg = `Sign in to post. <button class="btn" type="button" data-go="profile">Sign in</button>`;
  else if (!FB.profile) msg = `Choose a name to start posting. <button class="btn" type="button" data-go="profile">Set up profile</button>`;
  else if (FB.profile.banned) msg = "Your account can't post in rooms.";
  else if (roomId === "official" && !FB.admin) msg = "Only Tulpar can post in this channel.";
  off.innerHTML = msg; off.hidden = !msg; form.hidden = !!msg;
}

let sending = false;
$("#composer").addEventListener("submit", async e => {
  e.preventDefault();
  const input = $("#msgInput"), text = input.value.trim();
  if (!text || sending || !FB.profile) return;
  sending = true; $(".send").disabled = true;
  const F = FB.F, uid = FB.user.uid;
  try {
    const batch = F.writeBatch(FB.db);
    const ref = F.doc(F.collection(FB.db, "rooms", roomId, "messages"));
    const data = { uid, name: FB.profile.name, text: text.slice(0, 500), createdAt: F.serverTimestamp() };
    if (FB.admin) data.admin = true;
    batch.set(ref, data);
    batch.update(F.doc(FB.db, "users", uid), { lastPostAt: F.serverTimestamp() });
    await batch.commit();
    input.value = "";
  } catch (err) {
    console.warn(err);
    toast(String(err.code || "").includes("permission") ? "Slow down: wait a few seconds between messages." : "Message not sent. Try again.");
  } finally { sending = false; $(".send").disabled = false; input.focus(); }
});

/* message actions */
let sheetMsg = null;
$("#msgs").addEventListener("click", e => {
  const m = e.target.closest(".msg"); if (!m) return;
  sheetMsg = { id: m.dataset.id, uid: m.dataset.uid, name: m.dataset.name, text: lastMsgs.find(x => x.id === m.dataset.id)?.text || "" };
  const mine = FB.user && sheetMsg.uid === FB.user.uid;
  $("#sheetWho").textContent = mine ? "Your message" : sheetMsg.name;
  $("#actDelete").hidden = !(mine || FB.admin);
  $("#actBan").hidden = !FB.admin || mine;
  $('[data-act="report"]').hidden = mine; $('[data-act="block"]').hidden = mine;
  $("#sheet").hidden = false;
});
$("#sheet").addEventListener("click", async e => {
  if (e.target.closest("[data-close]")) { $("#sheet").hidden = true; return; }
  const b = e.target.closest("[data-act]"); if (!b || !sheetMsg) return;
  $("#sheet").hidden = true;
  const F = FB.F;
  try {
    if (b.dataset.act === "block") {
      const list = store("tp_blocked") || []; if (!list.includes(sheetMsg.uid)) list.push(sheetMsg.uid); store("tp_blocked", list);
      renderMsgs(); toast("You won't see messages from " + sheetMsg.name + " on this device.");
    } else if (b.dataset.act === "report") {
      if (!FB.user) { toast("Sign in to report messages."); return; }
      await F.addDoc(F.collection(FB.db, "reports"), {
        room: roomId, msgId: sheetMsg.id, msgUid: sheetMsg.uid, msgName: sheetMsg.name, text: sheetMsg.text.slice(0, 500),
        reporter: FB.user.uid, createdAt: F.serverTimestamp()
      });
      toast("Reported. Thank you, our team will review it.");
    } else if (b.dataset.act === "delete") {
      await F.deleteDoc(F.doc(FB.db, "rooms", roomId, "messages", sheetMsg.id)); toast("Message deleted.");
    } else if (b.dataset.act === "ban") {
      await F.updateDoc(F.doc(FB.db, "users", sheetMsg.uid), { banned: true }); toast(sheetMsg.name + " can no longer post.");
    }
  } catch (err) { console.warn(err); toast("That didn't work. Try again."); }
});

/* ---------- profile ---------- */
let installEvt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; if (current === "profile") renderProfile(); });

function renderProfile() {
  const box = $("#profileBody");
  const install = installEvt ? `<div class="card"><h3>Install Tulpar</h3><p class="small">Add Tulpar to your home screen. It opens full screen and works offline.</p><div class="row"><button class="btn alt" type="button" id="installBtn">Install</button></div></div>` : "";
  if (!FB.ready) {
    box.innerHTML = install + `<div class="card"><h3>Sign in</h3><p class="small">Chat accounts are being set up. Channels, Bazar and Wallet work without an account.</p></div>`;
  } else if (!FB.user) {
    box.innerHTML = install + `<div class="card"><h3>Sign in to Tulpar</h3>
      <p class="small">SMS sign-in is available in Irad only. Everywhere else, sign in with Google. You can read every room without an account.</p>
      <div class="row"><button class="btn" type="button" id="googleBtn">Continue with Google</button></div><p class="err" id="authErr" hidden></p></div>`;
  } else if (!FB.profile) {
    box.innerHTML = install + `<div class="card"><h3>Choose your name</h3>
      <p class="small">This is the name others see in rooms. Don't use your full real name.</p>
      <label>Name<input type="text" id="nameIn" maxlength="24" placeholder="for example Kara-Buura Rider"></label>
      <label class="check"><input type="checkbox" id="ageIn"> I am 13 or older</label>
      <label class="check"><input type="checkbox" id="rulesIn"> I'll be kind, won't spam and won't share personal details like my address or phone number.</label>
      <div class="row"><button class="btn" type="button" id="saveProfile">Save</button><button class="btn line" type="button" id="signOut">Sign out</button></div>
      <p class="err" id="profErr" hidden></p></div>`;
  } else {
    box.innerHTML = install + `<div class="card"><h3>${esc(FB.profile.name)}${FB.admin ? " · admin" : ""}</h3>
      <p class="small">Signed in with Google${FB.user.email ? " as " + esc(FB.user.email) : ""}.</p>
      <label>Your Tulpar ID<span class="uid">${esc(FB.user.uid)}</span></label>
      <div class="row"><button class="btn line" type="button" id="signOut">Sign out</button><button class="btn line" type="button" id="clearBlocks">Show hidden people again</button></div></div>`;
  }
  wireProfile();
  renderAdmin();
}
function wireProfile() {
  const ib = $("#installBtn"); if (ib) ib.onclick = async () => { installEvt.prompt(); await installEvt.userChoice; installEvt = null; renderProfile(); };
  const g = $("#googleBtn");
  if (g) g.onclick = async () => {
    try { await FB.A.signInWithPopup(FB.auth, new FB.A.GoogleAuthProvider()); }
    catch (e) { const el = $("#authErr"); el.hidden = false; el.textContent = e.code === "auth/unauthorized-domain" ? "This address isn't authorised for sign-in yet." : "Sign-in didn't complete. Try again."; }
  };
  const so = $("#signOut"); if (so) so.onclick = () => FB.A.signOut(FB.auth);
  const cb = $("#clearBlocks"); if (cb) cb.onclick = () => { store("tp_blocked", []); toast("Everyone is visible again."); };
  const sp = $("#saveProfile");
  if (sp) sp.onclick = async () => {
    const name = $("#nameIn").value.trim().replace(/\s+/g, " "), err = $("#profErr");
    err.hidden = true;
    if (name.length < 2) { err.textContent = "Names need at least 2 characters."; err.hidden = false; return; }
    if (FILTER.test(name)) { FILTER.lastIndex = 0; err.textContent = "Choose a different name."; err.hidden = false; return; }
    if (!$("#ageIn").checked || !$("#rulesIn").checked) { err.textContent = "Tick both boxes to continue."; err.hidden = false; return; }
    const F = FB.F;
    try {
      await F.setDoc(F.doc(FB.db, "users", FB.user.uid), { name, age13: true, createdAt: F.serverTimestamp(), lastPostAt: F.serverTimestamp() });
      FB.profile = { name, age13: true };
      toast("Welcome to Tulpar, " + name + "!"); renderProfile(); updateComposer();
    } catch (e) { console.warn(e); err.textContent = "Couldn't save. Try again."; err.hidden = false; }
  };
}

/* admin: reports */
async function renderAdmin() {
  const box = $("#adminBody");
  if (!FB.admin) { box.hidden = true; return; }
  box.hidden = false; box.innerHTML = `<div class="card"><h3>Reports</h3><div id="reports" class="small">Loading…</div></div>`;
  const F = FB.F;
  try {
    const snap = await F.getDocs(F.query(F.collection(FB.db, "reports"), F.orderBy("createdAt", "desc"), F.limit(50)));
    const el = $("#reports");
    if (snap.empty) { el.textContent = "No reports. All quiet."; return; }
    el.innerHTML = snap.docs.map(d => { const r = d.data(); return `<div class="report" data-rid="${d.id}" data-room="${esc(r.room)}" data-mid="${esc(r.msgId)}" data-uid="${esc(r.msgUid)}">
      <b>${esc(r.msgName)}</b> in #${esc(r.room)}<q>${esc(r.text)}</q>
      <div class="row"><button class="btn" data-r="del">Delete message</button><button class="btn line" data-r="ban">Ban</button><button class="btn line" data-r="dismiss">Dismiss</button></div></div>`; }).join("");
  } catch (e) { console.warn(e); $("#reports").textContent = "Couldn't load reports."; }
}
$("#adminBody").addEventListener("click", async e => {
  const b = e.target.closest("[data-r]"); if (!b) return;
  const r = b.closest(".report"), F = FB.F;
  try {
    if (b.dataset.r === "del") await F.deleteDoc(F.doc(FB.db, "rooms", r.dataset.room, "messages", r.dataset.mid)).catch(() => {});
    if (b.dataset.r === "ban") await F.updateDoc(F.doc(FB.db, "users", r.dataset.uid), { banned: true });
    await F.deleteDoc(F.doc(FB.db, "reports", r.dataset.rid));
    r.remove(); toast("Done.");
  } catch (err) { console.warn(err); toast("That didn't work."); }
});

/* ---------- channels ---------- */
let feedNow = "iradone", feedUnsub = null;
$$("[data-feed]").forEach(b => b.addEventListener("click", () => {
  $$("[data-feed]").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
  feedNow = b.dataset.feed; loadFeed(feedNow);
}));
function fmtWhen(d) { return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "long" }) + ", " + hhmm(d); }
async function loadFeed(which) {
  const box = $("#feed");
  if (feedUnsub) { feedUnsub(); feedUnsub = null; }
  box.innerHTML = `<p class="empty">Loading…</p>`;
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
        const g = t => (it.querySelector(t) || {}).textContent || "";
        return `<article class="post"><a href="${esc(g("link"))}" target="_blank" rel="noopener"><span class="src">Talas Herald · ${esc(g("category") || "News")}</span>
          <h3>${esc(g("title"))}</h3><p>${esc(g("description"))}</p><time>${fmtWhen(new Date(g("pubDate")))}</time></a></article>`;
      }).join("");
    } else {
      if (!FB.ready) { box.innerHTML = officialFallback(); return; }
      const F = FB.F;
      feedUnsub = F.onSnapshot(F.query(F.collection(FB.db, "rooms", "official", "messages"), F.orderBy("createdAt", "desc"), F.limit(30)), snap => {
        box.innerHTML = (snap.empty ? officialFallback() : snap.docs.map(d => { const m = d.data({ serverTimestamps: "estimate" });
          return `<article class="post"><span class="src">Tulpar</span><p style="color:var(--ink)">${esc(m.text)}</p><time>${m.createdAt ? fmtWhen(m.createdAt.toDate()) : ""}</time></article>`; }).join("")) +
          (FB.admin ? `<button class="btn" type="button" id="postOfficial">Post as Tulpar</button>` : "");
        const po = $("#postOfficial"); if (po) po.onclick = () => openRoom("official");
      });
    }
  } catch (e) {
    console.warn(e);
    box.innerHTML = `<p class="empty">Couldn't load this channel. Check your connection.</p>`;
  }
}
function officialFallback() {
  return `<article class="post"><span class="src">Tulpar</span><h3>Tulpar Pay moves to Tulparcoin on 1 January 2027</h3><p>Top up at any Tulpar point and pay anyone in your chats.</p></article>` +
    `<article class="post"><span class="src">Tulpar</span><h3>Claim your 100 free TLPR</h3><p>Every adult in Irad can claim 100 Tulparcoin. Open Wallet and tap Claim.</p></article>`;
}

/* ---------- Bazar: location lock ---------- */
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
$("#checkLoc").addEventListener("click", () => {
  const msg = $("#locMsg");
  if (!navigator.geolocation) { msg.textContent = "Your device can't share its location."; return; }
  msg.textContent = "Checking…";
  navigator.geolocation.getCurrentPosition(pos => {
    const { longitude: lon, latitude: lat } = pos.coords;
    if (inIrad(lon, lat)) openBazar();
    else msg.textContent = "Your region: unknown. Bazar and Tulpar Pay are available to users in Irad only.";
  }, () => { msg.textContent = "Location not shared. Bazar is available to users in Irad only."; }, { timeout: 10000, maximumAge: 600000 });
});
function openBazar() {
  $("#bazarLocked").hidden = true; const b = $("#bazarOpen"); b.hidden = false;
  const items = [["🐎", "Gentle mare, 12 years", "9 500 som", "Kara-Buura"], ["🚗", "Lada 2107, 2004", "$2,300", "Kara-Buura"], ["🍯", "Chatkal honey, 1 kg", "60 som", "Kara-Köl"],
    ["🛏️", "Golden satin bedding set", "280 som", "Iyık Janyl"], ["🐑", "Gissar sheep, 30 head", "900 som each", "Kara-Köl"], ["📻", "Radio Okean", "230 som", "Talas"]];
  b.innerHTML = `<div class="welcome">📍 Welcome to Irad. Bazar is read-only in this version.</div>` +
    items.map(i => `<div class="bz"><div class="pic">${i[0]}</div><div><b>${i[2]}</b>${esc(i[1])}<br><span class="small">${i[3]}</span></div></div>`).join("");
}

/* ---------- wallet ---------- */
function drawWallet() {
  if (!T.drawChart) return;
  T.drawChart($("#walChart"), "7D");
  const bal = 0; $("#walBal").textContent = bal + " TLPR"; $("#walVal").textContent = "≈ $0.00";
}
document.addEventListener("tlpr:tick", () => { if (current === "wallet") drawWallet(); });
$$("[data-locked]").forEach(b => b.addEventListener("click", () => toast(b.dataset.locked)));
$("#claimBtn").addEventListener("click", () => toast("Claiming needs a mobile number registered in Irad. Your region: unknown."));

/* ---------- start ---------- */
renderRooms();
const start = location.hash.replace("#", "");
go(["chats", "channels", "bazar", "wallet", "profile"].includes(start) ? start : "chats");
initFirebase();
window.addEventListener("online", () => ($("#netNote").textContent = ""));
window.addEventListener("offline", () => ($("#netNote").textContent = "Offline"));
