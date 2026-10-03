import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Preferences } from '../types';

const DEFAULTS: Preferences = {
  mobility: 'wheelchair',
  avoidStairs: true,
  avoidEscalators: true,
  textSize: 'default',
  highContrast: false,
  announceAloud: true,
  voicePace: 'normal',
  vibrate: true,
  alertStopsBefore: 1,
};

const KEY = 'stepfree:prefs';

function load(): Preferences {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return DEFAULTS;
  }
}

const Ctx = createContext<{ prefs: Preferences; update: (p: Partial<Preferences>) => void } | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      /* storage unavailable */
    }
    const root = document.documentElement;
    root.dataset.textSize = prefs.textSize;
    root.dataset.contrast = prefs.highContrast ? 'high' : 'normal';
  }, [prefs]);

  return <Ctx.Provider value={{ prefs, update: (p) => setPrefs((cur) => ({ ...cur, ...p })) }}>{children}</Ctx.Provider>;
}

export function usePreferences() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePreferences must be used inside PreferencesProvider');
  return ctx;
}
