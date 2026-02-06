import { sqliteTable, text, real, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const glucoseReadings = sqliteTable('glucose_readings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: text('timestamp').notNull(), // ISO 8601
  value: real('value').notNull(), // mmol/L
  trend: text('trend'),
  source: text('source').default('dexcom'),
}, (table) => [
  uniqueIndex('glucose_readings_timestamp_idx').on(table.timestamp),
]);

export const insulinDoses = sqliteTable('insulin_doses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: text('timestamp').notNull(), // ISO 8601
  units: real('units').notNull(),
  type: text('type', { enum: ['bolus', 'basal'] }).notNull(),
  source: text('source').default('loop'),
});

export const activitySummaries = sqliteTable('activity_summaries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  steps: integer('steps'),
  activeCalories: integer('active_calories'),
  exerciseMinutes: integer('exercise_minutes'),
  standHours: integer('stand_hours'),
  moveGoal: integer('move_goal'),
});

export const runningSessions = sqliteTable('running_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startTime: text('start_time').notNull(), // ISO 8601
  endTime: text('end_time'),
  distanceKm: real('distance_km'),
  durationSeconds: integer('duration_seconds'),
  avgPaceSecPerKm: integer('avg_pace_sec_per_km'),
  avgHeartRate: integer('avg_heart_rate'),
  maxHeartRate: integer('max_heart_rate'),
  elevationGainM: real('elevation_gain_m'),
});
