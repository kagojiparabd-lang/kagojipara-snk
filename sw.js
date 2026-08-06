// মাসজিদ ড্যাশবোর্ড — Service Worker
// কৌশল: "network first, cache fallback" — অনলাইনে থাকলে সবসময় সর্বশেষ ভার্সন
// লোড হবে; অফলাইনে থাকলে শেষবার সংরক্ষিত কপি থেকে খুলবে যাতে অ্যাপটি বন্ধ না
// হয়ে যায়। চার্ট/গ্রাফের মতো বাইরের CDN রিসোর্স অফলাইনে নাও লোড হতে পারে,
// কিন্তু মূল ড্যাশবোর্ড ও আপনার সংরক্ষিত ডেটা (localStorage) ঠিকই খুলবে।

const CACHE_NAME = 'mosque-dashboard-v1';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
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

self.addEventListener('fetch', (event) => {
  // শুধু নিজস্ব origin-এর GET রিকোয়েস্ট handle করি; বাইরের CDN কল সরাসরি নেটওয়ার্কে যাক
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
