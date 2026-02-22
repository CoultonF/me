import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createWifeDb } from '@/lib/db/wife-client';
import {
  getStephDailyActivity,
  getStephWorkouts,
  getStephHeartRate,
  getStephSleep,
  getStephVitals,
  getStephActivityStats,
  getStephWorkoutStats,
  getStephSleepStats,
  getStephWeeklyWorkoutVolume,
  getStephWorkoutTypeBreakdown,
  computeStephHRZones,
} from '@/lib/db/wife-queries';
import type { StephActivityAPIResponse } from '@/lib/types/steph-activity';

const RANGE_MS: Record<string, number> = {
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
  '365d': 365 * 24 * 60 * 60 * 1000,
};

const emptyResponse: StephActivityAPIResponse = {
  dailyActivity: [],
  workouts: [],
  heartRate: [],
  sleep: [],
  vitals: [],
  activityStats: { avgCalories: 0, totalExercise: 0, totalSteps: 0, days: 0 },
  workoutStats: { count: 0, totalDistanceKm: 0, avgHR: 0, totalDurationSeconds: 0 },
  sleepStats: { avgTotalMinutes: 0, avgRemMinutes: 0, avgDeepMinutes: 0, avgCoreMinutes: 0, avgAwakeMinutes: 0, nights: 0 },
  hrZones: { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 },
  workoutTypeBreakdown: [],
  weeklyWorkoutVolume: [],
  trainingLoadActivity: [],
  trainingLoadWorkouts: [],
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const cfEnv = await getCloudflareEnv();
    if (!cfEnv) {
      return new Response(JSON.stringify(emptyResponse), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = createWifeDb(cfEnv.WIFE_DB);

    const range = url.searchParams.get('range') ?? '30d';
    const now = new Date();
    let startDate: string;
    let endDate: string;

    if (/^\d{4}$/.test(range)) {
      // Year range: "2025", "2024", etc.
      startDate = `${range}-01-01`;
      const yearEnd = `${parseInt(range) + 1}-01-01`;
      endDate = yearEnd < now.toISOString().slice(0, 10) ? `${range}-12-31` : now.toISOString().slice(0, 10);
    } else {
      const ms = RANGE_MS[range] ?? RANGE_MS['30d']!;
      startDate = new Date(now.getTime() - ms).toISOString().slice(0, 10);
      endDate = now.toISOString().slice(0, 10);
    }

    // Always fetch 90 days for training load computation
    const trainingLoadStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [
      dailyActivity,
      workoutsData,
      heartRate,
      sleep,
      vitalsData,
      activityStats,
      workoutStats,
      sleepStats,
      weeklyWorkoutVolume,
      workoutTypeBreakdown,
      trainingLoadActivity,
      trainingLoadWorkouts,
    ] = await Promise.all([
      getStephDailyActivity(db, startDate, endDate),
      getStephWorkouts(db, startDate, endDate + 'T23:59:59'),
      getStephHeartRate(db, startDate, endDate),
      getStephSleep(db, startDate, endDate),
      getStephVitals(db, startDate, endDate),
      getStephActivityStats(db, startDate, endDate),
      getStephWorkoutStats(db, startDate, endDate + 'T23:59:59'),
      getStephSleepStats(db, startDate, endDate),
      getStephWeeklyWorkoutVolume(db, startDate, endDate + 'T23:59:59'),
      getStephWorkoutTypeBreakdown(db, startDate, endDate + 'T23:59:59'),
      getStephDailyActivity(db, trainingLoadStart, endDate),
      getStephWorkouts(db, trainingLoadStart, endDate + 'T23:59:59'),
    ]);

    const hrZones = computeStephHRZones(workoutsData);

    const body: StephActivityAPIResponse = {
      dailyActivity,
      workouts: workoutsData,
      heartRate,
      sleep,
      vitals: vitalsData,
      activityStats,
      workoutStats,
      sleepStats,
      hrZones,
      workoutTypeBreakdown,
      weeklyWorkoutVolume,
      trainingLoadActivity,
      trainingLoadWorkouts,
    };

    return new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[private/api/steph-activity]', e);
    return new Response(JSON.stringify(emptyResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
