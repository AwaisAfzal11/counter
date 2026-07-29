import { useClock, useClockEvents } from '../../context/ClockContext';
import { formatDuration, formatLongDuration } from '../../lib/format';
import { DrainBar } from './DrainBar';

/**
 * The emotional center of the app: a huge static day number above a visibly
 * emptying bar. Spend the design budget here.
 */
export function MarchWindow() {
  const { phase, dayIndex, window: w, startsInMs } = useClock();
  const { windowFlash } = useClockEvents();

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

      <div className={`relative mt-5 ${windowFlash === 'OPEN' ? 'window-open-flash' : ''}`}>
        <DrainBar
          remaining={phase === 'PRE' ? 0 : w.remainingFraction}
          dormant={phase === 'ACTIVE' && w.state === 'DORMANT'}
          closing={w.closing}
          variant={closed ? 'ash' : 'ember'}
          label={`${formatDuration(w.remainingMs)} left in today's window`}
        />
      </div>

      <div className="micro mt-4 flex justify-between text-bone-dim">
        <span>{w.state === 'DORMANT' || phase === 'PRE' ? 'Opens 6:00 AM' : 'Opened 6:00 AM'}</span>
        <span>{closed ? 'Closed 10:00 PM' : 'Closes 10:00 PM'}</span>
      </div>
    </section>
  );
}
