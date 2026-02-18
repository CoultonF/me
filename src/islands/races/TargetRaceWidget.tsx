import type { TargetRaceInfo } from '../../lib/types/races';
import type { TrainingStats } from '../../lib/types/training';

interface Props {
  target: TargetRaceInfo;
  trainingStats?: TrainingStats | null | undefined;
}

export default function TargetRaceWidget({ target, trainingStats }: Props) {
  // Compute training block progress
  let weekNumber: number | null = null;
  let totalWeeks: number | null = null;
  let completionPct: number | null = null;

  if (trainingStats && trainingStats.planStartDate && trainingStats.planEndDate && trainingStats.totalWorkouts > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(trainingStats.planStartDate + 'T00:00:00');
    const end = new Date(trainingStats.planEndDate + 'T00:00:00');

    totalWeeks = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    weekNumber = Math.max(1, Math.min(totalWeeks, Math.ceil((today.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1));
    completionPct = Math.round((trainingStats.completedCount / trainingStats.totalWorkouts) * 100);
  }

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs font-medium text-dim uppercase tracking-wide mb-1">Target Race</div>
          <div className="text-lg font-semibold text-heading">{target.name}</div>
          <div className="text-sm text-subtle">
            {target.distance} &middot; {target.location ?? target.date}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-accent leading-none">{target.daysUntil}</div>
          <div className="text-xs text-dim mt-1">days to go</div>
        </div>
      </div>

      {target.predictions.length > 0 && (
        <div className="border-t border-stroke pt-4">
          <div className="text-xs font-medium text-dim uppercase tracking-wide mb-3">VDOT Predictions</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {target.predictions.map((p) => (
              <div key={p.distance} className="bg-page rounded-md px-3 py-2">
                <div className="text-xs text-dim">{p.distance}</div>
                <div className="text-sm font-semibold text-heading">{p.predictedTime}</div>
                <div className="text-xs text-subtle">{p.predictedPace}/km</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {target.recentAvgPace && (
        <div className="border-t border-stroke pt-3 mt-4 flex items-center gap-2">
          <span className="text-xs text-dim">Recent training pace (30d):</span>
          <span className="text-sm font-medium text-body">{target.recentAvgPace}/km</span>
        </div>
      )}

      {weekNumber != null && totalWeeks != null && completionPct != null && (
        <div className="border-t border-stroke pt-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-dim uppercase tracking-wide">Training Block</div>
            <div className="text-xs text-subtle">
              Week {weekNumber} of {totalWeeks} &middot; {completionPct}% complete
            </div>
          </div>
          <div className="h-2 bg-page rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (weekNumber / totalWeeks) * 100)}%`,
                background: 'var(--color-training-planned)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
