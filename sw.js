// দক্ষিণ নগর কসবা — Service Worker (মূল অ্যাপ + পাবলিক অ্যাপ দুটোর জন্যই কাজ করে)
// কৌশল: "network first, cache fallback" — অনলাইনে সবসময় সর্বশেষ ভার্সন; অফলাইনে শেষবার দেখা কপি।
// শুধু নিজস্ব origin-এর GET ফাইল ক্যাশ হয়। Google Apps Script API (সদস্যের তথ্যসহ) কখনোই ক্যাশ হয় না।

const CACHE_NAME = 'mosque-dashboard-v23';
const APP_SHELL = [
  './', './index.html', './manifest.json', './icon-192.png', './icon-512.png',
  './chart.umd.min.js',
  './public.html', './blood.html', './member-login.html', './member.html',
  './public-manifest.json', './pwa.js', './pub-icon-192.png', './pub-icon-512.png'
];

self.addEventListener('install', (event) => {
  // যে ফাইল নেই সেটা বাদ দিয়ে বাকিগুলো ক্যাশ হবে (দুই ধরনের ডিপ্লয়ের জন্যই নিরাপদ)
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(APP_SHELL.map((u) => cache.add(u).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

function offlineFallback(request) {
  const p = new URL(request.url).pathname;
  const isPublic = /\/(public|blood|member|member-login)(\.html)?$/.test(p);
  return caches.match(isPublic ? './public.html' : './index.html')
    .then((r) => r || caches.match('./public.html'))
    .then((r) => r || caches.match('./index.html'));
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }).then((cached) => cached || (event.request.mode === 'navigate' ? offlineFallback(event.request) : undefined)))
  );
});
