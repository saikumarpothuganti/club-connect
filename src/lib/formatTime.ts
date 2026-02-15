/**
 * Format minutes into human-readable time.
 * < 60 → "45m"
 * >= 60 → "1h 15m"
 */
export function formatTime(totalMinutes: number): string {
  if (totalMinutes < 0) return "0m";
  const m = Math.round(totalMinutes);
  if (m < 60) return `${m}m`;
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
