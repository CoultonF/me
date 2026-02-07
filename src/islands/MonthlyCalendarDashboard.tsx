import { useState, useEffect, useRef, useCallback } from 'react';
import type { CalendarAPIResponse, CalendarDay } from '@/lib/types/calendar';
import MonthNavigator from './calendar/MonthNavigator';
import CalendarGrid from './calendar/CalendarGrid';
import ErrorBoundary from './shared/ErrorBoundary';
import Skeleton from './shared/Skeleton';

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function buildCalendarDays(data: CalendarAPIResponse): CalendarDay[] {
  const [year, mon] = data.month.split('-').map(Number) as [number, number];
  const daysInMonth = new Date(year, mon, 0).getDate();
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Index glucose readings by date
  const readingsByDate = new Map<string, { timestamp: string; value: number }[]>();
  for (const r of data.glucoseReadings) {
    const date = r.timestamp.slice(0, 10);
    const arr = readingsByDate.get(date) ?? [];
    arr.push(r);
    readingsByDate.set(date, arr);
  }

  // Index TIR by date
  const tirByDate = new Map<string, { tirPercent: number; count: number }>();
  for (const t of data.dailyTIR) {
    tirByDate.set(t.date, { tirPercent: t.tirPercent, count: t.count });
  }

  // Index daily summaries by date
  const summaryByDate = new Map<string, (typeof data.dailySummaries)[number]>();
  for (const s of data.dailySummaries) {
    summaryByDate.set(s.date, s);
  }

  // Index workouts by date
  const workoutsByDate = new Map<string, CalendarDay['workouts']>();
  for (const w of data.workouts) {
    const date = w.startTime.slice(0, 10);
    const arr = workoutsByDate.get(date) ?? [];
    arr.push({
      activityName: w.activityName,
      durationSeconds: w.durationSeconds,
      distanceKm: w.distanceKm,
      avgHeartRate: w.avgHeartRate,
    });
    workoutsByDate.set(date, arr);
  }

  // Index insulin by date
  const insulinByDate = new Map<string, { bolusTotal: number; basalTotal: number }>();
  for (const ins of data.dailyInsulin) {
    insulinByDate.set(ins.date, { bolusTotal: ins.bolusTotal, basalTotal: ins.basalTotal });
  }

  const days: CalendarDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${data.month}-${String(d).padStart(2, '0')}`;
    const isFuture = dateStr > todayStr;

    const tir = tirByDate.get(dateStr);
    const summary = summaryByDate.get(dateStr);
    const insulin = insulinByDate.get(dateStr);
    const bolusTotal = insulin?.bolusTotal ?? 0;
    const basalTotal = insulin?.basalTotal ?? 0;

    days.push({
      date: dateStr,
      dayOfMonth: d,
      isCurrentMonth: true,
      isFuture,
      glucoseReadings: isFuture ? [] : (readingsByDate.get(dateStr) ?? []),
      tirPercent: tir?.tirPercent ?? null,
      glucoseReadingCount: tir?.count ?? 0,
      exerciseMinutes: summary?.exerciseMinutes ?? null,
      activeCalories: summary?.activeCalories ?? null,
      workouts: workoutsByDate.get(dateStr) ?? [],
      insulinTotal: insulin ? bolusTotal + basalTotal : null,
      bolusTotal,
      basalTotal,
    });
  }

  return days;
}

function CalendarSkeleton() {
  return (
    <div className="space-y-1">
      {/* Day headers skeleton */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} height={16} />
        ))}
      </div>
      {/* 5 rows x 7 cells */}
      {Array.from({ length: 5 }).map((_, row) => (
        <div key={row} className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, col) => (
            <Skeleton key={col} height={80} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function MonthlyCalendarDashboard() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth);
  const [days, setDays] = useState<CalendarDay[] | null>(null);
  const [loading, setLoading] = useState(true);
  const cache = useRef(new Map<string, CalendarDay[]>());

  const fetchMonth = useCallback(async (month: string) => {
    const cached = cache.current.get(month);
    if (cached) {
      setDays(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/health/calendar?month=${month}`);
      const data = (await res.json()) as CalendarAPIResponse;
      const built = buildCalendarDays(data);
      cache.current.set(month, built);
      setDays(built);
    } catch {
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonth(currentMonth);
  }, [currentMonth, fetchMonth]);

  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-heading">Dashboard</h2>
        <MonthNavigator month={currentMonth} onMonthChange={handleMonthChange} />
      </div>

      <ErrorBoundary fallbackTitle="Calendar failed to load">
        <div className="bg-tile border border-stroke rounded-lg p-3 md:p-5">
          {loading || !days ? (
            <CalendarSkeleton />
          ) : (
            <CalendarGrid days={days} month={currentMonth} />
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
}
