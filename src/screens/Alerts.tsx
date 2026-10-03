import { useEffect, useState } from 'react';
import { ScreenHeader } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { LineBadge } from '../components/LineBadge';
import { fetchAlerts, fetchRouteStatuses, type RouteStatus } from '../services/cta';
import type { ServiceAlert } from '../types';

export function Alerts() {
  const [filter, setFilter] = useState<'access' | 'all'>('access');
  const [alerts, setAlerts] = useState<ServiceAlert[] | null>(null);
  const [routes, setRoutes] = useState<RouteStatus[]>([]);

  useEffect(() => {
    setAlerts(null);
    fetchAlerts({ accessibilityOnly: filter === 'access' }).then(setAlerts);
  }, [filter]);
  useEffect(() => { fetchRouteStatuses().then(setRoutes); }, []);

  return (
    <div className="screen">
      <ScreenHeader title="Alerts" subtitle="Elevator outages and service changes" />

      <div className="segmented" role="radiogroup" aria-label="Alert filter">
        {(['access', 'all'] as const).map((f) => (
          <button key={f} role="radio" aria-checked={filter === f} onClick={() => setFilter(f)}>
            {f === 'access' ? 'Elevators' : 'All alerts'}
          </button>
        ))}
      </div>

      <section aria-live="polite" aria-busy={!alerts}>
        {!alerts && <p className="muted">Loading…</p>}
        {alerts?.length === 0 && <p className="card">All elevators are working. 🎉</p>}
        <ul className="alert-list">
          {alerts?.map((a) => (
            <li key={a.id} className={`card alert alert-${a.severity}`}>
              <div className="alert-head">
                <Icon name={a.severity === 'accessibility' ? 'elevator' : 'alert'} />
                <h2 className="row-title">{a.headline}</h2>
              </div>
              <p>{a.shortDescription}</p>
              <div className="badges">{a.lines.map((l) => <LineBadge key={l} line={l} compact />)}</div>
              <p className="muted small">Since {a.start.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</p>
            </li>
          ))}
        </ul>
      </section>

      {routes.length > 0 && (
        <section aria-labelledby="status-h">
          <h2 id="status-h" className="section-title">Line status</h2>
          <p className="muted small">CTA line status doesn't include elevator outages. Check the elevator alerts above.</p>
          <ul className="list card">
            {routes.map((r) => (
              <li key={r.id} className="list-row">
                <span>{r.name}</span>
                <span className={r.status === 'Normal Service' ? 'ok-text' : 'warn-text'}>{r.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
