import { useState, useEffect } from 'react';
import type { TargetRaceInfo } from '../../lib/types/races';

export default function TargetRaceCountdown() {
  const [target, setTarget] = useState<TargetRaceInfo | null>(null);

  useEffect(() => {
    fetch('/api/health/races?target=1')
      .then((res) => res.ok ? res.json() as Promise<{ target: TargetRaceInfo | null }> : null)
      .then((data) => {
        if (data?.target) setTarget(data.target);
      })
      .catch(() => {});
  }, []);

  if (!target) return null;

  // Find the prediction matching the target's distance, or show the first one
  const matchingPrediction = target.predictions.find(
    (p) => p.distance === target.distance,
  ) ?? target.predictions[0];

  return (
    <a
      href="/dashboard/races"
      className="block bg-tile border border-stroke rounded-lg p-4 hover:border-accent transition-colors no-underline hover:no-underline"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-dim uppercase tracking-wide mb-1">Target Race</div>
          <div className="text-sm font-semibold text-heading">{target.name}</div>
          <div className="text-xs text-subtle">
            {target.distance} &middot; {target.date}
            {matchingPrediction && ` · Est. ${matchingPrediction.predictedTime}`}
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <div className="text-2xl font-bold text-accent leading-none">{target.daysUntil}</div>
          <div className="text-xs text-dim">days</div>
        </div>
      </div>
    </a>
  );
}
