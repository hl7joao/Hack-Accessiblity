import { Link } from 'react-router-dom';
import { ScreenHeader } from '../components/AppShell';
import { SatelliteMap } from '../components/SatelliteMap';
import { StationVerdictCard } from '../components/StationVerdict';
import { StepList } from '../components/StepList';
import { StreetViewPanorama } from '../components/StreetViewPanorama';
import { TripProgress } from '../components/TripProgress';
import { useTrip } from '../context/Trip';
import { useStationStatus } from '../services/useStationStatus';
import { NoTrip } from './NoTrip';

export function StationGuide() {
  const { trip } = useTrip();
  const leg = trip?.legs[0];
  const { status, error } = useStationStatus(leg?.from.id, leg?.from.name ?? '', leg?.from.accessible ?? true);

  if (!trip || !leg) return <NoTrip />;

  // Point the 360 view at the entrance the rider should actually use: the first
  // working street-level elevator. When one is out, this is what changes - and it's
  // the difference between arriving at the right door and arriving at a dead end.
  const entrance = status?.elevators.find((e) => !e.isOut && e.spec.entrance)?.spec.entrance;

  return (
    <div className="screen">
      <ScreenHeader title={`${leg.from.name} station`} subtitle={`Get to the ${leg.toward}-bound platform`} />
      <TripProgress stage={0} />

      {/* The verdict leads: whether the station works at all decides everything below it. */}
      {status && <StationVerdictCard status={status} />}
      {error && (
        <p className="error" role="alert">
          Couldn't reach CTA for elevator status. Don't assume elevators are working —
          check the station signage or call 1-888-YOUR-CTA.
        </p>
      )}

      {entrance && (
        <section aria-labelledby="entrance-h">
          <h2 id="entrance-h" className="section-title">Look for this entrance</h2>
          <StreetViewPanorama
            lat={entrance.lat}
            lng={entrance.lng}
            heading={entrance.heading}
            description={entrance.name}
          />
        </section>
      )}

      <SatelliteMap lat={leg.from.lat} lng={leg.from.lng} label={`${leg.from.name} station entrance`} />
      <StepList steps={trip.originSteps} current={0} />
      <div className="sticky-actions">
        <Link to="/trip/platform" className="btn btn-primary">I'm on the platform</Link>
      </div>
    </div>
  );
}
