import { WEEKDAY_LETTERS } from '../../lib/constants';

interface WeekdayDotsProps {
  /** 1-based day within the battle. */
  dayInBattle: number;
  /** 7, or 4 for Battle 23. */
  length: number;
  live: boolean;
}

/** Elapsed days ash, today a pulsing signal dot, future days hollow rings. */
export function WeekdayDots({ dayInBattle, length, live }: WeekdayDotsProps) {
  return (
    <div className="flex items-center gap-[7px]" aria-hidden="true">
      {Array.from({ length }, (_, i) => {
        const day = i + 1;
        if (day < dayInBattle || !live) {
          return (
            <span
              key={day}
              className="micro w-[9px] text-center leading-none"
              style={{ color: 'var(--color-ash)' }}
            >
              {WEEKDAY_LETTERS[i]}
            </span>
          );
        }
        if (day === dayInBattle) {
          return (
            <span
              key={day}
              className="pulse-live block size-[9px] rounded-full"
              style={{ background: 'var(--color-signal)' }}
            />
          );
        }
        return (
          <span
            key={day}
            className="block size-[9px] rounded-full border"
            style={{ borderColor: 'var(--color-bone-dim)' }}
          />
        );
      })}
    </div>
  );
}
