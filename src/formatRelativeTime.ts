import { MILLISECONDS_PER_DAY } from "./storage";

const plural = (count: number, unit: string) =>
  `${count} ${unit}${count === 1 ? "" : "s"} ago`;

// "3 days ago" - used in the properties panel
export function formatRelativeTime(timestamp: number): string {
  const elapsed = Date.now() - timestamp;
  const minutes = Math.floor(elapsed / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return plural(minutes, "minute");

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, "hour");

  const days = Math.floor(elapsed / MILLISECONDS_PER_DAY);
  if (days === 1) return "yesterday";
  if (days < 14) return plural(days, "day");
  if (days < 60) return plural(Math.floor(days / 7), "week");
  if (days < 365) return plural(Math.floor(days / 30), "month");
  return plural(Math.floor(days / 365), "year");
}

// "3d ago" - used inside the balls, where there is little room
export function formatRelativeTimeShort(timestamp: number): string {
  const elapsed = Date.now() - timestamp;
  const hours = Math.floor(elapsed / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(elapsed / MILLISECONDS_PER_DAY);
  if (days < 14) return `${days}d ago`;
  if (days < 60) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
