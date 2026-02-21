import { TOTAL_EXERCISES } from '../../lib/rehab-exercises';
import type { RehabStatsResponse } from '../../lib/types/rehab';

interface Props {
  todayCount: number;
  stats: RehabStatsResponse;
}

export default function RehabStats({ todayCount, stats }: Props) {
  // 30-day consistency: days with at least 1 exercise / 30
  const last30 = stats.dailyCounts.filter((d) => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return d.date >= cutoff;
  });
  const consistencyPct = Math.round((last30.length / 30) * 100);

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-tile border border-stroke rounded-lg px-3 py-3 text-center">
        <div className="text-lg font-bold text-heading">
          {todayCount}/{TOTAL_EXERCISES}
        </div>
        <div className="text-[10px] text-dim uppercase tracking-wide">Today</div>
      </div>
      <div className="bg-tile border border-stroke rounded-lg px-3 py-3 text-center">
        <div className="text-lg font-bold text-heading">{stats.currentStreak}</div>
        <div className="text-[10px] text-dim uppercase tracking-wide">Day streak</div>
      </div>
      <div className="bg-tile border border-stroke rounded-lg px-3 py-3 text-center">
        <div className="text-lg font-bold text-heading">{consistencyPct}%</div>
        <div className="text-[10px] text-dim uppercase tracking-wide">30d consistency</div>
      </div>
    </div>
  );
}
