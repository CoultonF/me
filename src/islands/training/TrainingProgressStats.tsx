import type { TrainingStats } from '../../lib/types/training';

interface Props {
  stats: TrainingStats;
}

export default function TrainingProgressStats({ stats }: Props) {
  const completionPct = stats.totalWorkouts > 0
    ? Math.round((stats.completedCount / stats.totalWorkouts) * 100)
    : 0;

  // Compute weeks to race from plan end date
  let weeksToRace: number | null = null;
  if (stats.planEndDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(stats.planEndDate + 'T00:00:00');
    const diffMs = end.getTime() - today.getTime();
    weeksToRace = Math.max(0, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)));
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-tile border border-stroke rounded-lg px-3 py-3 text-center">
        <div className="text-lg font-bold text-heading">{stats.totalPlannedKm}</div>
        <div className="text-[10px] text-dim uppercase tracking-wide">Planned km</div>
      </div>
      <div className="bg-tile border border-stroke rounded-lg px-3 py-3 text-center">
        <div className="text-lg font-bold text-heading">{completionPct}%</div>
        <div className="text-[10px] text-dim uppercase tracking-wide">Complete</div>
      </div>
      <div className="bg-tile border border-stroke rounded-lg px-3 py-3 text-center">
        <div className="text-lg font-bold text-heading">{weeksToRace ?? '—'}</div>
        <div className="text-[10px] text-dim uppercase tracking-wide">Weeks left</div>
      </div>
    </div>
  );
}
