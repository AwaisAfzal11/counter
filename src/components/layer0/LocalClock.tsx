import { formatTime12h, localTimezoneLabel } from '../../lib/format';

/**
 * Device-local wall clock, 12-hour with AM/PM, labelled with the device
 * timezone. Campaign math is always UTC+5 — a user who travels sees both
 * truths without the day counter shifting.
 */
export function LocalClock({ now }: { now: Date }) {
  const { time, meridiem, seconds } = formatTime12h(now);
  const tz = localTimezoneLabel(now);

  return (
    <div className="flex items-baseline gap-1.5">
      <span className="num text-[19px] font-semibold text-bone">{time}</span>
      <span className="num text-[11px] text-bone-dim opacity-60">:{seconds}</span>
      <span className="label">{meridiem}</span>
      {tz && <span className="label opacity-55">{tz}</span>}
    </div>
  );
}
