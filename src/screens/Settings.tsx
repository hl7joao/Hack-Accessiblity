import { ScreenHeader } from '../components/AppShell';
import { usePreferences } from '../context/Preferences';
import type { Preferences } from '../types';

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="list-row toggle-row">
      <span>
        <span className="row-title">{label}</span>
        {hint && <span className="muted small block">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function Settings() {
  const { prefs, update } = usePreferences();

  return (
    <div className="screen">
      <ScreenHeader title="Settings" subtitle="Personalize routes and alerts" />

      <section aria-labelledby="mob-h">
        <h2 id="mob-h" className="section-title">How I get around</h2>
        <fieldset className="card chips">
          <legend className="visually-hidden">Mobility</legend>
          {(['wheelchair', 'walker', 'cane', 'none'] as Preferences['mobility'][]).map((m) => (
            <label key={m} className="chip">
              <input type="radio" name="mobility" checked={prefs.mobility === m} onChange={() => update({ mobility: m })} />
              {{ wheelchair: 'Wheelchair / scooter', walker: 'Walker', cane: 'Cane / low vision', none: 'Other' }[m]}
            </label>
          ))}
        </fieldset>
      </section>

      <section aria-labelledby="route-h">
        <h2 id="route-h" className="section-title">Routes</h2>
        <div className="list card">
          <Toggle label="Avoid stairs" checked={prefs.avoidStairs} onChange={(v) => update({ avoidStairs: v })} />
          <Toggle label="Avoid escalators" checked={prefs.avoidEscalators} onChange={(v) => update({ avoidEscalators: v })} />
        </div>
      </section>

      <section aria-labelledby="alert-h">
        <h2 id="alert-h" className="section-title">Voice and arrival alerts</h2>
        <div className="list card">
          <Toggle label="Speak directions and alerts aloud" checked={prefs.announceAloud} onChange={(v) => update({ announceAloud: v })} />
          {prefs.announceAloud && (
            <fieldset className="card chips">
              <legend>Voice pace</legend>
              {(['slow', 'normal', 'fast'] as const).map((pace) => (
                <label key={pace} className="chip">
                  <input
                    type="radio"
                    name="voicePace"
                    checked={prefs.voicePace === pace}
                    onChange={() => update({ voicePace: pace })}
                  />
                  {pace[0].toUpperCase() + pace.slice(1)}
                </label>
              ))}
            </fieldset>
          )}
          <Toggle label="Vibrate" checked={prefs.vibrate} onChange={(v) => update({ vibrate: v })} />
          <p className="muted small">
            iPhones don't let websites vibrate the phone — on iPhone you'll feel the
            notification's own buzz instead. Android vibrates with our full pattern.
          </p>
          <label className="list-row">
            <span className="row-title">Warn me before my stop</span>
            <select value={prefs.alertStopsBefore} onChange={(e) => update({ alertStopsBefore: Number(e.target.value) })}>
              <option value={1}>1 stop</option>
              <option value={2}>2 stops</option>
              <option value={3}>3 stops</option>
            </select>
          </label>
        </div>
      </section>

      <section aria-labelledby="disp-h">
        <h2 id="disp-h" className="section-title">Display</h2>
        <div className="list card">
          <label className="list-row">
            <span className="row-title">Text size</span>
            <select value={prefs.textSize} onChange={(e) => update({ textSize: e.target.value as Preferences['textSize'] })}>
              <option value="default">Default</option>
              <option value="large">Large</option>
              <option value="xlarge">Extra large</option>
            </select>
          </label>
          <Toggle label="High contrast" checked={prefs.highContrast} onChange={(v) => update({ highContrast: v })} />
        </div>
      </section>
    </div>
  );
}
