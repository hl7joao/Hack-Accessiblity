/**
 * Plan B — when a station is unusable, say where to go instead.
 *
 * Telling a wheelchair user "this station is not step-free right now" is only half an
 * answer; it leaves them stranded with a problem rather than a route. This finds the
 * nearest station that is genuinely usable *right now* — accessible in GTFS, no live
 * elevator outage severing its step-free path — and reports how far it is.
 *
 * Deliberately conservative: a station we can't verify is not offered. Sending someone
 * to a second dead end is worse than sending them nowhere, because they've now made
 * two trips on the promise of our answer.
 */

import type { ServiceAlert, Station } from '../types';
import { resolveStationStatus, type StationStatus } from './stationStatus';

export interface Alternative {
  station: Station;
  status: StationStatus;
  /** Straight-line distance in miles. */
  distanceMi: number;
  /** Rough step-free walking time, minutes. */
  walkMin: number;
  /** Shares at least one line with the original, so the trip still works. */
  sharesLine: boolean;
  /** Beyond the comfortable walking preference - surfaced, but flagged in the UI. */
  isFar?: boolean;
}

/** Haversine distance in miles. */
function distanceMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Walking minutes for a wheelchair user, from straight-line distance.
 *
 * 2 mph, not the 3 mph a routing API assumes: curb cuts, crossings, driveway aprons
 * and detours around obstructions all cost time. The 1.3 factor converts straight-line
 * to street distance on Chicago's grid. Rounded UP.
 *
 * This runs roughly double a typical ambulatory estimate, and that asymmetry is
 * deliberate: a rider who budgets 12 minutes for a 24-minute push misses the train,
 * while one who budgets 24 for a 15-minute push waits. The UI says "up to" so the
 * number reads as a ceiling, not a promise.
 *
 * Replace with a real pedestrian routing call when one is wired up - this is a
 * placeholder good enough to choose between two nearby stations, not a trip plan.
 */
function walkMinutes(distanceMi: number): number {
  return Math.ceil((distanceMi * 1.3) / 2 * 60);
}

export function findAlternatives(opts: {
  /** The station that isn't usable. */
  from: Station;
  /** Every station we could send them to. */
  candidates: Station[];
  alerts: ServiceAlert[];
  /**
   * Prefer alternatives within this distance. Not a hard cut: a 1.02-mile station
   * that works beats nothing at all, and an arbitrary threshold that returns zero
   * results leaves the rider exactly as stranded as before. Beyond it we still
   * offer the nearest option and let them judge.
   */
  preferWithinMi?: number;
  /** Absolute ceiling - past this, a bus or paratransit is the better answer. */
  maxDistanceMi?: number;
  limit?: number;
}): Alternative[] {
  const { from, candidates, alerts } = opts;
  const preferWithinMi = opts.preferWithinMi ?? 1.0;
  const maxDistanceMi = opts.maxDistanceMi ?? 2.5;
  const limit = opts.limit ?? 3;

  return candidates
    .filter((s) => s.id !== from.id && s.accessible)
    .map((station) => {
      const status = resolveStationStatus({
        stationId: station.id,
        stationName: station.name,
        isAccessibleStation: station.accessible,
        alerts,
      });
      const distanceMi = distanceMiles(from, station);
      return {
        station,
        status,
        distanceMi,
        walkMin: walkMinutes(distanceMi),
        sharesLine: station.lines.some((l) => from.lines.includes(l)),
      };
    })
    // Only offer what we can actually stand behind. 'degraded' is fine — there's a
    // working path, just a detour. 'unknown-impact' is not: we'd be guessing.
    .filter((a) => a.status.verdict === 'accessible' || a.status.verdict === 'degraded')
    .filter((a) => a.distanceMi <= maxDistanceMi)
    .sort((a, b) => {
      // A station on the same line keeps the trip intact; prefer it even if slightly
      // further, since the alternative means transfers the rider didn't plan for.
      if (a.sharesLine !== b.sharesLine) return a.sharesLine ? -1 : 1;
      return a.distanceMi - b.distanceMi;
    })
    .map((a) => ({ ...a, isFar: a.distanceMi > preferWithinMi }))
    .slice(0, limit);
}

export function formatDistance(mi: number): string {
  return mi < 0.1 ? `${Math.round(mi * 5280)} ft` : `${mi.toFixed(1)} mi`;
}
