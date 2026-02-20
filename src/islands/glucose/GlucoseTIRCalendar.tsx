import { useState, useEffect } from 'react';
import type { GlucoseAPIResponse, GlucoseDailyTIR } from '../../lib/types/glucose';
import { useContainerWidth, computeCellSize } from '../shared/useContainerWidth';
import { localDateStr } from '../shared/dates';
import { CalendarTooltip } from '../shared/CalendarTooltip';

const MIN_CELL = 10;
const GAP = 3;
const DAY_W = 24;

interface DayData {
  date: string;
  tirPercent: number;
  count: number;
}

function buildCalendarData(tirData: GlucoseDailyTIR[]): DayData[] {
  const now = new Date();
  const map = new Map<string, DayData>();

  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = localDateStr(d);
    map.set(key, { date: key, tirPercent: -1, count: 0 });
  }

  for (const entry of tirData) {
    const existing = map.get(entry.date);
    if (existing) {
      existing.tirPercent = entry.tirPercent;
      existing.count = entry.count;
    }
  }

  return Array.from(map.values());
}

function getIntensityClass(d: DayData): string {
  if (d.count === 0) return 'bg-stroke-soft';
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

export default function GlucoseTIRCalendar() {
  const [tirData, setTirData] = useState<GlucoseDailyTIR[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/health/glucose?range=365d')
      .then((r) => r.json() as Promise<GlucoseAPIResponse>)
      .then((d) => { setTirData(d.dailyTIR ?? []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
        <div className="text-xs text-dim">Loading TIR calendar...</div>
      </div>
    );
  }

  const data = buildCalendarData(tirData);
  const daysWithData = data.filter((d) => d.count > 0).length;

  return <GridView data={data} daysWithData={daysWithData} />;
}

function GridView({ data, daysWithData }: { data: DayData[]; daysWithData: number }) {
  const [containerRef, containerWidth] = useContainerWidth();

  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];

  // Pad first week so column starts on Sunday
  if (data.length > 0) {
    const firstDow = new Date(data[0]!.date + 'T12:00:00').getDay();
    for (let i = 0; i < firstDow; i++) {
      currentWeek.push({ date: '', tirPercent: -1, count: -1 });
    }
  }

  for (const d of data) {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push({ date: '', tirPercent: -1, count: -1 });
    weeks.push(currentWeek);
  }

  const cols = weeks.length;
  const cellSize = containerWidth > 0
    ? computeCellSize(containerWidth, cols, DAY_W, GAP, MIN_CELL)
    : MIN_CELL;

  // Month labels with pixel positions
  const monthLabels: { label: string; x: number }[] = [];
  let lastMonth = '';
  weeks.forEach((week, wi) => {
    for (const d of week) {
      if (d.count < 0 || !d.date) continue;
      const month = new Date(d.date + 'T12:00:00').toLocaleDateString([], { month: 'short' });
      if (month !== lastMonth) {
        monthLabels.push({ label: month, x: wi * (cellSize + GAP) });
        lastMonth = month;
      }
      break;
    }
  });

  const gridW = cols * cellSize + (cols - 1) * GAP;

  return (
    <div ref={containerRef} className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-medium text-dim uppercase tracking-wide">Time in Range</div>
        <div className="text-xs text-dim">
          {daysWithData}/{data.length} days tracked
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: DAY_W + gridW }}>
          {/* Month labels */}
          <div className="relative" style={{ height: 15, marginLeft: DAY_W }}>
            {monthLabels.map((m, i) => (
              <span key={i} className="absolute text-[10px] text-dim leading-none" style={{ left: m.x }}>
                {m.label}
              </span>
            ))}
          </div>

          {/* Day labels + cells */}
          <div className="flex">
            <div className="shrink-0 flex flex-col" style={{ width: DAY_W, gap: GAP }}>
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((l, i) => (
                <div key={i} className="flex items-center text-[10px] text-dim" style={{ height: cellSize }}>
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
                week.map((d, di) => (
                  <CalendarTooltip
                    key={`${wi}-${di}`}
                    content={d.count >= 0 ? (
                      <>
                        <div className="font-medium text-body">{formatDateLabel(d.date)}</div>
                        {d.count === 0 ? (
                          <div className="text-dim mt-0.5">No data</div>
                        ) : (
                          <div className="text-subtle mt-0.5">
                            {d.tirPercent}% in range &middot; {d.count} readings
                          </div>
                        )}
                      </>
                    ) : null}
                  >
                    <div className={`rounded-sm ${d.count < 0 ? 'bg-transparent' : getIntensityClass(d)}`} style={{ width: cellSize, height: cellSize }} />
                  </CalendarTooltip>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-dim">
        <span>&lt; 50%</span>
        <div className="size-3 rounded-sm bg-glucose-low/80" />
        <div className="size-3 rounded-sm bg-glucose-very-high/70" />
        <div className="size-3 rounded-sm bg-glucose-good/70" />
        <div className="size-3 rounded-sm bg-glucose-normal/80" />
        <span>&gt; 85%</span>
      </div>
    </div>
  );
}
