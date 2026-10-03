import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { TripProgress } from '../components/TripProgress';
import { LINES } from '../data/lines';
import { usePreferences } from '../context/Preferences';
import { useTrip } from '../context/Trip';
import { USE_MOCKS } from '../services/config';
import { alertRider } from '../services/notify';
import { NoTrip } from './NoTrip';

export function Ride() {
  const { trip } = useTrip();
  const { prefs } = usePreferences();
  const navigate = useNavigate();
  const [stopIndex, setStopIndex] = useState(-1); // -1 = departed origin, before first stop
  const alerted = useRef<Set<string>>(new Set());
  const [showAllStops, setShowAllStops] = useState(false);
  const leg = trip?.legs[0];

  // Demo: advance one stop every 4s. TODO: replace with ttfollow.aspx (run number) + geolocation.
  useEffect(() => {
    if (!USE_MOCKS || !leg) return;
    const id = setInterval(() => setStopIndex((i) => Math.min(i + 1, leg.stops.length - 1)), 4000);
    return () => clearInterval(id);
  }, [leg]);

  const total = leg?.stops.length ?? 0;
  const remaining = total - 1 - stopIndex;

  useEffect(() => {
    if (!leg) return;
    const say = (key: string, title: string, body: string) => {
      if (alerted.current.has(key)) return;
      alerted.current.add(key);
      alertRider(title, body, { vibrate: prefs.vibrate, speak: prefs.announceAloud, pace: prefs.voicePace });
    };
    if (remaining === prefs.alertStopsBefore && remaining > 0) {
      say('soon', `${leg.to.name} is ${remaining === 1 ? 'the next stop' : `in ${remaining} stops`}`, 'Get ready to exit. Doors open on the right.');
    }
    if (remaining === 0) say('arrived', `You've arrived at ${leg.to.name}`, 'Exit the train now.');
  }, [remaining, leg, prefs]);

  if (!trip || !leg) return <NoTrip />;
  const arrived = remaining === 0;

  // Compact view: the stops either side of where the rider is, plus their destination.
  // Skipped stretches collapse to a "N more stops" row so the line still reads as one route.
  const here = Math.max(stopIndex, 0);
  const visible = (i: number) => showAllStops || Math.abs(i - here) <= 1 || i === total - 1;
  const rows: ({ kind: 'stop'; i: number } | { kind: 'gap'; count: number; key: string })[] = [];
  leg.stops.forEach((_, i) => {
    if (visible(i)) rows.push({ kind: 'stop', i });
    else {
      const last = rows[rows.length - 1];
      if (last?.kind === 'gap') last.count++;
      else rows.push({ kind: 'gap', count: 1, key: `gap-${i}` });
    }
  });

  return (
    <div className="screen">
      <ScreenHeader title={`To ${leg.to.name}`} subtitle={`${LINES[leg.line].name} toward ${leg.toward}`} />
      <TripProgress stage={2} />

      <section className={`card ride-status ${arrived ? 'arrived' : ''}`} aria-live="assertive">
        {arrived ? (
          <>
            <p className="big-time">You're here</p>
            <p>Exit now at <strong>{leg.to.name}</strong></p>
          </>
        ) : (
          <>
            <p className="row-label">Stops remaining</p>
            <p className="big-time">{remaining}</p>
            <p>Next: <strong>{leg.stops[stopIndex + 1]?.name}</strong></p>
          </>
        )}
      </section>

      <ol id="stop-list" className="stop-line" aria-label="Stops on this trip">
        {rows.map((row) => {
          if (row.kind === 'gap') {
            return (
              <li key={row.key} className="gap">
                <span className="stop-gap-label">{row.count} more stop{row.count === 1 ? '' : 's'}</span>
              </li>
            );
          }
          const { i } = row;
          const s = leg.stops[i];
          return (
            <li key={s.id} className={i < stopIndex ? 'passed' : i === stopIndex ? 'here' : i === total - 1 ? 'dest' : ''} aria-current={i === stopIndex ? 'location' : undefined}>
              <span className="stop-dot" />
              <span className="stop-name">{s.name}</span>
              {!s.accessible && <span className="muted small">no elevator</span>}
              {i === total - 1 && <Icon name="pin" size={18} label="Your stop" />}
            </li>
          );
        })}
      </ol>
      {(showAllStops || rows.some((row) => row.kind === 'gap')) && (
        <button
          type="button"
          className="btn btn-secondary stop-toggle"
          aria-expanded={showAllStops}
          aria-controls="stop-list"
          onClick={() => setShowAllStops(!showAllStops)}
        >
          {showAllStops ? 'Show fewer stops' : `Show all ${total} stops`}
        </button>
      )}

      <p className="muted small center">
        <Icon name="volume" size={16} /> We'll {prefs.announceAloud ? 'announce and ' : ''}notify you {prefs.alertStopsBefore} stop{prefs.alertStopsBefore === 1 ? '' : 's'} before {leg.to.name}.
      </p>

      <div className="sticky-actions">
        <button className="btn btn-primary" onClick={() => navigate('/trip/arrive')} disabled={!arrived && USE_MOCKS}>
          {arrived ? 'Show exit route' : 'Riding…'}
        </button>
      </div>
    </div>
  );
}
