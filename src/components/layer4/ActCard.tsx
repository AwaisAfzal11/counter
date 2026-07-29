import type { Act } from '../../lib/constants';
import { DrainBar } from '../layer1/DrainBar';

export type ActCardState = 'AHEAD' | 'ACTIVE' | 'CONCLUDED';

interface ActCardProps {
  act: Act;
  state: ActCardState;
  dayInAct: number;
}

const STATE_COPY: Record<ActCardState, string> = {
  AHEAD: 'Ahead',
  ACTIVE: 'In progress',
  CONCLUDED: 'Concluded',
};

function Seal() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="6" fill="none" stroke="var(--color-signal)" strokeWidth="1.5" />
      <circle cx="7" cy="7" r="2.2" fill="var(--color-signal)" />
    </svg>
  );
}

export function ActCard({ act, state, dayInAct }: ActCardProps) {
  const remaining = state === 'AHEAD' ? 1 : state === 'CONCLUDED' ? 0 : (act.length - dayInAct + 1) / act.length;

  const style =
    state === 'ACTIVE'
      ? { borderColor: 'var(--color-ember)' }
      : state === 'CONCLUDED'
        ? { borderLeft: '2px solid var(--color-signal)' }
        : undefined;

  return (
    <article className="card py-4" style={style}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span
            className="num w-6 text-[13px]"
            style={{ color: state === 'ACTIVE' ? 'var(--color-ember)' : 'var(--color-bone-dim)' }}
          >
            {act.roman}
          </span>
          <h3
            className="label"
            style={{ color: state === 'AHEAD' ? 'var(--color-bone-dim)' : 'var(--color-bone)' }}
          >
            {act.name}
          </h3>
        </div>
        <span className="label flex items-center gap-1.5 whitespace-nowrap">
          {state === 'CONCLUDED' && <Seal />}
          <span style={{ color: state === 'ACTIVE' ? 'var(--color-ember)' : undefined }}>
            {STATE_COPY[state]}
          </span>
        </span>
      </div>

      <p className="micro mt-2 pl-9 text-bone-dim">
        {act.range} · {act.length} marches
      </p>

      <div className="mt-3 pl-9">
        <DrainBar
          remaining={remaining}
          size="sm"
          variant={state === 'ACTIVE' ? 'ember' : 'ash'}
          label={`${act.name}: ${Math.round(remaining * act.length)} marches left`}
        />
      </div>

      {state === 'ACTIVE' && (
        <p className="micro mt-2 pl-9" style={{ color: 'var(--color-bone)' }}>
          Day {dayInAct} of {act.length} · {act.length - dayInAct + 1} left
        </p>
      )}
    </article>
  );
}
