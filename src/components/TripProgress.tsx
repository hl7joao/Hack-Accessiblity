const STAGES = ['Station', 'Platform', 'On board', 'Arrive'];

export function TripProgress({ stage }: { stage: number }) {
  return (
    <ol className="trip-progress" aria-label={`Trip progress: step ${stage + 1} of ${STAGES.length}, ${STAGES[stage]}`}>
      {STAGES.map((s, i) => (
        <li key={s} className={i < stage ? 'done' : i === stage ? 'current' : ''} aria-hidden="true">
          <span className="dot" />
          {s}
        </li>
      ))}
    </ol>
  );
}
