import { useState, useEffect } from 'react';
import type { Workout, ActivityAPIResponse } from '../../lib/types/activity';
import type { RacesAPIResponse, RaceWithResult } from '../../lib/types/races';
import type { TrainingWorkout, TrainingAPIResponse } from '../../lib/types/training';
import { useContainerWidth, computeCellSize } from '../shared/useContainerWidth';
import { localDateStr, utcToLocalDate } from '../shared/dates';
import { CalendarTooltip } from '../shared/CalendarTooltip';
import { getWorkoutColor, getWorkoutLabel } from '../training/workoutTypeColors';

const MIN_CELL = 10;
const GAP = 3;
const DAY_W = 24;

interface RaceInfo {
  name: string;
  distance: string;
  chipTime: string | null;
  status: 'completed' | 'upcoming' | 'target';
}

interface TrainingInfo {
  title: string;
  workoutType: string | null;
  distanceKm: number | null;
}

interface DayData {
  date: string;
  count: number;
  totalMinutes: number;
  totalDistanceKm: number;
  names: string[];
  race?: RaceInfo | undefined;
  training?: TrainingInfo | undefined;
  isFuture: boolean;
}

function buildCalendarData(workouts: Workout[], races: RaceWithResult[], trainingWorkouts: TrainingWorkout[]): DayData[] {
  const now = new Date();
  const today = localDateStr(now);
  const map = new Map<string, DayData>();

  // Past 364 days + today
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = localDateStr(d);
    map.set(key, { date: key, count: 0, totalMinutes: 0, totalDistanceKm: 0, names: [], isFuture: false });
  }

  // Extend into future for upcoming training workouts (up to ~6 months)
  const futureTraining = trainingWorkouts.filter((w) => w.date > today);
  if (futureTraining.length > 0) {
    const lastTrainingDate = futureTraining[futureTraining.length - 1]!.date;
    const endDate = new Date(lastTrainingDate + 'T12:00:00');
    // Fill from tomorrow to the last training date
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    for (let d = new Date(tomorrow); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = localDateStr(d);
      if (!map.has(key)) {
        map.set(key, { date: key, count: 0, totalMinutes: 0, totalDistanceKm: 0, names: [], isFuture: true });
      }
    }
  }

  for (const w of workouts) {
    const key = utcToLocalDate(w.startTime);
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

  for (const r of races) {
    const entry = map.get(r.date);
    if (entry) {
      entry.race = {
        name: r.name,
        distance: r.distance,
        chipTime: r.result?.chipTime ?? null,
        status: r.status,
      };
    }
  }

  for (const t of trainingWorkouts) {
    const entry = map.get(t.date);
    if (entry) {
      entry.training = {
        title: t.title,
        workoutType: t.workoutType,
        distanceKm: t.distanceKm,
      };
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
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

function MedalIcon({ size }: { size: number }) {
  const s = Math.max(size - 2, 6);
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 m-auto drop-shadow-sm"
    >
      {/* Ribbon */}
      <path d="M5 1h2.5l-1 5H5V1z" fill="#DC2626" opacity="0.9" />
      <path d="M11 1H8.5l1 5H11V1z" fill="#2563EB" opacity="0.9" />
      {/* Medal circle */}
      <circle cx="8" cy="10.5" r="4.5" fill="#EAB308" />
      <circle cx="8" cy="10.5" r="3.2" fill="#FACC15" />
      {/* Star */}
      <path d="M8 7.8l.9 1.8 2 .3-1.4 1.4.3 2L8 12.3l-1.8 1 .3-2-1.4-1.4 2-.3z" fill="#EAB308" />
    </svg>
  );
}

function StripedCell({ size, color }: { size: number; color: string }) {
  return (
    <svg className="absolute inset-0 size-full rounded-sm overflow-hidden" viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="transparent" />
      {/* Diagonal stripes */}
      {Array.from({ length: Math.ceil(size / 3) + 1 }, (_, i) => (
        <line
          key={i}
          x1={i * 4 - size}
          y1={size}
          x2={i * 4}
          y2={0}
          stroke={color}
          strokeWidth={1.5}
          strokeOpacity={0.5}
        />
      ))}
    </svg>
  );
}

export default function ActivityCalendar() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [races, setRaces] = useState<RaceWithResult[]>([]);
  const [trainingWorkouts, setTrainingWorkouts] = useState<TrainingWorkout[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const activityPromise = fetch('/api/health/activity?range=365d')
      .then((r) => r.json() as Promise<ActivityAPIResponse>)
      .then((d) => d.workouts)
      .catch(() => [] as Workout[]);

    const racesPromise = fetch('/api/health/races')
      .then((r) => r.json() as Promise<RacesAPIResponse>)
      .then((d) => [...d.completed, ...d.upcoming])
      .catch(() => [] as RaceWithResult[]);

    const trainingPromise = fetch('/api/health/training?range=all')
      .then((r) => r.json() as Promise<TrainingAPIResponse>)
      .then((d) => d.workouts)
      .catch(() => [] as TrainingWorkout[]);

    Promise.all([activityPromise, racesPromise, trainingPromise]).then(([w, r, t]) => {
      setWorkouts(w);
      setRaces(r);
      setTrainingWorkouts(t);
      setLoaded(true);
    });
  }, []);

  if (!loaded) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
        <div className="text-xs text-dim">Loading activity calendar...</div>
      </div>
    );
  }

  const data = buildCalendarData(workouts, races, trainingWorkouts);
  const activeDays = data.filter((d) => d.count > 0 && !d.isFuture).length;
  const pastDays = data.filter((d) => !d.isFuture).length;

  return <GridView data={data} activeDays={activeDays} pastDays={pastDays} />;
}

