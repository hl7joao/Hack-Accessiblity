import type { StationStatus, StationVerdict } from '../services/stationStatus';
import { StreetViewPreview } from './StreetViewPreview';
import { Icon } from './Icon';

const ICON: Record<StationVerdict, 'check' | 'alert' | 'x'> = {
  accessible: 'check',
  degraded: 'alert',
  unusable: 'x',
  'not-accessible': 'x',
  'unknown-impact': 'alert',
};

const LABEL: Record<StationVerdict, string> = {
  accessible: 'Step-free',
  degraded: 'Step-free with a detour',
  unusable: 'Not step-free right now',
  'not-accessible': 'Not wheelchair accessible',
  'unknown-impact': 'Step-free access uncertain',
};

function sinceText(start: Date): string {
  const mins = Math.floor((Date.now() - start.getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'}`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

/**
 * The answer to "can I use this station right now?".
 *
 * The verdict is announced via a live region because it can change while the rider is
 * mid-journey, and the whole point is that they hear about it before they're committed.
 */
export function StationVerdictCard({ status }: { status: StationStatus }) {
  const broken = status.elevators.filter((e) => e.isOut);
  const working = status.elevators.filter((e) => !e.isOut);

  return (
    <section className={`verdict verdict-${status.verdict}`} aria-labelledby="verdict-heading">
      <h2 id="verdict-heading" className="verdict-head">
        <Icon name={ICON[status.verdict]} size={24} />
        {LABEL[status.verdict]}
      </h2>

      {/* Assertive: a step-free path disappearing is not a "finish what you were reading" event. */}
      <p className="verdict-summary" aria-live="assertive">
        {status.summary}
      </p>

      {broken.length > 0 && (
        <>
          <h3 className="verdict-sub">Out of service</h3>
          <ul className="elevator-list">
            {broken.map(({ spec, alert }) => (
              <li key={spec.id} className="elevator elevator-out">
                <Icon name="x" size={18} />
                <div>
                  <strong>{spec.label}</strong>
                  {alert && (
                    <span className="elevator-meta">
                      Out for {sinceText(alert.start)} · no repair estimate given
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {working.length > 0 && (
        <>
          <h3 className="verdict-sub">Working</h3>
          <ul className="elevator-list">
            {working.map(({ spec }) => (
              <li key={spec.id} className="elevator elevator-working">
                <Icon name="check" size={18} />
                <div>
                  <strong>{spec.label}</strong>
                  {spec.entrance && <span className="elevator-meta">{spec.entrance.name}</span>}
                </div>
              </li>
            ))}
          </ul>
          {/* Show the way in for the first working street entrance — the one they should head to. */}
          {working.find((e) => e.spec.entrance)?.spec.entrance && (
            <StreetViewPreview
              {...working.find((e) => e.spec.entrance)!.spec.entrance!}
              description={`${working.find((e) => e.spec.entrance)!.spec.entrance!.name} — use this entrance`}
            />
          )}
        </>
      )}

      <footer className="verdict-foot">
        <p>Last confirmed {sinceText(status.checkedAt)} ago.</p>
        {!status.isModeled && (
          <p className="verdict-caveat">
            We don't have a map of this station's elevators yet, so we can't say whether a
            step-free path remains. Elevator layouts here are community-contributed, not
            published by CTA.
          </p>
        )}
      </footer>
    </section>
  );
}
