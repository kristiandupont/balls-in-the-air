import { MILLISECONDS_PER_DAY } from "./storage";

const HOUR = 1000 * 60 * 60;

const plural = (count: number, unit: string) =>
  `${count} ${unit}${count === 1 ? "" : "s"}`;

// "3 days", "2 weeks", "1 month" - the largest unit that fits
export function formatDuration(milliseconds: number): string {
  const elapsed = Math.max(milliseconds, 0);
  const minutes = Math.floor(elapsed / (1000 * 60));
  if (minutes < 60) return plural(minutes, "minute");

  const hours = Math.floor(elapsed / HOUR);
  if (hours < 24) return plural(hours, "hour");

  const days = Math.floor(elapsed / MILLISECONDS_PER_DAY);
  if (days < 14) return plural(days, "day");
  if (days < 60) return plural(Math.floor(days / 7), "week");
  if (days < 365) return plural(Math.floor(days / 30), "month");
  return plural(Math.floor(days / 365), "year");
}

// "3d", "2w", "5mo" - used inside the balls, where there is little room
export function formatDurationShort(milliseconds: number): string {
  const elapsed = Math.max(milliseconds, 0);
  const hours = Math.floor(elapsed / HOUR);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(elapsed / MILLISECONDS_PER_DAY);
  if (days < 14) return `${days}d`;
  if (days < 60) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

// "3 days ago" - used in the properties panel
export function formatRelativeTime(timestamp: number): string {
  const elapsed = Date.now() - timestamp;
  if (elapsed < 1000 * 60) return "just now";
  if (elapsed >= MILLISECONDS_PER_DAY && elapsed < 2 * MILLISECONDS_PER_DAY) {
    return "yesterday";
  }
  return `${formatDuration(elapsed)} ago`;
}

// "3d ago" - used inside the balls
export function formatRelativeTimeShort(timestamp: number): string {
  const elapsed = Date.now() - timestamp;
  if (elapsed < HOUR) return "just now";
  return `${formatDurationShort(elapsed)} ago`;
}
