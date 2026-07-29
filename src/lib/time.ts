import { ACTS, CAMPAIGN, DOCTRINE, MILESTONES, type Act } from './constants';

export const MS_PER_SECOND = 1_000;
export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 86_400_000;

const TZ_MS = CAMPAIGN.TZ_OFFSET_HOURS * MS_PER_HOUR;

export const START_MS = Date.parse(CAMPAIGN.START);
export const END_MS = Date.parse(CAMPAIGN.END);
export const WINDOW_MS_PER_DAY = CAMPAIGN.WINDOW_HOURS_PER_DAY * MS_PER_HOUR;
export const TOTAL_WINDOW_MS = CAMPAIGN.TOTAL_WINDOW_HOURS * MS_PER_HOUR;

export type WindowState = 'DORMANT' | 'OPEN' | 'CLOSED';
export type Phase = 'PRE' | 'ACTIVE' | 'POST';
export type DayState = 'SPENT' | 'TODAY' | 'AHEAD';

export interface PktParts {
  year: number;
  month: number; // 0-indexed
  date: number;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
}

export interface CampaignState {
  now: Date;
  phase: Phase;
  /** 1-based, inclusive of today. Clamped to [1, 158]. */
  dayIndex: number;
  daysSealed: number;
  daysAhead: number;
  /** PKT weekday index of the campaign day, 0 = Sunday. */
  weekday: number;
  /** ms until the campaign opens. 0 unless phase is PRE. */
  startsInMs: number;
  window: {
    state: WindowState;
    remainingMs: number;
    /** 0 → 1 across 6:00 AM – 10:00 PM. */
    elapsedFraction: number;
    /** 1 → 0 across the same span. This is what the drain bar renders. */
    remainingFraction: number;
    opensInMs: number;
    /** true below 2 hours remaining */
    closing: boolean;
  };
  battle: {
    index: number;
    dayInBattle: number;
    length: number;
    /** includes today */
    remainingDays: number;
    remainingBattles: number;
  };
  act: Act & {
    dayInAct: number;
    /** includes today */
    remainingDays: number;
    remainingFraction: number;
  };
  campaign: {
    windowMsRemaining: number;
    fractionSpent: number;
    /** includes today */
    daysRemaining: number;
  };
  milestone: string | null;
  doctrine: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Midnight PKT of the given instant, as a UTC epoch. */
export function pktMidnight(now: Date | number): number {
  const t = typeof now === 'number' ? now : now.getTime();
  return Math.floor((t + TZ_MS) / MS_PER_DAY) * MS_PER_DAY - TZ_MS;
}

/** Calendar parts of a UTC epoch, read in PKT (fixed UTC+5, no DST). */
export function pktParts(ms: number): PktParts {
  const shifted = new Date(ms + TZ_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    date: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

/** Midnight PKT of campaign day N (1-based). */
export function dayStartMs(dayIndex: number): number {
  return START_MS + (dayIndex - 1) * MS_PER_DAY;
}

/** Campaign day index for a PKT calendar date, or null if outside the campaign. */
export function dayIndexForDate(year: number, month: number, date: number): number | null {
  const ms = Date.UTC(year, month, date) - TZ_MS;
  const index = Math.round((ms - START_MS) / MS_PER_DAY) + 1;
  return index >= 1 && index <= CAMPAIGN.TOTAL_DAYS ? index : null;
}

export function actForDay(dayIndex: number): Act {
  return ACTS.find((a) => dayIndex >= a.startDay && dayIndex <= a.endDay) ?? ACTS[ACTS.length - 1];
}

/**
 * The single source of colour truth for every day-shaped node — grid squares,
 * ring dashes, calendar cells. Keeping it in one place is what makes a future
 * outcome layer a small change rather than a rewrite.
 */
export function getDayState(day: number, dayIndex: number, phase: Phase): DayState {
  if (phase === 'PRE') return 'AHEAD';
  if (phase === 'POST') return 'SPENT';
  if (day < dayIndex) return 'SPENT';
  if (day === dayIndex) return 'TODAY';
  return 'AHEAD';
}

export function battleLength(battleIndex: number): number {
  return battleIndex === 23 ? 4 : 7;
}

/** Pure: takes an instant, returns all derived campaign state. No side effects. */
export function computeCampaignState(now: Date): CampaignState {
  const t = now.getTime();
  const midnight = pktMidnight(t);

  const rawDayIndex = Math.floor((midnight - START_MS) / MS_PER_DAY) + 1;
  const phase: Phase = rawDayIndex < 1 ? 'PRE' : rawDayIndex > CAMPAIGN.TOTAL_DAYS ? 'POST' : 'ACTIVE';
  const dayIndex = clamp(rawDayIndex, 1, CAMPAIGN.TOTAL_DAYS);

  // ── The March Window ──────────────────────────────────────────────────────
  const opensAt = midnight + CAMPAIGN.WINDOW_OPEN_HOUR * MS_PER_HOUR;
  const closesAt = midnight + CAMPAIGN.WINDOW_CLOSE_HOUR * MS_PER_HOUR;

  let windowState: WindowState;
  if (phase !== 'ACTIVE') windowState = 'CLOSED';
  else if (t < opensAt) windowState = 'DORMANT';
  else if (t < closesAt) windowState = 'OPEN';
  else windowState = 'CLOSED';

  const windowRemainingMs = windowState === 'OPEN' ? closesAt - t : 0;
  const remainingFraction = windowRemainingMs / WINDOW_MS_PER_DAY;
  const opensInMs = windowState === 'DORMANT' ? opensAt - t : 0;

  // ── Battles (weeks) ───────────────────────────────────────────────────────
  const battleIndex = Math.floor((dayIndex - 1) / 7) + 1;
  const dayInBattle = ((dayIndex - 1) % 7) + 1;
  const length = battleLength(battleIndex);

  // ── Acts ──────────────────────────────────────────────────────────────────
  const act = actForDay(dayIndex);
  const dayInAct = dayIndex - act.startDay + 1;

  // ── Campaign totals ───────────────────────────────────────────────────────
  const daysSealed = phase === 'POST' ? CAMPAIGN.TOTAL_DAYS : phase === 'PRE' ? 0 : dayIndex - 1;
  const daysAhead = phase === 'POST' ? 0 : phase === 'PRE' ? CAMPAIGN.TOTAL_DAYS : CAMPAIGN.TOTAL_DAYS - dayIndex;

  // §3.4 words today's contribution as "0 if closed/not yet open", but a
  // dormant window is 16 unspent hours, not zero — scoring it as zero makes the
  // campaign total jump *up* by 16h at every 6:00 AM. A bar that refills each
  // dawn is the one thing this app must never do, so a dormant day counts whole.
  const todayContribution =
    windowState === 'DORMANT' ? WINDOW_MS_PER_DAY : windowRemainingMs;

  let windowMsRemaining: number;
  if (phase === 'POST') windowMsRemaining = 0;
  else if (phase === 'PRE') windowMsRemaining = TOTAL_WINDOW_MS;
  else windowMsRemaining = daysAhead * WINDOW_MS_PER_DAY + todayContribution;

  return {
    now,
    phase,
    dayIndex,
    daysSealed,
    daysAhead,
    weekday: pktParts(midnight).weekday,
    startsInMs: phase === 'PRE' ? START_MS - t : 0,
    window: {
      state: windowState,
      remainingMs: windowRemainingMs,
      elapsedFraction: windowState === 'DORMANT' ? 0 : 1 - remainingFraction,
      remainingFraction,
      opensInMs,
      closing: windowState === 'OPEN' && windowRemainingMs <= 2 * MS_PER_HOUR,
    },
    battle: {
      index: battleIndex,
      dayInBattle,
      length,
      remainingDays: phase === 'ACTIVE' ? length - dayInBattle + 1 : 0,
      remainingBattles: phase === 'ACTIVE' ? 23 - battleIndex : 0,
    },
    act: {
      ...act,
      dayInAct,
      remainingDays: phase === 'ACTIVE' ? act.length - dayInAct + 1 : 0,
      remainingFraction: phase === 'ACTIVE' ? (act.length - dayInAct + 1) / act.length : phase === 'PRE' ? 1 : 0,
    },
    campaign: {
      windowMsRemaining,
      fractionSpent: 1 - windowMsRemaining / TOTAL_WINDOW_MS,
      daysRemaining: phase === 'ACTIVE' ? CAMPAIGN.TOTAL_DAYS - dayIndex + 1 : phase === 'PRE' ? CAMPAIGN.TOTAL_DAYS : 0,
    },
    milestone: phase === 'ACTIVE' ? (MILESTONES[dayIndex] ?? null) : null,
    doctrine: DOCTRINE[dayIndex % DOCTRINE.length],
  };
}
