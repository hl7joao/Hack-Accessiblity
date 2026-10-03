import { Icon } from './Icon';
import { formatDistance, type Alternative } from '../services/planB';

/**
 * "Go here instead" — the other half of an unusable verdict.
 *
 * Shown only when the station the rider is heading to can't be used. Leading with a
 * route rather than an apology is the whole point: they need somewhere to go, not a
 * better explanation of why they're stuck.
 */
export function PlanBCard({
  alternatives,
  onChoose,
}: {
  alternatives: Alternative[];
  onChoose?: (alt: Alternative) => void;
}) {
  if (alternatives.length === 0) {
    return (
      <section className="planb planb-empty" aria-labelledby="planb-h">
        <h2 id="planb-h" className="planb-head">
          <Icon name="alert" size={20} /> No step-free alternative nearby
        </h2>
        <p>
          We couldn't find another accessible station within walking distance that's
          confirmed working right now.
        </p>
        <a className="btn btn-secondary" href="tel:18889687282">
          <Icon name="bell" size={18} /> Call CTA: 1-888-YOUR-CTA
        </a>
      </section>
    );
  }

  const [best, ...rest] = alternatives;

  return (
    <section className="planb" aria-labelledby="planb-h">
      <p className="planb-label">Plan B</p>
      <h2 id="planb-h" className="planb-head">
        Go to {best.station.name} instead
      </h2>

      <p className="pill pill-working planb-pill">
        <Icon name="check" size={16} />
        {best.status.verdict === 'degraded' ? 'Step-free with a detour' : 'Elevator working'}
      </p>

      <p className="planb-meta">
        {formatDistance(best.distanceMi)} · step-free street route · up to {best.walkMin} min
        {best.sharesLine && ' · same line'}
      </p>

      {best.status.verdict === 'degraded' && <p className="planb-caveat">{best.status.summary}</p>}

      {/* Say plainly when it's a long way. A rider deciding between a 40-minute push
          and waiting for the elevator deserves the distance stated, not buried. */}
      {best.isFar && (
        <p className="planb-caveat">
          That's a long way to travel on the street. Calling CTA may get you a shorter
          option, or staff assistance at this station.
        </p>
      )}

      <button
        className="btn btn-primary"
        aria-label={`Use this route: ${best.station.name}, ${formatDistance(best.distanceMi)}, about ${best.walkMin} minutes`}
        onClick={() => onChoose?.(best)}
      >
        Use this route
      </button>

      <a className="btn btn-secondary" href="tel:18889687282">
        <Icon name="bell" size={18} /> Call CTA for help
      </a>

      {rest.length > 0 && (
        <details className="planb-more">
          <summary>Other nearby stations ({rest.length})</summary>
          <ul className="planb-list">
            {rest.map((alt) => (
              <li key={alt.station.id}>
                <button
                  className="planb-alt"
                  aria-label={`Use ${alt.station.name}, ${formatDistance(alt.distanceMi)}, about ${alt.walkMin} minutes`}
                  onClick={() => onChoose?.(alt)}
                >
                  <strong>{alt.station.name}</strong>
                  <span className="muted small">
                    {formatDistance(alt.distanceMi)} · {alt.walkMin} min
                    {alt.sharesLine && ' · same line'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
