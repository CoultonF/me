import type { TrainingWorkout } from '../../lib/types/training';
import { getWorkoutColor, getWorkoutLabel } from './workoutTypeColors';

interface Props {
  workout: TrainingWorkout;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';

  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function NextWorkoutCard({ workout }: Props) {
  const color = getWorkoutColor(workout.workoutType);
  const label = getWorkoutLabel(workout.workoutType);

  return (
    <div
      className="bg-tile border border-stroke rounded-lg p-4 md:p-5"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-dim uppercase tracking-wide mb-1">Next Workout</div>
          <div className="text-sm font-semibold text-heading truncate">{workout.title}</div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: color, color: '#fff' }}
            >
              {label}
            </span>
            {workout.distanceKm != null && workout.distanceKm > 0 && (
              <span className="text-xs text-subtle">{workout.distanceKm} km</span>
            )}
            {workout.targetPace && (
              <span className="text-xs text-dim">{workout.targetPace}/km</span>
            )}
          </div>
          {workout.description && (
            <div className="text-xs text-dim mt-2 line-clamp-2">{workout.description}</div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-medium text-accent">{formatDate(workout.date)}</div>
        </div>
      </div>
    </div>
  );
}
