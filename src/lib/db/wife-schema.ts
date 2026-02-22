import { sqliteTable, text, real, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const dailyActivity = sqliteTable('daily_activity', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  steps: integer('steps'),
  activeCalories: integer('active_calories'),
  basalCalories: integer('basal_calories'),
  exerciseMinutes: integer('exercise_minutes'),
  standHours: integer('stand_hours'),
  walkDistanceKm: real('walk_distance_km'),
  cycleDistanceKm: real('cycle_distance_km'),
  updatedAt: text('updated_at'),
});

export const workouts = sqliteTable('workouts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workoutType: text('workout_type').notNull(), // running, cycling, yoga, etc.
  startTime: text('start_time').notNull(), // ISO 8601
  endTime: text('end_time'),
  durationSeconds: integer('duration_seconds'),
  distanceKm: real('distance_km'),
  activeCalories: integer('active_calories'),
  avgHeartRate: integer('avg_heart_rate'),
  maxHeartRate: integer('max_heart_rate'),
  updatedAt: text('updated_at'),
}, (table) => [
  uniqueIndex('workouts_type_start_idx').on(table.workoutType, table.startTime),
]);

export const heartRateDaily = sqliteTable('heart_rate_daily', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  restingHR: integer('resting_hr'),
  walkingHRAvg: integer('walking_hr_avg'),
  hrv: real('hrv'), // SDNN in ms
  updatedAt: text('updated_at'),
});

export const vitals = sqliteTable('vitals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // vo2max, respiratory_rate, spo2
  date: text('date').notNull(), // YYYY-MM-DD
  value: real('value').notNull(),
  updatedAt: text('updated_at'),
}, (table) => [
  uniqueIndex('vitals_type_date_idx').on(table.type, table.date),
]);

export const sleepSessions = sqliteTable('sleep_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(), // YYYY-MM-DD (night of)
  bedtime: text('bedtime'), // ISO 8601
  wakeTime: text('wake_time'), // ISO 8601
  totalMinutes: integer('total_minutes'),
  remMinutes: integer('rem_minutes'),
  coreMinutes: integer('core_minutes'),
  deepMinutes: integer('deep_minutes'),
  awakeMinutes: integer('awake_minutes'),
  updatedAt: text('updated_at'),
});

export const bodyMeasurements = sqliteTable('body_measurements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // weight, body_fat
  date: text('date').notNull(), // YYYY-MM-DD
  value: real('value').notNull(), // kg or %
  updatedAt: text('updated_at'),
}, (table) => [
  uniqueIndex('body_measurements_type_date_idx').on(table.type, table.date),
]);

export const syncState = sqliteTable('sync_state', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
