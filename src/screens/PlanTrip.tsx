import { useNavigate, useSearchParams } from 'react-router-dom';
import { ScreenHeader } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { LineBadge } from '../components/LineBadge';
import { useTrip } from '../context/Trip';
import { usePreferences } from '../context/Preferences';
import { STATIONS, TRIP_OPTIONS } from '../data/mock';

export function PlanTrip() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setTrip } = useTrip();
  const { prefs } = usePreferences();
  const dest = STATIONS[params.get('to') ?? 'belmont'] ?? STATIONS.belmont;

  // TODO: real routing — combine GTFS (stops/pathways) with live elevator alerts.
  const options = [...TRIP_OPTIONS].sort((a, b) => Number(b.stepFree) - Number(a.stepFree));

  return (
    <div className="screen">
      <ScreenHeader back title={`To ${dest.name}`} subtitle={`From Roosevelt · ${prefs.avoidStairs ? 'No stairs' : 'Any route'}${prefs.avoidEscalators ? ', no escalators' : ''}`} />

      <ul className="options" aria-label="Route options">
        {options.map((o, i) => (
          <li key={o.id}>
            <article className={`card option ${o.stepFree ? '' : 'option-warn'}`} aria-labelledby={`${o.id}-h`}>
              {i === 0 && o.stepFree && <p className="tag">Recommended</p>}
              <div className="option-top">
                <h2 id={`${o.id}-h`} className="row-title">{o.summary}</h2>
                <p className="duration"><strong>{o.durationMin}</strong> min</p>
              </div>
              <div className="badges">
                {o.legs.map((l, j) => <LineBadge key={j} line={l.line} />)}
                <span className={`pill ${o.stepFree ? 'pill-working' : 'pill-out'}`}>
                  <Icon name={o.stepFree ? 'check' : 'alert'} size={16} />
                  {o.stepFree ? 'Step-free' : 'Not step-free today'}
                </span>
              </div>
              <p className="muted small">
                <Icon name="elevator" size={16} /> {o.elevatorCount} elevators · {o.legs[0].stops.length} stops
              </p>
              {o.warnings.map((w) => <p key={w} className="warn-text">{w}</p>)}
              {/* Every option's button says "Start this trip", so a screen reader user
                  tabbing the list would hear the same label repeatedly with no way to
                  tell a step-free route from one that isn't. The label names the route
                  and its step-free state; the visible text stays short. */}
              <button
                className="btn btn-primary"
                aria-label={`Start this trip: ${o.summary}, ${o.durationMin} minutes, ${o.stepFree ? 'step-free' : 'not step-free today'}`}
                onClick={() => { setTrip(o); navigate('/trip'); }}
              >
                Start this trip
              </button>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
