import { desc, and, gte, lte, sql, count } from 'drizzle-orm';
import type { Database } from './client';
import { glucoseReadings, runningSessions, activitySummaries } from './schema';

export async function getLatestGlucose(db: Database) {
  const rows = await db
    .select({
      id: glucoseReadings.id,
      timestamp: glucoseReadings.timestamp,
      value: glucoseReadings.value,
      trend: glucoseReadings.trend,
      source: glucoseReadings.source,
    })
    .from(glucoseReadings)
    .orderBy(desc(glucoseReadings.timestamp))
    .limit(1);
  return rows[0] ?? null;
}

export async function getGlucoseRange(db: Database, startDate: string, endDate: string) {
  return db
    .select({
      id: glucoseReadings.id,
      timestamp: glucoseReadings.timestamp,
      value: glucoseReadings.value,
      trend: glucoseReadings.trend,
    })
    .from(glucoseReadings)
    .where(and(gte(glucoseReadings.timestamp, startDate), lte(glucoseReadings.timestamp, endDate)))
    .orderBy(glucoseReadings.timestamp);
}

export async function getGlucoseStats(db: Database, startDate: string, endDate: string) {
  const range = and(gte(glucoseReadings.timestamp, startDate), lte(glucoseReadings.timestamp, endDate));

  const [agg] = await db
    .select({
      min: sql<number>`min(${glucoseReadings.value})`,
      max: sql<number>`max(${glucoseReadings.value})`,
      avg: sql<number>`avg(${glucoseReadings.value})`,
      count: count(),
    })
    .from(glucoseReadings)
    .where(range);

  if (!agg || agg.count === 0) {
    return { min: 0, max: 0, avg: 0, count: 0, timeInRange: { low: 0, normal: 0, high: 0, veryHigh: 0 } };
  }

  const [tir] = await db
    .select({
      low: sql<number>`sum(case when ${glucoseReadings.value} < 3.9 then 1 else 0 end)`,
      normal: sql<number>`sum(case when ${glucoseReadings.value} >= 3.9 and ${glucoseReadings.value} <= 10.0 then 1 else 0 end)`,
      high: sql<number>`sum(case when ${glucoseReadings.value} > 10.0 and ${glucoseReadings.value} <= 13.9 then 1 else 0 end)`,
      veryHigh: sql<number>`sum(case when ${glucoseReadings.value} > 13.9 then 1 else 0 end)`,
    })
    .from(glucoseReadings)
    .where(range);

  const total = agg.count;
  return {
    min: Math.round(agg.min * 10) / 10,
    max: Math.round(agg.max * 10) / 10,
    avg: Math.round(agg.avg * 10) / 10,
    count: total,
    timeInRange: {
      low: Math.round(((tir?.low ?? 0) / total) * 100),
      normal: Math.round(((tir?.normal ?? 0) / total) * 100),
      high: Math.round(((tir?.high ?? 0) / total) * 100),
      veryHigh: Math.round(((tir?.veryHigh ?? 0) / total) * 100),
    },
  };
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
