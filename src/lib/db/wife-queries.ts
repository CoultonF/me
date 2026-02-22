import { desc, and, gte, lte, sql, count } from 'drizzle-orm';
import type { WifeDatabase } from './wife-client';
import { dailyActivity, workouts, heartRateDaily, sleepSessions, vitals } from './wife-schema';
import type {
  StephActivityDay,
  StephWorkout,
  StephHeartRateDay,
  StephSleepSession,
  StephVital,
  StephActivityStats,
  StephWorkoutStats,
  StephSleepStats,
  StephHRZoneDistribution,
  WorkoutTypeBreakdown,
  WeeklyWorkoutVolume,
} from '../types/steph-activity';

export async function getStephDailyActivity(db: WifeDatabase, start: string, end: string): Promise<StephActivityDay[]> {
  const rows = await db
    .select({
      date: dailyActivity.date,
      steps: dailyActivity.steps,
      activeCalories: dailyActivity.activeCalories,
      exerciseMinutes: dailyActivity.exerciseMinutes,
      standHours: dailyActivity.standHours,
      walkDistanceKm: dailyActivity.walkDistanceKm,
      cycleDistanceKm: dailyActivity.cycleDistanceKm,
    })
    .from(dailyActivity)
    .where(and(gte(dailyActivity.date, start), lte(dailyActivity.date, end)))
    .orderBy(dailyActivity.date);
  return rows;
}

export async function getStephWorkouts(db: WifeDatabase, start: string, end: string): Promise<StephWorkout[]> {
  const rows = await db
    .select({
      workoutType: workouts.workoutType,
      startTime: workouts.startTime,
      endTime: workouts.endTime,
      durationSeconds: workouts.durationSeconds,
      distanceKm: workouts.distanceKm,
      activeCalories: workouts.activeCalories,
      avgHeartRate: workouts.avgHeartRate,
      maxHeartRate: workouts.maxHeartRate,
    })
    .from(workouts)
    .where(and(gte(workouts.startTime, start), lte(workouts.startTime, end)))
    .orderBy(desc(workouts.startTime));
  return rows;
}

export async function getStephHeartRate(db: WifeDatabase, start: string, end: string): Promise<StephHeartRateDay[]> {
  const rows = await db
    .select({
      date: heartRateDaily.date,
      restingHR: heartRateDaily.restingHR,
      walkingHRAvg: heartRateDaily.walkingHRAvg,
      hrv: heartRateDaily.hrv,
    })
    .from(heartRateDaily)
    .where(and(gte(heartRateDaily.date, start), lte(heartRateDaily.date, end)))
    .orderBy(heartRateDaily.date);
  return rows;
}

export async function getStephSleep(db: WifeDatabase, start: string, end: string): Promise<StephSleepSession[]> {
  const rows = await db
    .select({
      date: sleepSessions.date,
      bedtime: sleepSessions.bedtime,
      wakeTime: sleepSessions.wakeTime,
      totalMinutes: sleepSessions.totalMinutes,
      remMinutes: sleepSessions.remMinutes,
      coreMinutes: sleepSessions.coreMinutes,
      deepMinutes: sleepSessions.deepMinutes,
      awakeMinutes: sleepSessions.awakeMinutes,
    })
    .from(sleepSessions)
    .where(and(gte(sleepSessions.date, start), lte(sleepSessions.date, end)))
    .orderBy(sleepSessions.date);
  return rows;
}

export async function getStephVitals(db: WifeDatabase, start: string, end: string): Promise<StephVital[]> {
  const rows = await db
    .select({
      type: vitals.type,
      date: vitals.date,
      value: vitals.value,
    })
    .from(vitals)
    .where(and(gte(vitals.date, start), lte(vitals.date, end)))
    .orderBy(vitals.date);
  return rows;
}

export async function getStephActivityStats(db: WifeDatabase, start: string, end: string): Promise<StephActivityStats> {
  const [agg] = await db
    .select({
      totalCalories: sql<number>`coalesce(sum(${dailyActivity.activeCalories}), 0)`,
      totalExercise: sql<number>`coalesce(sum(${dailyActivity.exerciseMinutes}), 0)`,
      totalSteps: sql<number>`coalesce(sum(${dailyActivity.steps}), 0)`,
      days: count(),
    })
    .from(dailyActivity)
    .where(and(gte(dailyActivity.date, start), lte(dailyActivity.date, end)));

  const days = agg?.days ?? 0;
  return {
    avgCalories: days > 0 ? Math.round((agg?.totalCalories ?? 0) / days) : 0,
    totalExercise: agg?.totalExercise ?? 0,
    totalSteps: agg?.totalSteps ?? 0,
    days,
  };
}

