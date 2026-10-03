/**
 * Station accessibility resolver.
 *
 * Turns CTA's prose elevator alerts into a verdict a rider can act on:
 * can I use this station right now, or not?
 *
 * CTA's own Route Status API cannot answer this — elevator alerts score severity 5
 * and are outranked by everything, so a station whose only elevator has been dead for
 * six days still reports "Normal Service". Verified live; see docs/api-verification.md.
 */

import type { ServiceAlert } from '../types';
import {
  ELEVATOR_REGISTRY,
  elevatorsForStation,
  type ElevatorSpec,
  type PathSegment,
} from '../data/elevators';

export type StationVerdict =
  /** Step-free path confirmed intact. */
  | 'accessible'
  /** An elevator is out, but a redundant one covers the same segment. Expect a detour. */
  | 'degraded'
  /** An elevator is out with no working alternative — step-free access is severed. */
  | 'unusable'
  /** Station has no elevators and is not step-free at all (GTFS wheelchair_boarding=2). */
  | 'not-accessible'
  /** An elevator is out here but we have no model of this station, so we can't judge. */
  | 'unknown-impact';

export interface ResolvedElevator {
  spec: ElevatorSpec;
  isOut: boolean;
  /** The alert that took it out, when isOut. */
  alert?: ServiceAlert;
}

export interface StationStatus {
  stationId: string;
  verdict: StationVerdict;
  /** One plain sentence for the rider. Never hedged — they're deciding whether to travel. */
  summary: string;
  elevators: ResolvedElevator[];
  outageAlerts: ServiceAlert[];
  /** False when the station isn't in our hand-built registry. Surface this honestly. */
  isModeled: boolean;
  /** When we last confirmed this against CTA. Stale "working" strands people. */
  checkedAt: Date;
}

/**
 * Bind a prose alert to specific elevators.
 *
 * Matching is deliberately conservative: an alert only binds to an elevator when one of
 * that elevator's distinctive phrases appears in the description. A false positive here
 * marks a working elevator as broken and sends someone the long way around; a false
 * negative leaves the alert visible but unattributed, which is the safer failure.
 */
function matchAlertToElevators(alert: ServiceAlert, candidates: ElevatorSpec[]): ElevatorSpec[] {
  const text = `${alert.headline} ${alert.shortDescription}`.toLowerCase();
  return candidates.filter((e) => e.matchers.some((m) => text.includes(m.toLowerCase())));
}

/** Does any working elevator still cover this segment? */
function segmentSurvives(
  segment: PathSegment,
  all: ResolvedElevator[],
): boolean {
  const covering = all.filter((r) => r.spec.segment === segment);
  if (covering.length === 0) return true; // we don't model this segment; don't invent a failure
  return covering.some((r) => !r.isOut);
}

export function resolveStationStatus(opts: {
  stationId: string;
  stationName: string;
  /** From GTFS wheelchair_boarding — is the station step-free at all? */
  isAccessibleStation: boolean;
  alerts: ServiceAlert[];
  checkedAt?: Date;
}): StationStatus {
  const { stationId, stationName, isAccessibleStation, alerts } = opts;
  const checkedAt = opts.checkedAt ?? new Date();

  const specs = elevatorsForStation(stationId);
  const isModeled = specs.length > 0;

  const outageAlerts = alerts.filter(
    (a) => a.severity === 'accessibility' && a.stationIds.includes(stationId),
  );

  // Station was never step-free — an outage changes nothing about that.
  if (!isAccessibleStation) {
    return {
      stationId,
      verdict: 'not-accessible',
      summary: `${stationName} is not wheelchair accessible. There is no step-free entrance.`,
      elevators: [],
      outageAlerts,
      isModeled,
      checkedAt,
    };
  }

  const elevators: ResolvedElevator[] = specs.map((spec) => {
    const alert = outageAlerts.find((a) => matchAlertToElevators(a, [spec]).length > 0);
    return { spec, isOut: Boolean(alert), alert };
  });

  const out = elevators.filter((e) => e.isOut);

  if (outageAlerts.length === 0) {
    return {
      stationId,
      verdict: 'accessible',
      summary: `${stationName} is step-free. No elevator outages reported.`,
      elevators,
      outageAlerts,
      isModeled,
      checkedAt,
    };
  }

  // Outage reported, but we have no station model — say so rather than guess.
  if (!isModeled) {
    return {
      stationId,
      verdict: 'unknown-impact',
      summary:
        `An elevator is out at ${stationName}. We don't yet have a map of this ` +
        `station's elevators, so we can't tell whether a step-free path remains.`,
      elevators,
      outageAlerts,
      isModeled,
      checkedAt,
    };
  }

  // Modeled station, but the alert didn't bind to any elevator we know about.
  if (out.length === 0) {
    return {
      stationId,
      verdict: 'unknown-impact',
      summary:
        `An elevator is out at ${stationName}, but we couldn't identify which one. ` +
        `Treat step-free access as uncertain.`,
      elevators,
      outageAlerts,
      isModeled,
      checkedAt,
    };
  }

  // Does every segment whose elevator is out still have a working alternative?
  const brokenSegments = Array.from(new Set(out.map((e) => e.spec.segment)));
  const severed = brokenSegments.filter((seg) => !segmentSurvives(seg, elevators));

  if (severed.length > 0) {
    const names = out.map((e) => e.spec.label).join('; ');
    return {
      stationId,
      verdict: 'unusable',
      summary:
        `${stationName} is NOT step-free right now. ${names} is out of service and ` +
        `there is no working alternative. Plan a different station.`,
      elevators,
      outageAlerts,
      isModeled,
      checkedAt,
    };
  }

  const working = elevators.filter((e) => !e.isOut && brokenSegments.includes(e.spec.segment));
  const alt = working[0]?.spec.label ?? 'another elevator';
  return {
    stationId,
    verdict: 'degraded',
    summary:
      `${stationName} is still step-free, but ${out[0].spec.label} is out. ` +
      `Use ${alt} instead — allow extra time.`,
    elevators,
    outageAlerts,
    isModeled,
    checkedAt,
  };
}

/** Can a rider complete this journey step-free right now? Worst station governs. */
export function worstVerdict(statuses: StationStatus[]): StationVerdict {
  const rank: Record<StationVerdict, number> = {
    'not-accessible': 0,
    unusable: 1,
    'unknown-impact': 2,
    degraded: 3,
    accessible: 4,
  };
  return statuses.reduce<StationVerdict>(
    (worst, s) => (rank[s.verdict] < rank[worst] ? s.verdict : worst),
    'accessible',
  );
}

/** Stations our registry covers, for honest UI about coverage. */
export const MODELED_STATION_COUNT = new Set(ELEVATOR_REGISTRY.map((e) => e.stationId)).size;
