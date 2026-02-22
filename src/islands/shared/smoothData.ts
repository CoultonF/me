/**
 * Smooth daily data to weekly aggregates when the dataset exceeds a threshold.
 * Groups by ISO week (Monday-start) and aggregates each field per config.
 */

interface FieldConfig {
  key: string;
  mode: 'avg' | 'sum';
}

function getISOWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  // Shift to Monday-start: getDay() returns 0=Sun..6=Sat → Mon=0..Sun=6
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  return monday.toISOString().slice(0, 10);
}

export function smoothToWeekly<T extends { date: string }>(
  data: T[],
  fields: FieldConfig[],
  threshold = 90,
): { data: T[]; smoothed: boolean } {
  if (data.length <= threshold) {
    return { data, smoothed: false };
  }

  // Group by ISO week
  const weekMap = new Map<string, T[]>();
  for (const item of data) {
    const weekKey = getISOWeekKey(item.date);
    const group = weekMap.get(weekKey);
    if (group) group.push(item);
    else weekMap.set(weekKey, [item]);
  }

  // Aggregate each week
  const result: T[] = [];
  for (const [weekDate, items] of weekMap) {
    const aggregated = { ...items[0]!, date: weekDate };

    for (const field of fields) {
      const values = items
        .map((item) => (item as Record<string, unknown>)[field.key])
        .filter((v): v is number => typeof v === 'number' && v != null);

      if (values.length === 0) {
        (aggregated as Record<string, unknown>)[field.key] = null;
        continue;
      }

      const total = values.reduce((sum, v) => sum + v, 0);
      (aggregated as Record<string, unknown>)[field.key] =
        field.mode === 'sum' ? Math.round(total) : Math.round(total / values.length);
    }

    result.push(aggregated);
  }

  return { data: result.sort((a, b) => a.date.localeCompare(b.date)), smoothed: true };
}
