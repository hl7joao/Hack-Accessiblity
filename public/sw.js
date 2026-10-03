/**
 * Offline support.
 *
 * A rider checking whether a station is step-free is frequently underground, on a
 * crowded platform, or on bad signal — which is exactly when they need the answer.
 * An app that only works on good wifi fails at the moment it matters.
 *
 * Two strategies, chosen per resource:
 *
 *  - Pages (index.html): network-first. The page names the current build's hashed
 *    bundles, so serving a cached copy first would pin every returning visitor to
 *    the old app forever - deploys would never reach them.
 *
 *  - Hashed bundles and cached entrance photos: cache-first. Their contents never
 *    change under the same URL, so serving them from disk is safe and offline-proof.
 *
 *  - CTA elevator data: network-first, falling back to the last response. Fresh data
 *    always wins, because a stale "elevator working" can strand someone. But a stale
 *    answer clearly labelled as stale beats a spinner and no answer at all — the UI
 *    already shows "last confirmed N minutes ago" from the payload's own timestamp.
 */

// Bump to discard caches from older builds on every phone that has visited.
const SHELL = 'stepfree-shell-v2';
const DATA = 'stepfree-data-v2';

// Everything needed to render the app with no network. Hashed asset filenames are
// added opportunistically on first fetch rather than listed here, since they change
// every build.
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== SHELL && k !== DATA).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // CTA data: network-first so fresh status always wins, cache as the fallback.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(DATA).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          // No network and nothing cached. Say so in the shape the client expects,
          // rather than throwing and leaving the UI stuck loading forever.
          return new Response(
            JSON.stringify({ offline: true, CTAAlerts: { Alert: [] }, ctatt: { errCd: '-1', errNm: 'Offline' } }),
            { status: 503, headers: { 'content-type': 'application/json' } },
          );
        }),
    );
    return;
  }

  // Pages: network-first, so a new deploy is picked up on the next visit. The cached
  // copy is only for when there's no network.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(SHELL).then((c) => c.put('/index.html', copy));
          }
          return res;
        })
        .catch(async () => (await caches.match('/index.html')) ?? (await caches.match('/')) ?? Response.error()),
    );
    return;
  }

  // Everything else (JS/CSS bundles, cached entrance photos): cache-first,
  // then fill the cache on the way past.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((res) => {
          if (res.ok && url.origin === self.location.origin) {
            const copy = res.clone();
            caches.open(SHELL).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
