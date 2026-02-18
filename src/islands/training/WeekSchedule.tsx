import type { TrainingWorkout } from '../../lib/types/training';
import { getWorkoutColor } from './workoutTypeColors';

interface Props {
  workouts: TrainingWorkout[];
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDates(): string[] {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(12, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export default function WeekSchedule({ workouts }: Props) {
  const weekDates = getWeekDates();
  const today = new Date().toISOString().slice(0, 10);
  const workoutMap = new Map(workouts.map((w) => [w.date, w]));

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-5">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-3">This Week</div>
      <div className="space-y-1">
        {weekDates.map((date, i) => {
          const workout = workoutMap.get(date);
          const isToday = date === today;
          const isPast = date < today;

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
                  {workout.distanceKm != null && workout.distanceKm > 0 && (
                    <span className="text-xs text-dim flex-shrink-0 ml-auto">{workout.distanceKm} km</span>
                  )}
                </>
              ) : (
                <>
                  <span className="size-2 rounded-full flex-shrink-0 bg-stroke" />
                  <span className="text-dim">Rest</span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
