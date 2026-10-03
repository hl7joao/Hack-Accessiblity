import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/trip', label: 'Trip', icon: 'route' },
  { to: '/alerts', label: 'Alerts', icon: 'alert' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

export function AppShell() {
  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <main id="main" className="main" tabIndex={-1}>
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
