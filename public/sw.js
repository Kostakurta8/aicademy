const CACHE_VERSION = "aicademy-v4";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

/** Immutable build assets use content-hashed filenames (safe to cache forever) */
const IMMUTABLE_RE = /\/_next\/static\/(css|media)\//;

/** Patterns that should NEVER be intercepted */
const BYPASS_RE = /(\/_next\/webpack-hmr|\/api\/|\.hot-update\.|__nextjs)/;

self.addEventListener("install", () => {
  // Skip precaching — let pages cache on first visit instead
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
            .map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests with http(s) scheme
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.protocol !== "https:" && url.protocol !== "http:") return;

  // Never intercept dev tools, HMR, API, or hot-update requests
  if (BYPASS_RE.test(url.pathname)) return;

  // Immutable assets (CSS, fonts, media) — content-hashed, cache-first
  if (IMMUTABLE_RE.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // JS chunks — network-first (chunks can change between deploys)
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || Response.error()),
        ),
    );
    return;
  }

  // Navigation & page requests — network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || Response.error()),
        ),
    );
  }
});

// ── Push Notifications ──
self.addEventListener("push", (event) => {
  const defaults = {
    title: "AIcademy",
    body: "Time to learn something new!",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    tag: "aicademy-notification",
    data: { url: "/" },
  };

  let payload = defaults;
  if (event.data) {
    try {
      payload = { ...defaults, ...event.data.json() };
    } catch {
      payload = { ...defaults, body: event.data.text() };
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      tag: payload.tag,
      data: payload.data,
      vibrate: [200, 100, 200],
      actions: [
        { action: "open", title: "Open App" },
        { action: "dismiss", title: "Dismiss" },
      ],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(url));
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      }),
  );
});
