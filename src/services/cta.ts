// CTA API client. Requests go through the Vite dev proxy (see vite.config.ts).
//   Customer Alerts API: https://www.transitchicago.com/developers/alerts/
//   Train Tracker API:   https://www.transitchicago.com/developers/ttdocs/
import type { Arrival, LineId, ServiceAlert } from '../types';
import { MOCK_ALERTS, mockArrivals } from '../data/mock';
import { USE_MOCKS } from './config';

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

/** CTA returns a single object when there's one result and an array otherwise. */
const asList = <T>(x: T | T[] | undefined | null): T[] => (x == null ? [] : Array.isArray(x) ? x : [x]);

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CTA request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

/* ---------- Customer Alerts: routes.aspx ----------
 * WARNING: never use Route Status for accessibility. Elevator alerts are severity 5 and
 * get outranked, so stations with a dead elevator report "Normal Service".
 * See docs/api-verification.md. Shown only as general line status.
 */

export interface RouteStatus {
  id: string;
  name: string;
  status: string;
}

interface RawRouteInfo {
  ServiceId: string;
  Route: string;
  RouteStatus: string;
}

interface RoutesResponse {
  CTARoutes: { RouteInfo?: RawRouteInfo | RawRouteInfo[] };
}

export async function fetchRouteStatuses(): Promise<RouteStatus[]> {
  if (USE_MOCKS) {
    await delay();
    return [
      { id: 'Red', name: 'Red Line', status: 'Minor Delays' },
      { id: 'Blue', name: 'Blue Line', status: 'Normal Service' },
      { id: 'Brn', name: 'Brown Line', status: 'Normal Service' },
    ];
  }
  const data = await getJson<RoutesResponse>('/api/cta/routes.aspx?type=rail&outputType=JSON');
  return asList(data.CTARoutes.RouteInfo).map((r) => ({ id: r.ServiceId, name: r.Route, status: r.RouteStatus }));
}

/* ---------- Customer Alerts: alerts.aspx ---------- */

interface RawService {
  ServiceType: string;
  ServiceId: string;
}

interface RawAlert {
  AlertId: string;
  Headline: string;
  ShortDescription: string;
  Impact: string;
  SeverityScore: string;
  EventStart: string;
  ImpactedService: { Service?: RawService | RawService[] };
}

export async function fetchAlerts(opts: { stationId?: string; accessibilityOnly?: boolean } = {}): Promise<ServiceAlert[]> {
  if (USE_MOCKS) {
    await delay();
    return MOCK_ALERTS.filter(
      (a) => (!opts.stationId || a.stationIds.includes(opts.stationId)) && (!opts.accessibilityOnly || a.severity === 'accessibility'),
    );
  }
  const params = new URLSearchParams({ outputType: 'JSON', activeonly: 'true' });
  if (opts.stationId) params.set('stationid', opts.stationId);
  // Never send accessibility=false: it strips elevator alerts. The default (true) is what we want.
  const data = await getJson<{ CTAAlerts: { Alert?: RawAlert | RawAlert[] } }>(`/api/cta/alerts.aspx?${params}`);
  const alerts = asList(data.CTAAlerts.Alert).map(toServiceAlert);
  return opts.accessibilityOnly ? alerts.filter((a) => a.severity === 'accessibility') : alerts;
}

// Severity bands: 1-19 informational (elevator = 5), 20-39 planned, 40-59 minor, 60+ significant/major.
function toServiceAlert(a: RawAlert): ServiceAlert {
  const services = asList(a.ImpactedService.Service);
  const isAccessibility = a.Impact === 'Elevator Status';
  return {
    id: a.AlertId,
    headline: a.Headline,
    shortDescription: a.ShortDescription,
    impact: a.Impact,
    severity: isAccessibility ? 'accessibility' : Number(a.SeverityScore) >= 60 ? 'major' : 'minor',
    lines: services.filter((s) => s.ServiceType === 'R').map((s) => s.ServiceId as LineId),
    stationIds: services.filter((s) => s.ServiceType === 'T').map((s) => s.ServiceId),
    start: new Date(a.EventStart),
  };
}

/* ---------- Train Tracker: ttarrivals.aspx (key injected by proxy) ---------- */

interface RawEta {
  staId: string;
  rn: string;
  rt: LineId;
  destNm: string;
  arrT: string;
  isApp: string;
  isDly: string;
  isSch: string;
}

export async function fetchArrivals(stationId: string, line?: LineId): Promise<Arrival[]> {
  if (USE_MOCKS) {
    await delay();
    return mockArrivals(stationId);
  }
  const params = new URLSearchParams({ mapid: stationId, max: '6' });
  if (line) params.set('rt', line);
  const data = await getJson<{ ctatt: { eta?: RawEta | RawEta[] } }>(`/api/traintracker/ttarrivals.aspx?${params}`);
  return asList(data.ctatt.eta).map((e) => ({
    runNumber: e.rn,
    line: e.rt,
    destination: e.destNm,
    stationId: e.staId,
    arrivalTime: new Date(e.arrT),
    isApproaching: e.isApp === '1',
    isDelayed: e.isDly === '1',
    isScheduled: e.isSch === '1',
  }));
}

// TODO: ttfollow.aspx?runnumber=… to track the rider's own train while on board,
// and ttpositions.aspx for live train locations on the map.
