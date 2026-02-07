import { useMemo } from 'react';
import type { MergedDay } from './types';
import { useContainerWidth, computeCellSize } from '../shared/useContainerWidth';

const MIN_CELL = 10;
const GAP = 3;
const DAY_W = 24;

interface Props {
  days: MergedDay[];
}

function getTIRClass(d: MergedDay): string {
  if (d.tirPercent === null || d.glucoseReadingCount === 0) return 'bg-stroke-soft';
  if (d.tirPercent < 50) return 'bg-glucose-low/80';
  if (d.tirPercent < 70) return 'bg-glucose-very-high/70';
  if (d.tirPercent < 85) return 'bg-glucose-good/70';
  return 'bg-glucose-normal/80';
}

function formatDateLabel(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function computeInsulinThresholds(days: MergedDay[]): { median: number; p75: number } {
  const values = days
    .filter((d) => d.insulinTotal !== null && d.insulinTotal > 0)
    .map((d) => d.insulinTotal!)
    .sort((a, b) => a - b);

  if (values.length === 0) return { median: Infinity, p75: Infinity };

  const median = values[Math.floor(values.length * 0.5)]!;
  const p75 = values[Math.floor(values.length * 0.75)]!;
  return { median, p75 };
}

function getInsulinBorder(
  d: MergedDay,
  thresholds: { median: number; p75: number },
): string | undefined {
  if (d.insulinTotal === null || d.insulinTotal <= thresholds.median) return undefined;
  if (d.insulinTotal > thresholds.p75) return '2px solid rgba(129, 140, 248, 0.8)';
  return '1px solid rgba(129, 140, 248, 0.5)';
}

function getExerciseDotOpacity(d: MergedDay): number | null {
  if (d.exerciseMinutes === null || d.exerciseMinutes <= 0) return null;
  if (d.exerciseMinutes < 30) return 0.5;
  if (d.exerciseMinutes < 60) return 0.7;
  return 0.9;
}

interface CellDay extends MergedDay {
  isEmpty: boolean;
}

export default function BlendedCalendar({ days }: Props) {
  const [containerRef, containerWidth] = useContainerWidth();
  const thresholds = useMemo(() => computeInsulinThresholds(days), [days]);

  const { weeks, cols } = useMemo(() => {
    const ws: CellDay[][] = [];
    let currentWeek: CellDay[] = [];

    // Pad first week so column starts on Sunday
    if (days.length > 0) {
      const firstDow = new Date(days[0]!.date + 'T12:00:00').getDay();
      for (let i = 0; i < firstDow; i++) {
        currentWeek.push({
          date: '',
          tirPercent: null,
          glucoseReadingCount: 0,
          exerciseMinutes: null,
          workoutCount: 0,
          workoutNames: [],
          totalDistanceKm: 0,
          insulinTotal: null,
          bolusTotal: 0,
          basalTotal: 0,
          isEmpty: true,
        });
      }
    }

    for (const d of days) {
      currentWeek.push({ ...d, isEmpty: false });
      if (currentWeek.length === 7) {
        ws.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: '',
          tirPercent: null,
          glucoseReadingCount: 0,
          exerciseMinutes: null,
          workoutCount: 0,
          workoutNames: [],
          totalDistanceKm: 0,
          insulinTotal: null,
          bolusTotal: 0,
          basalTotal: 0,
          isEmpty: true,
        });
      }
      ws.push(currentWeek);
    }

    return { weeks: ws, cols: ws.length };
  }, [days]);

  const cellSize =
    containerWidth > 0 ? computeCellSize(containerWidth, cols, DAY_W, GAP, MIN_CELL) : MIN_CELL;

  const monthLabels = useMemo(() => {
    const labels: { label: string; x: number }[] = [];
    let lastMonth = '';
    weeks.forEach((week, wi) => {
      for (const d of week) {
        if (d.isEmpty || !d.date) continue;
        const month = new Date(d.date + 'T12:00:00').toLocaleDateString([], { month: 'short' });
        if (month !== lastMonth) {
          labels.push({ label: month, x: wi * (cellSize + GAP) });
          lastMonth = month;
        }
        break;
      }
    });
    return labels;
  }, [weeks, cellSize]);

  const gridW = cols * cellSize + (cols - 1) * GAP;
  const dotSize = Math.max(Math.round(cellSize * 0.35), 3);
  const daysWithData = days.filter(
    (d) => d.glucoseReadingCount > 0 || d.workoutCount > 0 || d.insulinTotal !== null,
  ).length;

  return (
    <div ref={containerRef} className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-medium text-dim uppercase tracking-wide">
          Health Correlations
        </div>
        <div className="text-xs text-dim">{daysWithData} days with data</div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: DAY_W + gridW }}>
          {/* Month labels */}
          <div className="relative" style={{ height: 15, marginLeft: DAY_W }}>
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="absolute text-[10px] text-dim leading-none"
                style={{ left: m.x }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Day labels + cells */}
          <div className="flex">
            <div className="shrink-0 flex flex-col" style={{ width: DAY_W, gap: GAP }}>
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((l, i) => (
                <div
                  key={i}
                  className="flex items-center text-[10px] text-dim"
                  style={{ height: cellSize }}
                >
                  {l}
                </div>
              ))}
            </div>

            <div
              className="grid"
              style={{
                gridTemplateRows: `repeat(7, ${cellSize}px)`,
                gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                gridAutoFlow: 'column',
                gap: GAP,
              }}
            >
              {weeks.flatMap((week, wi) =>
                week.map((d, di) => {
                  const border = d.isEmpty ? undefined : getInsulinBorder(d, thresholds);
                  const dotOpacity = d.isEmpty ? null : getExerciseDotOpacity(d);

                  return (
                    <div key={`${wi}-${di}`} className="relative group">
                      <div
                        className={`size-full rounded-sm ${d.isEmpty ? 'bg-transparent' : getTIRClass(d)}`}
                        style={border ? { border, boxSizing: 'border-box' } : undefined}
                      />
                      {dotOpacity !== null && (
                        <div
                          className="absolute rounded-full bg-white"
                          style={{
                            width: dotSize,
                            height: dotSize,
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            opacity: dotOpacity,
                          }}
                        />
                      )}
                      {!d.isEmpty && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                          <div className="bg-tile border border-stroke rounded-lg px-3 py-2 shadow-lg whitespace-nowrap text-xs">
                            <div className="font-medium text-body">
                              {formatDateLabel(d.date)}
                            </div>
                            {/* Glucose */}
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="size-2 rounded-full bg-glucose-normal shrink-0" />
                              {d.tirPercent !== null ? (
                                <span className="text-subtle">
                                  {d.tirPercent}% in range &middot; {d.glucoseReadingCount} readings
                                </span>
                              ) : (
                                <span className="text-dim">No glucose data</span>
                              )}
                            </div>
                            {/* Exercise */}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="size-2 rounded-full bg-white border border-stroke shrink-0" />
                              {d.exerciseMinutes !== null && d.exerciseMinutes > 0 ? (
                                <span className="text-subtle">
                                  {d.exerciseMinutes} min exercise
                                  {d.workoutNames.length > 0 &&
                                    ` \u00b7 ${d.workoutNames.join(', ')}`}
                                </span>
                              ) : (
                                <span className="text-dim">Rest day</span>
                              )}
                            </div>
                            {/* Insulin */}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="size-2 rounded-full bg-indigo-400 shrink-0" />
                              {d.insulinTotal !== null ? (
                                <span className="text-subtle">
                                  {d.insulinTotal.toFixed(1)}u insulin ({d.bolusTotal.toFixed(1)}{' '}
                                  bolus + {d.basalTotal.toFixed(1)} basal)
                                </span>
                              ) : (
                                <span className="text-dim">No insulin data</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-end gap-2 mt-3 text-[10px] text-dim">
        <span>&lt; 50%</span>
        <div className="size-3 rounded-sm bg-glucose-low/80" />
        <div className="size-3 rounded-sm bg-glucose-very-high/70" />
        <div className="size-3 rounded-sm bg-glucose-good/70" />
        <div className="size-3 rounded-sm bg-glucose-normal/80" />
        <span>&gt; 85% TIR</span>
        <span className="mx-1">|</span>
        <div className="size-2.5 rounded-full bg-white border border-stroke" />
        <span>Exercise</span>
        <span className="mx-1">|</span>
        <div
          className="size-3 rounded-sm bg-stroke-soft"
          style={{ border: '1px solid rgba(129, 140, 248, 0.5)' }}
        />
        <span>High insulin</span>
        <div
          className="size-3 rounded-sm bg-stroke-soft"
          style={{ border: '2px solid rgba(129, 140, 248, 0.8)' }}
        />
        <span>Very high</span>
      </div>
    </div>
  );
}
