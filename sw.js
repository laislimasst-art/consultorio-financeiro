/* Service worker: permite abrir o sistema sem internet (guarda uma cópia da página). */
const VERSION = 'consultorio-v2-1';
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(['./index.html'])).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co')) return;                       // nunca guardar API/login/arquivos privados
  if (req.mode === 'navigate' || url.origin === location.origin) {
    const key = new Request(url.origin + url.pathname);                    // ignora ?code= e #
    e.respondWith(
      fetch(req).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(key, copy)); } return r; })
        .catch(() => caches.match(key).then((m) => m || caches.match('./index.html')))
    );
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {           // fontes: usa a cópia guardada se offline
    e.respondWith(caches.open(VERSION).then((c) => c.match(req).then((m) => m || fetch(req).then((r) => { c.put(req, r.clone()); return r; }).catch(() => m))));
  }
});
