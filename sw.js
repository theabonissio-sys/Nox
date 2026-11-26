/* Offline: guarda o app no aparelho. Ao publicar uma mudança, troque o número da versão. */
const CACHE = 'nox-v1';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'css/styles.css', 'js/logic.js', 'js/db.js', 'js/icons.js', 'js/share.js', 'js/app.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('nox-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    if (e.request.mode === 'navigate') return (await c.match('index.html')) || fetch(e.request);
    return fetch(e.request);
  }));
});
