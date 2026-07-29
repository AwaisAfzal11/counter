import type { CSSProperties } from 'react';

interface DrainBarProps {
  /** 1 = full (all time still yours), 0 = empty (all time gone). Bars drain. */
  remaining: number;
  variant?: 'ember' | 'ash';
  size?: 'md' | 'sm';
  dormant?: boolean;
  closing?: boolean;
  label?: string;
}

/**
 * Filled = time you still have. Empty = time gone. A filling bar rewards the
 * passage of time; this one makes it cost something.
 */
export function DrainBar({
  remaining,
  variant = 'ember',
  size = 'md',
  dormant = false,
  closing = false,
  label,
}: DrainBarProps) {
  const pct = Math.max(0, Math.min(1, remaining)) * 100;
  const classes = [
    'drain',
    size === 'sm' ? 'drain--sm' : '',
    variant === 'ash' ? 'drain--ash' : '',
    dormant ? 'drain--dormant' : '',
    closing ? 'drain--closing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      role="img"
      aria-label={label ?? `${pct.toFixed(0)}% of this window remains`}
    >
      {!dormant && <div className="drain__fill" style={{ '--fill': `${pct}%` } as CSSProperties} />}
    </div>
  );
}
