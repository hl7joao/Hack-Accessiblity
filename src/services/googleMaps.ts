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

export function streetViewUrl(opts: { lat: number; lng: number; heading?: number; width?: number; height?: number }) {
  const params = new URLSearchParams({
    size: `${opts.width ?? 640}x${opts.height ?? 320}`,
    location: `${opts.lat},${opts.lng}`,
    fov: '80',
    pitch: '0',
    source: 'outdoor',
    key: GOOGLE_MAPS_KEY,
  });
  if (opts.heading != null) params.set('heading', String(opts.heading));
  return `https://maps.googleapis.com/maps/api/streetview?${params}`;
}
