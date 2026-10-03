// Mock data so the UI can be built without API keys. Station ids are real CTA mapids.
// CTA publishes no pathways.txt and no car-level data, so in-station steps, elevator ids
// and boarding tips have no CTA source. They'd come from our hand-built elevator
// registry and community reports (see README "What we're building").
import type { Arrival, Elevator, ServiceAlert, Station, TripOption } from '../types';

const s = (id: string, name: string, lat: number, lng: number, accessible = true, lines: Station['lines'] = ['Red']): Station =>
  ({ id, name, lat, lng, accessible, lines });

export const STATIONS: Record<string, Station> = {
  roosevelt: s('41400', 'Roosevelt', 41.867368, -87.627402, true, ['Red', 'Org', 'G']),
  harrison: s('41490', 'Harrison', 41.874039, -87.627479, false),
  jackson: s('40560', 'Jackson', 41.878153, -87.627596, true, ['Red', 'Blue']),
  monroe: s('41090', 'Monroe', 41.880745, -87.627696, false),
  lake: s('41660', 'Lake', 41.884809, -87.627813, true),
  grand: s('40330', 'Grand', 41.891665, -87.628021, true),
  chicago: s('41450', 'Chicago', 41.896671, -87.628176, true),
  clarkDivision: s('40630', 'Clark/Division', 41.90392, -87.631412, true),
  northClybourn: s('40650', 'North/Clybourn', 41.910655, -87.649177, false),
  fullerton: s('41220', 'Fullerton', 41.925051, -87.652866, true, ['Red', 'Brn', 'P']),
  belmont: s('41320', 'Belmont', 41.939751, -87.65338, true, ['Red', 'Brn', 'P']),
};

export const RECENT_DESTINATIONS = [
  { label: 'Belmont', sub: 'Red, Brown, Purple', stationKey: 'belmont' },
  { label: 'Clark/Division', sub: 'Red', stationKey: 'clarkDivision' },
  { label: 'Fullerton', sub: 'Red, Brown, Purple', stationKey: 'fullerton' },
];

export const ELEVATORS: Record<string, Elevator> = {
  'roos-street': { id: 'roos-street', description: 'Street to mezzanine — State St & Roosevelt (NE corner)', status: 'working' },
  'roos-red': { id: 'roos-red', description: 'Mezzanine to Red Line platform', status: 'working' },
  'belm-plat': { id: 'belm-plat', description: 'Red Line platform to mezzanine', status: 'working' },
  'belm-street': { id: 'belm-street', description: 'Mezzanine to street — Belmont Ave', status: 'out', note: 'Out of service until 6 PM. Use Fullerton instead, or request a shuttle.' },
  'full-plat': { id: 'full-plat', description: 'Platform to street — Fullerton Ave', status: 'working' },
};

export const TRIP_OPTIONS: TripOption[] = [
  {
    id: 'opt-1',
    summary: 'Red Line to Belmont',
    durationMin: 24,
    stepFree: false,
    elevatorCount: 4,
    warnings: ['Belmont street elevator is out of service'],
    legs: [
      {
        line: 'Red',
        from: STATIONS.roosevelt,
        to: STATIONS.belmont,
        toward: 'Howard',
        platform: 'Red Line — northbound (Howard) side',
        stops: [STATIONS.harrison, STATIONS.jackson, STATIONS.monroe, STATIONS.lake, STATIONS.grand, STATIONS.chicago, STATIONS.clarkDivision, STATIONS.northClybourn, STATIONS.fullerton, STATIONS.belmont],
        boardingTip: 'Board the 4th car — it stops closest to the Belmont elevator.',
      },
    ],
    originSteps: [],
    destinationSteps: [],
  },
  {
    id: 'opt-2',
    summary: 'Red Line to Fullerton, then accessible bus #77',
    durationMin: 31,
    stepFree: true,
    elevatorCount: 3,
    warnings: [],
    legs: [
      {
        line: 'Red',
        from: STATIONS.roosevelt,
        to: STATIONS.fullerton,
        toward: 'Howard',
        platform: 'Red Line — northbound (Howard) side',
        stops: [STATIONS.harrison, STATIONS.jackson, STATIONS.monroe, STATIONS.lake, STATIONS.grand, STATIONS.chicago, STATIONS.clarkDivision, STATIONS.northClybourn, STATIONS.fullerton],
        boardingTip: 'Board the front car — it stops beside the Fullerton elevator.',
      },
    ],
    originSteps: [],
    destinationSteps: [],
  },
];

