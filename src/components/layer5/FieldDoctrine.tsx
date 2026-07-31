import { memo } from 'react';
import { DOCTRINE } from '../../lib/constants';

/**
 * The leading doctrine changes at the top of every local hour. Nearby entries
 * stay horizontally scrollable so the user can keep reading without waiting.
 */
export const FieldDoctrine = memo(function FieldDoctrine({ now }: { now: Date }) {
  const hourKey = Math.floor(now.getTime() / 3_600_000);
  const start = hourKey % DOCTRINE.length;
  const lines = Array.from(
    { length: Math.min(8, DOCTRINE.length) },
    (_, index) => DOCTRINE[(start + index) % DOCTRINE.length],
  );

  return (
    <section className="pt-2 pb-2" aria-label="Field Doctrine">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="label">Field Doctrine</p>
        <p className="micro text-bone-dim">New doctrine each hour</p>
      </div>
      <div className="doctrine-scroll" tabIndex={0} aria-label="Scrollable field doctrines">
        {lines.map((line, index) => (
          <article
            className={`doctrine-card ${index === 0 ? 'doctrine-card--current' : ''}`}
            key={line}
          >
            <p className="micro mb-3 text-bone-dim">
              {index === 0 ? 'CURRENT ORDER' : `FIELD NOTE ${index + 1}`}
            </p>
            <p className="text-[15px] leading-relaxed text-bone">{line}</p>
          </article>
        ))}
      </div>
    </section>
  );
});
