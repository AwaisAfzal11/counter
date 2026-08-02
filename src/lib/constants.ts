export const CAMPAIGN = {
  START: '2026-07-27T00:00:00+05:00', // Monday
  END: '2027-01-01T00:00:00+05:00', // exclusive — Dec 31 2026 is the last day
  TOTAL_DAYS: 158,
  TZ_OFFSET_HOURS: 5, // PKT — no daylight saving, ever
  WINDOW_OPEN_HOUR: 6, // 6:00 AM
  WINDOW_CLOSE_HOUR: 22, // 10:00 PM
  WINDOW_HOURS_PER_DAY: 16,
  TOTAL_WINDOW_HOURS: 2528, // 158 × 16
} as const;

export interface Block {
  /** 1-based. Blocks are numbered; Acts are roman — the two never read alike. */
  index: number;
  name: string;
  /** PKT hour the block opens. */
  startHour: number;
  /** PKT hour the block seals. */
  endHour: number;
  hours: number;
  range: string;
  /** Bar treatment. Each block wears a different one so it is identifiable at a glance. */
  variant: 'dawn' | 'ribs' | 'hatch' | 'bands' | 'dusk';
  /** Why this block is not the optional one. Every block gets a reason. */
  stake: string;
}

/**
 * The window is not one undifferentiated 16-hour slab — it is five blocks with
 * different shapes and different failure modes. 3 + 5 + 1 + 3 + 4 = 16, tiling
 * 6:00 AM → 10:00 PM with no gap and no overlap. A gap would be an hour the app
 * quietly forgives, and this app forgives nothing.
 */
export const BLOCKS: readonly Block[] = [
  {
    index: 1,
    name: 'FIRST LIGHT',
    startHour: 6,
    endHour: 9,
    hours: 3,
    range: '6:00 — 9:00 AM',
    variant: 'dawn',
    stake: 'Sets the ceiling for the other four. Nothing later recovers a lost morning.',
  },
  {
    index: 2,
    name: 'THE MAIN ASSAULT',
    startHour: 9,
    endHour: 14,
    hours: 5,
    range: '9:00 AM — 2:00 PM',
    variant: 'ribs',
    stake: 'The largest ground you will hold today. Five hours, once, then never again.',
  },
  {
    index: 3,
    name: 'THE PIVOT',
    startHour: 14,
    endHour: 15,
    hours: 1,
    range: '2:00 — 3:00 PM',
    variant: 'hatch',
    stake: 'Short enough to skip. That is precisely how the days go missing.',
  },
  {
    index: 4,
    name: 'SECOND PUSH',
    startHour: 15,
    endHour: 18,
    hours: 3,
    range: '3:00 — 6:00 PM',
    variant: 'bands',
    stake: 'Ten hours are already ash. Half a day spent is not a day worked.',
  },
  {
    index: 5,
    name: 'LAST WATCH',
    startHour: 18,
    endHour: 22,
    hours: 4,
    range: '6:00 — 10:00 PM',
    variant: 'dusk',
    stake: 'Four hours nobody is watching. The record counts them exactly the same.',
  },
] as const;

export const BLOCKS_PER_DAY = BLOCKS.length; // 5
/** 158 × 5. Every one of them is spent whether or not it is used. */
export const TOTAL_BLOCKS = CAMPAIGN.TOTAL_DAYS * BLOCKS_PER_DAY; // 790

export interface Act {
  index: number;
  roman: string;
  name: string;
  range: string;
  startDay: number;
  endDay: number;
  length: number;
}

/**
 * Act I absorbs the 5 leftover July days so Acts II–V align exactly to
 * calendar months. 36 + 30 + 31 + 30 + 31 = 158.
 */
export const ACTS: readonly Act[] = [
  { index: 1, roman: 'I', name: 'MOBILIZATION', range: 'Jul 27 — Aug 31', startDay: 1, endDay: 36, length: 36 },
  { index: 2, roman: 'II', name: 'THE BLITZ', range: 'Sep 1 — Sep 30', startDay: 37, endDay: 66, length: 30 },
  { index: 3, roman: 'III', name: 'ATTRITION', range: 'Oct 1 — Oct 31', startDay: 67, endDay: 97, length: 31 },
  { index: 4, roman: 'IV', name: 'BREAKTHROUGH', range: 'Nov 1 — Nov 30', startDay: 98, endDay: 127, length: 30 },
  { index: 5, roman: 'V', name: 'THE LAST MARCH', range: 'Dec 1 — Dec 31', startDay: 128, endDay: 158, length: 31 },
] as const;

export const MILESTONES: Readonly<Record<number, string>> = {
  10: 'TEN MARCHES. THE CAMPAIGN IS REAL.',
  25: '25 DOWN. 133 AHEAD.',
  40: 'ONE QUARTER BURNED.',
  79: 'HALFWAY. THE BACK NINE IS WHERE CAMPAIGNS ARE LOST.',
  100: '100 MARCHES. 58 REMAIN.',
  119: 'THREE QUARTERS GONE.',
  138: '20 LEFT. NOTHING BANKED, EVERYTHING SPENT.',
  148: '10 LEFT.',
  153: 'FINAL BATTLE.',
  158: 'THE LAST MARCH.',
};

/** Quarter marks — thin ember ticks above the grid. */
export const QUARTER_MARKS: readonly number[] = [40, 79, 119];

/**
 * Original lines written for this app. Not attributed to any real person —
 * an invented quotation attached to a real name is worse than no quotation.
 */
export const DOCTRINE: readonly string[] = [
  'Ground can be retaken. The hour cannot.',
  'The plan is not the work. The hour is the work.',
  'Every campaign is decided before anyone notices it was decided.',
  'Speed is the only advantage that cannot be bought.',
  'Rest is a position, not a retreat. Know which one you are in.',
  'Momentum compounds. So does its absence.',
  'The window does not care whether you are ready.',
  'There are 158 of these. This is one of them.',
  'Five blocks a day. A skipped block is not rest, it is a fifth of a day burned.',
  'The block you are standing in is the only one you can still affect.',
  'Difficulty is the terrain, not the verdict.',
  'Ambition without a clock is a hobby.',
  'Nobody is coming. That is the whole advantage.',
  'The enemy is not the work. The enemy is the hour after the work.',
  'Small days, taken consecutively, are indistinguishable from genius.',
  'The campaign is not won on the good days.',
  'You are not behind. You are here. Move.',
  'Obsession is just consistency with the excuses removed.',
  'Half-measures cost the same hours as whole ones.',
  'The record is being written whether or not you are writing it.',
  'There is no version of this that does not require today.',
  'Discipline outlives motivation by about nine days.',
  'Act as if the deadline were fixed. It is.',
  'The only unrecoverable resource is the one on the bar above.',
];

export const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

export const WEEKDAY_NAMES = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const;

export const MONTH_NAMES = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
] as const;
