import type { ReactNode } from 'react';
import { DrainBar } from '../layer1/DrainBar';

interface PressureRowProps {
  label: string;
  /** Always remaining, never elapsed. */
  figure: ReactNode;
  remaining: number;
  /** Replaces the bar — used by the battle row's weekday dots. */
  slot?: ReactNode;
  emphasis?: boolean;
}

export function PressureRow({ label, figure, remaining, slot, emphasis }: PressureRowProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="label whitespace-nowrap">{label}</span>
        <span
          className="num text-[13px] whitespace-nowrap"
          style={{ color: emphasis ? 'var(--color-ember)' : 'var(--color-bone)' }}
        >
          {figure}
        </span>
      </div>
      <div className="mt-2">{slot ?? <DrainBar remaining={remaining} size="sm" label={label} />}</div>
    </div>
  );
}
