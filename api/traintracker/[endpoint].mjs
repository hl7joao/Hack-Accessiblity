/**
 * Train Tracker API proxy (arrival predictions).
 *
 * The key is injected here and never reaches the browser. Without a key the app still
 * works — station status and elevator data need none — so this returns CTA's own
 * "missing key" shape rather than crashing, and the UI degrades to "no arrivals".
 */

const ALLOWED = new Set(['ttarrivals.aspx', 'ttfollow.aspx', 'ttpositions.aspx']);

export default async function handler(req, res) {
  const endpoint = String(req.query.endpoint ?? '');

  if (!ALLOWED.has(endpoint)) {
    res.status(404).json({ error: 'Unknown endpoint' });
    return;
  }

  const key = process.env.CTA_TRAIN_KEY;
  if (!key) {
    res.status(200).json({
      ctatt: { errCd: '100', errNm: 'Train Tracker key not configured on the server' },
    });
    return;
  }

  const target = new URL(`https://lapi.transitchicago.com/api/1.0/${endpoint}`);
  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'endpoint' || v == null) continue;
    target.searchParams.set(k, Array.isArray(v) ? v[0] : String(v));
  }
  target.searchParams.set('key', key);
  target.searchParams.set('outputType', 'JSON');

  try {
    const upstream = await fetch(target, { headers: { accept: 'application/json' } });
    const body = await upstream.text();
    res.setHeader('cache-control', 'public, max-age=15, stale-while-revalidate=30');
    res.setHeader('content-type', 'application/json');
    res.status(upstream.status).send(body);
  } catch {
    res.status(502).json({ error: 'Train Tracker unreachable' });
  }
}
