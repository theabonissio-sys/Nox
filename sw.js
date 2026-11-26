/* Offline: guarda o app no aparelho. Ao publicar uma mudança, troque o número da versão. */
importScripts('js/logic.js', 'js/db.js');
const CACHE = 'nox-v5';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'css/styles.css', 'js/logic.js', 'js/db.js', 'js/icons.js', 'js/share.js', 'js/app.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/badge.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
});
/* a versão nova espera o toque em "Atualizar" (ou o app ser fechado) */
self.addEventListener('message', e => { if (e.data === 'nox-update') self.skipWaiting(); });
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

/* Botões da notificação do modo "Vou dormir": funcionam com o app fechado. */
const showApp = async () => {
  const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const open = list.find(c => c.url.startsWith(self.registration.scope));
  if (!open) return self.clients.openWindow(self.registration.scope);
  open.postMessage('nox-session');
  return open.focus();
};

const showNotice = session => {
  const n = Logic.sessionNotice(session);
  return self.registration.showNotification(n.title, n.options);
};

/* Os botões agem na própria notificação. Tocar no corpo atualiza o tempo mostrado. */
self.addEventListener('notificationclick', e => {
  e.waitUntil((async () => {
    if (e.notification.tag === 'nox-reminder') { e.notification.close(); return showApp(); }
    if (e.action === 'review') return showApp();
    await DB.open();
    const session = await DB.updateSession(s => e.action ? Logic.sessionAction(s, e.action) : Logic.expire(s));
    if (!session) { e.notification.close(); return showApp(); }
    if (!e.action && session.status === 'ended') return showApp();
    await showNotice(session);
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    list.forEach(c => c.postMessage('nox-session'));
  })());
});

/* Lembrete diário. O Android decide quando acordar o app (sincronização periódica). */
const remind = async () => {
  await DB.open();
  const data = await DB.load();
  const now = new Date(), day = Logic.today();
  if (data.settings?.reminders === false || (data.session && data.session.status !== 'ended')) return;
  if (await DB.getMeta('lastReminder') === day) return;
  const text = Logic.reminderFor(now.getHours(), Math.floor(Logic.parse(day) / 864e5));
  if (!text) return;
  await self.registration.showNotification('NOX', { body: text, tag: 'nox-reminder', icon: 'icons/icon-192.png', badge: 'icons/badge.png' });
  await DB.setMeta('lastReminder', day);
};
self.addEventListener('periodicsync', e => { if (e.tag === 'nox-reminder') e.waitUntil(remind()); });

/* Se a notificação for arrastada para fora com o cronômetro ligado, ela volta. */
self.addEventListener('notificationclose', e => {
  if (e.notification.tag !== 'nox-sleep') return;
  e.waitUntil((async () => {
    await new Promise(r => setTimeout(r, 400));
    await DB.open();
    const session = await DB.updateSession(s => Logic.expire(s));
    if (session && session.status !== 'ended') await showNotice(session);
  })());
});
