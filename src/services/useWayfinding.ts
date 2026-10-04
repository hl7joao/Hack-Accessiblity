import { useEffect, useRef, useState } from 'react';
import {
  bearingDegrees,
  distanceMeters,
  readHeading,
  relativeBearing,
  turnInstruction,
  type Coords,
} from './wayfinding';

export interface WayfindingState {
  position: Coords | null;
  /** Metres of GPS uncertainty. Large values mean the arrow is a hint, not a fix. */
  accuracy: number | null;
  heading: number | null;
  compassUnreliable: boolean;
  distanceM: number | null;
  /** Signed turn to the target: negative left, positive right. */
  relative: number | null;
  instruction: string | null;
  error: string | null;
  /** GeolocationPositionError.code, for diagnostics. */
  errorCode: number | null;
  /** The browser's own message, which often names the real cause. */
  rawError: string | null;
  /** Which orientation event actually fired — tells us if the compass is alive. */
  orientationSource: string | null;
  fixCount: number;
}

/**
 * Tracks the rider relative to a target, from GPS and the compass.
 *
 * Smoothing matters here: a raw compass jitters several degrees at rest, and an arrow
 * that twitches is both unreadable and nauseating — the latter being a real problem
 * for the vestibular-sensitive riders this app is for. We apply a small circular
 * low-pass filter instead of rendering every reading.
 */
export function useWayfinding(target: Coords | null, active: boolean): WayfindingState {
  const [state, setState] = useState<WayfindingState>({
    position: null,
    accuracy: null,
    heading: null,
    compassUnreliable: false,
    distanceM: null,
    relative: null,
    instruction: null,
    error: null,
    errorCode: null,
    rawError: null,
    orientationSource: null,
    fixCount: 0,
  });

  const smoothed = useRef<number | null>(null);

  useEffect(() => {
    if (!active || !target) return;
    let cancelled = false;

    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, error: 'This device has no location sensor.' }));
      return;
    }

    // Browsers silently refuse location on insecure origins. Over wifi to a dev
    // server this looks identical to "permission denied", so name it explicitly.
    if (!window.isSecureContext) {
      setState((s) => ({
        ...s,
        error: 'Location needs a secure (https) connection. Open the deployed site, not a local address.',
      }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (cancelled) return;
        const position = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setState((s) => ({
          ...s,
          position,
          accuracy: pos.coords.accuracy,
          distanceM: distanceMeters(position, target),
          error: null,
          errorCode: null,
          rawError: null,
          fixCount: s.fixCount + 1,
        }));
      },
      (err) => {
        if (cancelled) return;
        const message =
          err.code === err.PERMISSION_DENIED
            ? 'Location is blocked. On iPhone: Settings › Privacy › Location Services, and allow it for Safari. Then reload.'
            : err.code === err.POSITION_UNAVAILABLE
              ? 'No location signal here — common underground or indoors.'
              : 'Still finding your location… this can take a few seconds outdoors.';
        setState((s) => ({
          ...s,
          error: message,
          // A timeout is not a dead end; watchPosition keeps trying.
          errorCode: err.code,
          rawError: err.message || null,
        }));
      },
      { enableHighAccuracy: true, maximumAge: 2_000, timeout: 15_000 },
    );

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (cancelled) return;
      const source = e.type === 'deviceorientationabsolute' ? 'absolute' : e.absolute ? 'alpha(abs)' : 'alpha(rel)';
      const { heading, unreliable } = readHeading(e);
      if (heading == null) {
        setState((s) => ({ ...s, heading: null, compassUnreliable: true, orientationSource: source }));
        return;
      }
      // Circular low-pass: average through the shortest arc so 359° → 1° doesn't
      // spin the arrow the long way round.
      const prev = smoothed.current;
      if (prev == null) {
        smoothed.current = heading;
      } else {
        const delta = ((heading - prev + 540) % 360) - 180;
        smoothed.current = (prev + delta * 0.25 + 360) % 360;
      }
      setState((s) => ({ ...s, heading: smoothed.current, compassUnreliable: unreliable, orientationSource: source }));
    };

    window.addEventListener('deviceorientationabsolute', onOrientation as EventListener);
    window.addEventListener('deviceorientation', onOrientation as EventListener);

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('deviceorientationabsolute', onOrientation as EventListener);
      window.removeEventListener('deviceorientation', onOrientation as EventListener);
    };
  }, [target, active]);

  // Derived values stay out of the sensor callbacks so they can't go out of sync.
  const { position, heading, distanceM } = state;
  const relative =
    position && heading != null && target
      ? relativeBearing(heading, bearingDegrees(position, target))
      : null;
  const instruction =
    relative != null && distanceM != null ? turnInstruction(relative, distanceM) : null;

  return { ...state, relative, instruction };
}
