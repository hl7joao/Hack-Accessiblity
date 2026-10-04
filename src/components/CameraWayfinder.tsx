import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { formatDistance, requestCompassPermission, type Coords } from '../services/wayfinding';
import { useWayfinding } from '../services/useWayfinding';
import { speakText } from '../services/notify';
import { usePreferences } from '../context/Preferences';

/**
 * First-person view: the phone camera with an arrow pointing at the accessible entrance.
 *
 * The camera is a viewfinder, not a sensor. Nothing here reads the image — the arrow
 * comes from GPS and the compass, and the elevator status comes from CTA. That matters:
 * a rider can glance up and check an arrow against the street, but could never check a
 * claim that the system had *seen* a clear path. We don't make claims they can't verify.
 *
 * Everything degrades: no camera permission still gives the arrow on a plain background;
 * no compass still gives distance and status.
 */
export function CameraWayfinder({
  target,
  label,
  status,
  onClose,
}: {
  target: Coords;
  label: string;
  /** Live elevator status for this entrance, e.g. "Elevator working". */
  status?: { text: string; ok: boolean };
  onClose: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [camera, setCamera] = useState<'idle' | 'on' | 'denied' | 'unsupported'>('idle');
  const [compassAsked, setCompassAsked] = useState(false);
  const { prefs } = usePreferences();
  const {
    distanceM, relative, instruction, accuracy, compassUnreliable, error, heading,
    position, errorCode, rawError, orientationSource, fixCount,
  } = useWayfinding(target, true);
  const [showDiag, setShowDiag] = useState(false);

  const needsCompassPermission =
    typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown })
      .requestPermission === 'function';

  const spokenRef = useRef<string | null>(null);

  // Start the camera. Back camera where there is one; a laptop's single camera still
  // works, which keeps this demoable without a phone.
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera('unsupported');
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play().catch(() => {});
        }
        setCamera('on');
      })
      .catch(() => !cancelled && setCamera('denied'));

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Announce each new instruction once. Riders using this are often not looking at
  // the screen — that's the point — so the turn has to be spoken, not just drawn.
  useEffect(() => {
    if (!instruction || !prefs.announceAloud) return;
    if (spokenRef.current === instruction) return;
    spokenRef.current = instruction;
    const dist = distanceM != null ? `, ${formatDistance(distanceM)}` : '';
    speakText(`${instruction}${dist}`, prefs.voicePace);
  }, [instruction, distanceM, prefs.announceAloud, prefs.voicePace]);

  const askCompass = async () => {
    setCompassAsked(true);
    await requestCompassPermission();
  };

  const arrived = distanceM != null && distanceM < 12;

  return (
    <div className="arview" role="region" aria-label={`Live camera directions to ${label}`}>
      {camera === 'on' ? (
        <video ref={video} className="arview-video" playsInline muted aria-hidden="true" />
      ) : (
        <div className="arview-video arview-nocam" aria-hidden="true" />
      )}

      {/* One live region for the whole overlay: the turn and distance change together,
          and announcing them separately would talk over itself. */}
      <div className="arview-overlay">
        <div className="arview-top">
          <button className="arview-close" onClick={onClose} aria-label="Close camera directions">
            <Icon name="x" size={24} />
          </button>
          <p className="arview-target">{label}</p>
        </div>

        <div className="arview-center" aria-live="polite" aria-atomic="true">
          {relative != null && !arrived && (
            <span
              className="arview-arrow"
              style={{ transform: `rotate(${relative}deg)` }}
              aria-hidden="true"
            >
              ↑
            </span>
          )}
          {arrived && (
            <span className="arview-arrived" aria-hidden="true">
              <Icon name="check" size={56} />
            </span>
          )}
          <p className="arview-instruction">
            {instruction ?? (error ? 'Can’t locate you' : 'Finding you…')}
          </p>
          {/* The reason belongs next to the symptom, not buried at the bottom. */}
          {error && !distanceM && <p className="arview-blocked">{error}</p>}
          {distanceM != null && <p className="arview-distance">{formatDistance(distanceM)}</p>}
        </div>

        <div className="arview-bottom">
          {status && (
            <p className={`arview-status ${status.ok ? 'ok' : 'bad'}`}>
              <Icon name={status.ok ? 'check' : 'x'} size={18} />
              {status.text}
            </p>
          )}

          {/* iOS needs a tap before it releases compass data. Only shown while we
              genuinely have no heading — on Android and desktop it would be a button
              that does nothing. */}
          {!compassAsked && needsCompassPermission && heading == null && (
            <button className="btn btn-primary" onClick={askCompass}>
              <Icon name="route" size={18} /> Turn on the compass
            </button>
          )}

          {compassUnreliable && (
            <p className="arview-note">
              Compass needs calibrating — move the phone in a figure of eight. Until then,
              trust the distance rather than the arrow.
            </p>
          )}
          {accuracy != null && accuracy > 30 && (
            <p className="arview-note">
              Location is only accurate to about {Math.round(accuracy)} m here, so the
              arrow is a rough guide.
            </p>
          )}
          {camera === 'denied' && (
            <p className="arview-note">
              Camera is off, so you'll just see the arrow. Directions still work.
            </p>
          )}
          {error && distanceM != null && <p className="arview-note arview-error">{error}</p>}

          {/* Diagnostics: turns "it doesn't work" into numbers we can act on. */}
          <button className="arview-diag-toggle" onClick={() => setShowDiag((v) => !v)}>
            {showDiag ? 'Hide' : 'Show'} technical details
          </button>
          {showDiag && (
            <dl className="arview-diag">
              <dt>Secure context</dt><dd>{String(window.isSecureContext)}</dd>
              <dt>Geolocation API</dt><dd>{'geolocation' in navigator ? 'present' : 'missing'}</dd>
              <dt>GPS fixes</dt><dd>{fixCount}</dd>
              <dt>Position</dt>
              <dd>{position ? `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}` : 'none'}</dd>
              <dt>Accuracy</dt><dd>{accuracy != null ? `${Math.round(accuracy)} m` : '—'}</dd>
              <dt>Error</dt><dd>{errorCode != null ? `code ${errorCode}: ${rawError ?? ''}` : 'none'}</dd>
              <dt>Compass event</dt><dd>{orientationSource ?? 'never fired'}</dd>
              <dt>Heading</dt><dd>{heading != null ? `${Math.round(heading)}°` : 'none'}</dd>
              <dt>Needs iOS permission</dt><dd>{String(needsCompassPermission)}</dd>
              <dt>Camera</dt><dd>{camera}</dd>
              <dt>Standalone app</dt>
              <dd>{String(window.matchMedia('(display-mode: standalone)').matches)}</dd>
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
