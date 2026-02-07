import type { MergedDay, CorrelationSummary } from './types';

interface Props {
  days: MergedDay[];
}

function computeCorrelations(days: MergedDay[]): CorrelationSummary {
  // Partition days with glucose data into active vs rest
  const daysWithGlucose = days.filter((d) => d.tirPercent !== null);
  const activeDays = daysWithGlucose.filter(
    (d) => d.exerciseMinutes !== null && d.exerciseMinutes > 0,
  );
  const restDays = daysWithGlucose.filter(
    (d) => d.exerciseMinutes === null || d.exerciseMinutes <= 0,
  );

  const activeDayAvgTIR =
    activeDays.length > 0
      ? Math.round(activeDays.reduce((s, d) => s + d.tirPercent!, 0) / activeDays.length)
      : 0;
  const restDayAvgTIR =
    restDays.length > 0
      ? Math.round(restDays.reduce((s, d) => s + d.tirPercent!, 0) / restDays.length)
      : 0;

  // For insulin: only days with all 3 data streams
  const daysWithAll = days.filter(
    (d) => d.tirPercent !== null && d.exerciseMinutes !== null && d.insulinTotal !== null,
  );
  const activeWithAll = daysWithAll.filter((d) => d.exerciseMinutes! > 0);
  const restWithAll = daysWithAll.filter((d) => d.exerciseMinutes! <= 0);

  const activeDayAvgInsulin =
    activeWithAll.length > 0
      ? activeWithAll.reduce((s, d) => s + d.insulinTotal!, 0) / activeWithAll.length
      : 0;
  const restDayAvgInsulin =
    restWithAll.length > 0
      ? restWithAll.reduce((s, d) => s + d.insulinTotal!, 0) / restWithAll.length
      : 0;

  return {
    activeDayAvgTIR,
    restDayAvgTIR,
    activeDays: activeDays.length,
    restDays: restDays.length,
    activeDayAvgInsulin,
    restDayAvgInsulin,
    daysWithAllData: daysWithAll.length,
  };
}

function DiffBadge({ value, unit, invert }: { value: number; unit: string; invert?: boolean }) {
  if (value === 0) return <span className="text-dim text-xs">same</span>;

  // For TIR: positive = better (green). For insulin: negative = less = better (green)
  const isPositive = invert ? value < 0 : value > 0;
  const color = isPositive ? 'text-glucose-normal' : 'text-glucose-very-high';
  const sign = value > 0 ? '+' : '';

  return (
    <span className={`text-sm font-semibold ${color}`}>
      {sign}
      {Math.abs(value).toFixed(value % 1 === 0 ? 0 : 1)}
      {unit}
    </span>
  );
}

export default function CorrelationStats({ days }: Props) {
  const stats = computeCorrelations(days);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* TIR on Active Days */}
      <div className="bg-tile border border-stroke rounded-lg p-4">
        <div className="text-xs font-medium text-dim uppercase tracking-wide mb-3">
          TIR on Active Days
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-heading">{stats.activeDayAvgTIR}%</span>
          <span className="text-sm text-dim">vs {stats.restDayAvgTIR}% rest</span>
          <DiffBadge value={stats.activeDayAvgTIR - stats.restDayAvgTIR} unit="%" />
        </div>
        <div className="text-xs text-ghost mt-2">
          {stats.activeDays} active / {stats.restDays} rest days
        </div>
      </div>

      {/* Insulin on Active Days */}
      <div className="bg-tile border border-stroke rounded-lg p-4">
        <div className="text-xs font-medium text-dim uppercase tracking-wide mb-3">
          Insulin on Active Days
        </div>
        {stats.daysWithAllData > 0 ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-heading">
                {stats.activeDayAvgInsulin.toFixed(1)}u
              </span>
              <span className="text-sm text-dim">
                vs {stats.restDayAvgInsulin.toFixed(1)}u rest
              </span>
              <DiffBadge
                value={stats.activeDayAvgInsulin - stats.restDayAvgInsulin}
                unit="u"
                invert
              />
            </div>
            <div className="text-xs text-ghost mt-2">
              Based on {stats.daysWithAllData} days with all data
            </div>
          </>
        ) : (
          <>
            <div className="text-2xl font-semibold text-heading">&mdash;</div>
            <div className="text-xs text-ghost mt-2">Not enough overlapping data</div>
          </>
        )}
      </div>

      {/* Explore links */}
      <div className="bg-tile border border-stroke rounded-lg p-4">
        <div className="text-xs font-medium text-dim uppercase tracking-wide mb-3">Explore</div>
        <div className="flex flex-col gap-2">
          <a
            href="/dashboard/glucose"
            className="text-sm text-accent hover:underline"
          >
            Glucose &rarr;
          </a>
          <a
            href="/dashboard/activity"
            className="text-sm text-accent hover:underline"
          >
            Activity &rarr;
          </a>
          <a
            href="/dashboard/insulin"
            className="text-sm text-accent hover:underline"
          >
            Insulin &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
