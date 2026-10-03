import { useEffect, useState } from 'react';
import { getSatelliteSession, hasMapsKey, latLngToTile, tileUrl } from '../services/googleMaps';

/**
 * 3×3 grid of Google satellite tiles centred on a point, with a marker.
 * Placeholder until we choose a full map renderer (e.g. MapLibre + Map Tiles API).
 */
export function SatelliteMap({ lat, lng, zoom = 19, label }: { lat: number; lng: number; zoom?: number; label: string }) {
  const [session, setSession] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!hasMapsKey()) return;
    getSatelliteSession().then(setSession).catch(() => setFailed(true));
  }, []);

  const { x, y } = latLngToTile(lat, lng, zoom);
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  // Offset so the exact point sits in the centre of the frame (each tile = 1/3 of grid).
  const offX = ((x - tx - 0.5) / 3) * 100;
  const offY = ((y - ty - 0.5) / 3) * 100;

  return (
    <figure className="sat-map" aria-label={`Satellite view of ${label}`}>
      {session && !failed ? (
        <div className="sat-grid" style={{ transform: `translate(${-offX}%, ${-offY}%)` }}>
          {[-1, 0, 1].flatMap((dy) =>
            [-1, 0, 1].map((dx) => <img key={`${dx},${dy}`} src={tileUrl(session, zoom, tx + dx, ty + dy)} alt="" />),
          )}
        </div>
      ) : (
        <div className="map-placeholder">
          <span>Satellite map</span>
          <small>{hasMapsKey() ? 'Loading…' : 'Add VITE_GOOGLE_MAPS_API_KEY to enable'}</small>
        </div>
      )}
      {session && <span className="map-marker" aria-hidden="true" />}
      <figcaption className="map-attrib">{session ? 'Imagery © Google' : label}</figcaption>
    </figure>
  );
}
