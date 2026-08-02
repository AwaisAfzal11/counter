import type { CSSProperties } from 'react';
import { formatDuration } from '../../lib/format';
import type { BlockProgress } from '../../lib/time';

interface BlockBarProps {
  blocks: readonly BlockProgress[];
  /** Widthless track with a sweeping line — the window has not opened yet. */
  dormant?: boolean;
  /** Index of a block that sealed in the last few seconds. It flares once. */
  sealed?: number | null;
  size?: 'md' | 'sm';
  /** Hides the numbered rail under the bar. */
  rail?: boolean;
}

/**
 * The March Window, cut into its five blocks. Segment width is proportional to
 * the block's hours, so the 1-hour Pivot is visibly a sliver and the 5-hour
 * Assault is visibly the day's main ground.
 *
 * Each segment drains toward its own right edge, so burnt time sweeps left to
 * right across the whole bar exactly as the clock does. Filled is what you still
 * hold; char is what is gone. It never refills.
 */
export function BlockBar({ blocks, dormant = false, sealed = null, size = 'md', rail = true }: BlockBarProps) {
  const classes = [
    'blockbar',
    size === 'sm' ? 'blockbar--sm' : '',
    dormant ? 'blockbar--dormant' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="blockbar-unit">
      <div className={classes} role="group" aria-label="The five blocks of today's window">
        {blocks.map(({ block, state, remainingFraction, remainingMs, opensInMs, closing }) => (
          <div
            key={block.index}
            className={[
              'blockseg',
              `is-${state.toLowerCase()}`,
              closing ? 'blockseg--closing' : '',
              sealed === block.index ? 'blockseg--sealing' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ '--span': block.hours, '--fill': `${remainingFraction * 100}%` } as CSSProperties}
            role="img"
            aria-label={`Block ${block.index}, ${block.name}, ${block.range}. ${
              state === 'SPENT'
                ? 'Sealed.'
                : state === 'ACTIVE'
                  ? `${formatDuration(remainingMs)} left.`
                  : opensInMs > 0
                    ? `Opens in ${formatDuration(opensInMs)}.`
                    : 'Not yet open.'
            }`}
          >
            <span className="blockseg__fill" data-tex={block.variant} />
          </div>
        ))}
      </div>

      {rail && (
        <div className="blockrail" aria-hidden="true">
          {blocks.map(({ block, state }) => (
            <span
              key={block.index}
              className={`blockrail__no is-${state.toLowerCase()}`}
              style={{ '--span': block.hours } as CSSProperties}
            >
              {block.index}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
