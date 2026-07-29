import { memo } from 'react';
import { ACTS, CAMPAIGN, QUARTER_MARKS } from '../../lib/constants';
import { getDayState, type Phase } from '../../lib/time';

const SEAMS = new Set(ACTS.slice(1).map((a) => a.startDay));
const TICKS = new Set<number>([...QUARTER_MARKS, ...ACTS.slice(1).map((a) => a.startDay)]);

/**
 * 158 blocks that burn down. Elapsed days are ash, not green — that single
 * palette decision is what makes the grid read as spending rather than
 * collecting.
 */
export const GridView = memo(function GridView({
  dayIndex,
  phase,
}: {
  dayIndex: number;
  phase: Phase;
}) {
  return (
    <div
      className="grid-158"
      role="img"
      aria-label={`${dayIndex} of ${CAMPAIGN.TOTAL_DAYS} marches. ${CAMPAIGN.TOTAL_DAYS - dayIndex} ahead.`}
    >
      {Array.from({ length: CAMPAIGN.TOTAL_DAYS }, (_, i) => {
        const day = i + 1;
        const state = getDayState(day, dayIndex, phase);
        const classes = [
          'grid-cell',
          state === 'SPENT' ? 'grid-cell--spent' : '',
          state === 'TODAY' ? 'grid-cell--today' : '',
          state === 'AHEAD' ? 'grid-cell--ahead' : '',
          SEAMS.has(day) ? 'grid-cell--seam' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div key={day} className={classes}>
            {TICKS.has(day) && <span className="grid-tick" />}
          </div>
        );
      })}
    </div>
  );
});
