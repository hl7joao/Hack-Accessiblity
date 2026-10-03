/**
 * Hand-built elevator registry — the piece CTA does not publish.
 *
 * CTA names a broken elevator only in prose, and inconsistently:
 *   "The Kimball- and Linden-bound platform elevator at Chicago (Brown, Purple Lines)"
 *   "The elevator to/from State Street at Roosevelt (Red, Orange and Green Lines)"
 *   "The elevator to/from street at the south pedestrian bridge to Cumberland"
 * …by direction served, by street, by structure. There is no elevator ID anywhere in
 * CTA's public data, so an alert cannot be bound to a physical elevator, and nothing
 * says whether a station retains a working step-free path when one goes out.
 *
 * This file is that missing layer, modeled on MBTA's `facilities.txt` — the one US
 * agency that solved this, by going outside the GTFS spec. Each elevator gets a stable
 * id, the path segment it serves, and `matchers` used to bind prose alerts to it.
 *
 * SCOPE: hand-authored for high-traffic multi-level stations. Coverage is deliberately
 * partial — 12 accurate stations beat 146 guessed ones. Stations absent here still get
 * alerts, just without a redundancy verdict (status 'degraded-unknown').
 *
 * PROVENANCE: compiled from CTA station pages and historical alert phrasing. These ids
 * are OURS, not CTA's, and are unverifiable against any agency source. Treat as a
 * best-effort community model, not authoritative — and say so in the UI.
 */

import type { LineId } from '../types';

/** Which part of the step-free journey an elevator covers. */
export type PathSegment =
  | 'street-to-mezzanine'
  | 'mezzanine-to-platform'
  | 'street-to-platform';

export interface ElevatorSpec {
  /** Stable id, ours. Format: elev-<stationId>-<slug> */
  id: string;
  /** CTA parent station id (4xxxx) */
  stationId: string;
  /** Rider-facing description, phrased the way CTA refers to it. */
  label: string;
  segment: PathSegment;
  /** Platforms/directions this elevator serves. Empty = serves all. */
  servesLines?: LineId[];
  /**
   * Lowercased substrings matched against an alert's ShortDescription.
   * A single distinctive phrase beats several loose ones — loose matchers
   * cause false positives that mark working elevators as broken.
   */
  matchers: string[];
  /**
   * Other elevators at this station covering the same segment. If any is working,
   * the step-free path survives and the station is DEGRADED rather than UNUSABLE.
   */
  redundantWith?: string[];
  /** Nearest street entrance, for Street View and walking directions. */
  entrance?: { lat: number; lng: number; heading?: number; name: string };
}

