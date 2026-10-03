/**
 * Train Tracker API proxy (arrival predictions).
 *
 * The key is injected here and never reaches the browser. Without a key configured
 * the app still works — station status and elevator data need none — so this returns
 * CTA's own "missing key" shape rather than a crash, and the UI degrades to its
 * normal "no arrivals" state.
 */
export const config = { runtime: 'edge' };

const ALLOWED = new Set(['ttarrivals.aspx', 'ttfollow.aspx', 'ttpositions.aspx']);

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const endpoint = url.pathname.split('/').pop() ?? '';

  if (!ALLOWED.has(endpoint)) {
    return new Response(JSON.stringify({ error: 'Unknown endpoint' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  const key = process.env.CTA_TRAIN_KEY;
  if (!key) {
    return new Response(
      JSON.stringify({
        ctatt: { errCd: '100', errNm: 'Train Tracker key not configured on the server' },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }

  const target = new URL(`https://lapi.transitchicago.com/api/1.0/${endpoint}`);
  url.searchParams.forEach((v, k) => target.searchParams.set(k, v));
  target.searchParams.set('key', key);
  target.searchParams.set('outputType', 'JSON');

  try {
    const res = await fetch(target, { headers: { accept: 'application/json' } });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=15, stale-while-revalidate=30',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Train Tracker unreachable' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
}
