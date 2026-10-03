import { createContext, useContext, useState, type ReactNode } from 'react';
import type { TripOption } from '../types';

const Ctx = createContext<{ trip: TripOption | null; setTrip: (t: TripOption | null) => void } | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [trip, setTrip] = useState<TripOption | null>(null);
  return <Ctx.Provider value={{ trip, setTrip }}>{children}</Ctx.Provider>;
}

export function useTrip() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTrip must be used inside TripProvider');
  return ctx;
}
