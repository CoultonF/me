import { desc } from 'drizzle-orm';
import type { Database } from './client';
import { glucoseReadings, runningSessions, activitySummaries } from './schema';

export async function getLatestGlucose(db: Database) {
  const rows = await db
    .select()
    .from(glucoseReadings)
    .orderBy(desc(glucoseReadings.timestamp))
    .limit(1);
  return rows[0] ?? null;
}

export async function getGlucoseReadings(db: Database, limit = 288) {
  return db
    .select()
    .from(glucoseReadings)
    .orderBy(desc(glucoseReadings.timestamp))
    .limit(limit);
}

export async function getLatestRun(db: Database) {
  const rows = await db
    .select()
    .from(runningSessions)
    .orderBy(desc(runningSessions.startTime))
    .limit(1);
  return rows[0] ?? null;
}

export async function getRecentActivity(db: Database, days = 7) {
  return db
    .select()
    .from(activitySummaries)
    .orderBy(desc(activitySummaries.date))
    .limit(days);
}
