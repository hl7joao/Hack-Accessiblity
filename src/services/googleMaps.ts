// Google Maps Platform helpers.
//   Map Tiles API (satellite): https://developers.google.com/maps/documentation/tile/satellite
//   Street View Static API:    https://developers.google.com/maps/documentation/streetview/overview
import { GOOGLE_MAPS_KEY } from './config';

export const hasMapsKey = () => GOOGLE_MAPS_KEY.length > 0;

let sessionPromise: Promise<string> | null = null;

/** Map Tiles API requires a session token before requesting 2D tiles. */
export function getSatelliteSession(): Promise<string> {
  sessionPromise ??= fetch(`https://tile.googleapis.com/v1/createSession?key=${GOOGLE_MAPS_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mapType: 'satellite', language: 'en-US', region: 'US' }),
  })
    .then((r) => r.json())
    .then((d: { session: string }) => d.session);
  return sessionPromise;
}

export function tileUrl(session: string, z: number, x: number, y: number) {
  return `https://tile.googleapis.com/v1/2dtiles/${z}/${x}/${y}?session=${session}&key=${GOOGLE_MAPS_KEY}`;
}

/** Web Mercator lat/lng → fractional tile coordinates at zoom z. */
export function latLngToTile(lat: number, lng: number, z: number) {
  const n = 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const rad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  return { x, y };
}

export function streetViewUrl(opts: {
  lat: number;
  lng: number;
  heading?: number;
  pitch?: number;
  fov?: number;
  width?: number;
  height?: number;
}) {
  const params = new URLSearchParams({
    size: `${opts.width ?? 640}x${opts.height ?? 320}`,
    location: `${opts.lat},${opts.lng}`,
    fov: String(opts.fov ?? 80),
    pitch: String(opts.pitch ?? 0),
    source: 'outdoor',
    key: GOOGLE_MAPS_KEY,
  });
  if (opts.heading != null) params.set('heading', String(opts.heading));
  return `https://maps.googleapis.com/maps/api/streetview?${params}`;
}

/* ---------- Street View metadata ----------
 * Free, and consumes no quota:
 *   "Street View Static API metadata requests are available at no charge.
 *    No quota is consumed when you request metadata."
 * https://developers.google.com/maps/documentation/streetview/metadata
 *
 * Always call this before spending an image request. It tells us whether imagery
 * exists at all, and HOW OLD it is — which matters more than it sounds. Clark/Lake's
 * main entrance is being relocated through late 2026, so a stale panorama could send
 * a rider to a doorway that isn't there any more.
 */

export interface StreetViewMeta {
  status: 'OK' | 'ZERO_RESULTS' | 'NOT_FOUND' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST';
  /** Capture month, e.g. "2024-06". Absent on user-contributed panoramas. */
  date?: string;
  pano_id?: string;
  location?: { lat: number; lng: number };
  /** "google" for Google-captured; an account name means a rider photosphere. */
  copyright?: string;
}

const metaCache = new Map<string, Promise<StreetViewMeta>>();

export function streetViewMeta(lat: number, lng: number, radius = 50): Promise<StreetViewMeta> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)},${radius}`;
  const cached = metaCache.get(key);
  if (cached) return cached;

  // Don't cache a no-key answer: the key can arrive later (env change, new deploy),
  // and a cached REQUEST_DENIED would keep claiming "no coverage" forever after.
  if (!hasMapsKey()) return Promise.resolve<StreetViewMeta>({ status: 'REQUEST_DENIED' });

  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: String(radius),
    source: 'outdoor',
    key: GOOGLE_MAPS_KEY,
  });
  const p = fetch(`https://maps.googleapis.com/maps/api/streetview/metadata?${params}`)
    .then((r) => r.json() as Promise<StreetViewMeta>)
    .then((m) => {
      // Only a definitive answer is worth keeping. Denials and quota errors are
      // transient - caching them would outlive the condition that caused them.
      if (m.status === 'REQUEST_DENIED' || m.status === 'OVER_QUERY_LIMIT') metaCache.delete(key);
      return m;
    })
    .catch(() => {
      metaCache.delete(key);
      return { status: 'NOT_FOUND' } as StreetViewMeta;
    });

  metaCache.set(key, p);
  return p;
}

/**
 * Only Google-captured imagery is usable for guidance. User photospheres pass the
 * same metadata check but can be indoors, years old, or pointed at anything — we
 * shipped a step that said "Bus #77 stop is 50 ft east" over a photo of framed
 * artwork on a gallery wall ("© Mass Interact") before this guard existed.
 */
export function isGoogleImagery(meta: StreetViewMeta): boolean {
  return meta.status === 'OK' && /google/i.test(meta.copyright ?? '');
}

/** How stale is this imagery? Entrances get rebuilt; riders need to know. */
export function imageryAgeMonths(meta: StreetViewMeta): number | null {
  if (!meta.date) return null;
  const [y, m] = meta.date.split('-').map(Number);
  if (!y) return null;
  const now = new Date();
  return (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - (m ?? 1));
}

/**
 * Headings for a full 360 sweep, for a static panorama strip.
 * Cheaper and more predictable than loading the Maps JS SDK, and each frame is a
 * plain <img> a screen reader can be given its own description for.
 */
export function panoramaHeadings(start = 0, count = 4): number[] {
  return Array.from({ length: count }, (_, i) => (start + (360 / count) * i) % 360);
}

