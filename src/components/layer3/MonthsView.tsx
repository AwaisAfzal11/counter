import { memo } from 'react';
import { MONTH_NAMES, WEEKDAY_LETTERS } from '../../lib/constants';
import { actForDay, dayIndexForDate, getDayState, type Phase } from '../../lib/time';

const YEAR = 2026;
const MONTHS = [6, 7, 8, 9, 10, 11]; // Jul – Dec

interface Cell {
  key: string;
  date: number | null;
  day: number | null;
}

function buildMonth(month: number): Cell[] {
  const first = new Date(Date.UTC(YEAR, month, 1));
  const daysInMonth = new Date(Date.UTC(YEAR, month + 1, 0)).getUTCDate();
  const leading = (first.getUTCDay() + 6) % 7; // Monday-first

  const cells: Cell[] = [];
  for (let i = 0; i < leading; i++) cells.push({ key: `pad-${month}-${i}`, date: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ key: `${month}-${d}`, date: d, day: dayIndexForDate(YEAR, month, d) });
  }
  return cells;
}

const MONTH_CELLS = MONTHS.map(buildMonth);

/** Six mini calendars, weekday-aligned, Monday-first. */
export const MonthsView = memo(function MonthsView({
  dayIndex,
  phase,
}: {
  dayIndex: number;
  phase: Phase;
}) {
  return (
    <div className="months">
      {MONTHS.map((month, mi) => {
        const firstCampaignDay = MONTH_CELLS[mi].find((c) => c.day !== null)?.day ?? 1;
        const act = actForDay(firstCampaignDay);

        return (
          <div key={month}>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="label" style={{ color: 'var(--color-bone)' }}>
                {MONTH_NAMES[month]}
              </span>
              <span className="micro text-bone-dim">ACT {act.roman}</span>
            </div>

            <div className="month-grid mb-1.5">
              {WEEKDAY_LETTERS.map((letter, i) => (
                <span
                  key={i}
                  className="micro text-center text-bone-dim opacity-45"
                  aria-hidden="true"
                >
                  {letter}
                </span>
              ))}
            </div>

            <div className="month-grid">
              {MONTH_CELLS[mi].map((cell) => {
                if (cell.date === null) return <span key={cell.key} />;
                if (cell.day === null)
                  return <span key={cell.key} className="month-cell month-cell--outside" />;

                const state = getDayState(cell.day, dayIndex, phase);
                const cls =
                  state === 'SPENT'
                    ? 'month-cell--spent'
                    : state === 'TODAY'
                      ? 'month-cell--today'
                      : 'month-cell--ahead';
                return <span key={cell.key} className={`month-cell ${cls}`} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
});
