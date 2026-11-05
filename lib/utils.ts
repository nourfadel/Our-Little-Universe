const DAY_MS = 86_400_000;

/** Parse "YYYY-MM-DD" into a UTC midnight timestamp. No timezone involved. */
function dateOnlyToUtc(value: string): number {
  const [y, m, d] = value.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/**
 * Whole days between a start date (YYYY-MM-DD) and "today" as seen on the
 * viewer's calendar. Both sides are reduced to date-only UTC values, so DST
 * and timezone offsets cannot cause off-by-one errors.
 */
export function daysSince(startDate: string, now: Date = new Date()): number {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today - dateOnlyToUtc(startDate)) / DAY_MS));
}

/** Milliseconds until the viewer's next local midnight (plus a small buffer). */
export function msUntilNextMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  return next.getTime() - now.getTime();
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
