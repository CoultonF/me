import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { getWorkouts, getActivityRange, getActivityStats, getRunningExtendedStats, getWeeklyDistances, getPaceHistory, getPaceHRCorrelation } from '@/lib/db/queries';
import type { ActivityAPIResponse, HRZoneDistribution } from '@/lib/types/activity';

const RANGE_MS: Record<string, number> = {
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
  '365d': 365 * 24 * 60 * 60 * 1000,
};

const MAX_HR = 190;

function computeHRZones(workouts: { avgHeartRate: number | null }[]): HRZoneDistribution {
  const counts = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
  let total = 0;

  for (const w of workouts) {
    if (!w.avgHeartRate || w.avgHeartRate <= 0) continue;
    total++;
    const pct = w.avgHeartRate / MAX_HR;
    if (pct < 0.6) counts.zone1++;
    else if (pct < 0.7) counts.zone2++;
    else if (pct < 0.8) counts.zone3++;
    else if (pct < 0.9) counts.zone4++;
    else counts.zone5++;
  }

  if (total === 0) return { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };

  return {
    zone1: Math.round((counts.zone1 / total) * 100),
    zone2: Math.round((counts.zone2 / total) * 100),
    zone3: Math.round((counts.zone3 / total) * 100),
    zone4: Math.round((counts.zone4 / total) * 100),
    zone5: Math.round((counts.zone5 / total) * 100),
  };
}

const emptyResponse: ActivityAPIResponse = {
  workouts: [],
  dailySummaries: [],
  activityStats: { totalCalories: 0, totalExerciseMinutes: 0, avgCalories: 0, avgExerciseMinutes: 0, days: 0 },
  runningStats: { totalDistanceKm: 0, totalDurationSeconds: 0, avgPaceSecPerKm: 0, avgHeartRate: 0, workoutCount: 0, longestRunKm: 0, fastestPaceSecPerKm: 0, totalElevationGainM: 0, totalActiveCalories: 0 },
  weeklyDistances: [],
  paceHistory: [],
  hrZones: { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 },
  paceHRCorrelation: [],
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const cfEnv = await getCloudflareEnv();
    if (!cfEnv) {
      return new Response(JSON.stringify(emptyResponse), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = createDb(cfEnv.DB);

    const range = url.searchParams.get('range') ?? '7d';
    const now = new Date();
    let startDate: string;
    let endDate: string;

    if (/^\d{4}$/.test(range)) {
      startDate = `${range}-01-01`;
      const yearEnd = `${parseInt(range) + 1}-01-01`;
      endDate = yearEnd < now.toISOString().slice(0, 10) ? `${range}-12-31` : now.toISOString().slice(0, 10);
    } else {
      const ms = RANGE_MS[range] ?? RANGE_MS['7d']!;
      startDate = new Date(now.getTime() - ms).toISOString();
      endDate = now.toISOString();
    }

    const [workouts, dailySummaries, activityStats, runningStats, weeklyDistances, paceHistoryRaw, paceHRCorrelationRaw] = await Promise.all([
      getWorkouts(db, startDate, endDate),
      getActivityRange(db, startDate, endDate),
      getActivityStats(db, startDate, endDate),
      getRunningExtendedStats(db, startDate, endDate),
      getWeeklyDistances(db, startDate, endDate),
      getPaceHistory(db, startDate, endDate),
      getPaceHRCorrelation(db, startDate, endDate),
    ]);

    const hrZones = computeHRZones(workouts);

    const paceHistory = paceHistoryRaw
      .filter((p) => p.avgPaceSecPerKm && p.avgPaceSecPerKm > 0)
      .map((p) => ({
        startTime: p.startTime,
        avgPaceSecPerKm: p.avgPaceSecPerKm!,
        distanceKm: p.distanceKm ?? 0,
        activityName: p.activityName ?? 'Workout',
      }));

    const paceHRCorrelation = paceHRCorrelationRaw.map((p) => ({
      avgPaceSecPerKm: p.avgPaceSecPerKm!,
      avgHeartRate: p.avgHeartRate!,
      distanceKm: p.distanceKm ?? 0,
      startTime: p.startTime,
    }));

    const body: ActivityAPIResponse = { workouts, dailySummaries, activityStats, runningStats, weeklyDistances, paceHistory, hrZones, paceHRCorrelation };

    return new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[api/health/activity]', e);
    return new Response(JSON.stringify(emptyResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