export async function getStephWorkoutStats(db: WifeDatabase, start: string, end: string): Promise<StephWorkoutStats> {
  const [agg] = await db
    .select({
      count: count(),
      totalDistanceKm: sql<number>`coalesce(sum(${workouts.distanceKm}), 0)`,
      avgHR: sql<number>`coalesce(avg(${workouts.avgHeartRate}), 0)`,
      totalDurationSeconds: sql<number>`coalesce(sum(${workouts.durationSeconds}), 0)`,
    })
    .from(workouts)
    .where(and(gte(workouts.startTime, start), lte(workouts.startTime, end)));

  return {
    count: agg?.count ?? 0,
    totalDistanceKm: Math.round((agg?.totalDistanceKm ?? 0) * 100) / 100,
    avgHR: Math.round(agg?.avgHR ?? 0),
    totalDurationSeconds: agg?.totalDurationSeconds ?? 0,
  };
}

export async function getStephSleepStats(db: WifeDatabase, start: string, end: string): Promise<StephSleepStats> {
  const [agg] = await db
    .select({
      avgTotalMinutes: sql<number>`coalesce(avg(${sleepSessions.totalMinutes}), 0)`,
      avgRemMinutes: sql<number>`coalesce(avg(${sleepSessions.remMinutes}), 0)`,
      avgDeepMinutes: sql<number>`coalesce(avg(${sleepSessions.deepMinutes}), 0)`,
      avgCoreMinutes: sql<number>`coalesce(avg(${sleepSessions.coreMinutes}), 0)`,
      avgAwakeMinutes: sql<number>`coalesce(avg(${sleepSessions.awakeMinutes}), 0)`,
      nights: count(),
    })
    .from(sleepSessions)
    .where(and(gte(sleepSessions.date, start), lte(sleepSessions.date, end)));

  return {
    avgTotalMinutes: Math.round(agg?.avgTotalMinutes ?? 0),
    avgRemMinutes: Math.round(agg?.avgRemMinutes ?? 0),
    avgDeepMinutes: Math.round(agg?.avgDeepMinutes ?? 0),
    avgCoreMinutes: Math.round(agg?.avgCoreMinutes ?? 0),
    avgAwakeMinutes: Math.round(agg?.avgAwakeMinutes ?? 0),
    nights: agg?.nights ?? 0,
  };
}

export async function getStephWeeklyWorkoutVolume(db: WifeDatabase, start: string, end: string): Promise<WeeklyWorkoutVolume[]> {
  const rows = await db
    .select({
      weekStart: sql<string>`date(${workouts.startTime}, 'weekday 1', '-7 days')`.as('week_start'),
      totalDistanceKm: sql<number>`coalesce(sum(${workouts.distanceKm}), 0)`,
      count: count(),
    })
    .from(workouts)
    .where(and(gte(workouts.startTime, start), lte(workouts.startTime, end)))
    .groupBy(sql`date(${workouts.startTime}, 'weekday 1', '-7 days')`)
    .orderBy(sql`week_start`);

  return rows.map((r) => ({
    weekStart: r.weekStart,
    totalDistanceKm: Math.round(r.totalDistanceKm * 100) / 100,
    count: r.count,
  }));
}

export async function getStephWorkoutTypeBreakdown(db: WifeDatabase, start: string, end: string): Promise<WorkoutTypeBreakdown[]> {
  const rows = await db
    .select({
      type: workouts.workoutType,
      totalDurationSeconds: sql<number>`coalesce(sum(${workouts.durationSeconds}), 0)`,
      count: count(),
    })
    .from(workouts)
    .where(and(gte(workouts.startTime, start), lte(workouts.startTime, end)))
    .groupBy(workouts.workoutType)
    .orderBy(desc(sql`sum(${workouts.durationSeconds})`));

  return rows.map((r) => ({
    type: r.type,
    totalDurationSeconds: r.totalDurationSeconds,
    count: r.count,
  }));
}

const STEPH_MAX_HR = 185;

export function computeStephHRZones(workoutList: { avgHeartRate: number | null }[]): StephHRZoneDistribution {
  const counts = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
  let total = 0;

  for (const w of workoutList) {
    if (!w.avgHeartRate || w.avgHeartRate <= 0) continue;
    total++;
    const pct = w.avgHeartRate / STEPH_MAX_HR;
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
