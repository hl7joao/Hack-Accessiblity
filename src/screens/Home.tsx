import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { LineBadge } from '../components/LineBadge';
import { RECENT_DESTINATIONS, STATIONS } from '../data/mock';
import { fetchAlerts } from '../services/cta';
import type { ServiceAlert } from '../types';

export function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [alerts, setAlerts] = useState<ServiceAlert[]>([]);
  const nearest = STATIONS.roosevelt; // TODO: geolocation → nearest accessible station

  useEffect(() => {
    fetchAlerts({ accessibilityOnly: true }).then(setAlerts);
  }, []);

  const matches = query.trim()
    ? Object.entries(STATIONS).filter(([, s]) => s.name.toLowerCase().includes(query.trim().toLowerCase()) && s.id !== nearest.id)
    : [];

  return (
    <div className="screen">
      <header className="hero">
        <p className="eyebrow">StepFree CTA</p>
        <h1>Where are you going?</h1>
      </header>

      <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); if (matches[0]) navigate(`/plan?to=${matches[0][0]}`); }}>
        <label htmlFor="dest" className="visually-hidden">Destination station</label>
        <Icon name="search" />
        <input id="dest" type="search" placeholder="Search a station" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
      </form>

      {matches.length > 0 && (
        <ul className="list card" aria-label="Matching stations">
          {matches.map(([key, s]) => (
            <li key={key}>
              <Link to={`/plan?to=${key}`} className="list-row">
                <div>
                  <p className="row-title">{s.name}</p>
                  <div className="badges">{s.lines.map((l) => <LineBadge key={l} line={l} compact />)}</div>
                </div>
                {s.accessible ? <Icon name="wheelchair" label="Accessible station" /> : <span className="muted small">Not accessible</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="card from-card" aria-labelledby="from-h">
        <Icon name="location" />
        <div>
          <h2 id="from-h" className="row-label">Starting from</h2>
          <p className="row-title">{nearest.name}</p>
          <p className="muted small">Nearest accessible station · 2 min away</p>
        </div>
        <button className="link-btn" type="button">Change</button>
      </section>

      {alerts.length > 0 && (
        <Link to="/alerts" className="banner banner-access">
          <Icon name="elevator" />
          <span><strong>{alerts.length} elevator alert{alerts.length > 1 ? 's' : ''}</strong> may affect your trip</span>
          <Icon name="chevron" />
        </Link>
      )}

      <section aria-labelledby="recent-h">
        <h2 id="recent-h" className="section-title">Recent</h2>
        <ul className="list card">
          {RECENT_DESTINATIONS.map((d) => (
            <li key={d.stationKey}>
              <Link to={`/plan?to=${d.stationKey}`} className="list-row">
                <div>
                  <p className="row-title">{d.label}</p>
                  <p className="muted small">{d.sub}</p>
                </div>
                <Icon name="chevron" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
