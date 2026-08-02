import { useClock, useClockEvents } from '../../context/ClockContext';
import { formatDuration, formatLongDuration } from '../../lib/format';
import { BlockBar } from './BlockBar';

/**
 * The emotional center of the app: a huge static day number above a visibly
 * emptying bar. Spend the design budget here.
 */
export function MarchWindow() {
  const { phase, dayIndex, window: w, blocks, startsInMs } = useClock();
  const { windowFlash, sealedBlock } = useClockEvents();

  const closed = w.state === 'CLOSED';

  const borderStyle = closed
    ? { borderColor: 'color-mix(in srgb, var(--color-ember) 30%, transparent)' }
    : undefined;

  return (
    <section
      className={`card relative overflow-hidden ${windowFlash === 'CLOSED' ? 'flare' : ''}`}
      style={borderStyle}
      aria-label="The March Window"
    >
      <div className="flex items-center justify-between">
        <h2 className="label">The March Window</h2>
        <span className="micro text-bone-dim">6A ─── 10P</span>
      </div>

      <div className="mt-5">
        {phase === 'PRE' && (
          <>
            <p className="label mb-2">Campaign opens in</p>
            <p className="hero-metric" style={{ color: 'var(--color-ember)' }}>
              {formatLongDuration(startsInMs)}
            </p>
            <p className="mt-2 text-[13px] text-bone-dim">No window has opened yet.</p>
          </>
        )}

        {phase === 'POST' && (
          <>
            <p className="card-metric text-bone-dim">WINDOW CLOSED</p>
            <p className="mt-2 text-[13px] text-bone-dim">
              158 marches. The campaign is closed.
            </p>
          </>
        )}

        {phase === 'ACTIVE' && w.state === 'DORMANT' && (
          <>
            <p className="label mb-2">Window opens in</p>
            <p className="hero-metric" style={{ color: 'var(--color-ember)' }}>
              {formatDuration(w.opensInMs)}
            </p>
            <p className="mt-2 text-[13px] text-bone-dim">Day {dayIndex} has not begun.</p>
          </>
        )}

        {phase === 'ACTIVE' && w.state === 'OPEN' && (
          <>
            <p
              className={`hero-metric ${w.closing ? 'drain--closing' : ''}`}
              style={{
                color: 'var(--color-ember)',
                animation: w.closing ? 'pulse-fast 1.2s ease-in-out infinite' : undefined,
              }}
            >
              {windowFlash === 'OPEN' ? 'OPEN' : formatDuration(w.remainingMs)}
            </p>
            <p className="mt-2 text-[13px] text-bone-dim">
              {windowFlash === 'OPEN'
                ? 'The window is open.'
                : w.closing
                  ? 'the window is closing'
                  : 'left in the window'}
            </p>
          </>
        )}

        {phase === 'ACTIVE' && w.state === 'CLOSED' && (
          <>
            <p className="card-metric text-bone-dim">WINDOW CLOSED</p>
            <p className="mt-2 text-[13px]" style={{ color: 'var(--color-ember)' }}>
              Day {dayIndex} is now unrecoverable.
            </p>
          </>
        )}
      </div>

      <div className="blockstrip mt-5">
        {blocks.current ? (
          <>
            <span className="blockstrip__tag num">BLOCK {blocks.current.block.index}</span>
            <span className="blockstrip__name">{blocks.current.block.name}</span>
            <span className={`blockstrip__left num ${blocks.current.closing ? 'pulse-live' : ''}`}>
              {formatDuration(blocks.current.remainingMs)}
            </span>
          </>
        ) : (
          <>
            <span className="blockstrip__tag num is-idle">
              {blocks.next ? `BLOCK ${blocks.next.block.index}` : 'BLOCK 5'}
            </span>
            <span className="blockstrip__name is-idle">
              {blocks.next ? blocks.next.block.name : 'LAST WATCH'}
            </span>
            <span className="blockstrip__left num is-idle">
              {phase === 'PRE'
                ? 'unopened'
                : blocks.next
                  ? `in ${formatDuration(blocks.next.opensInMs)}`
                  : 'sealed'}
            </span>
          </>
        )}
      </div>

      <div className={`relative mt-3 ${windowFlash === 'OPEN' ? 'window-open-flash' : ''}`}>
        <BlockBar
          blocks={blocks.all}
          dormant={phase === 'ACTIVE' && w.state === 'DORMANT'}
          sealed={sealedBlock}
        />
      </div>

      <div className="micro mt-3 flex justify-between text-bone-dim">
        <span>{w.state === 'DORMANT' || phase === 'PRE' ? 'Opens 6:00 AM' : 'Opened 6:00 AM'}</span>
        <span>{closed ? 'Closed 10:00 PM' : 'Closes 10:00 PM'}</span>
      </div>
    </section>
  );
}
