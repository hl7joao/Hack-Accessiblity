import { useEffect, useState } from 'react';
import { usePreferences } from '../context/Preferences';
import { speakText, stopSpeaking } from '../services/notify';
import type { RouteStep } from '../types';
import { Icon } from './Icon';
import { STEP_ICON, StepDetails } from './StepList';

export interface StepGroup {
  /** Which part of the journey these steps cover, e.g. "To the station". */
  title: string;
  steps: RouteStep[];
}

/**
 * One step at a time, so the rider only has to hold the instruction in front of them.
 * Groups run back to back, so walking to the station and moving through it read as
 * one continuous set of directions.
 *
 * Prev/Next use aria-disabled rather than disabled at the ends: a disabled button drops
 * keyboard and screen-reader focus, leaving the rider lost mid-route.
 */
export function StepByStep({ groups }: { groups: StepGroup[] }) {
  const [index, setIndex] = useState(0);
  const { prefs } = usePreferences();
  const steps = groups.flatMap((g) => g.steps.map((step) => ({ step, group: g.title })));

  // Clamp in case the step list shrinks underneath us (e.g. elevator status loads late).
  const current = Math.min(index, Math.max(steps.length - 1, 0));
  const currentStep = steps[current];

  useEffect(() => {
    if (!prefs.announceAloud || !currentStep) {
      stopSpeaking();
      return;
    }

    const instruction = [currentStep.step.title, currentStep.step.detail]
      .filter(Boolean)
      .join('. ');
    speakText(instruction, prefs.voicePace);
    return stopSpeaking;
  }, [current, currentStep?.step.id, currentStep?.step.title, currentStep?.step.detail, prefs.announceAloud, prefs.voicePace]);

  if (!currentStep) return null;

  const { step, group } = currentStep;
  const isFirst = current === 0;
  const isLast = current === steps.length - 1;

  return (
    <section className="step-by-step" aria-labelledby="step-by-step-h">
      <h2 id="step-by-step-h" className="section-title">Directions</h2>

      <div className="step-card" aria-live="polite">
        <div className="step-card-head">
          <span className="step-icon step-icon-current"><Icon name={STEP_ICON[step.kind]} /></span>
          <div>
            <p className="step-group">{group}</p>
            <p className="step-count">Step {current + 1} of {steps.length}</p>
          </div>
        </div>
        <div className="step-body">
          <StepDetails key={step.id} step={step} />
        </div>
        {step.lat != null && step.lng != null && (
          <p className="walkpath-note">
            Photos are Google Street View and may be out of date. If what you see doesn't
            match, the entrance may have changed.
          </p>
        )}
      </div>

      <div className="step-nav">
        <button
          type="button"
          className="btn btn-secondary"
          aria-disabled={isFirst}
          onClick={() => !isFirst && setIndex(current - 1)}
        >
          <Icon name="back" size={20} /> Previous
        </button>
        <button
          type="button"
          className="btn btn-primary"
          aria-disabled={isLast}
          onClick={() => !isLast && setIndex(current + 1)}
        >
          Next <Icon name="chevron" size={20} />
        </button>
      </div>
    </section>
  );
}
