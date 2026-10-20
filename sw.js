// オフライン用キャッシュ。index.html などを更新したら VERSION を上げる
const VERSION = 'v9';
const CACHE = 'shinryo-' + VERSION;
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// キャッシュを即返し、裏でネットから更新（オフラインでも起動できる）
// 自分のファイルと Firebase の SDK だけを扱う（Firestore の通信そのものには触らない）
const SDK = 'https://www.gstatic.com/firebasejs/';
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  if (new URL(url).origin !== location.origin && !url.startsWith(SDK)) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const key = e.request.mode === 'navigate' ? './index.html' : e.request;
    const cached = await cache.match(key, {ignoreSearch: true});
    const net = fetch(e.request).then(res => {
      if (res.ok) cache.put(key, res.clone());
      return res;
    }).catch(() => cached);
    return cached || net;
  }));
});
