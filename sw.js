const VERSION = 'pintara-v5.5-under-100-files';
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const SHELL = [
  './', './index.html', './manifest.webmanifest', './favicon.png', './favicon.ico',
  './apple-touch-icon.png', './icon-192.png', './icon-512.png',
  './icon-maskable-192.png', './icon-maskable-512.png', './logo.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => ![SHELL_CACHE,RUNTIME_CACHE].includes(key)).map(key => caches.delete(key))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.headers.has('range')) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request, {cache:'no-store'}).then(response => {
      const copy=response.clone();
      caches.open(SHELL_CACHE).then(cache=>cache.put('./index.html',copy));
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }

  if (/\.(?:webp|png|svg|ico|mp3)$/i.test(url.pathname)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) caches.open(RUNTIME_CACHE).then(cache=>cache.put(request,response.clone()));
      return response;
    })));
    return;
  }

  event.respondWith(fetch(request).catch(()=>caches.match(request)));
});
