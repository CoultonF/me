import { useState, useEffect } from 'react';
import type { Workout, ActivityAPIResponse } from '../../lib/types/activity';

const DAYS = 365;

interface DayData {
  date: string;
  count: number;
  totalMinutes: number;
  names: string[];
}

function buildCalendarData(workouts: Workout[], days: number = DAYS): DayData[] {
  const now = new Date();
  const map = new Map<string, DayData>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { date: key, count: 0, totalMinutes: 0, names: [] });
  }

  for (const w of workouts) {
    const key = w.startTime.slice(0, 10);
    const entry = map.get(key);
    if (entry) {
      entry.count++;
      entry.totalMinutes += w.durationSeconds ? Math.round(w.durationSeconds / 60) : 0;
      if (w.activityName && !entry.names.includes(w.activityName)) {
        entry.names.push(w.activityName);
      }
    }
  }

  return Array.from(map.values());
}

function getIntensityClass(d: DayData): string {
  if (d.count === 0) return 'bg-stroke-soft';
  if (d.totalMinutes < 30) return 'bg-activity-exercise/40';
  if (d.totalMinutes < 60) return 'bg-activity-exercise/60';
  return 'bg-activity-exercise/90';
}

function formatDateLabel(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function ActivityCalendar() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/health/activity?range=365d')
      .then((r) => r.json() as Promise<ActivityAPIResponse>)
      .then((d) => { setWorkouts(d.workouts); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
        <div className="text-xs text-dim">Loading activity calendar...</div>
      </div>
    );
  }

  const data = buildCalendarData(workouts);
  const activeDays = data.filter((d) => d.count > 0).length;

  return <GridView data={data} activeDays={activeDays} />;
}

// ── 365-day compact grid heatmap ──

function GridView({ data, activeDays }: { data: DayData[]; activeDays: number }) {
  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];

  // Pad first week to start on Monday
  if (data.length > 0) {
    const firstDay = new Date(data[0]!.date + 'T12:00:00').getDay();
    const mondayOffset = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < mondayOffset; i++) {
      currentWeek.push({ date: '', count: -1, totalMinutes: 0, names: [] });
    }
  }

  for (const d of data) {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const cellClass = 'size-3 rounded-sm';
  const gap = 4;

  // Month labels
  const monthLabels: { label: string; index: number }[] = [];
  let lastMonth = '';
  weeks.forEach((week, wi) => {
    for (const d of week) {
      if (d.count < 0 || !d.date) continue;
      const month = new Date(d.date + 'T12:00:00').toLocaleDateString([], { month: 'short' });
      if (month !== lastMonth) {
        monthLabels.push({ label: month, index: wi });
        lastMonth = month;
      }
      break;
    }
  });

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-medium text-dim uppercase tracking-wide">Activity Calendar</div>
        <div className="text-xs text-dim">
          {activeDays}/{data.length} days active
        </div>
      </div>

      {/* Month labels */}
      {monthLabels.length > 0 && (
        <div className="flex mb-1" style={{ paddingLeft: 18 }}>
          <div className="flex flex-1 overflow-x-auto" style={{ gap }}>
            {weeks.map((_, wi) => {
              const ml = monthLabels.find((m) => m.index === wi);
              return (
                <div key={wi} className="text-[10px] text-dim" style={{ width: 16, flexShrink: 0 }}>
                  {ml?.label ?? ''}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex" style={{ gap }}>
        {/* Day-of-week labels */}
        <div className="flex flex-col text-[10px] text-dim" style={{ gap, paddingTop: 1, width: 14 }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => (
            <div key={i} className="h-3 flex items-center justify-end leading-none">
              {i % 2 === 0 ? label : ''}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex flex-1 overflow-x-auto" style={{ gap }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col" style={{ gap }}>
              {week.map((d, di) => (
                <div key={di} className="relative group">
                  <div
                    className={`${cellClass} ${d.count < 0 ? 'bg-transparent' : getIntensityClass(d)}`}
                  />
                  {d.count >= 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                      <div className="bg-tile border border-stroke rounded-lg px-3 py-2 shadow-lg whitespace-nowrap text-xs">
                        <div className="font-medium text-body">{formatDateLabel(d.date)}</div>
                        {d.count === 0 ? (
                          <div className="text-dim mt-0.5">Rest day</div>
                        ) : (
                          <>
                            <div className="text-subtle mt-0.5">
                              {d.count} workout{d.count > 1 ? 's' : ''} &middot; {d.totalMinutes} min
                            </div>
                            <div className="text-dim">{d.names.join(', ')}</div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-dim">
        <span>Rest</span>
        <div className={`${cellClass} bg-stroke-soft`} />
        <div className={`${cellClass} bg-activity-exercise/40`} />
        <div className={`${cellClass} bg-activity-exercise/60`} />
        <div className={`${cellClass} bg-activity-exercise/90`} />
        <span>60+ min</span>
      </div>
    </div>
  );
}
