import { Link } from 'react-router-dom';
import { ScreenHeader } from '../components/AppShell';
import { SatelliteMap } from '../components/SatelliteMap';
import { StationVerdictCard } from '../components/StationVerdict';
import { StepList } from '../components/StepList';
import { TripProgress } from '../components/TripProgress';
import { useTrip } from '../context/Trip';
import { useStationStatus } from '../services/useStationStatus';
import { NoTrip } from './NoTrip';

export function StationGuide() {
  const { trip } = useTrip();
  const leg = trip?.legs[0];
  const { status, error } = useStationStatus(leg?.from.id, leg?.from.name ?? '', leg?.from.accessible ?? true);

  if (!trip || !leg) return <NoTrip />;

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

      <SatelliteMap lat={leg.from.lat} lng={leg.from.lng} label={`${leg.from.name} station entrance`} />
      <StepList steps={trip.originSteps} current={0} />
      <div className="sticky-actions">
        <Link to="/trip/platform" className="btn btn-primary">I'm on the platform</Link>
      </div>
    </div>
  );
}
