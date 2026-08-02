import { describe, expect, it } from 'vitest';
import { ACTS, BLOCKS, CAMPAIGN, TOTAL_BLOCKS } from './constants';
import {
  battleLength,
  computeCampaignState,
  dayIndexForDate,
  dayStartMs,
  getDayState,
  MS_PER_HOUR,
  MS_PER_MINUTE,
  pktParts,
  START_MS,
  TOTAL_WINDOW_MS,
} from './time';

/** All test instants are written in PKT (UTC+5), which is what the app runs on. */
const at = (pkt: string) => new Date(`${pkt}+05:00`);

describe('campaign constants', () => {
  it('starts on a Monday and ends on a Thursday', () => {
    expect(pktParts(START_MS).weekday).toBe(1); // Monday
    expect(pktParts(dayStartMs(CAMPAIGN.TOTAL_DAYS)).weekday).toBe(4); // Thursday
  });

  it('spans exactly 158 days, Jul 27 through Dec 31', () => {
    const last = pktParts(dayStartMs(158));
    expect(last).toMatchObject({ year: 2026, month: 11, date: 31 });
    expect(dayIndexForDate(2026, 6, 27)).toBe(1);
    expect(dayIndexForDate(2026, 11, 31)).toBe(158);
    expect(dayIndexForDate(2026, 6, 26)).toBeNull();
    expect(dayIndexForDate(2027, 0, 1)).toBeNull();
  });

  it('acts sum to 158 and tile the campaign without gaps', () => {
    expect(ACTS.reduce((sum, a) => sum + a.length, 0)).toBe(158);
    ACTS.forEach((act, i) => {
      expect(act.endDay - act.startDay + 1).toBe(act.length);
      if (i > 0) expect(act.startDay).toBe(ACTS[i - 1].endDay + 1);
    });
  });
});

describe('day index — 1-based, today counts as in progress', () => {
  it('reads DAY 3 / 158 on Wednesday Jul 29, 2026', () => {
    const s = computeCampaignState(at('2026-07-29T10:00:00'));
    expect(s.dayIndex).toBe(3);
    expect(s.daysSealed).toBe(2);
    expect(s.daysAhead).toBe(155);
    expect(s.weekday).toBe(3); // Wednesday
  });

  it('reads DAY 1 at the very first instant of the campaign', () => {
    const s = computeCampaignState(at('2026-07-27T00:00:00'));
    expect(s.dayIndex).toBe(1);
    expect(s.daysSealed).toBe(0);
    expect(s.phase).toBe('ACTIVE');
  });

  it('rolls over at midnight PKT, not before', () => {
    expect(computeCampaignState(at('2026-07-29T23:59:59')).dayIndex).toBe(3);
    expect(computeCampaignState(at('2026-07-30T00:00:00')).dayIndex).toBe(4);
  });

  it('holds day 158 through the final instant, then archives', () => {
    expect(computeCampaignState(at('2026-12-31T23:59:59')).dayIndex).toBe(158);
    expect(computeCampaignState(at('2026-12-31T23:59:59')).phase).toBe('ACTIVE');

    const after = computeCampaignState(at('2027-01-01T00:00:00'));
    expect(after.phase).toBe('POST');
    expect(after.dayIndex).toBe(158);
    expect(after.campaign.windowMsRemaining).toBe(0);
  });

  it('reports a pre-campaign phase before Jul 27', () => {
    const s = computeCampaignState(at('2026-07-26T12:00:00'));
    expect(s.phase).toBe('PRE');
    expect(s.dayIndex).toBe(1);
    expect(s.startsInMs).toBe(12 * MS_PER_HOUR);
    expect(s.campaign.windowMsRemaining).toBe(TOTAL_WINDOW_MS);
  });
});

describe('the March Window', () => {
  it('is DORMANT at 5:59 AM and reports when it opens', () => {
    const s = computeCampaignState(at('2026-07-29T05:59:00'));
    expect(s.window.state).toBe('DORMANT');
    expect(s.window.opensInMs).toBe(60_000);
    expect(s.window.remainingMs).toBe(0);
  });

  it('opens exactly at 6:00 AM with the full 16 hours', () => {
    const s = computeCampaignState(at('2026-07-29T06:00:00'));
    expect(s.window.state).toBe('OPEN');
    expect(s.window.remainingMs).toBe(16 * MS_PER_HOUR);
    expect(s.window.remainingFraction).toBe(1);
    expect(s.window.elapsedFraction).toBe(0);
  });

  it('is half spent at 2:00 PM', () => {
    const s = computeCampaignState(at('2026-07-29T14:00:00'));
    expect(s.window.remainingMs).toBe(8 * MS_PER_HOUR);
    expect(s.window.remainingFraction).toBeCloseTo(0.5, 10);
  });

  it('is still OPEN at 9:59 PM and flags closing below two hours', () => {
    const s = computeCampaignState(at('2026-07-29T21:59:00'));
    expect(s.window.state).toBe('OPEN');
    expect(s.window.closing).toBe(true);
    expect(computeCampaignState(at('2026-07-29T19:59:00')).window.closing).toBe(false);
    expect(computeCampaignState(at('2026-07-29T20:01:00')).window.closing).toBe(true);
  });

  it('is CLOSED at 10:00 PM and stays closed to 11:59 PM', () => {
    for (const t of ['2026-07-29T22:00:00', '2026-07-29T23:59:59']) {
      const s = computeCampaignState(at(t));
      expect(s.window.state).toBe('CLOSED');
      expect(s.window.remainingMs).toBe(0);
      expect(s.window.remainingFraction).toBe(0);
    }
  });
});

