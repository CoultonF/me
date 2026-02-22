import { sql } from 'drizzle-orm';
import type { WifeDatabase } from '../db/wife-client';
import {
  dailyActivity,
  workouts,
  heartRateDaily,
  vitals,
  sleepSessions,
  bodyMeasurements,
  syncState,
} from '../db/wife-schema';
import type {
  AppleHealthSyncPayload,
  DailyActivityPayload,
  WorkoutPayload,
  HeartRateDailyPayload,
  VitalPayload,
  SleepSessionPayload,
  BodyMeasurementPayload,
  SyncResult,
} from './types';

const D1_BATCH_LIMIT = 500;

function buildDailyActivityQueries(db: WifeDatabase, rows: DailyActivityPayload[]) {
  return rows.map((row) =>
    db.insert(dailyActivity).values({
      date: row.date,
      steps: row.steps ?? null,
      activeCalories: row.activeCalories ?? null,
      basalCalories: row.basalCalories ?? null,
      exerciseMinutes: row.exerciseMinutes ?? null,
      standHours: row.standHours ?? null,
      walkDistanceKm: row.walkDistanceKm ?? null,
      cycleDistanceKm: row.cycleDistanceKm ?? null,
      updatedAt: sql`datetime('now')`,
    }).onConflictDoUpdate({
      target: dailyActivity.date,
      set: {
        steps: sql`excluded.steps`,
        activeCalories: sql`excluded.active_calories`,
        basalCalories: sql`excluded.basal_calories`,
        exerciseMinutes: sql`excluded.exercise_minutes`,
        standHours: sql`excluded.stand_hours`,
        walkDistanceKm: sql`excluded.walk_distance_km`,
        cycleDistanceKm: sql`excluded.cycle_distance_km`,
        updatedAt: sql`datetime('now')`,
      },
    })
  );
}

function buildWorkoutQueries(db: WifeDatabase, rows: WorkoutPayload[]) {
  return rows.map((row) =>
    db.insert(workouts).values({
      workoutType: row.workoutType,
      startTime: row.startTime,
      endTime: row.endTime ?? null,
      durationSeconds: row.durationSeconds ?? null,
      distanceKm: row.distanceKm ?? null,
      activeCalories: row.activeCalories ?? null,
      avgHeartRate: row.avgHeartRate ?? null,
      maxHeartRate: row.maxHeartRate ?? null,
      updatedAt: sql`datetime('now')`,
    }).onConflictDoUpdate({
      target: [workouts.workoutType, workouts.startTime],
      set: {
        endTime: sql`excluded.end_time`,
        durationSeconds: sql`excluded.duration_seconds`,
        distanceKm: sql`excluded.distance_km`,
        activeCalories: sql`excluded.active_calories`,
        avgHeartRate: sql`excluded.avg_heart_rate`,
        maxHeartRate: sql`excluded.max_heart_rate`,
        updatedAt: sql`datetime('now')`,
      },
    })
  );
}

const RESTING_HR_CAP = 80;

function buildHeartRateDailyQueries(db: WifeDatabase, rows: HeartRateDailyPayload[]) {
  return rows.map((row) => {
    const restingHR = row.restingHR != null && row.restingHR > RESTING_HR_CAP ? null : (row.restingHR ?? null);
    return db.insert(heartRateDaily).values({
      date: row.date,
      restingHR,
      walkingHRAvg: row.walkingHRAvg ?? null,
      hrv: row.hrv ?? null,
      updatedAt: sql`datetime('now')`,
    }).onConflictDoUpdate({
      target: heartRateDaily.date,
      set: {
        restingHR: sql`excluded.resting_hr`,
        walkingHRAvg: sql`excluded.walking_hr_avg`,
        hrv: sql`excluded.hrv`,
        updatedAt: sql`datetime('now')`,
      },
    });
  });
}

