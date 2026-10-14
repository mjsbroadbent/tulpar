/* Tulpar app service worker: caches the app shell so it opens offline.
   Chat, news feeds and Firebase always go to the network. Bump VERSION when app files change. */
const VERSION = "tulpar-app-v8";
const SHELL = ["./", "index.html", "app.css", "app.js", "i18n.js", "firebase-config.js", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png", "../strings.js", "../site.js",
  ...["salam", "rahmat", "jakshi", "kosh", "chai", "nan", "kalpak", "horse_love", "tlpr_up", "tlpr_down", "jailoo", "gol", "bee", "marshrutka", "haha", "bilbeim"].map(s => "stickers/" + s + ".svg")];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;   // Firebase, fonts, feeds: network only
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html")))
  );
});

// tapping a message alert opens (or focuses) the app on that chat
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) if (c.url.includes("/app/")) { c.navigate(url).catch(() => {}); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
