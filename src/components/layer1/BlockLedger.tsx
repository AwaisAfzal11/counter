import { TOTAL_BLOCKS } from '../../lib/constants';
import { useClock } from '../../context/ClockContext';
import { formatCount, formatDuration } from '../../lib/format';
import type { BlockProgress } from '../../lib/time';

function status(entry: BlockProgress, active: boolean): string {
  if (entry.state === 'SPENT') return 'SEALED';
  if (entry.state === 'ACTIVE') return `${formatDuration(entry.remainingMs)} left`;
  if (!active) return 'UNOPENED';
  return `opens in ${formatDuration(entry.opensInMs)}`;
}

/**
 * The five blocks, named and accounted for. A block that is only a coloured
 * sliver on a bar is easy to write off; a block with a name, a span and a stake
 * is harder to hand back.
 */
export function BlockLedger() {
  const { phase, blocks, dayIndex } = useClock();
  const active = phase === 'ACTIVE';

  return (
    <section className="card" aria-label="The five blocks">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="label">The Five Blocks</h2>
        <span
          className="num text-[11px] tracking-wide"
          style={{ color: blocks.remainingToday === 0 ? 'var(--color-bone-dim)' : 'var(--color-ember)' }}
        >
          {blocks.remainingToday === 0
            ? 'ALL FIVE SEALED'
            : `${blocks.remainingToday} OF 5 STILL YOURS`}
        </span>
      </div>

      <ul className="mt-4 space-y-px">
        {blocks.all.map((entry) => {
          const { block, state } = entry;
          return (
            <li key={block.index} className={`blockrow is-${state.toLowerCase()}`}>
              <span className="blockswatch" data-tex={block.variant} aria-hidden="true" />

              <div className="min-w-0">
                <p className="blockrow__name">
                  <span className="num">{block.index}</span> {block.name}
                </p>
                <p className="micro text-bone-dim">
                  {block.range} · {block.hours}h
                </p>
              </div>

              <span className="blockrow__status num">{status(entry, active)}</span>
            </li>
          );
        })}
      </ul>

      {blocks.current && (
        <p className="blockstake">{blocks.current.block.stake}</p>
      )}

      <p className="micro mt-4 border-t border-gunmetal pt-3 text-bone-dim">
        {formatCount(TOTAL_BLOCKS)} blocks in the campaign ·{' '}
        <span style={{ color: 'var(--color-ember)' }}>{formatCount(blocks.remainingCampaign)}</span> remain
        {active && ` · day ${dayIndex} is spending five of them right now`}
      </p>
    </section>
  );
}
