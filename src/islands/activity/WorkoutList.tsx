import type { Workout } from '../../lib/types/activity';

interface Props {
  workouts: Workout[];
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatPace(secPerKm: number | null): string {
  if (!secPerKm || secPerKm <= 0) return '—';
  const min = Math.floor(secPerKm / 60);
  const sec = secPerKm % 60;
  return `${min}:${sec.toString().padStart(2, '0')} /km`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDistance(km: number | null): string {
  if (!km) return '—';
  return `${km.toFixed(2)} km`;
}

export default function WorkoutList({ workouts }: Props) {
  if (workouts.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No workouts for this period</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-dim uppercase tracking-wide">Recent Workouts</div>
      {workouts.map((w) => (
        <div key={w.id} className="bg-tile border border-stroke rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-heading text-sm">{w.activityName ?? 'Workout'}</div>
            <div className="text-xs text-dim">{formatDate(w.startTime)}</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-dim">Distance</span>
              <div className="font-medium text-body">{formatDistance(w.distanceKm)}</div>
            </div>
            <div>
              <span className="text-dim">Duration</span>
              <div className="font-medium text-body">{formatDuration(w.durationSeconds)}</div>
            </div>
            <div>
              <span className="text-dim">Pace</span>
              <div className="font-medium text-body">{formatPace(w.avgPaceSecPerKm)}</div>
            </div>
            <div>
              <span className="text-dim">Calories</span>
              <div className="font-medium text-body">{w.activeCalories ? `${w.activeCalories} kcal` : '—'}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
