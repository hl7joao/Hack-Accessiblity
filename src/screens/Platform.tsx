import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { LineBadge } from '../components/LineBadge';
import { TripProgress } from '../components/TripProgress';
import { formatClock, minutesUntil, useNow } from '../components/hooks';
import { usePreferences } from '../context/Preferences';
import { useTrip } from '../context/Trip';
import { fetchArrivals } from '../services/cta';
import { alertRider, requestNotificationPermission, speakText, stopSpeaking } from '../services/notify';
import type { Arrival } from '../types';
import { NoTrip } from './NoTrip';

export function Platform() {
  const { trip } = useTrip();
  const { prefs } = usePreferences();
  const navigate = useNavigate();
  const now = useNow(10_000);
  const [arrivals, setArrivals] = useState<Arrival[] | null>(null);
  const [watching, setWatching] = useState(false);
  const notified = useRef(false);
  const leg = trip?.legs[0];

  useEffect(() => {
    if (!leg) return;
    const load = () => fetchArrivals(leg.from.id, leg.line).then((a) => setArrivals(a.filter((x) => x.destination === leg.toward)));
    load();
    const id = setInterval(load, 30_000); // Train Tracker updates roughly every 30–60s
    return () => clearInterval(id);
  }, [leg]);

  const next = arrivals?.[0];
  const mins = next ? minutesUntil(next.arrivalTime, now) : null;

  useEffect(() => {
    if (!prefs.announceAloud || !next || mins == null) {
      stopSpeaking();
      return;
    }

    const announcement = mins === 0
      ? `Next ${leg?.toward}-bound train is due now.`
      : `Next ${leg?.toward}-bound train in ${mins} minute${mins === 1 ? '' : 's'}.`;
    speakText(announcement, prefs.voicePace);
    return stopSpeaking;
  }, [leg?.toward, mins, next?.runNumber, prefs.announceAloud, prefs.voicePace]);

  useEffect(() => {
    if (!watching || !next || notified.current) return;
    if (next.isApproaching || (mins ?? 99) <= 1) {
      notified.current = true;
      alertRider(`Your ${next.line} Line train is arriving`, `${next.destination}-bound. ${leg?.boardingTip ?? ''}`, { vibrate: prefs.vibrate });
    }
  }, [watching, next, mins, leg, prefs]);

  if (!trip || !leg) return <NoTrip />;

  return (
    <div className="screen">
      <ScreenHeader title="On the platform" subtitle={leg.platform} />
      <TripProgress stage={1} />

      <section className="card next-train" aria-labelledby="next-h" aria-live="polite">
        <h2 id="next-h" className="row-label">Next {leg.toward}-bound train</h2>
        {next ? (
          <>
            <p className="big-time">{mins === 0 ? 'Due' : <>{mins}<span> min</span></>}</p>
            <div className="badges">
              <LineBadge line={next.line} />
              <span className="muted small">Arrives {formatClock(next.arrivalTime)} · Run #{next.runNumber}</span>
            </div>
            {next.isDelayed && <p className="warn-text">Delayed</p>}
            {next.isScheduled && <p className="muted small">Scheduled time — live tracking not yet available</p>}
          </>
        ) : (
          <p className="muted">{arrivals ? 'No trains predicted right now.' : 'Loading arrivals…'}</p>
        )}
      </section>

      {leg.boardingTip && (
        <section className="card tip">
          <Icon name="wheelchair" />
          <p>{leg.boardingTip}</p>
        </section>
      )}

      <button
        className={`btn ${watching ? 'btn-secondary' : 'btn-primary'}`}
        aria-pressed={watching}
        onClick={async () => { if (!watching) await requestNotificationPermission(); notified.current = false; setWatching(!watching); }}
      >
        <Icon name="bell" /> {watching ? 'Alert is on — tap to cancel' : 'Alert me when my train arrives'}
      </button>

      {arrivals && arrivals.length > 1 && (
        <section aria-labelledby="later-h">
          <h2 id="later-h" className="section-title">Later trains</h2>
          <ul className="list card">
            {arrivals.slice(1).map((a) => (
              <li key={a.runNumber} className="list-row">
                <span>{a.destination}</span>
                <span><strong>{minutesUntil(a.arrivalTime, now)} min</strong> <span className="muted small">· {formatClock(a.arrivalTime)}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="sticky-actions">
        <button className="btn btn-primary" onClick={() => navigate('/trip/ride')}>
          <Icon name="train" /> I'm on the train
        </button>
      </div>
    </div>
  );
}
