import { ELEVATORS } from '../data/mock';
import type { RouteStep, StepKind } from '../types';
import { ElevatorStatusPill } from './ElevatorStatus';
import { Icon, type IconName } from './Icon';
import { StreetViewPreview } from './StreetViewPreview';

export const STEP_ICON: Record<StepKind, IconName> = {
  enter: 'door', elevator: 'elevator', ramp: 'wheelchair', fare: 'ticket', walk: 'walk',
  platform: 'pin', board: 'train', ride: 'train', exit: 'door',
};

/** A step's title, detail, elevator status and photo - shared by the list and one-at-a-time views. */
export function StepDetails({ step, showPreview = true }: { step: RouteStep; showPreview?: boolean }) {
  const elevator = step.elevatorId ? ELEVATORS[step.elevatorId] : undefined;
  return (
    <>
      <p className="step-title">{step.title}</p>
      {step.detail && <p className="muted">{step.detail}</p>}
      {elevator && (
        <div className="step-elevator">
          <ElevatorStatusPill status={elevator.status} />
          {elevator.note && <p className="warn-text">{elevator.note}</p>}
        </div>
      )}
      {showPreview && step.lat != null && step.lng != null && (
        <StreetViewPreview lat={step.lat} lng={step.lng} heading={step.heading} description={step.title} cachedViewId={step.cachedViewId} />
      )}
    </>
  );
}

export function StepList({ steps, current = -1 }: { steps: RouteStep[]; current?: number }) {
  return (
    <ol className="steps">
      {steps.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li key={step.id} className={`step step-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="step-icon"><Icon name={STEP_ICON[step.kind]} /></span>
            <div className="step-body">
              <StepDetails step={step} showPreview={state !== 'done'} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
