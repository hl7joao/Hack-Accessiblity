import { LINES } from '../data/lines';
import type { LineId } from '../types';

export function LineBadge({ line, compact }: { line: LineId; compact?: boolean }) {
  const l = LINES[line];
  return (
    <span className="line-badge" style={{ background: l.color, color: l.textColor }}>
      {compact ? l.name.replace(' Line', '') : l.name}
    </span>
  );
}