describe('the five blocks', () => {
  it('tiles the window exactly — no gap, no overlap, 16 hours', () => {
    expect(BLOCKS.reduce((sum, b) => sum + b.hours, 0)).toBe(CAMPAIGN.WINDOW_HOURS_PER_DAY);
    expect(BLOCKS[0].startHour).toBe(CAMPAIGN.WINDOW_OPEN_HOUR);
    expect(BLOCKS[BLOCKS.length - 1].endHour).toBe(CAMPAIGN.WINDOW_CLOSE_HOUR);
    BLOCKS.forEach((block, i) => {
      expect(block.endHour - block.startHour).toBe(block.hours);
      expect(block.index).toBe(i + 1);
      if (i > 0) expect(block.startHour).toBe(BLOCKS[i - 1].endHour);
    });
  });

  it('holds the boundaries at 9 AM, 2 PM, 3 PM, 6 PM and 10 PM', () => {
    const active = (pkt: string) => computeCampaignState(at(pkt)).blocks.current?.block.index ?? null;
    expect(active('2026-07-29T06:00:00')).toBe(1);
    expect(active('2026-07-29T08:59:59')).toBe(1);
    expect(active('2026-07-29T09:00:00')).toBe(2);
    expect(active('2026-07-29T13:59:59')).toBe(2);
    expect(active('2026-07-29T14:00:00')).toBe(3);
    expect(active('2026-07-29T15:00:00')).toBe(4);
    expect(active('2026-07-29T18:00:00')).toBe(5);
    expect(active('2026-07-29T21:59:59')).toBe(5);
    expect(active('2026-07-29T22:00:00')).toBeNull();
    expect(active('2026-07-29T05:59:59')).toBeNull();
  });

  it('marks exactly one block ACTIVE while the window is open, and none outside it', () => {
    for (let hour = 6; hour < 22; hour++) {
      const states = computeCampaignState(at(`2026-08-11T${String(hour).padStart(2, '0')}:30:00`))
        .blocks.all.map((b) => b.state);
      expect(states.filter((s) => s === 'ACTIVE')).toHaveLength(1);
    }
    for (const t of ['2026-08-11T03:00:00', '2026-08-11T23:00:00']) {
      const blocks = computeCampaignState(at(t)).blocks;
      expect(blocks.all.filter((b) => b.state === 'ACTIVE')).toHaveLength(0);
      expect(blocks.current).toBeNull();
    }
  });

  it('drains each block against its own span, not the window', () => {
    // 11:30 AM — halfway through the five-hour Assault, ten past the day.
    const s = computeCampaignState(at('2026-07-29T11:30:00'));
    const [first, second] = s.blocks.all;
    expect(first.state).toBe('SPENT');
    expect(first.remainingMs).toBe(0);
    expect(second.state).toBe('ACTIVE');
    expect(second.remainingMs).toBe(2.5 * MS_PER_HOUR);
    expect(second.remainingFraction).toBeCloseTo(0.5, 10);

    // The Pivot is one hour, so the same clock reading drains it four times faster.
    const pivot = computeCampaignState(at('2026-07-29T14:30:00')).blocks.all[2];
    expect(pivot.remainingFraction).toBeCloseTo(0.5, 10);
    expect(pivot.remainingMs).toBe(0.5 * MS_PER_HOUR);
  });

  it('reports blocks ahead as whole and tells you when they open', () => {
    const s = computeCampaignState(at('2026-07-29T06:00:00'));
    const pivot = s.blocks.all[2];
    expect(pivot.state).toBe('AHEAD');
    expect(pivot.remainingFraction).toBe(1);
    expect(pivot.opensInMs).toBe(8 * MS_PER_HOUR);
    expect(s.blocks.next?.block.index).toBe(2);
  });

  it('flags a block as closing for its final fifteen minutes only', () => {
    expect(computeCampaignState(at('2026-07-29T08:44:00')).blocks.current?.closing).toBe(false);
    expect(computeCampaignState(at('2026-07-29T08:46:00')).blocks.current?.closing).toBe(true);
    // Same rule on the one-hour block: fifteen minutes, not a fraction.
    expect(computeCampaignState(at('2026-07-29T14:44:00')).blocks.current?.closing).toBe(false);
    expect(computeCampaignState(at('2026-07-29T14:45:00')).blocks.current?.closing).toBe(true);
  });

  it('counts a block as still yours until it seals', () => {
    const dawn = computeCampaignState(at('2026-07-29T05:00:00')).blocks;
    expect(dawn).toMatchObject({ spentToday: 0, remainingToday: 5 });

    const midday = computeCampaignState(at('2026-07-29T13:59:00')).blocks;
    expect(midday).toMatchObject({ spentToday: 1, remainingToday: 4 });

    const shut = computeCampaignState(at('2026-07-29T22:00:00')).blocks;
    expect(shut).toMatchObject({ spentToday: 5, remainingToday: 0, current: null, next: null });
  });

  it('counts 790 blocks in the campaign and never hands one back', () => {
    expect(TOTAL_BLOCKS).toBe(790);
    expect(computeCampaignState(at('2026-07-26T12:00:00')).blocks.remainingCampaign).toBe(790);
    expect(computeCampaignState(at('2026-07-27T00:00:00')).blocks.remainingCampaign).toBe(790);
    expect(computeCampaignState(at('2027-01-01T00:00:00')).blocks.remainingCampaign).toBe(0);

    // The 6:00 AM refill is the failure mode this guards: dormant counts whole.
    let previous = Infinity;
    for (let day = 1; day <= 158; day++) {
      for (const [hour, minute] of [
        [0, 0],
        [5, 59],
        [6, 0],
        [9, 1],
        [14, 1],
        [15, 1],
        [18, 1],
        [22, 0],
        [23, 59],
      ] as const) {
        const value = computeCampaignState(
          new Date(dayStartMs(day) + hour * MS_PER_HOUR + minute * MS_PER_MINUTE),
        ).blocks.remainingCampaign;
        expect(value).toBeLessThanOrEqual(previous);
        previous = value;
      }
    }
    expect(previous).toBe(0);
  });

  it('leaves every block unopened before the campaign and sealed after it', () => {
    const before = computeCampaignState(at('2026-07-01T10:00:00')).blocks;
    expect(before.all.every((b) => b.state === 'AHEAD')).toBe(true);
    expect(before.all.every((b) => b.opensInMs === 0)).toBe(true);
    expect(before.current).toBeNull();

    const after = computeCampaignState(at('2027-02-01T10:00:00')).blocks;
    expect(after.all.every((b) => b.state === 'SPENT')).toBe(true);
    expect(after.remainingToday).toBe(0);
  });
});

