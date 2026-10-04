/**
 * Live position and heading, for pointing a rider at an accessible entrance.
 *
 * Everything here is geometry over sensor readings — compass bearing, great-circle
 * distance. Nothing is inferred from the camera. That boundary is deliberate: an
 * arrow that says "the entrance is that way" can be checked by the rider against
 * what they see, while a system claiming to *see* a clear path cannot, and is
 * exactly the failure mode that hurts someone who can't verify it.
 */

export interface Coords {
  lat: number;
  lng: number;
}

/** Great-circle distance in metres. */
export function distanceMeters(a: Coords, b: Coords): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Initial bearing from `a` to `b`, in degrees clockwise from true north. */
export function bearingDegrees(a: Coords, b: Coords): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Signed turn from where the phone faces to where the target is: -180..180. */
export function relativeBearing(deviceHeading: number, targetBearing: number): number {
  return ((targetBearing - deviceHeading + 540) % 360) - 180;
}

/** Plain-language turn instruction. Spoken aloud, so it must read naturally. */
export function turnInstruction(relative: number, distanceM: number): string {
  const a = Math.abs(relative);
  if (distanceM < 12) return "You're here";
  if (a < 20) return 'Straight ahead';
  if (a < 70) return relative > 0 ? 'Bear right' : 'Bear left';
  if (a < 115) return relative > 0 ? 'Turn right' : 'Turn left';
  if (a < 160) return relative > 0 ? 'Turn sharply right' : 'Turn sharply left';
  return 'Turn around';
}

export function formatDistance(m: number): string {
  if (m < 20) return `${Math.round(m)} m`;
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

/**
 * Compass heading, normalised across platforms.
 *
 * iOS exposes true heading as `webkitCompassHeading` (already clockwise from north).
 * Everyone else gives `alpha`, which is counter-clockwise, so it needs inverting.
 * Getting this backwards sends the rider the wrong way, which is worse than no arrow
 * at all — so when we can't trust the reading we report null rather than guess.
 */
export interface HeadingReading {
  heading: number | null;
  /** True when the OS says the compass is uncalibrated or absolute data is missing. */
  unreliable: boolean;
}

export function readHeading(e: DeviceOrientationEvent): HeadingReading {
  const webkit = (e as DeviceOrientationEvent & { webkitCompassHeading?: number })
    .webkitCompassHeading;
  if (typeof webkit === 'number' && !Number.isNaN(webkit)) {
    const accuracy = (e as DeviceOrientationEvent & { webkitCompassAccuracy?: number })
      .webkitCompassAccuracy;
    // iOS reports -1 when the compass needs calibrating; anything above ~25° of
    // error is too vague to point an arrow with.
    return { heading: webkit, unreliable: accuracy == null || accuracy < 0 || accuracy > 25 };
  }
  if (e.absolute && typeof e.alpha === 'number') {
    return { heading: (360 - e.alpha) % 360, unreliable: false };
  }
  if (typeof e.alpha === 'number') {
    // Non-absolute alpha is relative to wherever the device started, so it can't be
    // trusted as a compass bearing.
    return { heading: (360 - e.alpha) % 360, unreliable: true };
  }
  return { heading: null, unreliable: true };
}

/** iOS 13+ requires an explicit permission request, from inside a user gesture. */
type OrientationPermissionAPI = {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

export async function requestCompassPermission(): Promise<'granted' | 'denied' | 'not-needed'> {
  const api = DeviceOrientationEvent as unknown as OrientationPermissionAPI;
  if (typeof api.requestPermission !== 'function') return 'not-needed';
  try {
    return await api.requestPermission();
  } catch {
    return 'denied';
  }
}
