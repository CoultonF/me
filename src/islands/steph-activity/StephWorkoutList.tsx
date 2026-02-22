import type { StephWorkout } from '../../lib/types/steph-activity';

interface Props {
  workouts: StephWorkout[];
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDistance(km: number | null): string {
  if (!km) return '--';
  return `${km.toFixed(2)} km`;
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StephWorkoutList({ workouts }: Props) {
  if (workouts.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No workouts recorded</div>
      </div>
    );
  }

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Recent Workouts</div>
      <div className="space-y-3">
        {workouts.slice(0, 15).map((w, i) => (
          <div key={i} className="border border-stroke rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-heading">{formatType(w.workoutType)}</div>
              <div className="text-xs text-dim">{formatDate(w.startTime)}</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-dim">Distance: </span>
                <span className="text-body">{formatDistance(w.distanceKm)}</span>
              </div>
              <div>
                <span className="text-dim">Duration: </span>
                <span className="text-body">{formatDuration(w.durationSeconds)}</span>
              </div>
              <div>
                <span className="text-dim">Avg HR: </span>
                <span className="text-body">{w.avgHeartRate ?? '--'} bpm</span>
              </div>
              <div>
                <span className="text-dim">Calories: </span>
                <span className="text-body">{w.activeCalories ?? '--'} kcal</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