describe('battles', () => {
  it('runs Battle 1 from Jul 27 to Aug 2', () => {
    expect(computeCampaignState(at('2026-07-27T12:00:00')).battle).toMatchObject({
      index: 1,
      dayInBattle: 1,
      length: 7,
      remainingDays: 7,
    });
    expect(computeCampaignState(at('2026-08-02T12:00:00')).battle).toMatchObject({
      index: 1,
      dayInBattle: 7,
      remainingDays: 1,
    });
    expect(computeCampaignState(at('2026-08-03T12:00:00')).battle.index).toBe(2);
  });

  it('counts today as still remaining', () => {
    // Wednesday of Battle 1: today plus four more.
    expect(computeCampaignState(at('2026-07-29T12:00:00')).battle.remainingDays).toBe(5);
  });

  it('makes Battle 23 four days long, Dec 28 to Dec 31', () => {
    expect(battleLength(23)).toBe(4);
    const first = computeCampaignState(at('2026-12-28T12:00:00'));
    expect(first.battle).toMatchObject({ index: 23, dayInBattle: 1, length: 4, remainingDays: 4 });
    const last = computeCampaignState(at('2026-12-31T12:00:00'));
    expect(last.battle).toMatchObject({ index: 23, dayInBattle: 4, remainingDays: 1 });
  });

  it('every battle before 23 is seven days', () => {
    for (let b = 1; b <= 22; b++) expect(battleLength(b)).toBe(7);
  });
});

