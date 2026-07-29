import { memo } from 'react';

/**
 * One line per day, selected deterministically from the day index. It changes
 * on rollover only — a line that shuffles every eight seconds becomes noise
 * inside a week.
 */
export const FieldDoctrine = memo(function FieldDoctrine({ line }: { line: string }) {
  return (
    <section className="px-1 pt-2 pb-10 text-center" aria-label="Field Doctrine">
      <p className="label mb-3">Field Doctrine</p>
      <p className="text-[15px] leading-relaxed text-bone">{line}</p>
    </section>
  );
});
