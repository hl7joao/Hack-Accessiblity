import type { ElevatorStatus as Status } from '../types';
import { Icon } from './Icon';

const TEXT: Record<Status, string> = { working: 'Working', out: 'Out of service', unknown: 'Status unknown' };

export function ElevatorStatusPill({ status }: { status: Status }) {
  return (
    <span className={`pill pill-${status}`}>
      <Icon name={status === 'working' ? 'check' : status === 'out' ? 'x' : 'alert'} size={16} />
      {TEXT[status]}
    </span>
  );
}
