import { MS_PER_HOUR, MS_PER_MINUTE, MS_PER_SECOND } from './time';

/** Device-local wall clock, 12-hour with AM/PM. Never 24-hour. */
export function formatTime12h(date: Date): { time: string; meridiem: string; seconds: string } {
  let hours = date.getHours();
  const meridiem = hours < 12 ? 'AM' : 'PM';
  hours = hours % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return { time: `${hours}:${minutes}`, meridiem, seconds };
}

/** Short timezone name for the device, e.g. PKT / GMT+5. */
export function localTimezoneLabel(date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).formatToParts(date);
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

/**
 * `9h 42m` above an hour, `42m 13s` below it. Always remaining, never elapsed.
 */
export function formatDuration(ms: number): string {
  const total = Math.max(0, ms);
  const hours = Math.floor(total / MS_PER_HOUR);
  const minutes = Math.floor((total % MS_PER_HOUR) / MS_PER_MINUTE);
  const seconds = Math.floor((total % MS_PER_MINUTE) / MS_PER_SECOND);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

/** `3d 04h 12m` — used only for the pre-campaign countdown. */
export function formatLongDuration(ms: number): string {
  const total = Math.max(0, ms);
  const days = Math.floor(total / 86_400_000);
  const hours = Math.floor((total % 86_400_000) / MS_PER_HOUR);
  const minutes = Math.floor((total % MS_PER_HOUR) / MS_PER_MINUTE);
  return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
}

/** Whole hours with a thousands separator: `2,486`. */
export function formatHours(ms: number): string {
  return Math.floor(Math.max(0, ms) / MS_PER_HOUR).toLocaleString('en-US');
}

/** Minutes-and-seconds remainder, for the live tick under a big hours figure. */
export function formatHourRemainder(ms: number): string {
  const total = Math.max(0, ms) % MS_PER_HOUR;
  const minutes = Math.floor(total / MS_PER_MINUTE);
  const seconds = Math.floor((total % MS_PER_MINUTE) / MS_PER_SECOND);
  return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

export function formatPercent(fraction: number, digits = 1): string {
  return `${(Math.max(0, Math.min(1, fraction)) * 100).toFixed(digits)}%`;
}

export function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}
