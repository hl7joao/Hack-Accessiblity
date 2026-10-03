/**
 * Customer Alerts API proxy (elevator outages, route status).
 *
 * Exists because CTA sends no CORS headers, so the browser cannot call it directly.
 * In dev the Vite proxy does this; in production this function does.
 *
 * No key needed — the accessibility-critical data is open.
 *
 * .mjs, not .ts: the project is "type": "module", and Vercel's Node runtime compiles
 * TS functions as CommonJS, which crashes at import time. An explicit .mjs removes
 * the ambiguity.
 */

const ALLOWED = new Set(['alerts.aspx', 'routes.aspx']);

export default async function handler(req, res) {
  const endpoint = String(req.query.endpoint ?? '');

  // Allowlist rather than passthrough: this must not become an open proxy that
  // anyone can point at an arbitrary host.
  if (!ALLOWED.has(endpoint)) {
    res.status(404).json({ error: 'Unknown endpoint' });
    return;
  }

  const target = new URL(`https://www.transitchicago.com/api/1.0/${endpoint}`);
  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'endpoint' || v == null) continue;
    target.searchParams.set(k, Array.isArray(v) ? v[0] : String(v));
  }
  target.searchParams.set('outputType', 'JSON');

  try {
    const upstream = await fetch(target, { headers: { accept: 'application/json' } });
    const body = await upstream.text();
    // Short cache: stale elevator status is a safety problem, but a few seconds of
    // sharing protects CTA from our traffic.
    res.setHeader('cache-control', 'public, max-age=20, stale-while-revalidate=40');
    res.setHeader('content-type', 'application/json');
    res.status(upstream.status).send(body);
  } catch {
    res.status(502).json({ error: 'CTA unreachable' });
  }
}
