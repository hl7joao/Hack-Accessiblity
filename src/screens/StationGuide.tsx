import { Link } from 'react-router-dom';
import { ScreenHeader } from '../components/AppShell';
import { SatelliteMap } from '../components/SatelliteMap';
import { StepList } from '../components/StepList';
import { TripProgress } from '../components/TripProgress';
import { useTrip } from '../context/Trip';
import { NoTrip } from './NoTrip';

export function StationGuide() {
  const { trip } = useTrip();
  if (!trip) return <NoTrip />;
  const leg = trip.legs[0];

  return (
    <div className="screen">
      <ScreenHeader title={`${leg.from.name} station`} subtitle={`Get to the ${leg.toward}-bound platform`} />
      <TripProgress stage={0} />
      <SatelliteMap lat={leg.from.lat} lng={leg.from.lng} label={`${leg.from.name} station entrance`} />
      <StepList steps={trip.originSteps} current={0} />
      <div className="sticky-actions">
        <Link to="/trip/platform" className="btn btn-primary">I'm on the platform</Link>
      </div>
    </div>
  );
}
