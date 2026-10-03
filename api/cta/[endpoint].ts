/**
 * Customer Alerts API proxy (elevator outages, route status).
 *
 * Exists because CTA sends no CORS headers, so the browser cannot call it directly.
 * In dev the Vite proxy does this; in production this function does.
 *
 * No key needed — the accessibility-critical data is open.
 */
export const config = { runtime: 'edge' };

const ALLOWED = new Set(['alerts.aspx', 'routes.aspx']);

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const endpoint = url.pathname.split('/').pop() ?? '';

  // Allowlist rather than passthrough: this function must not become an open proxy
  // that anyone can point at an arbitrary host.
  if (!ALLOWED.has(endpoint)) {
    return new Response(JSON.stringify({ error: 'Unknown endpoint' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  const target = new URL(`https://www.transitchicago.com/api/1.0/${endpoint}`);
  url.searchParams.forEach((v, k) => target.searchParams.set(k, v));
  target.searchParams.set('outputType', 'JSON');

  try {
    const res = await fetch(target, { headers: { accept: 'application/json' } });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        'content-type': 'application/json',
        // Short cache: elevator status going stale is a safety problem, but a few
        // seconds of sharing protects CTA from our traffic.
        'cache-control': 'public, max-age=20, stale-while-revalidate=40',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'CTA unreachable' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
}
