import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/AppShell';
import { SatelliteMap } from '../components/SatelliteMap';
import { StepByStep } from '../components/StepByStep';
import { TripProgress } from '../components/TripProgress';
import { useTrip } from '../context/Trip';
import { NoTrip } from './NoTrip';

export function Arrive() {
  const { trip, setTrip } = useTrip();
  const navigate = useNavigate();
  if (!trip) return <NoTrip />;
  const leg = trip.legs[trip.legs.length - 1];

  return (
    <div className="screen">
      <ScreenHeader title={`Exit ${leg.to.name}`} subtitle="Step-free route to the street" />
      <TripProgress stage={3} />
      <SatelliteMap lat={leg.to.lat} lng={leg.to.lng} label={`${leg.to.name} station`} />
      <StepByStep groups={[{ title: 'To the street', steps: trip.destinationSteps }]} />
      <div className="sticky-actions">
        <button className="btn btn-secondary" onClick={() => { setTrip(null); navigate('/'); }}>End trip</button>
      </div>
    </div>
  );
}
