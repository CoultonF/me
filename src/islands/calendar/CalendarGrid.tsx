import type { CalendarDay } from '@/lib/types/calendar';
import { useContainerWidth } from '../shared/useContainerWidth';
import CalendarDayCell from './CalendarDayCell';

interface Props {
  days: CalendarDay[];
  month: string;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildGrid(days: CalendarDay[], month: string): CalendarDay[] {
  const [year, mon] = month.split('-').map(Number) as [number, number];

  // Day of week for the 1st of the month (0 = Sunday)
  const firstDow = new Date(year, mon - 1, 1).getDay();

  // Padding days from previous month
  const prevMonth = new Date(year, mon - 1, 0); // last day of prev month
  const prevMonthDays = prevMonth.getDate();
  const leading: CalendarDay[] = [];
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
    leading.push({
      date: `${prevMonthStr}-${String(d).padStart(2, '0')}`,
      dayOfMonth: d,
      isCurrentMonth: false,
      isFuture: false,
      glucoseReadings: [],
      tirPercent: null,
      glucoseReadingCount: 0,
      exerciseMinutes: null,
      activeCalories: null,
      workouts: [],
      insulinTotal: null,
      bolusTotal: 0,
      basalTotal: 0,
    });
  }

  // Trailing days to fill out the last week
  const total = leading.length + days.length;
  const remainder = total % 7;
  const trailingCount = remainder === 0 ? 0 : 7 - remainder;
  const trailing: CalendarDay[] = [];
  for (let i = 1; i <= trailingCount; i++) {
    const nextMonth = new Date(year, mon, 1); // 1st of next month
    const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
    trailing.push({
      date: `${nextMonthStr}-${String(i).padStart(2, '0')}`,
      dayOfMonth: i,
      isCurrentMonth: false,
      isFuture: false,
      glucoseReadings: [],
      tirPercent: null,
      glucoseReadingCount: 0,
      exerciseMinutes: null,
      activeCalories: null,
      workouts: [],
      insulinTotal: null,
      bolusTotal: 0,
      basalTotal: 0,
    });
  }

  return [...leading, ...days, ...trailing];
}

export default function CalendarGrid({ days, month }: Props) {
  const [containerRef, containerWidth] = useContainerWidth();
  const gridDays = buildGrid(days, month);

  // Calculate cell width from container
  const gap = 4;
  const cols = 7;
  const cellWidth = containerWidth > 0
    ? Math.floor((containerWidth - (cols - 1) * gap) / cols)
    : 120;

  return (
    <div ref={containerRef}>
      {/* Day-of-week headers */}
      <div
        className="grid mb-1"
        style={{
          gridTemplateColumns: `repeat(7, 1fr)`,
          gap,
        }}
      >
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-[10px] text-dim font-medium text-center uppercase tracking-wide py-1"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(7, 1fr)`,
          gap,
        }}
      >
        {gridDays.map((day, i) => (
          <CalendarDayCell key={i} day={day} cellWidth={cellWidth} />
        ))}
      </div>
    </div>
  );
}
