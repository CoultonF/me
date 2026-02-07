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
  subType: text('sub_type'), // bolus: normal/extended/dual; basal: scheduled/temp/suspend
  duration: integer('duration'), // basal segment duration in ms
  source: text('source').default('loop'),
}, (table) => [
  uniqueIndex('insulin_doses_ts_type_idx').on(table.timestamp, table.type),
]);

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
  activityName: text('activity_name'), // "Running", "Cycling", etc.
  activeCalories: integer('active_calories'), // kcal from Tidepool energy
  source: text('source').default('tidepool'),
}, (table) => [
  uniqueIndex('running_sessions_start_time_idx').on(table.startTime),
]);

export const races = sqliteTable('races', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  date: text('date').notNull(),                  // YYYY-MM-DD
  location: text('location'),                    // "Calgary, AB"
  distance: text('distance').notNull(),          // "10K", "Half Marathon", "Marathon"
  status: text('status', { enum: ['completed', 'upcoming', 'target'] }).notNull(),
  resultsUrl: text('results_url'),
}, (table) => [
  uniqueIndex('races_name_date_idx').on(table.name, table.date),
]);

export const raceResults = sqliteTable('race_results', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  raceId: integer('race_id').notNull().references(() => races.id),
  bibNumber: text('bib_number'),
  chipTime: text('chip_time'),                   // "0:47:41"
  gunTime: text('gun_time'),                     // "0:47:46"
  pacePerKm: text('pace_per_km'),                // "04:46"
  city: text('city'),                            // "Calgary, AB"
  division: text('division'),                    // "M3034"
  overallPlace: integer('overall_place'),
  overallTotal: integer('overall_total'),
  genderPlace: integer('gender_place'),
  genderTotal: integer('gender_total'),
  divisionPlace: integer('division_place'),
  divisionTotal: integer('division_total'),
  resultsUrl: text('results_url'),
}, (table) => [
  uniqueIndex('race_results_race_id_idx').on(table.raceId),
]);