function GridView({ data, activeDays, pastDays }: { data: DayData[]; activeDays: number; pastDays: number }) {
  const [containerRef, containerWidth] = useContainerWidth();

  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];

  // Pad first week so column starts on Sunday
  if (data.length > 0) {
    const firstDow = new Date(data[0]!.date + 'T12:00:00').getDay();
    for (let i = 0; i < firstDow; i++) {
      currentWeek.push({ date: '', count: -1, totalMinutes: 0, totalDistanceKm: 0, names: [], isFuture: false });
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
    while (currentWeek.length < 7) currentWeek.push({ date: '', count: -1, totalMinutes: 0, totalDistanceKm: 0, names: [], isFuture: false });
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
      if (d.count < 0 || !d.date) continue;
      const month = new Date(d.date + 'T12:00:00').toLocaleDateString([], { month: 'short' });
      if (month !== lastMonth) {
        monthLabels.push({ label: month, x: wi * (cellSize + GAP) });
        lastMonth = month;
      }
      break;
    }
  });

  const gridW = cols * cellSize + (cols - 1) * GAP;
  const hasTraining = data.some((d) => d.training && d.isFuture);

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
                week.map((d, di) => {
                  const isFutureWithTraining = d.isFuture && d.training;
                  const isFutureEmpty = d.isFuture && !d.training;
                  const trainingColor = d.training ? getWorkoutColor(d.training.workoutType) : '';

                  return (
                    <CalendarTooltip
                      key={`${wi}-${di}`}
                      content={d.count >= 0 && d.date ? (
                        <>
                          <div className="font-medium text-body">{formatDateLabel(d.date)}</div>
                          {d.race && (
                            <div className="text-yellow-500 font-medium mt-0.5">
                              {d.race.name} ({d.race.distance})
                              {d.race.chipTime && <> &middot; {d.race.chipTime}</>}
                            </div>
                          )}
                          {d.training && d.isFuture && (
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span
                                className="inline-block text-[9px] font-medium px-1 py-0.5 rounded leading-none"
                                style={{ background: trainingColor, color: '#fff' }}
                              >
                                {getWorkoutLabel(d.training.workoutType)}
                              </span>
                              <span className="text-body">{d.training.title}</span>
                              {d.training.distanceKm != null && d.training.distanceKm > 0 && (
                                <span className="text-dim">{d.training.distanceKm} km</span>
                              )}
                            </div>
                          )}
                          {!d.isFuture && d.count === 0 ? (
                            !d.race && !d.training && <div className="text-dim mt-0.5">Rest day</div>
                          ) : !d.isFuture && d.count > 0 ? (
                            <>
                              <div className="text-subtle mt-0.5">
                                {d.count} workout{d.count > 1 ? 's' : ''} &middot; {d.totalMinutes} min
                                {d.totalDistanceKm > 0 && <> &middot; {d.totalDistanceKm.toFixed(1)} km</>}
                              </div>
                              <div className="text-dim">{d.names.join(', ')}</div>
                            </>
                          ) : null}
                        </>
                      ) : null}
                    >
                      <div className="relative">
                        <div
                          className={`size-full rounded-sm ${
                            d.count < 0
                              ? 'bg-transparent'
                              : isFutureEmpty
                                ? 'bg-transparent'
                                : isFutureWithTraining
                                  ? ''
                                  : getIntensityClass(d)
                          }`}
                          style={{ width: cellSize, height: cellSize }}
                        />
                        {isFutureWithTraining && <StripedCell size={cellSize} color={trainingColor} />}
                        {d.race && <MedalIcon size={cellSize} />}
                      </div>
                    </CalendarTooltip>
                  );
                })
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
        <span className="ml-1">|</span>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="10.5" r="4.5" fill="#EAB308" />
          <circle cx="8" cy="10.5" r="3.2" fill="#FACC15" />
          <path d="M8 7.8l.9 1.8 2 .3-1.4 1.4.3 2L8 12.3l-1.8 1 .3-2-1.4-1.4 2-.3z" fill="#EAB308" />
        </svg>
        <span>Race</span>
        {hasTraining && (
          <>
            <span className="ml-1">|</span>
            <div className="size-3 rounded-sm relative overflow-hidden">
              <svg className="absolute inset-0 size-full" viewBox="0 0 12 12">
                <line x1="0" y1="12" x2="4" y2="0" stroke="var(--color-training-planned)" strokeWidth="1.5" strokeOpacity="0.5" />
                <line x1="4" y1="12" x2="8" y2="0" stroke="var(--color-training-planned)" strokeWidth="1.5" strokeOpacity="0.5" />
                <line x1="8" y1="12" x2="12" y2="0" stroke="var(--color-training-planned)" strokeWidth="1.5" strokeOpacity="0.5" />
              </svg>
            </div>
            <span>Planned</span>
          </>
        )}
      </div>
    </div>
  );
}
