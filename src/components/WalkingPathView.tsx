import { useEffect, useState } from 'react';
import { hasMapsKey, isGoogleImagery, streetViewMeta, streetViewUrl } from '../services/googleMaps';

export interface PathPoint {
  lat: number;
  lng: number;
  /** Which way to look at this point — usually toward the next one. */
  heading: number;
  /** What the rider should do here. Written as an instruction, not a label. */
  instruction: string;
}

/**
 * A visual walk-up to the accessible entrance: one Street View still per decision
 * point, each with the instruction that goes with it.
 *
 * Why this exists: CTA's own station coordinates are the *facility*, not the entrance —
 * their KML says so outright ("Station locations are based on the facility, and are not
 * necessarily where an entrance to station would be"). So "you have arrived" from a
 * normal map app can leave you at a wall, or at the stair-only entrance while the one
 * with the elevator is around the corner.
 *
 * Each still is a plain <img> with its own alt text, so the sequence is as usable
 * read aloud as it is looked at.
 */
export function WalkingPathView({ points, destination }: { points: PathPoint[]; destination: string }) {
  const [coverage, setCoverage] = useState<boolean[]>([]);

  useEffect(() => {
    if (!hasMapsKey()) return;
    let cancelled = false;
    // Free metadata calls — check coverage before spending image quota.
    Promise.all(points.map((p) => streetViewMeta(p.lat, p.lng))).then((metas) => {
      if (!cancelled) setCoverage(metas.map((m) => isGoogleImagery(m)));
    });
    return () => {
      cancelled = true;
    };
  }, [points]);

  if (points.length === 0) return null;

  return (
    <section className="walkpath" aria-labelledby="walkpath-heading">
      <h3 id="walkpath-heading">Walking to {destination}</h3>
      <ol className="walkpath-list">
        {points.map((p, i) => {
          const hasImage = hasMapsKey() && coverage[i] !== false;
          return (
            <li key={`${p.lat},${p.lng},${i}`} className="walkpath-step">
              <span className="walkpath-num" aria-hidden="true">
                {i + 1}
              </span>
              <div className="walkpath-body">
                <p className="walkpath-instruction">{p.instruction}</p>
                {hasImage ? (
                  <img
                    className="walkpath-img"
                    src={streetViewUrl({ lat: p.lat, lng: p.lng, heading: p.heading, width: 400, height: 220 })}
                    alt={`Step ${i + 1}: ${p.instruction}`}
                    loading="lazy"
                  />
                ) : (
                  <div className="map-placeholder short">
                    <small>
                      {hasMapsKey() ? 'No street imagery at this point' : 'Add a Maps key for photos'}
                    </small>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="walkpath-note">
        Photos are Google Street View and may be out of date. If what you see doesn't
        match, the station entrance may have changed.
      </p>
    </section>
  );
}
