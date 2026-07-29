import { memo } from 'react';
import { CAMPAIGN } from '../../lib/constants';
import { formatHourRemainder, formatHours } from '../../lib/format';
import { getDayState, type Phase } from '../../lib/time';
import { useClock } from '../../context/ClockContext';

const SIZE = 300;
const C = SIZE / 2;
const R_OUT = 142;

function point(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [C + Math.cos(rad) * radius, C + Math.sin(rad) * radius] as const;
}

/**
 * 158 radial dashes, one full revolution across the campaign. The sweep hand
 * advances once per day, never continuously — a hand that creeps in real time
 * turns the campaign into a clock face and dilutes the daily boundary.
 */
const RingDial = memo(function RingDial({ dayIndex, phase }: { dayIndex: number; phase: Phase }) {
  const todayAngle = ((dayIndex - 1) / CAMPAIGN.TOTAL_DAYS) * 360;
  const [hx, hy] = point(todayAngle, 108);

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[320px]" aria-hidden="true">
      {Array.from({ length: CAMPAIGN.TOTAL_DAYS }, (_, i) => {
        const day = i + 1;
        const state = getDayState(day, dayIndex, phase);
        const angle = (i / CAMPAIGN.TOTAL_DAYS) * 360;
        const inner = state === 'TODAY' ? 118 : 130;
        const outer = state === 'TODAY' ? R_OUT + 4 : R_OUT;
        const [x1, y1] = point(angle, inner);
        const [x2, y2] = point(angle, outer);

        const stroke =
          state === 'SPENT'
            ? 'var(--color-ash)'
            : state === 'TODAY'
              ? 'var(--color-signal)'
              : 'var(--color-gunmetal)';

        return (
          <line
            key={day}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={stroke}
            strokeWidth={state === 'TODAY' ? 3.5 : 2}
            strokeLinecap="round"
            className={state === 'TODAY' ? 'ring-today' : undefined}
            style={
              state === 'TODAY'
                ? { filter: 'drop-shadow(0 0 5px color-mix(in srgb, var(--color-signal) 80%, transparent))' }
                : undefined
            }
          />
        );
      })}

      {phase === 'ACTIVE' && (
        <line
          x1={C}
          y1={C}
          x2={hx}
          y2={hy}
          stroke="var(--color-bone-dim)"
          strokeWidth={1}
          opacity={0.5}
        />
      )}
    </svg>
  );
});

export function RingView({ dayIndex, phase }: { dayIndex: number; phase: Phase }) {
  const { campaign } = useClock();

  return (
    <div className="relative flex justify-center">
      <RingDial dayIndex={dayIndex} phase={phase} />

      {/* Live overlay — kept outside the memoized dial so 158 dashes never
          re-render on the tick. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span className="num text-[34px] font-semibold" style={{ color: 'var(--color-ember)' }}>
          {formatHours(campaign.windowMsRemaining)}
        </span>
        <span className="label">hours left</span>
        <span className="micro mt-1 text-bone-dim">
          {formatHourRemainder(campaign.windowMsRemaining)}
        </span>
      </div>
    </div>
  );
}
