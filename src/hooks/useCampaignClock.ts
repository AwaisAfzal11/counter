import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Act } from '../lib/constants';
import { computeCampaignState, type CampaignState, type WindowState } from '../lib/time';

export interface ClockEvents {
  /** Bumped on day rollover — drives the odometer roll. */
  rolloverKey: number;
  /** Transient flash when the window opens or closes. */
  windowFlash: 'OPEN' | 'CLOSED' | null;
  /** Set at an Act boundary; full-screen takeover until dismissed or timed out. */
  actTransition: Act | null;
  /** Battle-concluded toast. */
  toast: string | null;
  dismissActTransition: () => void;
}

export interface Clock {
  state: CampaignState;
  events: ClockEvents;
}

/**
 * THE single setInterval of this application. Everything downstream consumes
 * this via context. Do not add a second one anywhere.
 */
export function useCampaignClock(): Clock {
  const [now, setNow] = useState(() => new Date());

  const [rolloverKey, setRolloverKey] = useState(0);
  const [windowFlash, setWindowFlash] = useState<'OPEN' | 'CLOSED' | null>(null);
  const [actTransition, setActTransition] = useState<Act | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);

    // Interval accumulation is never trusted: any return to visibility forces a
    // full recompute from the system clock.
    const recompute = () => {
      if (document.visibilityState === 'visible') setNow(new Date());
    };
    document.addEventListener('visibilitychange', recompute);
    window.addEventListener('focus', recompute);
    window.addEventListener('pageshow', recompute);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', recompute);
      window.removeEventListener('focus', recompute);
      window.removeEventListener('pageshow', recompute);
    };
  }, []);

  const state = useMemo(() => computeCampaignState(now), [now]);

  const previous = useRef<{
    dayIndex: number;
    battleIndex: number;
    actIndex: number;
    windowState: WindowState;
  } | null>(null);

  const { dayIndex, phase } = state;
  const battleIndex = state.battle.index;
  const actIndex = state.act.index;
  const windowState = state.window.state;
  const actRef = useRef(state.act);
  actRef.current = state.act;

  useEffect(() => {
    const prev = previous.current;
    previous.current = { dayIndex, battleIndex, actIndex, windowState };

    // Never fire ceremony on first paint — only on a real crossing.
    if (!prev) return;

    if (prev.dayIndex !== dayIndex) setRolloverKey((k) => k + 1);

    if (prev.windowState !== windowState && phase === 'ACTIVE') {
      if (windowState === 'OPEN') setWindowFlash('OPEN');
      else if (windowState === 'CLOSED' && prev.windowState === 'OPEN') setWindowFlash('CLOSED');
    }

    if (prev.battleIndex !== battleIndex && battleIndex > prev.battleIndex) {
      setToast(`Battle ${prev.battleIndex} concluded. ${23 - prev.battleIndex} battles remain.`);
    }

    if (prev.actIndex !== actIndex && actIndex > prev.actIndex) {
      setActTransition(actRef.current);
    }
  }, [dayIndex, battleIndex, actIndex, windowState, phase]);

  // Transient timers below are setTimeout, not setInterval — the one-interval
  // rule stands.
  useEffect(() => {
    if (!windowFlash) return;
    const id = setTimeout(() => setWindowFlash(null), windowFlash === 'OPEN' ? 2400 : 1400);
    return () => clearTimeout(id);
  }, [windowFlash]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!actTransition) return;
    const id = setTimeout(() => setActTransition(null), 5000);
    return () => clearTimeout(id);
  }, [actTransition]);

  const dismissActTransition = useCallback(() => setActTransition(null), []);

  const events = useMemo<ClockEvents>(
    () => ({ rolloverKey, windowFlash, actTransition, toast, dismissActTransition }),
    [rolloverKey, windowFlash, actTransition, toast, dismissActTransition],
  );

  return { state, events };
}
