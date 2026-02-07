import { useState, useEffect } from 'react';
import type { Workout, ActivityAPIResponse } from '../../lib/types/activity';

const CELL = 10;
const GAP = 3;
const DAY_W = 24;

interface DayData {
  date: string;
  count: number;
  totalMinutes: number;
  totalDistanceKm: number;
  names: string[];
}

function buildCalendarData(workouts: Workout[]): DayData[] {
  const now = new Date();
  const map = new Map<string, DayData>();

  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { date: key, count: 0, totalMinutes: 0, totalDistanceKm: 0, names: [] });
  }

  for (const w of workouts) {
    const key = w.startTime.slice(0, 10);
    const entry = map.get(key);
    if (entry) {
      entry.count++;
      entry.totalMinutes += w.durationSeconds ? Math.round(w.durationSeconds / 60) : 0;
      entry.totalDistanceKm += w.distanceKm ?? 0;
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

function GridView({ data, activeDays }: { data: DayData[]; activeDays: number }) {
  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];

  // Pad first week so column starts on Sunday
  if (data.length > 0) {
    const firstDow = new Date(data[0]!.date + 'T12:00:00').getDay();
    for (let i = 0; i < firstDow; i++) {
      currentWeek.push({ date: '', count: -1, totalMinutes: 0, totalDistanceKm: 0, names: [] });
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
    while (currentWeek.length < 7) currentWeek.push({ date: '', count: -1, totalMinutes: 0, totalDistanceKm: 0, names: [] });
    weeks.push(currentWeek);
  }

  // Month labels with pixel positions
  const monthLabels: { label: string; x: number }[] = [];
  let lastMonth = '';
  weeks.forEach((week, wi) => {
    for (const d of week) {
      if (d.count < 0 || !d.date) continue;
      const month = new Date(d.date + 'T12:00:00').toLocaleDateString([], { month: 'short' });
      if (month !== lastMonth) {
        monthLabels.push({ label: month, x: wi * (CELL + GAP) });
        lastMonth = month;
      }
      break;
    }
  });

  const cols = weeks.length;
  const gridW = cols * CELL + (cols - 1) * GAP;

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-medium text-dim uppercase tracking-wide">Activity Calendar</div>
        <div className="text-xs text-dim">
          {activeDays}/{data.length} days active
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: DAY_W + gridW }}>
          {/* Month labels */}
          <div className="relative" style={{ height: 15, marginLeft: DAY_W }}>
            {monthLabels.map((m, i) => (
              <span key={i} className="absolute text-[10px] text-dim leading-none" style={{ left: m.x }}>
                {m.label}
              </span>
            ))}
          </div>

          {/* Day labels + cells */}
          <div className="flex">
            <div className="shrink-0 flex flex-col" style={{ width: DAY_W, gap: GAP }}>
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((l, i) => (
                <div key={i} className="flex items-center text-[10px] text-dim" style={{ height: CELL }}>
                  {l}
                </div>
              ))}
            </div>

            <div
              className="grid"
              style={{
                gridTemplateRows: `repeat(7, ${CELL}px)`,
                gridTemplateColumns: `repeat(${cols}, ${CELL}px)`,
                gridAutoFlow: 'column',
                gap: GAP,
              }}
            >
              {weeks.flatMap((week, wi) =>
                week.map((d, di) => (
                  <div key={`${wi}-${di}`} className="relative group">
                    <div className={`size-full rounded-sm ${d.count < 0 ? 'bg-transparent' : getIntensityClass(d)}`} />
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
                                {d.totalDistanceKm > 0 && <> &middot; {d.totalDistanceKm.toFixed(1)} km</>}
                              </div>
                              <div className="text-dim">{d.names.join(', ')}</div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-dim">
        <span>Rest</span>
        <div className="size-3 rounded-sm bg-stroke-soft" />
        <div className="size-3 rounded-sm bg-activity-exercise/40" />
        <div className="size-3 rounded-sm bg-activity-exercise/60" />
        <div className="size-3 rounded-sm bg-activity-exercise/90" />
        <span>60+ min</span>
      </div>
    </div>
  );
}
