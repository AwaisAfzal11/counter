import { CAMPAIGN, WEEKDAY_NAMES } from '../../lib/constants';
import { formatCount } from '../../lib/format';
import { useClock, useClockEvents } from '../../context/ClockContext';
import { LiveDot } from './LiveDot';
import { LocalClock } from './LocalClock';

/**
 * The first thing seen at 7:04 AM before the brain is online. The day number
 * is the product — no progress ring around it, ever: rings read as gain-framed
 * completion and pull against the drain philosophy.
 */
export function HeroCounter() {
  const { now, phase, dayIndex, daysSealed, daysAhead, weekday, battle, act } = useClock();
  const { rolloverKey } = useClockEvents();

  const pre = phase === 'PRE';

  return (
    <header className="pt-5">
      <div className="flex items-center justify-between">
        <span className="label" style={{ letterSpacing: '0.42em' }}>
          {pre ? 'Campaign' : 'Day'}
        </span>
        <LiveDot live={phase === 'ACTIVE'} label={pre ? 'Armed' : undefined} />
      </div>

      <div className="mt-3 flex justify-center">
        <span key={rolloverKey} className="day-number odometer block">
          {pre ? CAMPAIGN.TOTAL_DAYS : dayIndex}
        </span>
      </div>

      <div className="mt-3.5 flex items-center gap-3">
        <span className="h-px flex-1 bg-gunmetal" aria-hidden="true" />
        <span className="num text-[26px] font-semibold text-bone-dim">
          {pre ? 'MARCHES' : `/ ${CAMPAIGN.TOTAL_DAYS}`}
        </span>
        <span className="h-px flex-1 bg-gunmetal" aria-hidden="true" />
      </div>

      <div className="mt-4 space-y-1.5 text-center">
        {pre ? (
          <p className="label">The campaign begins Jul 27, 2026.</p>
        ) : (
          <p className="label">
            {WEEKDAY_NAMES[weekday]} · Battle {battle.index} of 23
          </p>
        )}
        <p className="label">
          Act {act.roman} — <span style={{ color: 'var(--color-ember)' }}>{act.name}</span>
        </p>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <LocalClock now={now} />
        <p className="micro text-bone-dim">
          {formatCount(daysSealed)} sealed · {formatCount(daysAhead)} ahead
        </p>
      </div>
    </header>
  );
}
