import { useEffect, useState } from 'react';
import { fetchAlerts } from './cta';
import { resolveStationStatus, type StationStatus } from './stationStatus';

/**
 * Live step-free status for a station.
 *
 * Polls because an elevator can fail while the rider is already travelling — the whole
 * problem this app exists for is finding out too late. On error we surface the failure
 * rather than keeping a stale "working" on screen: a stale yes strands someone.
 */
export function useStationStatus(
  stationId: string | undefined,
  stationName: string,
  isAccessibleStation: boolean,
  pollMs = 60_000,
) {
  const [status, setStatus] = useState<StationStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!stationId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const alerts = await fetchAlerts({ accessibilityOnly: true });
        if (cancelled) return;
        setStatus(resolveStationStatus({ stationId, stationName, isAccessibleStation, alerts }));
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e as Error);
      }
    };

    load();
    const t = setInterval(load, pollMs);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [stationId, stationName, isAccessibleStation, pollMs]);

  return { status, error };
}
