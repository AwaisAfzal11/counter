import { createContext, useContext, type ReactNode } from 'react';
import { useCampaignClock, type Clock, type ClockEvents } from '../hooks/useCampaignClock';
import type { CampaignState } from '../lib/time';

const ClockContext = createContext<Clock | null>(null);

export function ClockProvider({ children }: { children: ReactNode }) {
  const clock = useCampaignClock();
  return <ClockContext.Provider value={clock}>{children}</ClockContext.Provider>;
}

function useClockContext(): Clock {
  const clock = useContext(ClockContext);
  if (!clock) throw new Error('useClock must be used inside <ClockProvider>');
  return clock;
}

/**
 * Live campaign state. Anything calling this re-renders once per second, so
 * only cheap leaves should. Heavy views take `dayIndex` as a prop and memoize.
 */
export function useClock(): CampaignState {
  return useClockContext().state;
}

export function useClockEvents(): ClockEvents {
  return useClockContext().events;
}