describe('acts', () => {
  it('lands boundaries on days 36/37, 66/67, 97/98, 127/128', () => {
    const boundaries: [number, number, number][] = [
      [36, 1, 37],
      [66, 2, 67],
      [97, 3, 98],
      [127, 4, 128],
    ];
    for (const [lastDay, actIndex, nextDay] of boundaries) {
      expect(computeCampaignState(new Date(dayStartMs(lastDay) + 12 * MS_PER_HOUR)).act.index).toBe(actIndex);
      expect(computeCampaignState(new Date(dayStartMs(nextDay) + 12 * MS_PER_HOUR)).act.index).toBe(actIndex + 1);
    }
  });

  it('aligns Acts II–V to calendar months', () => {
    expect(pktParts(dayStartMs(37))).toMatchObject({ month: 8, date: 1 }); // Sep 1
    expect(pktParts(dayStartMs(67))).toMatchObject({ month: 9, date: 1 }); // Oct 1
    expect(pktParts(dayStartMs(98))).toMatchObject({ month: 10, date: 1 }); // Nov 1
    expect(pktParts(dayStartMs(128))).toMatchObject({ month: 11, date: 1 }); // Dec 1
  });

  it('counts act days remaining inclusive of today', () => {
    const s = computeCampaignState(at('2026-07-29T12:00:00'));
    expect(s.act.dayInAct).toBe(3);
    expect(s.act.remainingDays).toBe(34);
  });
});

describe('campaign hours remaining', () => {
  it('is 2,528 hours at the first instant', () => {
    const s = computeCampaignState(at('2026-07-27T00:00:00'));
    expect(s.campaign.windowMsRemaining).toBe(TOTAL_WINDOW_MS);
    expect(s.campaign.fractionSpent).toBe(0);
  });

  it('drains only during the window, never overnight', () => {
    const evening = computeCampaignState(at('2026-07-29T22:00:00')).campaign.windowMsRemaining;
    const nextDawn = computeCampaignState(at('2026-07-30T06:00:00')).campaign.windowMsRemaining;
    expect(evening).toBe(nextDawn);
    expect(evening).toBe(155 * 16 * MS_PER_HOUR);
  });

  it('reaches zero after the last window closes', () => {
    expect(computeCampaignState(at('2026-12-31T22:00:00')).campaign.windowMsRemaining).toBe(0);
    expect(computeCampaignState(at('2026-12-31T22:00:00')).campaign.fractionSpent).toBe(1);
  });

  it('never fills — remaining is monotonically non-increasing', () => {
    let previous = Infinity;
    for (let day = 1; day <= 158; day++) {
      for (const hour of [0, 6, 12, 18, 22, 23]) {
        const value = computeCampaignState(
          new Date(dayStartMs(day) + hour * MS_PER_HOUR),
        ).campaign.windowMsRemaining;
        expect(value).toBeLessThanOrEqual(previous);
        previous = value;
      }
    }
    expect(previous).toBe(0);
  });
});

describe('getDayState — the single source of colour truth', () => {
  it('agrees for grid, ring and calendar at every instant', () => {
    const s = computeCampaignState(at('2026-09-15T09:30:00'));
    expect(s.dayIndex).toBe(51);
    expect(getDayState(50, s.dayIndex, s.phase)).toBe('SPENT');
    expect(getDayState(51, s.dayIndex, s.phase)).toBe('TODAY');
    expect(getDayState(52, s.dayIndex, s.phase)).toBe('AHEAD');
    expect(dayIndexForDate(2026, 8, 15)).toBe(51);
  });

  it('marks exactly one day as TODAY across the whole grid', () => {
    const s = computeCampaignState(at('2026-10-20T14:00:00'));
    const today = Array.from({ length: 158 }, (_, i) =>
      getDayState(i + 1, s.dayIndex, s.phase),
    ).filter((state) => state === 'TODAY');
    expect(today).toHaveLength(1);
  });

  it('hollows the whole grid before the campaign and burns it all after', () => {
    const before = computeCampaignState(at('2026-07-01T00:00:00'));
    const after = computeCampaignState(at('2027-02-01T00:00:00'));
    expect(getDayState(1, before.dayIndex, before.phase)).toBe('AHEAD');
    expect(getDayState(158, after.dayIndex, after.phase)).toBe('SPENT');
  });
});

describe('milestones and doctrine', () => {
  it('shows a banner only on milestone days', () => {
    expect(computeCampaignState(new Date(dayStartMs(79) + MS_PER_HOUR)).milestone).toContain('HALFWAY');
    expect(computeCampaignState(new Date(dayStartMs(78) + MS_PER_HOUR)).milestone).toBeNull();
    expect(computeCampaignState(new Date(dayStartMs(158) + MS_PER_HOUR)).milestone).toBe('THE LAST MARCH.');
  });

  it('gives the same doctrine line all day and a different one tomorrow', () => {
    const morning = computeCampaignState(at('2026-08-05T06:30:00')).doctrine;
    const night = computeCampaignState(at('2026-08-05T21:30:00')).doctrine;
    const tomorrow = computeCampaignState(at('2026-08-06T06:30:00')).doctrine;
    expect(morning).toBe(night);
    expect(tomorrow).not.toBe(morning);
  });
});
