/* Qintar offline support: public site shell only; no user transaction data is read or cached. */
'use strict';

const SHELL_CACHE = 'qintar-shell-v3';
const RATE_CACHE = 'qintar-rates-v1';
const MAX_RATE_AGE_MS = 72 * 60 * 60 * 1000;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/about.html',
  '/article.html',
  '/big-goal-planning.html',
  '/blog.html',
  '/budget-50-30-20.html',
  '/contact.html',
  '/credit-cards-smart.html',
  '/currency-converter.html',
  '/debt-payoff-plan.html',
  '/editorial-policy.html',
  '/emergency-fund.html',
  '/expense-tracking.html',
  '/family-budget.html',
  '/investing-basics.html',
  '/personal-loans-guide.html',
  '/privacy.html',
  '/reduce-expenses.html',
  '/rent-vs-buy.html',
  '/zakat-guide.html',
  '/retirement-planning.html',
  '/salary-negotiation.html',
  '/terms.html',
  '/travel-budget.html',
  '/variable-income.html',
  '/young-money-mistakes.html',
  '/offline.html',
  '/offline-status.js',
  '/sw.js',
  '/site.webmanifest',
  '/favicon.ico',
  '/icon-32.png',
  '/icon-48.png',
  '/icon-180.png',
  '/icon-192.png',
  '/icon-512.png',
  '/og-image.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => (key.startsWith('qintar-shell-') && key !== SHELL_CACHE) ||
        (key.startsWith('qintar-rates-') && key !== RATE_CACHE))
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function cachedShellResponse(request) {
  const cache = await caches.open(SHELL_CACHE);
  return (await cache.match(request, { ignoreSearch: true })) || null;
}

async function handleSameOrigin(request) {
  const url = new URL(request.url);
  const isNavigation = request.mode === 'navigate';

  if (isNavigation) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(SHELL_CACHE);
        await cache.put(new Request(url.origin + url.pathname), response.clone());
      }
      if (response.status >= 500) {
        return (await cachedShellResponse(request)) || response;
      }
      return response;
    } catch (_) {
      return (await cachedShellResponse(request)) ||
        (await caches.match('/offline.html')) || Response.error();
    }
  }

  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok && url.origin === self.location.origin) {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    return Response.error();
  }
}

async function cachedRatesResponse(request) {
  const cache = await caches.open(RATE_CACHE);
  const cached = await cache.match(request);
  if (!cached) return null;

  try {
    const payload = await cached.json();
    const updated = Number(payload && payload.time_last_update_unix) * 1000;
    const age = Date.now() - updated;
    if (payload.result !== 'success' || payload.base_code !== 'SAR' ||
        !payload.rates || !Number.isFinite(updated) || age < -24 * 60 * 60 * 1000 ||
        age > MAX_RATE_AGE_MS) return null;

    payload.qintar_offline_fallback = true;
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  } catch (_) {
    return null;
  }
}

async function handleRates(request) {
  try {
    const response = await fetch(new Request(request, { cache: 'no-cache' }));
    if (!response.ok) return (await cachedRatesResponse(request)) || response;

    const payload = await response.clone().json();
    const updated = Number(payload && payload.time_last_update_unix) * 1000;
    const now = Date.now();
    const valid = payload && payload.result === 'success' && payload.base_code === 'SAR' &&
      payload.rates && Number.isFinite(updated) && updated > 0 &&
      updated <= now + 24 * 60 * 60 * 1000 && now - updated <= MAX_RATE_AGE_MS;

    if (valid) {
      const cache = await caches.open(RATE_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    return (await cachedRatesResponse(request)) || Response.error();
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(handleSameOrigin(request));
    return;
  }

  if (url.origin === 'https://open.er-api.com' &&
      url.pathname === '/v6/latest/SAR' && !url.search) {
    event.respondWith(handleRates(request));
  }
});
