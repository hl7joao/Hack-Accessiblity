/**
 * Pre-fetched Street View stills for every street entrance in the registry.
 *
 * Why cache at all: live Street View needs a working key, an active billing account
 * and a network. A demo at a venue has none of those guaranteed, and a rider standing
 * outside a station on bad signal has the last one least of all. These images are
 * committed to the repo, so the entrance view works with no key, no quota and no
 * network — and live requests still take over whenever they can.
 *
 * Four angles per entrance (the entrance heading plus 90/180/270) is enough to turn
 * and get oriented; it is not a continuous panorama.
 */

export interface CachedEntrance {
  name: string;
  /** Capture month from Street View metadata, e.g. "2024-09". */
  date?: string;
  /** heading (degrees, as a string) -> public path */
  headings: Record<string, string>;
}

import manifest from '../data/streetViewCache.json';

const CACHE = manifest as Record<string, CachedEntrance>;

export function cachedEntrance(elevatorId: string): CachedEntrance | undefined {
  return CACHE[elevatorId];
}

/** The cached angles available for an entrance, sorted. Empty when not cached. */
export function cachedHeadings(elevatorId: string): number[] {
  const entry = CACHE[elevatorId];
  return entry ? Object.keys(entry.headings).map(Number).sort((a, b) => a - b) : [];
}

/**
 * Nearest cached angle to a requested heading, and its image.
 *
 * Returns the ACTUAL angle, not just the file: with only four stills, a 45-degree
 * nudge often lands between them, and describing a photo as "looking southeast" when
 * it shows east is a lie told to exactly the person who can't check it. The caller
 * snaps its displayed heading to this value so the label, the alt text and the
 * picture always agree.
 */
export function cachedViewFor(
  elevatorId: string,
  heading: number,
): { src: string; actualHeading: number } | undefined {
  const entry = CACHE[elevatorId];
  if (!entry) return undefined;
  const available = cachedHeadings(elevatorId);
  if (available.length === 0) return undefined;
  const dist = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
  const nearest = available.reduce((best, h) => (dist(h, heading) < dist(best, heading) ? h : best));
  return { src: entry.headings[String(nearest)], actualHeading: nearest };
}

export const CACHED_ENTRANCE_COUNT = Object.keys(CACHE).length;
