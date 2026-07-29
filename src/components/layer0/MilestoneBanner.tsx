/** Persistent for the whole milestone day. Slow border pulse, nothing more. */
export function MilestoneBanner({ copy }: { copy: string }) {
  return (
    <div
      className="milestone label mt-4 rounded-[10px] px-4 py-3 text-center"
      style={{ color: 'var(--color-ember)' }}
      role="status"
    >
      {copy}
    </div>
  );
}
