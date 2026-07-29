import { memo } from 'react';
import { ACTS } from '../../lib/constants';
import type { Phase } from '../../lib/time';
import { ActCard, type ActCardState } from './ActCard';

/**
 * The zoom-out narrative view. CONCLUDED is the only place green appears at
 * scale, and it happens exactly five times in 158 days — that scarcity is the
 * entire reason green means anything here.
 */
export const Chronicle = memo(function Chronicle({
  dayIndex,
  phase,
}: {
  dayIndex: number;
  phase: Phase;
}) {
  return (
    <section className="space-y-3" aria-label="The Chronicle">
      <h2 className="label px-1">The Chronicle</h2>
      {ACTS.map((act) => {
        let state: ActCardState;
        if (phase === 'PRE') state = 'AHEAD';
        else if (phase === 'POST' || dayIndex > act.endDay) state = 'CONCLUDED';
        else if (dayIndex < act.startDay) state = 'AHEAD';
        else state = 'ACTIVE';

        return (
          <ActCard
            key={act.index}
            act={act}
            state={state}
            dayInAct={dayIndex - act.startDay + 1}
          />
        );
      })}
    </section>
  );
});
