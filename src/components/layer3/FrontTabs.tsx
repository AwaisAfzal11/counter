import { useRef, type TouchEvent } from 'react';
import { useTabPersistence } from '../../hooks/useTabPersistence';
import type { Phase } from '../../lib/time';
import { GridView } from './GridView';
import { MonthsView } from './MonthsView';
import { RingView } from './RingView';

const TABS = ['GRID', 'RING', 'MONTHS'] as const;
type Tab = (typeof TABS)[number];

const SWIPE_THRESHOLD = 48;

/**
 * The only interactive control in the app. It changes which visualization you
 * are looking at — it never changes the data.
 */
export function FrontTabs({ dayIndex, phase }: { dayIndex: number; phase: Phase }) {
  const [tab, setTab] = useTabPersistence<Tab>(TABS, 'GRID');
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const step = (delta: number) => {
    const next = TABS[(TABS.indexOf(tab) + delta + TABS.length) % TABS.length];
    setTab(next);
  };

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    step(dx < 0 ? 1 : -1);
  };

  return (
    <section aria-label="The Front">
      <div className="tabs" role="tablist" aria-label="Visualization">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            id={`front-tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`front-panel-${t}`}
            tabIndex={tab === t ? 0 : -1}
            className="tab"
            onClick={() => setTab(t)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') step(1);
              else if (e.key === 'ArrowLeft') step(-1);
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div
        className="card mt-3"
        role="tabpanel"
        id={`front-panel-${tab}`}
        aria-labelledby={`front-tab-${tab}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {tab === 'GRID' && <GridView dayIndex={dayIndex} phase={phase} />}
        {tab === 'RING' && <RingView dayIndex={dayIndex} phase={phase} />}
        {tab === 'MONTHS' && <MonthsView dayIndex={dayIndex} phase={phase} />}
      </div>
    </section>
  );
}
