export type LineId = 'Red' | 'Blue' | 'Brn' | 'G' | 'Org' | 'P' | 'Pink' | 'Y';

export interface Line {
  id: LineId;
  name: string;
  color: string;
  textColor: string;
}

export interface Station {
  /** CTA parent station id (mapid), e.g. 41400 */
  id: string;
  name: string;
  lines: LineId[];
  accessible: boolean;
  lat: number;
  lng: number;
}

export type ElevatorStatus = 'working' | 'out' | 'unknown';

export interface Elevator {
  id: string;
  description: string;
  status: ElevatorStatus;
  /** Alert headline when status is 'out' */
  note?: string;
}

export type StepKind = 'enter' | 'elevator' | 'ramp' | 'fare' | 'walk' | 'platform' | 'board' | 'ride' | 'exit';

export interface RouteStep {
  id: string;
  kind: StepKind;
  title: string;
  detail?: string;
  elevatorId?: string;
  /** Optional coordinates so the step can show Street View / map context */
  lat?: number;
  lng?: number;
  heading?: number;
}

export interface TripLeg {
  line: LineId;
  from: Station;
  to: Station;
  /** CTA destination / direction, e.g. "Howard" */
  toward: string;
  platform: string;
  stops: Station[];
  boardingTip?: string;
}

export interface TripOption {
  id: string;
  summary: string;
  durationMin: number;
  stepFree: boolean;
  elevatorCount: number;
  warnings: string[];
  legs: TripLeg[];
  originSteps: RouteStep[];
  destinationSteps: RouteStep[];
}

export interface Arrival {
  runNumber: string;
  line: LineId;
  destination: string;
  stationId: string;
  arrivalTime: Date;
  isApproaching: boolean;
  isDelayed: boolean;
  isScheduled: boolean;
}

export interface ServiceAlert {
  id: string;
  headline: string;
  shortDescription: string;
  impact: string;
  severity: 'minor' | 'major' | 'accessibility';
  lines: LineId[];
  stationIds: string[];
  start: Date;
}

export interface Preferences {
  mobility: 'wheelchair' | 'walker' | 'cane' | 'none';
  avoidStairs: boolean;
  avoidEscalators: boolean;
  textSize: 'default' | 'large' | 'xlarge';
  highContrast: boolean;
  announceAloud: boolean;
  vibrate: boolean;
  /** Alert this many stops before your destination */
  alertStopsBefore: number;
}
