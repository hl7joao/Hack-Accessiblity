import { useEffect, useRef, useState } from 'react';
import {
  hasMapsKey,
  imageryAgeMonths,
  streetViewMeta,
  streetViewUrl,
  type StreetViewMeta,
} from '../services/googleMaps';

/**
 * Drag-to-look-around 360 view of a station entrance.
 *
 * Built from Street View Static stills rather than the Maps JS SDK: the SDK renders
 * into a canvas that a screen reader cannot see into, where stills are plain <img>
 * elements we can describe individually. It's also far lighter and has no extra SDK
 * load on a phone at a station entrance.
 *
 * Checks the free metadata endpoint first — no quota — so we never spend an image
 * request on a location with no coverage, and we can tell the rider how old the
 * photo is. A rebuilt entrance makes old imagery actively misleading.
 */
export function StreetViewPanorama({
  lat,
  lng,
  heading = 0,
  description,
}: {
  lat: number;
  lng: number;
  heading?: number;
  description: string;
}) {
  const [meta, setMeta] = useState<StreetViewMeta | null>(null);
  const [angle, setAngle] = useState(heading);
  const drag = useRef<{ x: number; start: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    streetViewMeta(lat, lng).then((m) => !cancelled && setMeta(m));
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, start: angle };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    // ~0.4°/px keeps a full sweep within a comfortable thumb drag on a phone.
    const next = drag.current.start + (drag.current.x - e.clientX) * 0.4;
    setAngle(((next % 360) + 360) % 360);
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const nudge = (deg: number) => setAngle((a) => ((a + deg) % 360 + 360) % 360);

  const noKey = !hasMapsKey();
  const noCoverage = Boolean(meta && meta.status !== 'OK');
  const unavailable = noKey || noCoverage;

  const ageMonths = meta ? imageryAgeMonths(meta) : null;
  const stale = ageMonths != null && ageMonths > 24;

  return (
    <figure className="pano">
      <div
        className="pano-frame"
        onPointerDown={unavailable ? undefined : onPointerDown}
        onPointerMove={unavailable ? undefined : onPointerMove}
        onPointerUp={unavailable ? undefined : onPointerUp}
        onPointerCancel={unavailable ? undefined : onPointerUp}
      >
        {unavailable ? (
          <div className="map-placeholder">
            <span>{noKey ? '360° entrance view' : 'No street imagery here'}</span>
            <small>
              {noKey
                ? 'Add VITE_GOOGLE_MAPS_API_KEY to enable'
                : 'Google has no Street View coverage at this entrance.'}
            </small>
          </div>
        ) : meta ? (
          <img
            src={streetViewUrl({ lat, lng, heading: angle, width: 640, height: 360, fov: 90 })}
            alt={`Street view of ${description}, looking ${compass(angle)}`}
            draggable={false}
          />
        ) : (
          <div className="map-placeholder">
            <span>Loading view…</span>
          </div>
        )}
      </div>

      {/* Keyboard and screen-reader path: dragging is never the only way to turn.
          Disabled rather than removed when there's no imagery, so the control set
          doesn't appear and disappear between stations. */}
      <div className="pano-controls">
        <button type="button" className="btn btn-sm" onClick={() => nudge(-45)} disabled={unavailable}>
          ← Look left
        </button>
        <span className="pano-heading" aria-live="polite">
          {unavailable ? 'View unavailable' : `Facing ${compass(angle)}`}
        </span>
        <button type="button" className="btn btn-sm" onClick={() => nudge(45)} disabled={unavailable}>
          Look right →
        </button>
      </div>

      <figcaption>
        {description}
        {meta?.date && (
          <span className={stale ? 'pano-stale' : 'pano-date'}>
            {' '}
            · Imagery from {formatMonth(meta.date)}
            {stale && ' — may be out of date'}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

function compass(deg: number): string {
  const dirs = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
  return dirs[Math.round(deg / 45) % 8];
}

function formatMonth(date: string): string {
  const [y, m] = date.split('-');
  const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return m ? `${names[Number(m) - 1]} ${y}` : y;
}