function buildVitalQueries(db: WifeDatabase, rows: VitalPayload[]) {
  return rows.map((row) =>
    db.insert(vitals).values({
      type: row.type,
      date: row.date,
      value: row.value,
      updatedAt: sql`datetime('now')`,
    }).onConflictDoUpdate({
      target: [vitals.type, vitals.date],
      set: {
        value: sql`excluded.value`,
        updatedAt: sql`datetime('now')`,
      },
    })
  );
}

function buildSleepSessionQueries(db: WifeDatabase, rows: SleepSessionPayload[]) {
  return rows.map((row) =>
    db.insert(sleepSessions).values({
      date: row.date,
      bedtime: row.bedtime ?? null,
      wakeTime: row.wakeTime ?? null,
      totalMinutes: row.totalMinutes ?? null,
      remMinutes: row.remMinutes ?? null,
      coreMinutes: row.coreMinutes ?? null,
      deepMinutes: row.deepMinutes ?? null,
      awakeMinutes: row.awakeMinutes ?? null,
      updatedAt: sql`datetime('now')`,
    }).onConflictDoUpdate({
      target: sleepSessions.date,
      set: {
        bedtime: sql`excluded.bedtime`,
        wakeTime: sql`excluded.wake_time`,
        totalMinutes: sql`excluded.total_minutes`,
        remMinutes: sql`excluded.rem_minutes`,
        coreMinutes: sql`excluded.core_minutes`,
        deepMinutes: sql`excluded.deep_minutes`,
        awakeMinutes: sql`excluded.awake_minutes`,
        updatedAt: sql`datetime('now')`,
      },
    })
  );
}

function buildBodyMeasurementQueries(db: WifeDatabase, rows: BodyMeasurementPayload[]) {
  return rows.map((row) =>
    db.insert(bodyMeasurements).values({
      type: row.type,
      date: row.date,
      value: row.value,
      updatedAt: sql`datetime('now')`,
    }).onConflictDoUpdate({
      target: [bodyMeasurements.type, bodyMeasurements.date],
      set: {
        value: sql`excluded.value`,
        updatedAt: sql`datetime('now')`,
      },
    })
  );
}

export async function ingestAppleHealthData(
  db: WifeDatabase,
  payload: AppleHealthSyncPayload,
): Promise<SyncResult> {
  const result: SyncResult = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allQueries: any[] = [];

  if (payload.dailyActivity?.length) {
    const queries = buildDailyActivityQueries(db, payload.dailyActivity);
    allQueries.push(...queries);
    result.dailyActivity = payload.dailyActivity.length;
  }
  if (payload.workouts?.length) {
    const queries = buildWorkoutQueries(db, payload.workouts);
    allQueries.push(...queries);
    result.workouts = payload.workouts.length;
  }
  if (payload.heartRateDaily?.length) {
    const queries = buildHeartRateDailyQueries(db, payload.heartRateDaily);
    allQueries.push(...queries);
    result.heartRateDaily = payload.heartRateDaily.length;
  }
  if (payload.vitals?.length) {
    const queries = buildVitalQueries(db, payload.vitals);
    allQueries.push(...queries);
    result.vitals = payload.vitals.length;
  }
  if (payload.sleepSessions?.length) {
    const queries = buildSleepSessionQueries(db, payload.sleepSessions);
    allQueries.push(...queries);
    result.sleepSessions = payload.sleepSessions.length;
  }
  if (payload.bodyMeasurements?.length) {
    const queries = buildBodyMeasurementQueries(db, payload.bodyMeasurements);
    allQueries.push(...queries);
    result.bodyMeasurements = payload.bodyMeasurements.length;
  }

  // Sync state update
  allQueries.push(
    db.insert(syncState).values({
      key: 'last_sync',
      value: payload.syncTimestamp,
    }).onConflictDoUpdate({
      target: syncState.key,
      set: { value: sql`excluded.value` },
    })
  );

  // Execute in chunks of D1_BATCH_LIMIT
  for (let i = 0; i < allQueries.length; i += D1_BATCH_LIMIT) {
    const chunk = allQueries.slice(i, i + D1_BATCH_LIMIT);
    await db.batch(chunk as [typeof chunk[0], ...typeof chunk]);
  }

  return result;
}
