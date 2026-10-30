// Offline support. Code and pages are network-first (players always get the latest version when online,
// the cached copy when offline). Art and audio are cache-first (they rarely change and are large).
// Bump CACHE when core files change.
const CACHE = 'pink-unicorn-v18', CORE = ['./', 'index.html', 'audio.js', 'game.js', 'stages.js', 'net.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url), isAsset = url.pathname.includes('/assets/');
  const save = res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; };
  if (isAsset) e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(save)));
  else e.respondWith(fetch(e.request).then(save).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
