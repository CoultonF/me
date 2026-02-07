import { useState, useEffect } from 'react';
import type { GlucoseAPIResponse, GlucoseDailyTIR } from '../../lib/types/glucose';

const DAYS = 365;

interface DayData {
  date: string;
  tirPercent: number;
  count: number;
}

function buildCalendarData(tirData: GlucoseDailyTIR[]): DayData[] {
  const now = new Date();
  const map = new Map<string, DayData>();

  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
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
  if (d.tirPercent < 50) return 'bg-glucose-normal/25';
  if (d.tirPercent < 70) return 'bg-glucose-normal/45';
  if (d.tirPercent < 85) return 'bg-glucose-normal/65';
  return 'bg-glucose-normal/90';
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
  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];

  // Pad first week to start on Monday
  if (data.length > 0) {
    const firstDay = new Date(data[0]!.date + 'T12:00:00').getDay();
    const mondayOffset = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < mondayOffset; i++) {
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
    weeks.push(currentWeek);
  }

  // Month labels
  const monthLabels: { label: string; index: number }[] = [];
  let lastMonth = '';
  weeks.forEach((week, wi) => {
    for (const d of week) {
      if (d.count < 0 || !d.date) continue;
      const month = new Date(d.date + 'T12:00:00').toLocaleDateString([], { month: 'short' });
      if (month !== lastMonth) {
        monthLabels.push({ label: month, index: wi });
        lastMonth = month;
      }
      break;
    }
  });

  const cols = weeks.length;
  const gridCols = `14px repeat(${cols}, 1fr)`;

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-medium text-dim uppercase tracking-wide">Time in Range</div>
        <div className="text-xs text-dim">
          {daysWithData}/{data.length} days tracked
        </div>
      </div>

      <div className="grid gap-[3px]" style={{ gridTemplateColumns: gridCols, gridTemplateRows: `auto repeat(7, 1fr)` }}>
        {/* Row 0: month labels */}
        <div /> {/* empty corner */}
        {weeks.map((_, wi) => {
          const ml = monthLabels.find((m) => m.index === wi);
          return (
            <div key={wi} className="text-[10px] text-dim leading-none truncate">
              {ml?.label ?? ''}
            </div>
          );
        })}

        {/* Rows 1-7: day labels + cells */}
        {[0, 1, 2, 3, 4, 5, 6].map((row) => {
          const dayLabels = ['M', '', 'W', '', 'F', '', 'S'];
          return [
            <div key={`label-${row}`} className="text-[10px] text-dim flex items-center justify-end leading-none pr-0.5">
              {dayLabels[row]}
            </div>,
            ...weeks.map((week, wi) => {
              const d = week[row];
              if (!d) return <div key={`${wi}-${row}`} />;
              return (
                <div key={`${wi}-${row}`} className="relative group">
                  <div
                    className={`aspect-square w-full rounded-sm ${d.count < 0 ? 'bg-transparent' : getIntensityClass(d)}`}
                  />
                  {d.count >= 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                      <div className="bg-tile border border-stroke rounded-lg px-3 py-2 shadow-lg whitespace-nowrap text-xs">
                        <div className="font-medium text-body">{formatDateLabel(d.date)}</div>
                        {d.count === 0 ? (
                          <div className="text-dim mt-0.5">No data</div>
                        ) : (
                          <div className="text-subtle mt-0.5">
                            {d.tirPercent}% in range &middot; {d.count} readings
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            }),
          ];
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-dim">
        <span>&lt; 50%</span>
        <div className="size-3 rounded-sm bg-stroke-soft" />
        <div className="size-3 rounded-sm bg-glucose-normal/25" />
        <div className="size-3 rounded-sm bg-glucose-normal/45" />
        <div className="size-3 rounded-sm bg-glucose-normal/65" />
        <div className="size-3 rounded-sm bg-glucose-normal/90" />
        <span>&gt; 85%</span>
      </div>
    </div>
  );
}
