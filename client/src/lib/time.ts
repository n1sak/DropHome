export const DAY = 86_400_000;

export function daysAgo(n: number, from = Date.now()): number {
  return from - n * DAY;
}

export function ageInDays(t: number, now = Date.now()): number {
  return Math.max(0, (now - t) / DAY);
}

export function relative(t: number, now = Date.now()): string {
  const d = ageInDays(t, now);
  if (d < 1 / 24) return 'just now';
  if (d < 1) return `${Math.round(d * 24)}h ago`;
  if (d < 2) return 'yesterday';
  if (d < 14) return `${Math.round(d)} days ago`;
  if (d < 60) return `${Math.round(d / 7)} weeks ago`;
  if (d < 365) return `${Math.round(d / 30)} months ago`;
  const y = d / 365;
  return y < 1.5 ? 'a year ago' : `${Math.round(y)} years ago`;
}

export function shortDate(t: number): string {
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function yearOf(t: number): number {
  return new Date(t).getFullYear();
}

/** How long since this was touched, as a dust level: 0 clean, 1 dusty, 2 very dusty, 3 cobwebs. */
export function dustLevel(touchedAt: number, now = Date.now()): 0 | 1 | 2 | 3 {
  const d = ageInDays(touchedAt, now);
  if (d > 730) return 3;
  if (d > 365) return 2;
  if (d > 120) return 1;
  return 0;
}
