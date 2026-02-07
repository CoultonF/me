import { desc, and, gte, lte, eq, sql, count } from 'drizzle-orm';
import type { Database } from './client';
import { glucoseReadings, insulinDoses, runningSessions, activitySummaries } from './schema';

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

export async function getGlucoseRangeDownsampled(db: Database, startDate: string, endDate: string, sampleEvery: number) {
  return db
    .select({
      timestamp: glucoseReadings.timestamp,
      value: glucoseReadings.value,
      trend: glucoseReadings.trend,
    })
    .from(glucoseReadings)
    .where(
      and(
        gte(glucoseReadings.timestamp, startDate),
        lte(glucoseReadings.timestamp, endDate),
        sql`rowid % ${sampleEvery} = 0`,
      ),
    )
    .orderBy(glucoseReadings.timestamp);
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

// ── Insulin queries ──

export async function getInsulinRange(db: Database, startDate: string, endDate: string) {
  return db
    .select({
      timestamp: insulinDoses.timestamp,
      units: insulinDoses.units,
      type: insulinDoses.type,
      subType: insulinDoses.subType,
      duration: insulinDoses.duration,
    })
    .from(insulinDoses)
    .where(and(gte(insulinDoses.timestamp, startDate), lte(insulinDoses.timestamp, endDate)))
    .orderBy(insulinDoses.timestamp);
}

export async function getInsulinDailyTotals(db: Database, startDate: string, endDate: string) {
  const range = and(gte(insulinDoses.timestamp, startDate), lte(insulinDoses.timestamp, endDate));

  const rows = await db
    .select({
      date: sql<string>`date(${insulinDoses.timestamp})`.as('date'),
      type: insulinDoses.type,
      total: sql<number>`sum(case when ${insulinDoses.type} = 'bolus' then ${insulinDoses.units} else ${insulinDoses.units} * ${insulinDoses.duration} / 3600000.0 end)`.as('total'),
    })
    .from(insulinDoses)
    .where(range)
    .groupBy(sql`date(${insulinDoses.timestamp})`, insulinDoses.type);

  // Pivot into { date, bolusTotal, basalTotal }
  const byDate = new Map<string, { bolusTotal: number; basalTotal: number }>();
  for (const row of rows) {
    const existing = byDate.get(row.date) ?? { bolusTotal: 0, basalTotal: 0 };
    if (row.type === 'bolus') {
      existing.bolusTotal = Math.round((row.total ?? 0) * 10) / 10;
    } else {
      existing.basalTotal = Math.round((row.total ?? 0) * 10) / 10;
    }
    byDate.set(row.date, existing);
  }

  return Array.from(byDate.entries()).map(([date, totals]) => ({
    date,
    ...totals,
  })).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getInsulinStats(
  db: Database,
  startDate: string,
  endDate: string,
  precomputedDailyTotals?: Awaited<ReturnType<typeof getInsulinDailyTotals>>,
) {
  const dailyTotals = precomputedDailyTotals ?? await getInsulinDailyTotals(db, startDate, endDate);

  if (dailyTotals.length === 0) {
    return { totalBolus: 0, totalBasal: 0, total: 0, avgDailyTotal: 0, bolusPercent: 0, basalPercent: 0, bolusCount: 0, days: 0 };
  }

  const totalBolus = dailyTotals.reduce((s, d) => s + d.bolusTotal, 0);
  const totalBasal = dailyTotals.reduce((s, d) => s + d.basalTotal, 0);
  const total = totalBolus + totalBasal;
  const days = dailyTotals.length;
  const avgDailyTotal = Math.round((total / days) * 10) / 10;

  // Count bolus events
  const range = and(
    gte(insulinDoses.timestamp, startDate),
    lte(insulinDoses.timestamp, endDate),
    eq(insulinDoses.type, 'bolus'),
  );
  const [countRow] = await db.select({ n: count() }).from(insulinDoses).where(range);

  return {
    totalBolus: Math.round(totalBolus * 10) / 10,
    totalBasal: Math.round(totalBasal * 10) / 10,
    total: Math.round(total * 10) / 10,
    avgDailyTotal,
    bolusPercent: total > 0 ? Math.round((totalBolus / total) * 100) : 0,
    basalPercent: total > 0 ? Math.round((totalBasal / total) * 100) : 0,
    bolusCount: countRow?.n ?? 0,
    days,
  };
}

export async function getLatestInsulin(db: Database) {
  const rows = await db
    .select({
      timestamp: insulinDoses.timestamp,
      units: insulinDoses.units,
      type: insulinDoses.type,
    })
    .from(insulinDoses)
    .where(eq(insulinDoses.type, 'bolus'))
    .orderBy(desc(insulinDoses.timestamp))
    .limit(1);
  return rows[0] ?? null;
}

// ── Activity queries ──

export async function getWorkouts(db: Database, startDate: string, endDate: string) {
  return db
    .select({
      startTime: runningSessions.startTime,
      distanceKm: runningSessions.distanceKm,
      durationSeconds: runningSessions.durationSeconds,
      avgPaceSecPerKm: runningSessions.avgPaceSecPerKm,
      avgHeartRate: runningSessions.avgHeartRate,
      activityName: runningSessions.activityName,
      activeCalories: runningSessions.activeCalories,
    })
    .from(runningSessions)
    .where(and(gte(runningSessions.startTime, startDate), lte(runningSessions.startTime, endDate)))
    .orderBy(desc(runningSessions.startTime));
}

export async function getActivityRange(db: Database, startDate: string, endDate: string) {
  return db
    .select()
    .from(activitySummaries)
    .where(and(gte(activitySummaries.date, startDate.slice(0, 10)), lte(activitySummaries.date, endDate.slice(0, 10))))
    .orderBy(activitySummaries.date);
}

export async function getActivityStats(db: Database, startDate: string, endDate: string) {
  const range = and(
    gte(activitySummaries.date, startDate.slice(0, 10)),
    lte(activitySummaries.date, endDate.slice(0, 10)),
  );

  const [agg] = await db
    .select({
      totalCalories: sql<number>`coalesce(sum(${activitySummaries.activeCalories}), 0)`,
      totalExerciseMinutes: sql<number>`coalesce(sum(${activitySummaries.exerciseMinutes}), 0)`,
      days: count(),
    })
    .from(activitySummaries)
    .where(range);

  const days = agg?.days ?? 0;
  return {
    totalCalories: agg?.totalCalories ?? 0,
    totalExerciseMinutes: agg?.totalExerciseMinutes ?? 0,
    avgCalories: days > 0 ? Math.round((agg?.totalCalories ?? 0) / days) : 0,
    avgExerciseMinutes: days > 0 ? Math.round((agg?.totalExerciseMinutes ?? 0) / days) : 0,
    days,
  };
}

export async function getRunningStats(db: Database, startDate: string, endDate: string) {
  const range = and(
    gte(runningSessions.startTime, startDate),
    lte(runningSessions.startTime, endDate),
  );

  const [agg] = await db
    .select({
      totalDistanceKm: sql<number>`coalesce(sum(${runningSessions.distanceKm}), 0)`,
      totalDurationSeconds: sql<number>`coalesce(sum(${runningSessions.durationSeconds}), 0)`,
      avgHeartRate: sql<number>`coalesce(avg(${runningSessions.avgHeartRate}), 0)`,
      workoutCount: count(),
    })
    .from(runningSessions)
    .where(range);

  const totalDist = agg?.totalDistanceKm ?? 0;
  const totalDur = agg?.totalDurationSeconds ?? 0;

  return {
    totalDistanceKm: Math.round(totalDist * 100) / 100,
    totalDurationSeconds: totalDur,
    avgPaceSecPerKm: totalDist > 0 ? Math.round(totalDur / totalDist) : 0,
    avgHeartRate: Math.round(agg?.avgHeartRate ?? 0),
    workoutCount: agg?.workoutCount ?? 0,
  };
}

export async function getWeeklyDistances(db: Database, startDate: string, endDate: string) {
  const range = and(
    gte(runningSessions.startTime, startDate),
    lte(runningSessions.startTime, endDate),
  );

  const rows = await db
    .select({
      weekStart: sql<string>`date(${runningSessions.startTime}, 'weekday 1', '-7 days')`.as('week_start'),
      totalDistanceKm: sql<number>`coalesce(sum(${runningSessions.distanceKm}), 0)`,
      runCount: count(),
      runningDistanceKm: sql<number>`coalesce(sum(case when ${runningSessions.activityName} = 'Running' then ${runningSessions.distanceKm} else 0 end), 0)`,
      cyclingDistanceKm: sql<number>`coalesce(sum(case when ${runningSessions.activityName} = 'Cycling' then ${runningSessions.distanceKm} else 0 end), 0)`,
    })
    .from(runningSessions)
    .where(range)
    .groupBy(sql`date(${runningSessions.startTime}, 'weekday 1', '-7 days')`)
    .orderBy(sql`week_start`);

  return rows.map((r) => ({
    weekStart: r.weekStart,
    totalDistanceKm: Math.round(r.totalDistanceKm * 100) / 100,
    runCount: r.runCount,
    runningDistanceKm: Math.round(r.runningDistanceKm * 100) / 100,
    cyclingDistanceKm: Math.round(r.cyclingDistanceKm * 100) / 100,
  }));
}

export async function getPaceHistory(db: Database, startDate: string, endDate: string) {
  const range = and(
    gte(runningSessions.startTime, startDate),
    lte(runningSessions.startTime, endDate),
  );

  return db
    .select({
      startTime: runningSessions.startTime,
      avgPaceSecPerKm: runningSessions.avgPaceSecPerKm,
      distanceKm: runningSessions.distanceKm,
      activityName: runningSessions.activityName,
    })
    .from(runningSessions)
    .where(range)
    .orderBy(runningSessions.startTime);
}

export async function getRunningExtendedStats(db: Database, startDate: string, endDate: string) {
  const range = and(
    gte(runningSessions.startTime, startDate),
    lte(runningSessions.startTime, endDate),
  );

  const [agg] = await db
    .select({
      totalDistanceKm: sql<number>`coalesce(sum(${runningSessions.distanceKm}), 0)`,
      totalDurationSeconds: sql<number>`coalesce(sum(${runningSessions.durationSeconds}), 0)`,
      avgHeartRate: sql<number>`coalesce(avg(${runningSessions.avgHeartRate}), 0)`,
      workoutCount: count(),
      longestRunKm: sql<number>`coalesce(max(${runningSessions.distanceKm}), 0)`,
      fastestPaceSecPerKm: sql<number>`min(case when ${runningSessions.avgPaceSecPerKm} > 0 then ${runningSessions.avgPaceSecPerKm} else null end)`,
      totalElevationGainM: sql<number>`coalesce(sum(${runningSessions.elevationGainM}), 0)`,
      totalActiveCalories: sql<number>`coalesce(sum(${runningSessions.activeCalories}), 0)`,
    })
    .from(runningSessions)
    .where(range);

  const totalDist = agg?.totalDistanceKm ?? 0;
  const totalDur = agg?.totalDurationSeconds ?? 0;

  return {
    totalDistanceKm: Math.round(totalDist * 100) / 100,
    totalDurationSeconds: totalDur,
    avgPaceSecPerKm: totalDist > 0 ? Math.round(totalDur / totalDist) : 0,
    avgHeartRate: Math.round(agg?.avgHeartRate ?? 0),
    workoutCount: agg?.workoutCount ?? 0,
    longestRunKm: Math.round((agg?.longestRunKm ?? 0) * 100) / 100,
    fastestPaceSecPerKm: agg?.fastestPaceSecPerKm ?? 0,
    totalElevationGainM: Math.round((agg?.totalElevationGainM ?? 0) * 10) / 10,
    totalActiveCalories: agg?.totalActiveCalories ?? 0,
  };
}

export async function getGlucoseDailyTIR(db: Database, startDate: string, endDate: string) {
  const rows = await db
    .select({
      date: sql<string>`date(${glucoseReadings.timestamp})`.as('date'),
      count: count(),
      inRange: sql<number>`sum(case when ${glucoseReadings.value} >= 3.9 and ${glucoseReadings.value} <= 10.0 then 1 else 0 end)`,
    })
    .from(glucoseReadings)
    .where(and(gte(glucoseReadings.timestamp, startDate), lte(glucoseReadings.timestamp, endDate)))
    .groupBy(sql`date(${glucoseReadings.timestamp})`)
    .orderBy(sql`date(${glucoseReadings.timestamp})`);

  return rows.map((r) => ({
    date: r.date,
    tirPercent: Math.round(((r.inRange ?? 0) / r.count) * 100),
    count: r.count,
  }));
}

export async function getPaceHRCorrelation(db: Database, startDate: string, endDate: string) {
  const range = and(
    gte(runningSessions.startTime, startDate),
    lte(runningSessions.startTime, endDate),
  );

  return db
    .select({
      avgPaceSecPerKm: runningSessions.avgPaceSecPerKm,
      avgHeartRate: runningSessions.avgHeartRate,
      distanceKm: runningSessions.distanceKm,
      startTime: runningSessions.startTime,
    })
    .from(runningSessions)
    .where(
      and(
        range,
        sql`${runningSessions.avgHeartRate} IS NOT NULL`,
        sql`${runningSessions.avgPaceSecPerKm} IS NOT NULL`,
        sql`${runningSessions.avgPaceSecPerKm} > 0`,
      ),
    )
    .orderBy(runningSessions.startTime);
}
