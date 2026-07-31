import { useClock } from '../../context/ClockContext';
import { formatDuration } from '../../lib/format';
import { PressureRow } from './PressureRow';
import { WeekdayDots } from './WeekdayDots';

/**
 * Four nested horizons, always visible together. The goal-gradient effect
 * operates independently at each scale, so the user is never more than 24
 * hours from some boundary.
 */
export function NestedPressure() {
  const { phase, window: w, battle } = useClock();
  const live = phase === 'ACTIVE';

  return (
    <section className="card space-y-4" aria-label="Nested pressure">
      <PressureRow
        label="Today"
        figure={
          w.state === 'OPEN'
            ? `${formatDuration(w.remainingMs)} left`
            : w.state === 'DORMANT'
              ? `opens in ${formatDuration(w.opensInMs)}`
              : '0h 0m left'
        }
        remaining={w.state === 'DORMANT' ? 1 : w.remainingFraction}
        emphasis
      />

      <PressureRow
        label={`Battle ${battle.index}`}
        figure={`${battle.remainingDays} days left`}
        remaining={battle.remainingDays / battle.length}
        slot={
          <WeekdayDots dayInBattle={battle.dayInBattle} length={battle.length} live={live} />
        }
      />

    </section>
  );
}
