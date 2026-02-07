import type { TargetRaceInfo } from '../../lib/types/races';

interface Props {
  target: TargetRaceInfo;
}

export default function TargetRaceWidget({ target }: Props) {
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
    </div>
  );
}
