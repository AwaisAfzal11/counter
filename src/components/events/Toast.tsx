export function Toast({ message }: { message: string }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <p
        className="toast label rounded-[10px] border px-4 py-3"
        style={{
          background: 'var(--color-iron)',
          borderColor: 'color-mix(in srgb, var(--color-ember) 45%, transparent)',
          color: 'var(--color-bone)',
        }}
      >
        {message}
      </p>
    </div>
  );
}
