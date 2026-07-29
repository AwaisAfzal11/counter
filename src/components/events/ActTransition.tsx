import { ACTS, type Act } from '../../lib/constants';

/**
 * One of fifteen moments that will define how the user remembers 158 days.
 * Old Act fades to a seal, new Act types in. Dismissible by tap.
 */
export function ActTransition({ act, onDismiss }: { act: Act; onDismiss: () => void }) {
  const previous = ACTS.find((a) => a.index === act.index - 1);

  return (
    <div
      className="act-takeover fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 px-8 text-center"
      style={{ background: 'var(--color-void)' }}
      role="dialog"
      aria-modal="true"
      aria-label={`Act ${act.roman} begins`}
      onClick={onDismiss}
    >
      {previous && (
        <div className="flex flex-col items-center gap-3 opacity-45">
          <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
            <circle cx="17" cy="17" r="15" fill="none" stroke="var(--color-signal)" strokeWidth="1.5" />
            <circle cx="17" cy="17" r="5" fill="var(--color-signal)" />
          </svg>
          <p className="label">
            Act {previous.roman} — {previous.name} · Concluded
          </p>
        </div>
      )}

      <div className="space-y-4">
        <p className="num text-[15px]" style={{ color: 'var(--color-ember)' }}>
          ACT {act.roman}
        </p>
        <h1
          className="type-in text-[34px] leading-tight font-semibold tracking-tight"
          style={{ color: 'var(--color-bone)' }}
        >
          {act.name}
        </h1>
        <p className="label">
          {act.length} marches · Begins now
        </p>
      </div>

      <p className="micro text-bone-dim opacity-60">tap to dismiss</p>
    </div>
  );
}
