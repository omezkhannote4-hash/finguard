// FinGuard's service worker. It keeps the app's pages, with their scripts and
// styles, so the interface still opens without a connection. It never handles
// the checks themselves (/api), anything but GET, or other sites: those always
// go to the network, and offline they fail with the app's usual short messages.

// Change the version to drop everything an older service worker saved.
const CACHE = "finguard-v1";
const PAGES = ["/", "/before-you-pay", "/emergency", "/learn"];
const FILES = [
  "/manifest.webmanifest",
  "/icons/favicon.svg",
  "/icons/favicon-32.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];
// The scripts and styles a page's HTML loads.
const ASSETS = /\/_next\/static\/[^"'\s\\)]+/g;

// Saves a page and everything it loads.
async function savePage(cache, page) {
  const response = await fetch(page, { cache: "no-cache" });
  if (!response.ok) return;
  const html = await response.clone().text();
  await cache.put(page, response);
  const assets = new Set(html.match(ASSETS));
  await Promise.all([...assets].map((asset) => cache.add(asset).catch(() => {})));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Whatever can't be saved now (say, on a flaky connection) is saved on a later visit.
      await Promise.allSettled([
        ...PAGES.map((page) => savePage(cache, page)),
        ...FILES.map((file) => cache.add(file)),
      ]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

// Built files never change once deployed, so a saved copy is always right.
async function cacheFirst(event) {
  const saved = await caches.match(event.request);
  if (saved) return saved;
  const response = await fetch(event.request);
  if (response.ok) {
    const copy = response.clone();
    event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy)));
  }
  return response;
}

// Pages and files come from the network whenever it's there, so they're always
// current, and each fresh page replaces its saved copy. Offline, the saved copy
// is used instead.
async function networkFirst(event, path) {
  try {
    const response = await fetch(event.request);
    if (response.ok && PAGES.includes(path)) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(path, copy)));
    }
    return response;
  } catch {
    return (await caches.match(path)) ?? Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // Left to the browser: other sites, anything but GET, the API, and the data
  // Next.js fetches for in-app navigation. Offline, that navigation falls back
  // to loading the whole page, which is then served from here.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    request.headers.has("RSC") ||
    url.searchParams.has("_rsc")
  ) {
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(event));
  } else if (request.mode === "navigate" || FILES.includes(url.pathname)) {
    event.respondWith(networkFirst(event, url.pathname));
  }
});
