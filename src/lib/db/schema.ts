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

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

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

// ── Code / GitHub tables ──

export const githubContributions = sqliteTable('github_contributions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  count: integer('count').notNull().default(0),
});

export const githubRepos = sqliteTable('github_repos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  fullName: text('full_name').notNull().unique(),
  description: text('description'),
  url: text('url').notNull(),
  language: text('language'),
  stars: integer('stars').default(0),
  forks: integer('forks').default(0),
  isArchived: integer('is_archived', { mode: 'boolean' }).default(false),
  isFork: integer('is_fork', { mode: 'boolean' }).default(false),
  updatedAt: text('updated_at'),
  pushedAt: text('pushed_at'),
});

export const githubEvents = sqliteTable('github_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // push, pr, issue, review, etc.
  repo: text('repo').notNull(),
  message: text('message'),
  ref: text('ref'),
  timestamp: text('timestamp').notNull(),
}, (table) => [
  uniqueIndex('github_events_type_ts_repo_idx').on(table.type, table.timestamp, table.repo),
]);

export const githubLanguages = sqliteTable('github_languages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  repoName: text('repo_name').notNull(),
  language: text('language').notNull(),
  bytes: integer('bytes').notNull().default(0),
}, (table) => [
  uniqueIndex('github_languages_repo_lang_idx').on(table.repoName, table.language),
]);

// ── Training plan ──

export const trainingPlan = sqliteTable('training_plan', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(), // YYYY-MM-DD
  title: text('title').notNull(),
  description: text('description'),
  workoutType: text('workout_type'), // easy, tempo, interval, long, recovery, race, progression
  distanceKm: real('distance_km'),
  targetPace: text('target_pace'), // e.g. "5:50"
  status: text('status').default('planned'), // planned, completed, skipped
  icalUid: text('ical_uid'),
}, (table) => [
  uniqueIndex('training_plan_date_uid_idx').on(table.date, table.icalUid),
]);

// ── Claude Code usage (Analytics API) ──

export const claudeCodeDaily = sqliteTable('claude_code_daily', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(), // YYYY-MM-DD — aggregated across all actors
  sessions: integer('sessions').default(0),
  linesAdded: integer('lines_added').default(0),
  linesRemoved: integer('lines_removed').default(0),
  commits: integer('commits').default(0),
  pullRequests: integer('pull_requests').default(0),
  editAccepted: integer('edit_accepted').default(0),
  editRejected: integer('edit_rejected').default(0),
  writeAccepted: integer('write_accepted').default(0),
  writeRejected: integer('write_rejected').default(0),
  inputTokens: integer('input_tokens').default(0),
  outputTokens: integer('output_tokens').default(0),
  cacheReadTokens: integer('cache_read_tokens').default(0),
  cacheCreationTokens: integer('cache_creation_tokens').default(0),
  costCents: integer('cost_cents').default(0), // USD cents
});

// ── Gift wishlist ──

export const gifts = sqliteTable('gifts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  price: real('price'),
  url: text('url'),
  store: text('store'),
  rating: integer('rating'), // 1–5 stars
  dateAdded: text('date_added').notNull(), // YYYY-MM-DD
  category: text('category').notNull(), // birthday, christmas, etc.
  notes: text('notes'),
  purchased: integer('purchased', { mode: 'boolean' }).default(false),
}, (table) => [
  uniqueIndex('gifts_name_category_idx').on(table.name, table.category),
]);

export const claudeCodeModels = sqliteTable('claude_code_models', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  model: text('model').notNull(),
  inputTokens: integer('input_tokens').default(0),
  outputTokens: integer('output_tokens').default(0),
  cacheReadTokens: integer('cache_read_tokens').default(0),
  cacheCreationTokens: integer('cache_creation_tokens').default(0),
  costCents: integer('cost_cents').default(0),
}, (table) => [
  uniqueIndex('claude_code_models_date_model_idx').on(table.date, table.model),
]);
