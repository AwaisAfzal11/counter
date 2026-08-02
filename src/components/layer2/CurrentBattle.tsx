import { MONTH_NAMES } from '../../lib/constants';
import { useClock } from '../../context/ClockContext';
import { dayStartMs, pktParts } from '../../lib/time';
import { DrainBar } from '../layer1/DrainBar';
import { BattleDays } from './BattleDays';

function stamp(day: number): string {
  const { month, date } = pktParts(dayStartMs(day));
  return `${MONTH_NAMES[month]} ${date}`;
}

/**
 * The week you are inside. Below the day and the blocks, this is the horizon
 * that decides whether a bad morning is an incident or a pattern — so it is
 * given a number large enough to be read from across the room.
 */
export function CurrentBattle() {
  const { phase, dayIndex, battle } = useClock();
  const live = phase === 'ACTIVE';

  const startDay = dayIndex - battle.dayInBattle + 1;
  const endDay = startDay + battle.length - 1;

  return (
    <section className="card" aria-label="The current battle">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="label">
          Battle <span className="num">{battle.index}</span> / 23
        </h2>
        <span className="micro text-bone-dim">
          {stamp(startDay)} — {stamp(endDay)}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="battle-metric" style={{ color: 'var(--color-ember)' }}>
            {live ? battle.remainingDays : phase === 'PRE' ? battle.length : 0}
          </p>
          <p className="label mt-2">
            {phase === 'POST'
              ? 'days left — none'
              : (live ? battle.remainingDays : battle.length) === 1
                ? 'day left in this battle'
                : 'days left in this battle'}
          </p>
        </div>

        <p className="micro text-right text-bone-dim">
          {phase === 'POST' ? (
            'ALL 23 CONCLUDED'
          ) : (
            <>
              <span className="num text-[15px] text-bone">
                {live ? battle.remainingBattles : 23}
              </span>
              <br />
              battles after
              <br />
              this one
            </>
          )}
        </p>
      </div>

      <div className="mt-4">
        <BattleDays
          startDay={startDay}
          length={battle.length}
          dayIndex={dayIndex}
          phase={phase}
        />
      </div>

      <div className="mt-4">
        <DrainBar
          remaining={live ? battle.remainingDays / battle.length : phase === 'PRE' ? 1 : 0}
          size="sm"
          variant={live ? 'ember' : 'ash'}
          label={`${battle.remainingDays} of ${battle.length} days left in battle ${battle.index}`}
        />
      </div>

      <p className="micro mt-3 text-bone-dim">
        {live ? (
          <>
            Day <span style={{ color: 'var(--color-ember)' }}>{battle.dayInBattle}</span> of{' '}
            {battle.length} · each one is spent whether or not it is used
          </>
        ) : phase === 'PRE' ? (
          'The first battle has not opened.'
        ) : (
          'The campaign is closed. Nothing further is winnable.'
        )}
      </p>
    </section>
  );
}
