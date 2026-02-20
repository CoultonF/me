import { useState, useMemo } from 'react';
import type { TrainingWorkout } from '../../lib/types/training';
import type { Workout } from '../../lib/types/activity';
import { getWorkoutColor } from './workoutTypeColors';
import { localDateStr, utcToLocalDate } from '../shared/dates';

interface Props {
  allWorkouts: TrainingWorkout[];
  actualWorkouts: Workout[];
  planStartDate: string | null;
  planEndDate: string | null;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDates(offset: number): string[] {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + offset * 7);
  monday.setHours(12, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return localDateStr(d);
  });
}

function formatWeekLabel(dates: string[]): string {
  const start = new Date(dates[0]! + 'T12:00:00');
  const end = new Date(dates[6]! + 'T12:00:00');
  const sameMonth = start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${start.toLocaleDateString([], { month: 'short', day: 'numeric' })}–${end.getDate()}`;
  }
  return `${start.toLocaleDateString([], { month: 'short', day: 'numeric' })}–${end.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}

export default function WeekSchedule({ allWorkouts, actualWorkouts, planStartDate, planEndDate }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const today = new Date().toISOString().slice(0, 10);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const workoutMap = useMemo(
    () => new Map(allWorkouts.map((w) => [w.date, w])),
    [allWorkouts],
  );

  // Build actual distance by date (sum all activities per day)
  const actualByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of actualWorkouts) {
      const date = utcToLocalDate(w.startTime);
      map.set(date, (map.get(date) ?? 0) + (w.distanceKm ?? 0));
    }
    return map;
  }, [actualWorkouts]);

  // Clamp navigation to plan boundaries
  const canGoPrev = planStartDate ? weekDates[0]! > planStartDate : weekOffset > -12;
  const canGoNext = planEndDate ? weekDates[6]! < planEndDate : weekOffset < 26;

  const weekLabel = weekOffset === 0 ? 'This Week' : formatWeekLabel(weekDates);

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-medium text-dim uppercase tracking-wide">{weekLabel}</div>
        <div className="flex items-center gap-1">
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-[10px] text-accent hover:underline mr-2"
            >
              Today
            </button>
          )}
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            disabled={!canGoPrev}
            className="p-1 rounded hover:bg-stroke/50 text-dim hover:text-body disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Previous week"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 4l-4 4 4 4" /></svg>
          </button>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            disabled={!canGoNext}
            className="p-1 rounded hover:bg-stroke/50 text-dim hover:text-body disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Next week"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 4l4 4-4 4" /></svg>
          </button>
        </div>
      </div>
      <div className="space-y-1">
        {weekDates.map((date, i) => {
          const workout = workoutMap.get(date);
          const isToday = date === today;
          const isPast = date < today;
          const actualKm = actualByDate.get(date);
          const hasActual = isPast && actualKm != null && actualKm > 0;
          const plannedKm = workout?.distanceKm;

          return (
            <div
              key={date}
              className={`flex items-center gap-3 rounded-md px-3 py-1.5 text-sm ${isToday ? 'bg-accent/10' : ''}`}
            >
              <span className={`w-8 text-xs font-medium ${isToday ? 'text-accent' : 'text-dim'}`}>
                {DAY_LABELS[i]}
              </span>
              {workout ? (
                <>
                  <span
                    className="size-2 rounded-full flex-shrink-0"
                    style={{ background: getWorkoutColor(workout.workoutType) }}
                  />
                  <span className={`truncate ${isPast && workout.status !== 'completed' ? 'text-dim line-through' : 'text-body'}`}>
                    {workout.title}
                  </span>
                  <span className="flex items-center gap-1 flex-shrink-0 ml-auto text-xs">
                    {hasActual && plannedKm != null && plannedKm > 0 ? (
                      <>
                        <span className={actualKm >= plannedKm * 0.9 ? 'text-training-easy' : 'text-dim'}>{actualKm.toFixed(1)}</span>
                        <span className="text-ghost">/</span>
                        <span className="text-dim">{plannedKm} km</span>
                      </>
                    ) : hasActual ? (
                      <span className="text-training-easy">{actualKm.toFixed(1)} km</span>
                    ) : plannedKm != null && plannedKm > 0 ? (
                      <span className="text-dim">{plannedKm} km</span>
                    ) : null}
                  </span>
                </>
              ) : (
                <>
                  <span className="size-2 rounded-full flex-shrink-0 bg-stroke" />
                  <span className="text-dim">Rest</span>
                  {hasActual && (
                    <span className="text-xs text-training-easy flex-shrink-0 ml-auto">{actualKm.toFixed(1)} km</span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
