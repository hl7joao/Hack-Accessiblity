import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';

export function NoTrip() {
  return (
    <div className="screen empty">
      <Icon name="route" size={48} />
      <h1>No active trip</h1>
      <p className="muted">Pick a destination to get a step-free route through the station.</p>
      <Link to="/" className="btn btn-primary">Plan a trip</Link>
    </div>
  );
}
