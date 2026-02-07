import type { CalendarDay } from '@/lib/types/calendar';
import BgSparkline from './BgSparkline';

interface Props {
  day: CalendarDay;
  cellWidth: number;
}

function getTIRColor(tirPercent: number | null, count: number): string {
  if (tirPercent === null || count === 0) return 'bg-stroke-soft';
  if (tirPercent < 50) return 'bg-glucose-low/80';
  if (tirPercent < 70) return 'bg-glucose-very-high/70';
  if (tirPercent < 85) return 'bg-glucose-good/70';
  return 'bg-glucose-normal/80';
}

function getTIRBarColor(tirPercent: number | null, count: number): string {
  if (tirPercent === null || count === 0) return 'var(--color-stroke-soft)';
  if (tirPercent < 50) return 'var(--color-glucose-low)';
  if (tirPercent < 70) return 'var(--color-glucose-very-high)';
  if (tirPercent < 85) return 'var(--color-glucose-good)';
  return 'var(--color-glucose-normal)';
}

function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h${rm}m` : `${h}h`;
}

function formatDistance(km: number): string {
  return km >= 1 ? `${km.toFixed(1)}km` : `${Math.round(km * 1000)}m`;
}

export default function CalendarDayCell({ day, cellWidth }: Props) {
  const isCondensed = cellWidth < 100;
  const sparklineWidth = cellWidth - 8; // 4px padding each side
  const sparklineHeight = isCondensed ? 28 : 36;

  // Ghost state for future dates
  if (day.isFuture) {
    return (
      <div className={`rounded-md border border-stroke/30 p-1 min-h-[40px] ${!day.isCurrentMonth ? 'opacity-30' : ''}`}>
        <span className="text-[11px] text-dim">{day.dayOfMonth}</span>
      </div>
    );
  }

  // Non-current-month padding days
  if (!day.isCurrentMonth) {
    return (
      <div className="rounded-md border border-stroke/20 p-1 min-h-[40px] opacity-30">
        <span className="text-[11px] text-dim">{day.dayOfMonth}</span>
      </div>
    );
  }

  const hasGlucose = day.glucoseReadings.length >= 5;
  const hasTIR = day.tirPercent !== null && day.glucoseReadingCount > 0;
  const primaryWorkout = day.workouts[0];
  const hasInsulin = day.insulinTotal !== null && day.insulinTotal > 0;

  // Condensed layout for narrow cells
  if (isCondensed) {
    return (
      <div className="rounded-md border border-stroke bg-tile p-1 min-h-[40px] flex flex-col gap-0.5">
        <span className="text-[11px] font-medium text-heading leading-none">
          {day.dayOfMonth}
        </span>
        {hasGlucose && (
          <BgSparkline
            readings={day.glucoseReadings}
            width={sparklineWidth}
            height={sparklineHeight}
          />
        )}
        {hasTIR && (
          <div
            className="h-[3px] rounded-full mt-auto"
            style={{
              background: getTIRBarColor(day.tirPercent, day.glucoseReadingCount),
              opacity: 0.8,
            }}
          />
        )}
      </div>
    );
  }

  // Full layout
  return (
    <div className="rounded-md border border-stroke bg-tile p-1.5 min-h-[80px] flex flex-col gap-0.5">
      {/* Header: day number + TIR badge */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-heading leading-none">
          {day.dayOfMonth}
        </span>
        {hasTIR && (
          <div className="flex items-center gap-1">
            <div
              className={`size-1.5 rounded-full ${getTIRColor(day.tirPercent, day.glucoseReadingCount)}`}
            />
            <span className="text-[10px] text-subtle leading-none">
              {day.tirPercent}%
            </span>
          </div>
        )}
      </div>

      {/* Sparkline */}
      {hasGlucose && (
        <BgSparkline
          readings={day.glucoseReadings}
          width={sparklineWidth}
          height={sparklineHeight}
        />
      )}

      {/* Workout summary */}
      {primaryWorkout && (
        <div className="text-[10px] text-subtle leading-tight truncate">
          {primaryWorkout.activityName ?? 'Workout'}
          {primaryWorkout.durationSeconds != null && ` ${formatDuration(primaryWorkout.durationSeconds)}`}
          {primaryWorkout.distanceKm != null && primaryWorkout.distanceKm > 0 && ` ${formatDistance(primaryWorkout.distanceKm)}`}
        </div>
      )}

      {/* Insulin */}
      {hasInsulin && (
        <div className="text-[10px] text-subtle leading-tight mt-auto">
          {day.insulinTotal!.toFixed(1)}u
          <span className="text-dim"> ({day.bolusTotal.toFixed(1)}+{day.basalTotal.toFixed(1)})</span>
        </div>
      )}
    </div>
  );
}
