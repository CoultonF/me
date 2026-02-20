import { useContainerWidth, computeCellSize } from '../shared/useContainerWidth';

const GAP = 3;
const DAY_W = 24;
const MIN_CELL = 10;

interface Contribution {
  date: string;
  count: number;
}

interface Props {
  contributions: Contribution[];
  totalContributions: number;
  currentStreak: number;
  longestStreak: number;
}

function getIntensityClass(count: number): string {
  if (count === 0) return 'bg-stroke-soft';
  if (count <= 3) return 'bg-green-500/30';
  if (count <= 7) return 'bg-green-500/55';
  return 'bg-green-500/80';
}

function formatDateLabel(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

interface DayData {
  date: string;
  count: number;
}

export default function ContributionCalendar({ contributions, totalContributions, currentStreak, longestStreak }: Props) {
  const [containerRef, containerWidth] = useContainerWidth();

  // Build 365-day map
  const contribMap = new Map(contributions.map((c) => [c.date, c.count]));
  const days: DayData[] = [];
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: contribMap.get(key) ?? 0 });
  }

  // Build weeks grid
  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];

  if (days.length > 0) {
    const firstDow = new Date(days[0]!.date + 'T12:00:00').getDay();
    for (let i = 0; i < firstDow; i++) {
      currentWeek.push({ date: '', count: -1 });
    }
  }

  for (const d of days) {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push({ date: '', count: -1 });
    weeks.push(currentWeek);
  }

  const cols = weeks.length;
  const cellSize = containerWidth > 0
    ? computeCellSize(containerWidth, cols, DAY_W, GAP, MIN_CELL)
    : MIN_CELL;

  // Month labels
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
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="text-xs font-medium text-dim uppercase tracking-wide">Contribution Calendar</div>
        <div className="flex gap-4 text-xs text-dim">
          <span><span className="text-heading font-semibold">{totalContributions}</span> contributions</span>
          <span><span className="text-heading font-semibold">{currentStreak}</span> day streak</span>
          <span className="hidden sm:inline"><span className="text-heading font-semibold">{longestStreak}</span> longest</span>
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
                  <div key={`${wi}-${di}`} className="relative group">
                    <div
                      className={`size-full rounded-sm ${d.count < 0 ? 'bg-transparent' : getIntensityClass(d.count)}`}
                    />
                    {d.count >= 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                        <div className="bg-tile border border-stroke rounded-lg px-3 py-2 shadow-lg whitespace-nowrap text-xs">
                          <div className="font-medium text-body">{formatDateLabel(d.date)}</div>
                          <div className="text-subtle mt-0.5">
                            {d.count === 0 ? 'No contributions' : `${d.count} contribution${d.count > 1 ? 's' : ''}`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-dim">
        <span>Less</span>
        <div className="size-3 rounded-sm bg-stroke-soft" />
        <div className="size-3 rounded-sm bg-green-500/30" />
        <div className="size-3 rounded-sm bg-green-500/55" />
        <div className="size-3 rounded-sm bg-green-500/80" />
        <span>More</span>
      </div>
    </div>
  );
}