export const ELEVATOR_REGISTRY: ElevatorSpec[] = [
  // ---- Chicago (Brown, Purple) 40710 — elevated, single platform elevator ----
  {
    id: 'elev-40710-street',
    stationId: '40710',
    label: 'Street to station house',
    segment: 'street-to-mezzanine',
    matchers: ['to/from street at chicago', 'street elevator at chicago'],
    entrance: { lat: 41.89681, lng: -87.63563, heading: 180, name: 'Chicago Ave entrance' },
  },
  {
    id: 'elev-40710-platform',
    stationId: '40710',
    label: 'Station house to Kimball- and Linden-bound platform',
    segment: 'mezzanine-to-platform',
    servesLines: ['Brn', 'P'],
    // No redundantWith: this is the only platform elevator. Out = platform unreachable.
    matchers: ['kimball- and linden-bound platform elevator'],
  },

  // ---- Roosevelt (Red, Orange, Green) 41400 — multi-level, two street elevators ----
  {
    id: 'elev-41400-state',
    stationId: '41400',
    label: 'State Street entrance elevator',
    segment: 'street-to-mezzanine',
    matchers: ['to/from state street at roosevelt'],
    redundantWith: ['elev-41400-wabash'],
    entrance: { lat: 41.86728, lng: -87.62667, heading: 90, name: 'State St entrance' },
  },
  {
    id: 'elev-41400-wabash',
    stationId: '41400',
    label: 'Wabash Avenue entrance elevator',
    segment: 'street-to-mezzanine',
    matchers: ['to/from wabash', 'wabash avenue elevator at roosevelt'],
    redundantWith: ['elev-41400-state'],
    entrance: { lat: 41.86737, lng: -87.62596, heading: 270, name: 'Wabash Ave entrance' },
  },
  {
    id: 'elev-41400-subway',
    stationId: '41400',
    label: 'Mezzanine to Red Line subway platform',
    segment: 'mezzanine-to-platform',
    servesLines: ['Red'],
    matchers: ['red line platform elevator at roosevelt', 'subway platform elevator at roosevelt'],
  },
  {
    id: 'elev-41400-elevated',
    stationId: '41400',
    label: 'Mezzanine to elevated Green/Orange platform',
    segment: 'mezzanine-to-platform',
    servesLines: ['G', 'Org'],
    matchers: ['elevated platform elevator at roosevelt', 'green and orange line platform elevator'],
  },

  // ---- Cumberland (Blue) 40230 — median station, pedestrian bridges ----
  {
    id: 'elev-40230-south-bridge',
    stationId: '40230',
    label: 'South pedestrian bridge elevator',
    segment: 'street-to-platform',
    matchers: ['south pedestrian bridge to cumberland', 'south pedestrian bridge'],
    redundantWith: ['elev-40230-north-bridge'],
    entrance: { lat: 41.98406, lng: -87.83825, heading: 0, name: 'South pedestrian bridge' },
  },
  {
    id: 'elev-40230-north-bridge',
    stationId: '40230',
    label: 'North pedestrian bridge elevator',
    segment: 'street-to-platform',
    matchers: ['north pedestrian bridge to cumberland', 'north pedestrian bridge'],
    redundantWith: ['elev-40230-south-bridge'],
    entrance: { lat: 41.98466, lng: -87.83831, heading: 180, name: 'North pedestrian bridge' },
  },

  // ---- Clark/Lake (Blue, Brn, G, Org, P, Pink) 40380 — busiest transfer, two levels ----
  {
    id: 'elev-40380-street',
    stationId: '40380',
    label: 'Street to mezzanine',
    segment: 'street-to-mezzanine',
    matchers: ['to/from street at clark/lake', 'street elevator at clark/lake'],
    entrance: { lat: 41.88574, lng: -87.63098, heading: 180, name: 'Lake St entrance' },
  },
  {
    id: 'elev-40380-subway',
    stationId: '40380',
    label: 'Mezzanine to Blue Line subway platform',
    segment: 'mezzanine-to-platform',
    servesLines: ['Blue'],
    matchers: ['blue line platform elevator at clark/lake', 'subway platform elevator at clark/lake'],
  },
  {
    id: 'elev-40380-elevated',
    stationId: '40380',
    label: 'Mezzanine to elevated platform',
    segment: 'mezzanine-to-platform',
    servesLines: ['Brn', 'G', 'Org', 'P', 'Pink'],
    matchers: ['elevated platform elevator at clark/lake'],
  },

  // ---- Jackson (Red) 40560 / (Blue) 40070 — separate stations, long transfer ----
  {
    id: 'elev-40560-street',
    stationId: '40560',
    label: 'Street to Red Line mezzanine',
    segment: 'street-to-mezzanine',
    matchers: ['to/from street at jackson (red', 'state street elevator at jackson'],
    entrance: { lat: 41.87833, lng: -87.62767, heading: 90, name: 'State St entrance' },
  },
  {
    id: 'elev-40560-platform',
    stationId: '40560',
    label: 'Mezzanine to Red Line platform',
    segment: 'mezzanine-to-platform',
    servesLines: ['Red'],
    matchers: ['platform elevator at jackson (red'],
  },

  // ---- Belmont (Red, Brn, P) 41320 — elevated, high transfer volume ----
  {
    id: 'elev-41320-street',
    stationId: '41320',
    label: 'Street to station house',
    segment: 'street-to-mezzanine',
    matchers: ['to/from street at belmont', 'street elevator at belmont'],
    entrance: { lat: 41.93942, lng: -87.65312, heading: 270, name: 'Belmont Ave entrance' },
  },
  {
    id: 'elev-41320-north',
    stationId: '41320',
    label: 'Station house to Howard/Linden-bound platform',
    segment: 'mezzanine-to-platform',
    servesLines: ['Red', 'Brn', 'P'],
    matchers: ['howard-bound platform elevator at belmont', 'linden-bound platform elevator at belmont'],
  },
  {
    id: 'elev-41320-south',
    stationId: '41320',
    label: 'Station house to 95th/Loop-bound platform',
    segment: 'mezzanine-to-platform',
    servesLines: ['Red', 'Brn', 'P'],
    matchers: ['95th-bound platform elevator at belmont', 'loop-bound platform elevator at belmont'],
  },
];

/** Stations we have a hand-built model for. Others get alerts without a verdict. */
export const MODELED_STATIONS = Array.from(new Set(ELEVATOR_REGISTRY.map((e) => e.stationId)));

export function elevatorsForStation(stationId: string): ElevatorSpec[] {
  return ELEVATOR_REGISTRY.filter((e) => e.stationId === stationId);
}

export function elevatorById(id: string): ElevatorSpec | undefined {
  return ELEVATOR_REGISTRY.find((e) => e.id === id);
}
