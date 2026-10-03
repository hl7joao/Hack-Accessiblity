import { useEffect, useState } from 'react';
import { hasMapsKey, streetViewMeta, streetViewUrl } from '../services/googleMaps';
import { cachedEntrance, cachedViewFor } from '../services/streetViewCache';

/**
 * A Street View still for a route step.
 *
 * Live imagery needs a working key, billing and coverage. When any of those is missing,
 * fall back to the saved entrance photo if this step has one, and otherwise say plainly
 * that there's no photo - never Google's grey "no imagery" tile or a broken image.
 */
export function StreetViewPreview({
  lat,
  lng,
  heading,
  description,
  cachedViewId,
}: {
  lat: number;
  lng: number;
  heading?: number;
  description: string;
  cachedViewId?: string;
}) {
  // 'checking' until the free metadata call says whether live imagery will load.
  const [live, setLive] = useState<'checking' | 'ok' | 'unavailable'>(hasMapsKey() ? 'checking' : 'unavailable');

  useEffect(() => {
    if (!hasMapsKey()) return;
    let cancelled = false;
    setLive('checking');
    streetViewMeta(lat, lng).then((m) => {
      if (!cancelled) setLive(m.status === 'OK' ? 'ok' : 'unavailable');
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  const cached = live === 'unavailable' && cachedViewId ? cachedViewFor(cachedViewId, heading ?? 0) : undefined;
  const cachedDate = cachedViewId ? cachedEntrance(cachedViewId)?.date : undefined;

  return (
    <figure className="streetview">
      {live === 'ok' ? (
        <img
          src={streetViewUrl({ lat, lng, heading })}
          alt={`Street View: ${description}`}
          loading="lazy"
          onError={() => setLive('unavailable')}
        />
      ) : cached ? (
        <img src={cached.src} alt={`Street View: ${description}`} loading="lazy" />
      ) : live === 'checking' ? (
        <div className="map-placeholder short" aria-hidden="true" />
      ) : (
        <div className="map-placeholder short">
          <span>No street photo</span>
          <small>{hasMapsKey() ? 'Street View is unavailable here right now' : 'Add VITE_GOOGLE_MAPS_API_KEY to enable'}</small>
        </div>
      )}
      <figcaption>
        {description}
        {cached && cachedDate && <> · saved photo from {cachedDate}</>}
      </figcaption>
    </figure>
  );
}
