import type { CSSProperties } from 'react';
import { WEEKDAY_LETTERS } from '../../lib/constants';
import { getDayState, type Phase } from '../../lib/time';

interface BattleDaysProps {
  /** Campaign day index of this battle's first day. */
  startDay: number;
  /** 7, or 4 for Battle 23. */
  length: number;
  dayIndex: number;
  phase: Phase;
}

/**
 * The battle week, one cell per day, each carrying its own campaign number.
 * Days are day-shaped nodes, so their colour comes from `getDayState` like every
 * other one — a day cannot read spent here and ahead in the grid.
 */
export function BattleDays({ startDay, length, dayIndex, phase }: BattleDaysProps) {
  return (
    <ul className="battledays" style={{ '--days': length } as CSSProperties}>
      {Array.from({ length }, (_, i) => {
        const day = startDay + i;
        const state = getDayState(day, dayIndex, phase);

        return (
          <li
            key={day}
            className={`battleday battleday--${state.toLowerCase()}`}
            aria-label={`Day ${day}, ${state === 'TODAY' ? 'today' : state.toLowerCase()}`}
          >
            <span className="battleday__letter">{WEEKDAY_LETTERS[i]}</span>
            <span className="battleday__no num">{day}</span>
          </li>
        );
      })}
    </ul>
  );
}
