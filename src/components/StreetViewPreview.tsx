import { hasMapsKey, streetViewUrl } from '../services/googleMaps';

export function StreetViewPreview({ lat, lng, heading, description }: { lat: number; lng: number; heading?: number; description: string }) {
  return (
    <figure className="streetview">
      {hasMapsKey() ? (
        <img src={streetViewUrl({ lat, lng, heading })} alt={`Street View: ${description}`} loading="lazy" />
      ) : (
        <div className="map-placeholder short">
          <span>Street View preview</span>
          <small>Add VITE_GOOGLE_MAPS_API_KEY to enable</small>
        </div>
      )}
      <figcaption>{description}</figcaption>
    </figure>
  );
}
