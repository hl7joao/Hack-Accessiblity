import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/trip', label: 'Trip', icon: 'route' },
  { to: '/alerts', label: 'Alerts', icon: 'alert' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

export function AppShell() {
  const { pathname } = useLocation();
  const main = useRef<HTMLElement>(null);
  const [announcement, setAnnouncement] = useState('');
  const first = useRef(true);

  /**
   * Move focus to the new screen on navigation, and announce it.
   *
   * Without this, a route change leaves focus on <body>: a screen reader says nothing
   * and a keyboard user loses their place, so every screen starts with hunting from
   * the top. Skipped on first load, where the browser's own page-load announcement
   * already does the job.
   */
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    main.current?.focus();
    // Read the new screen's heading after it renders, so the announcement names
    // where the rider actually is rather than a route path.
    const t = setTimeout(() => {
      const h1 = document.querySelector('main h1')?.textContent?.trim();
      setAnnouncement(h1 ? `${h1}` : '');
    }, 80);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>
      {/* Names the screen after each navigation; visually hidden. */}
      <p className="sr-only" aria-live="polite" role="status">{announcement}</p>
      <main id="main" className="main" tabIndex={-1} ref={main}>
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="Primary">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'} className="tab">
            <Icon name={t.icon} size={26} />
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function ScreenHeader({ title, subtitle, back }: { title: string; subtitle?: string; back?: boolean }) {
  const navigate = useNavigate();
  const { key } = useLocation();
  return (
    <header className="screen-header">
      {back && (
        <button className="icon-btn" onClick={() => (key === 'default' ? navigate('/') : navigate(-1))} aria-label="Back">
          <Icon name="back" />
        </button>
      )}
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
    </header>
  );
}
