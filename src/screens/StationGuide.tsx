import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { PlanBCard } from '../components/PlanBCard';
import { StepByStep } from '../components/StepByStep';
import { TripProgress } from '../components/TripProgress';
import { useTrip } from '../context/Trip';
import type { RouteStep } from '../types';
import { findAlternatives } from '../services/planB';
import { STATIONS } from '../data/mock';
import { useStationStatus } from '../services/useStationStatus';
import { NoTrip } from './NoTrip';

export function StationGuide() {
  const { trip } = useTrip();
  const leg = trip?.legs[0];
  const { status, error } = useStationStatus(leg?.from.id, leg?.from.name ?? '', leg?.from.accessible ?? true);
  // The destination matters as much as the origin - arguably more. Being unable to
  // ENTER a station costs a detour; being unable to EXIT one strands you there.
  const dest = trip?.legs[trip.legs.length - 1]?.to;
  const { status: destStatus } = useStationStatus(dest?.id, dest?.name ?? '', dest?.accessible ?? true);

  if (!trip || !leg) return <NoTrip />;

  // Guide the rider to the entrance they should actually use: the first working
  // street-level elevator. When one is out, this is what changes - and it's the
  // difference between arriving at the right door and arriving at a dead end.
  const entranceElevator = status?.elevators.find((e) => !e.isOut && e.spec.entrance);
  const entrance = entranceElevator?.spec.entrance;

  // The walk up to that entrance comes first in the directions, so the rider follows
  // one sequence from the street to the platform.
  const approachSteps: RouteStep[] = (entrance ? entranceElevator?.spec.approach ?? [] : []).map((p, i) => ({
    id: `approach-${i}`,
    kind: 'walk',
    title: p.instruction,
    lat: p.lat,
    lng: p.lng,
    heading: p.heading,
  }));

  // When the station can't be used, lead with somewhere that can be.
  const stranded = status?.verdict === 'unusable' || status?.verdict === 'not-accessible';
  const destStranded = destStatus?.verdict === 'unusable' || destStatus?.verdict === 'not-accessible';

  const alternatives = stranded
    ? findAlternatives({ from: leg.from, candidates: Object.values(STATIONS), alerts: status.outageAlerts })
    : [];
  const destAlternatives = destStranded && dest
    ? findAlternatives({ from: dest, candidates: Object.values(STATIONS), alerts: destStatus.outageAlerts })
    : [];

  return (
    <div className="screen">
      {/* The station name is the one thing the rider must match against signage, so it leads. */}
      <header className="station-header">
        <p className="eyebrow">Your station</p>
        <h1>{leg.from.name}</h1>
        <p className="station-header-sub">Get to the {leg.toward}-bound platform</p>
      </header>
      <TripProgress stage={0} />

      {stranded && <PlanBCard alternatives={alternatives} />}

      {/* Warn about the destination before they board, not after they arrive. */}
      {destStranded && dest && destStatus && (
        <section className="dest-warning" aria-labelledby="dest-h">
          <h2 id="dest-h" className="planb-head">
            <Icon name="alert" size={20} /> Your destination isn't step-free
          </h2>
          <p>{destStatus.summary}</p>
          <PlanBCard alternatives={destAlternatives} />
        </section>
      )}
      {error && (
        <p className="error" role="alert">
          Couldn't reach CTA for elevator status. Don't assume elevators are working —
          check the station signage or call 1-888-YOUR-CTA.
        </p>
      )}

      <StepByStep
        groups={[
          { title: entrance ? `To the ${entrance.name}` : 'To the station', steps: approachSteps },
          { title: 'Through the station', steps: trip.originSteps },
        ]}
      />
      <div className="sticky-actions">
        <Link to="/trip/platform" className="btn btn-primary">I'm on the platform</Link>
      </div>
    </div>
  );
}
