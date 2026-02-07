import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import {
  getGlucoseRangeDownsampled,
  getGlucoseDailyTIR,
  getActivityRange,
  getWorkouts,
  getInsulinDailyTotals,
} from '@/lib/db/queries';
import type { CalendarAPIResponse } from '@/lib/types/calendar';

const emptyResponse = (month: string): CalendarAPIResponse => ({
  month,
  glucoseReadings: [],
  dailyTIR: [],
  dailySummaries: [],
  workouts: [],
  dailyInsulin: [],
});

export const GET: APIRoute = async ({ url }) => {
  const monthParam = url.searchParams.get('month');
  const now = new Date();
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam)
    ? monthParam
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  try {
    const cfEnv = await getCloudflareEnv();
    if (!cfEnv) {
      return new Response(JSON.stringify(emptyResponse(month)), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = createDb(cfEnv.DB);

    const [year, mon] = month.split('-').map(Number) as [number, number];
    const startDate = `${month}-01T00:00:00.000Z`;
    const lastDay = new Date(year, mon, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;

    const [glucoseReadings, dailyTIR, activityRows, workoutRows, dailyInsulin] =
      await Promise.all([
        getGlucoseRangeDownsampled(db, startDate, endDate, 3),
        getGlucoseDailyTIR(db, startDate, endDate),
        getActivityRange(db, startDate, endDate),
        getWorkouts(db, startDate, endDate),
        getInsulinDailyTotals(db, startDate, endDate),
      ]);

    const body: CalendarAPIResponse = {
      month,
      glucoseReadings: glucoseReadings.map((r) => ({
        timestamp: r.timestamp,
        value: r.value,
      })),
      dailyTIR,
      dailySummaries: activityRows.map((a) => ({
        date: a.date,
        exerciseMinutes: a.exerciseMinutes,
        activeCalories: a.activeCalories,
        steps: a.steps,
      })),
      workouts: workoutRows.map((w) => ({
        startTime: w.startTime,
        distanceKm: w.distanceKm,
        durationSeconds: w.durationSeconds,
        avgHeartRate: w.avgHeartRate,
        activityName: w.activityName,
      })),
      dailyInsulin,
    };

    return new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[api/health/calendar]', e);
    return new Response(JSON.stringify(emptyResponse(month)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
