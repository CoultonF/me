import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { getWorkouts, getWeeklyDistances, getPaceHistory, getRunningExtendedStats, getPaceHRCorrelation } from '@/lib/db/queries';
import type { RunningAPIResponse, HRZoneDistribution } from '@/lib/types/running';

const RANGE_MS: Record<string, number> = {
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

const emptyResponse: RunningAPIResponse = {
  workouts: [],
  weeklyDistances: [],
  paceHistory: [],
  hrZones: { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 },
  paceHRCorrelation: [],
  stats: {
    totalDistanceKm: 0, totalDurationSeconds: 0, avgPaceSecPerKm: 0, avgHeartRate: 0,
    workoutCount: 0, longestRunKm: 0, fastestPaceSecPerKm: 0, totalElevationGainM: 0, totalActiveCalories: 0,
  },
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

    const range = url.searchParams.get('range') ?? '90d';
    const ms = RANGE_MS[range] ?? RANGE_MS['90d']!;

    const now = new Date();
    const startDate = new Date(now.getTime() - ms).toISOString();
    const endDate = now.toISOString();

    const [workouts, weeklyDistances, paceHistoryRaw, stats, paceHRCorrelationRaw] = await Promise.all([
      getWorkouts(db, startDate, endDate),
      getWeeklyDistances(db, startDate, endDate),
      getPaceHistory(db, startDate, endDate),
      getRunningExtendedStats(db, startDate, endDate),
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

    const body: RunningAPIResponse = { workouts, weeklyDistances, paceHistory, hrZones, paceHRCorrelation, stats };

    return new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[api/health/running]', e);
    return new Response(JSON.stringify(emptyResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
