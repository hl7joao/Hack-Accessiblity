import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { LineBadge } from '../components/LineBadge';
import { TripProgress } from '../components/TripProgress';
import { formatClock, minutesUntil, useNow } from '../components/hooks';
import { usePreferences } from '../context/Preferences';
import { useTrip } from '../context/Trip';
import { LINES } from '../data/lines';
import { fetchArrivals } from '../services/cta';
import { alertRider, primeSpeech, requestNotificationPermission, speakText, stopSpeaking } from '../services/notify';
import type { Arrival } from '../types';
import { NoTrip } from './NoTrip';

/** How long after the alert is turned on before the demo arrival alert fires. */
const DEMO_ALERT_DELAY_MS = 5_000;

export function Platform() {
  const { trip } = useTrip();
  const { prefs } = usePreferences();
  const navigate = useNavigate();
  const now = useNow(10_000);
  const [arrivals, setArrivals] = useState<Arrival[] | null>(null);
  const [watching, setWatching] = useState(false);
  const notified = useRef(false);
  const [arrivalAlert, setArrivalAlert] = useState<{ title: string; body: string } | null>(null);
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

  // Show the in-app alert as well as the system one: notifications may be blocked or
  // silenced, and the banner is what the rider sees while looking at the screen.
  const fireArrivalAlert = () => {
    if (notified.current || !leg) return;
    notified.current = true;
    const title = `Your ${LINES[leg.line].name} train is arriving`;
    const body = `${leg.toward}-bound. ${leg.boardingTip ?? ''}`.trim();
    setArrivalAlert({ title, body });
    alertRider(title, body, { vibrate: prefs.vibrate, speak: prefs.announceAloud, pace: prefs.voicePace });
  };

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
    if (next.isApproaching || (mins ?? 99) <= 1) fireArrivalAlert();
  });

  // Demo: once the alert is on, announce an arriving train after a short delay so the
  // flow can be shown without waiting for a real train.
  useEffect(() => {
    if (!watching) return;
    const t = setTimeout(fireArrivalAlert, DEMO_ALERT_DELAY_MS);
    return () => clearTimeout(t);
  }, [watching]);

  if (!trip || !leg) return <NoTrip />;

  return (
    <div className="screen">
      <ScreenHeader title="On the platform" subtitle={leg.platform} />

      {/* role="alert" announces without moving focus, so the rider doesn't lose their place. */}
      <div className="arrival-alert-region" role="alert">
        {arrivalAlert && (
          <div className="arrival-alert">
            <Icon name="train" size={28} />
            <div className="arrival-alert-text">
              <p className="arrival-alert-title">{arrivalAlert.title}</p>
              {arrivalAlert.body && <p>{arrivalAlert.body}</p>}
            </div>
            <button className="btn btn-secondary arrival-alert-dismiss" onClick={() => setArrivalAlert(null)}>
              Dismiss
            </button>
          </div>
        )}
      </div>
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
        onClick={() => {
          // Everything here stays synchronous: iOS only unlocks speech inside the tap
          // itself, and an awaited permission prompt that never settles must not stop
          // the alert from turning on.
          if (!watching) {
            if (prefs.announceAloud) primeSpeech("Arrival alert on. We'll tell you when your train is arriving.", prefs.voicePace);
            void requestNotificationPermission();
          }
          notified.current = false;
          setArrivalAlert(null);
          setWatching(!watching);
        }}
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