const ORIGIN_STEPS: TripOption['originSteps'] = [
  { id: 'o1', kind: 'enter', title: 'Enter at State St & Roosevelt Rd', detail: 'Northeast corner, glass elevator building. Automatic door on the left.', lat: 41.86745, lng: -87.62705, heading: 270 },
  { id: 'o2', kind: 'elevator', title: 'Take elevator down to mezzanine', elevatorId: 'roos-street' },
  { id: 'o3', kind: 'fare', title: 'Use the wide accessible fare gate', detail: 'Far right gate. Tap Ventra card or phone on the reader at seat height.' },
  { id: 'o4', kind: 'walk', title: 'Follow the red signs 40 ft ahead', detail: 'Level floor, tactile strip guides you to the elevator.' },
  { id: 'o5', kind: 'elevator', title: 'Take elevator to Red Line platform', elevatorId: 'roos-red' },
  { id: 'o6', kind: 'platform', title: 'Wait at the blue accessible boarding area', detail: 'Northbound (Howard) side. Marked with a wheelchair symbol, near the elevator.' },
];

TRIP_OPTIONS[0].originSteps = ORIGIN_STEPS;
TRIP_OPTIONS[1].originSteps = ORIGIN_STEPS;
TRIP_OPTIONS[0].destinationSteps = [
  { id: 'd1', kind: 'exit', title: 'Exit train and turn right', detail: 'Elevator is 30 ft from the 4th car door.' },
  { id: 'd2', kind: 'elevator', title: 'Elevator up to mezzanine', elevatorId: 'belm-plat' },
  { id: 'd3', kind: 'elevator', title: 'Elevator down to Belmont Ave', elevatorId: 'belm-street' },
];
TRIP_OPTIONS[1].destinationSteps = [
  { id: 'd1', kind: 'exit', title: 'Exit at front of train', detail: 'Elevator is directly ahead.' },
  { id: 'd2', kind: 'elevator', title: 'Elevator to Fullerton Ave', elevatorId: 'full-plat' },
  { id: 'd3', kind: 'walk', title: 'Bus #77 stop is 50 ft east', detail: 'Curb cut at the corner. Bus has a ramp at the front door.', lat: 41.92505, lng: -87.6522, heading: 90 },
];

export function mockArrivals(stationId: string): Arrival[] {
  const now = Date.now();
  return [2, 9, 16].map((min, i) => ({
    runNumber: String(812 + i * 7),
    line: 'Red',
    destination: 'Howard',
    stationId,
    arrivalTime: new Date(now + min * 60_000),
    isApproaching: min <= 1,
    isDelayed: false,
    isScheduled: false,
  }));
}

export const MOCK_ALERTS: ServiceAlert[] = [
  {
    id: 'a1',
    headline: 'Elevator at Belmont temporarily out of service',
    shortDescription: 'The elevator between the mezzanine and Belmont Ave is out of service. Use Fullerton or Addison for step-free access.',
    impact: 'Elevator Status',
    severity: 'accessibility',
    lines: ['Red', 'Brn', 'P'],
    stationIds: ['41320'],
    start: new Date(Date.now() - 3 * 3600_000),
  },
  {
    id: 'a2',
    headline: 'Red Line trains running with residual delays',
    shortDescription: 'Northbound trains are operating with minor delays after an earlier signal problem near Grand.',
    impact: 'Minor Delays',
    severity: 'minor',
    lines: ['Red'],
    stationIds: [],
    start: new Date(Date.now() - 40 * 60_000),
  },
];
