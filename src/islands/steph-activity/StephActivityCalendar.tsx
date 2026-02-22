import { useState, useEffect } from 'react';
import type { StephActivityAPIResponse, StephWorkout } from '../../lib/types/steph-activity';
import { useContainerWidth, computeCellSize } from '../shared/useContainerWidth';
import { localDateStr, utcToLocalDate } from '../shared/dates';
import { CalendarTooltip } from '../shared/CalendarTooltip';

const MIN_CELL = 10;
const GAP = 3;
const DAY_W = 24;

interface DayData {
  date: string;
  workoutCount: number;
  totalMinutes: number;
  totalDistanceKm: number;
  activeCalories: number;
  workoutTypes: string[];
  exerciseMinutes: number;
  steps: number;
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildCalendarData(
  workouts: StephWorkout[],
): DayData[] {
  const now = new Date();
  const map = new Map<string, DayData>();

  // Past 364 days + today
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = localDateStr(d);
    map.set(key, {
      date: key,
      workoutCount: 0,
      totalMinutes: 0,
      totalDistanceKm: 0,
      activeCalories: 0,
      workoutTypes: [],
      exerciseMinutes: 0,
      steps: 0,
    });
  }

  for (const w of workouts) {
    const key = utcToLocalDate(w.startTime);
    const entry = map.get(key);
    if (entry) {
      entry.workoutCount++;
      entry.totalMinutes += w.durationSeconds ? Math.round(w.durationSeconds / 60) : 0;
      entry.totalDistanceKm += w.distanceKm ?? 0;
      entry.activeCalories += w.activeCalories ?? 0;
      if (!entry.workoutTypes.includes(w.workoutType)) {
        entry.workoutTypes.push(w.workoutType);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

const TYPE_COLORS: Record<string, string> = {
  running: '#f59e0b',
  strength: '#a78bfa',
  walking: '#22c55e',
  cycling: '#0ea5e9',
  other: '#9ca3af',
};

function getDayStyle(d: DayData, hiddenTypes: Set<string>): React.CSSProperties | undefined {
  if (d.workoutCount === 0) return undefined;
  const visibleTypes = d.workoutTypes.filter((t) => !hiddenTypes.has(t));
  if (visibleTypes.length === 0) return undefined;
  const opacity = d.totalMinutes < 20 ? 0.35
    : d.totalMinutes < 45 ? 0.55
    : d.totalMinutes < 75 ? 0.75
    : 0.95;
  const colors = visibleTypes.map((t) => TYPE_COLORS[t] ?? TYPE_COLORS.other);
  if (colors.length <= 1) {
    return { backgroundColor: colors[0] ?? TYPE_COLORS.other, opacity };
  }
  const stops = colors.map((c, i) => {
    const start = (i / colors.length) * 100;
    const end = ((i + 1) / colors.length) * 100;
    return `${c} ${start}%, ${c} ${end}%`;
  }).join(', ');
  return { background: `linear-gradient(135deg, ${stops})`, opacity };
}

function formatDateLabel(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function StephActivityCalendar() {
  const [workouts, setWorkouts] = useState<StephWorkout[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/private/api/steph-activity?range=365d')
      .then((r) => r.json() as Promise<StephActivityAPIResponse>)
      .then((d) => {
        setWorkouts(d.workouts);
        setLoaded(true);
      })
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
  const activeDays = data.filter((d) => d.workoutCount > 0).length;

  return <GridView data={data} activeDays={activeDays} pastDays={data.length} />;
}

function GridView({ data, activeDays, pastDays }: { data: DayData[]; activeDays: number; pastDays: number }) {
  const [containerRef, containerWidth] = useContainerWidth();
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());

  const toggleType = (type: string) => {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];

  // Pad first week so column starts on Sunday
  if (data.length > 0) {
    const firstDow = new Date(data[0]!.date + 'T12:00:00').getDay();
    for (let i = 0; i < firstDow; i++) {
      currentWeek.push({
        date: '', workoutCount: -1, totalMinutes: 0, totalDistanceKm: 0,
        activeCalories: 0, workoutTypes: [], exerciseMinutes: 0, steps: 0,
      });
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
    while (currentWeek.length < 7) {
      currentWeek.push({
        date: '', workoutCount: -1, totalMinutes: 0, totalDistanceKm: 0,
        activeCalories: 0, workoutTypes: [], exerciseMinutes: 0, steps: 0,
      });
    }
    weeks.push(currentWeek);
  }

  const cols = weeks.length;
  const cellSize = containerWidth > 0
    ? computeCellSize(containerWidth, cols, DAY_W, GAP, MIN_CELL)
    : MIN_CELL;

  // Month labels with pixel positions
  const monthLabels: { label: string; x: number }[] = [];
  let lastMonth = '';
  weeks.forEach((week, wi) => {
    for (const d of week) {
      if (d.workoutCount < 0 || !d.date) continue;
      const month = new Date(d.date + 'T12:00:00').toLocaleDateString([], { month: 'short' });
      if (month !== lastMonth) {
        monthLabels.push({ label: month, x: wi * (cellSize + GAP) });
        lastMonth = month;
      }
      break;
    }
  });

  const gridW = cols * cellSize + (cols - 1) * GAP;

  return (
    <div ref={containerRef} className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-medium text-dim uppercase tracking-wide">Activity Calendar</div>
        <div className="text-xs text-dim">
          {activeDays}/{pastDays} days active
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
                <div key={i} className="flex items-center text-[10px] text-dim" style={{ height: cellSize }}>
                  {l}
                </div>
              ))}
            </div>

            <div
              className="grid"
              style={{
                gridTemplateRows: `repeat(7, ${cellSize}px)`,
                gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                gridAutoFlow: 'column',
                gap: GAP,
              }}
            >
              {weeks.flatMap((week, wi) =>
                week.map((d, di) => (
                  <CalendarTooltip
                    key={`${wi}-${di}`}
                    content={d.workoutCount >= 0 && d.date ? (
                      <>
                        <div className="font-medium text-body">{formatDateLabel(d.date)}</div>
                        {d.workoutCount === 0 ? (
                          <div className="text-dim mt-0.5">Rest day</div>
                        ) : (
                          <>
                            <div className="text-subtle mt-0.5">
                              {d.workoutCount} workout{d.workoutCount > 1 ? 's' : ''} &middot; {d.totalMinutes} min
                              {d.totalDistanceKm > 0 && <> &middot; {d.totalDistanceKm.toFixed(1)} km</>}
                            </div>
                            {d.activeCalories > 0 && (
                              <div className="text-dim">{d.activeCalories} kcal</div>
                            )}
                            <div className="text-dim">{d.workoutTypes.map(formatType).join(', ')}</div>
                          </>
                        )}
                      </>
                    ) : null}
                  >
                    <div
                      className={`rounded-sm ${
                        d.workoutCount < 0 ? 'bg-transparent' : d.workoutCount === 0 ? 'bg-stroke-soft' : ''
                      }`}
                      style={{ width: cellSize, height: cellSize, ...getDayStyle(d, hiddenTypes) }}
                    />
                  </CalendarTooltip>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 mt-3 text-[10px] text-dim">
        <div className="flex items-center gap-1">
          <div className="size-3 rounded-sm bg-stroke-soft" />
          <span>Rest</span>
        </div>
        {Object.entries(TYPE_COLORS).filter(([k]) => k !== 'other').map(([type, color]) => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            className={`flex items-center gap-1 transition-opacity ${hiddenTypes.has(type) ? 'opacity-30' : ''}`}
          >
            <div className="size-3 rounded-sm" style={{ backgroundColor: color }} />
            <span className="capitalize">{type}</span>
          </button>
        ))}
        <span className="ml-1">Shade = duration</span>
      </div>
    </div>
  );
}
