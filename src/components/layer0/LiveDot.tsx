/** The only always-green thing on the page. */
export function LiveDot({ live = true, label }: { live?: boolean; label?: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`block size-1.5 rounded-full ${live ? 'bg-signal pulse-live' : 'bg-ash'}`}
        aria-hidden="true"
      />
      <span className="label" style={{ color: live ? 'var(--color-signal)' : undefined }}>
        {label ?? (live ? 'Live' : 'Closed')}
      </span>
    </span>
  );
}
