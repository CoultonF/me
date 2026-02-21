#!/usr/bin/env node
/**
 * Local backfill script — fetches from Tidepool API and inserts into
 * remote production D1 via `wrangler d1 execute --file`. No Worker CPU limits.
 *
 * Usage:
 *   node scripts/backfill-gaps.mjs --from=270 --to=180
 *   node scripts/backfill-gaps.mjs --from=270 --to=180 --dry-run
 *   node scripts/backfill-gaps.mjs   (legacy gap-fill mode)
 */

import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

// ── Config ──────────────────────────────────────────────────────────
const DB_NAME = 'coultonf-health';
const TIDEPOOL_API = 'https://api.tidepool.org';
const DAY_MS = 24 * 60 * 60 * 1000;
const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_GLUCOSE = process.argv.includes('--skip-glucose');
const SKIP_INSULIN = process.argv.includes('--skip-insulin');
const SKIP_ACTIVITY = process.argv.includes('--skip-activity');
const CHUNK_DAYS = 5;
const ROOT = resolve(import.meta.dirname, '..');
const TMP_SQL = resolve(ROOT, '.backfill-tmp.sql');

// ── Parse CLI args ──────────────────────────────────────────────────
function parseArgs() {
  const args = {};
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--(\w+)=(.+)$/);
    if (m) args[m[1]] = m[2];
  }
  return args;
}
const cliArgs = parseArgs();

// ── Load credentials from .dev.vars ─────────────────────────────────
function loadEnv() {
  const vars = readFileSync(resolve(ROOT, '.dev.vars'), 'utf-8');
  const env = {};
  for (const line of vars.split('\n')) {
    const eq = line.indexOf('=');
    if (eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return env;
}

// ── Tidepool API ────────────────────────────────────────────────────
async function tidepoolLogin(email, password) {
  const res = await fetch(`${TIDEPOOL_API}/auth/login`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${email}:${password}`)}` },
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  return { token: res.headers.get('x-tidepool-session-token'), userId: (await res.json()).userid };
}

async function fetchCGM(token, userId, start, end) {
  const res = await fetch(`${TIDEPOOL_API}/data/${userId}?${new URLSearchParams({ type: 'cbg', startDate: start, endDate: end })}`, {
    headers: { 'x-tidepool-session-token': token },
  });
  if (!res.ok) throw new Error(`CGM fetch failed: ${res.status}`);
  return res.json();
}

async function fetchInsulin(token, userId, start, end) {
  const headers = { 'x-tidepool-session-token': token };
  const [bolusRes, basalRes] = await Promise.all([
    fetch(`${TIDEPOOL_API}/data/${userId}?${new URLSearchParams({ type: 'bolus', startDate: start, endDate: end })}`, { headers }),
    fetch(`${TIDEPOOL_API}/data/${userId}?${new URLSearchParams({ type: 'basal', startDate: start, endDate: end })}`, { headers }),
  ]);
  if (!bolusRes.ok) throw new Error(`Bolus fetch failed: ${bolusRes.status}`);
  if (!basalRes.ok) throw new Error(`Basal fetch failed: ${basalRes.status}`);
  return { boluses: await bolusRes.json(), basals: await basalRes.json() };
}

async function fetchActivity(token, userId, start, end) {
  const res = await fetch(`${TIDEPOOL_API}/data/${userId}?${new URLSearchParams({ type: 'physicalActivity', startDate: start, endDate: end })}`, {
    headers: { 'x-tidepool-session-token': token },
  });
  if (!res.ok) throw new Error(`Activity fetch failed: ${res.status}`);
  return res.json();
}

// ── Helpers ─────────────────────────────────────────────────────────
function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function convertDistance(value, units) {
  if (units === 'miles') return value * 1.60934;
  if (units === 'meters' || units === 'm') return value / 1000;
  return value;
}

function convertDuration(value, units) {
  if (units === 'hours') return value * 3600;
  if (units === 'minutes') return value * 60;
  if (units === 'milliseconds' || units === 'ms') return value / 1000;
  return value;
}

function extractActivityType(name) {
  const dash = name.indexOf(' - ');
  return dash > 0 ? name.slice(0, dash) : name;
}

function generateChunks(fromDays, toDays, chunkSize) {
  const chunks = [];
  for (let f = fromDays; f > toDays; f -= chunkSize) {
    chunks.push([f, Math.max(f - chunkSize, toDays)]);
  }
  return chunks;
}

/**
 * Execute a batch of SQL statements via a single `wrangler d1 execute --file`.
 * Collects all statements, writes to temp file, runs once.
 */
function executeSQLFile(statements) {
  const sql = statements.join('\n');
  if (DRY_RUN) {
    console.log(`  [dry-run] ${statements.length} statements, ${sql.length} bytes`);
    return;
  }
  writeFileSync(TMP_SQL, sql);
  try {
    execSync(`npx wrangler d1 execute ${DB_NAME} --remote --file="${TMP_SQL}"`, {
      cwd: ROOT, stdio: 'pipe', timeout: 120000,
    });
  } catch (e) {
    const stderr = e.stderr?.toString() || '';
    if (stderr.includes('UNIQUE constraint')) return;
    console.error(`  SQL file exec failed: ${stderr.slice(0, 300)}`);
  } finally {
    try { unlinkSync(TMP_SQL); } catch {}
  }
}

// ── Backfill glucose ────────────────────────────────────────────────
async function backfillGlucose(session, chunks) {
  let total = 0;
  for (const [fromDays, toDays] of chunks) {
    const now = Date.now();
    const start = new Date(now - fromDays * DAY_MS).toISOString();
    const end = new Date(now - toDays * DAY_MS).toISOString();
    console.log(`\nGlucose ${fromDays}→${toDays} (${start.slice(0, 10)} → ${end.slice(0, 10)})`);

    const data = await fetchCGM(session.token, session.userId, start, end);
    console.log(`  Fetched ${data.length} readings`);
    if (data.length === 0) continue;

    // Build all INSERT statements for this chunk
    const BATCH = 50;
    const stmts = [];
    for (let i = 0; i < data.length; i += BATCH) {
      const batch = data.slice(i, i + BATCH);
      const values = batch.map(r => {
        const val = Math.round(r.value * 10) / 10;
        return `(${esc(r.time)},${val},${esc(r.trend ?? null)},'tidepool')`;
      }).join(',');
      stmts.push(`INSERT OR IGNORE INTO glucose_readings(timestamp,value,trend,source) VALUES ${values};`);
    }

    executeSQLFile(stmts);
    total += data.length;
    console.log(`  Inserted ${data.length} readings (${stmts.length} batches in 1 call)`);
    await sleep(500);
  }
  return total;
}

// ── Backfill insulin ────────────────────────────────────────────────
async function backfillInsulin(session, chunks) {
  let total = 0;
  for (const [fromDays, toDays] of chunks) {
    const now = Date.now();
    const start = new Date(now - fromDays * DAY_MS).toISOString();
    const end = new Date(now - toDays * DAY_MS).toISOString();
    console.log(`\nInsulin ${fromDays}→${toDays} (${start.slice(0, 10)} → ${end.slice(0, 10)})`);

    const data = await fetchInsulin(session.token, session.userId, start, end);
    const rows = [
      ...data.boluses.map(b => ({
        timestamp: b.time, units: (b.normal ?? 0) + (b.extended ?? 0),
        type: 'bolus', sub_type: b.subType, duration: null,
      })),
      ...data.basals.map(b => ({
        timestamp: b.time, units: b.rate ?? 0,
        type: 'basal', sub_type: b.deliveryType, duration: b.duration,
      })),
    ];
    console.log(`  Fetched ${rows.length} doses (${data.boluses.length} bolus, ${data.basals.length} basal)`);
    if (rows.length === 0) continue;

    const BATCH = 30;
    const stmts = [];
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const values = batch.map(r =>
        `(${esc(r.timestamp)},${r.units},${esc(r.type)},${esc(r.sub_type)},${esc(r.duration)},'tidepool')`
      ).join(',');
      stmts.push(`INSERT OR IGNORE INTO insulin_doses(timestamp,units,type,sub_type,duration,source) VALUES ${values};`);
    }

    executeSQLFile(stmts);
    total += rows.length;
    console.log(`  Inserted ${rows.length} doses (${stmts.length} batches in 1 call)`);
    await sleep(500);
  }
  return total;
}

// ── Backfill activity ───────────────────────────────────────────────
async function backfillActivity(session, chunks) {
  let totalWorkouts = 0, totalSummaries = 0;
  for (const [fromDays, toDays] of chunks) {
    const now = Date.now();
    const start = new Date(now - fromDays * DAY_MS).toISOString();
    const end = new Date(now - toDays * DAY_MS).toISOString();
    console.log(`\nActivity ${fromDays}→${toDays} (${start.slice(0, 10)} → ${end.slice(0, 10)})`);

    const activities = await fetchActivity(session.token, session.userId, start, end);
    if (activities.length === 0) { console.log('  No activities'); continue; }

    const workoutRows = activities.map(a => {
      const dur = a.duration ? convertDuration(a.duration.value, a.duration.units) : null;
      const dist = a.distance ? convertDistance(a.distance.value, a.distance.units) : null;
      const cal = a.energy ? Math.round(a.energy.value) : null;
      const endT = dur ? new Date(new Date(a.time).getTime() + dur * 1000).toISOString() : null;
      const pace = dist && dur && dist > 0 ? Math.round(dur / dist) : null;
      return { startTime: a.time, endTime: endT, distanceKm: dist ? Math.round(dist * 100) / 100 : null,
        durationSeconds: dur ? Math.round(dur) : null, avgPaceSecPerKm: pace,
        activityName: extractActivityType(a.name), activeCalories: cal };
    });

    console.log(`  Fetched ${workoutRows.length} workouts`);
    const stmts = [];

    // running_sessions
    for (const r of workoutRows) {
      stmts.push(`INSERT OR IGNORE INTO running_sessions(start_time,end_time,distance_km,duration_seconds,avg_pace_sec_per_km,activity_name,active_calories,source) VALUES (${esc(r.startTime)},${esc(r.endTime)},${esc(r.distanceKm)},${esc(r.durationSeconds)},${esc(r.avgPaceSecPerKm)},${esc(r.activityName)},${esc(r.activeCalories)},'tidepool');`);
    }

    // activity_summaries
    const byDate = new Map();
    for (const w of workoutRows) {
      const date = w.startTime.slice(0, 10);
      const ex = byDate.get(date) ?? { calories: 0, minutes: 0 };
      ex.calories += w.activeCalories ?? 0;
      ex.minutes += w.durationSeconds ? w.durationSeconds / 60 : 0;
      byDate.set(date, ex);
    }
    for (const [date, agg] of byDate) {
      const cal = Math.round(agg.calories), mins = Math.round(agg.minutes);
      stmts.push(`INSERT INTO activity_summaries(date,active_calories,exercise_minutes) VALUES(${esc(date)},${cal},${mins}) ON CONFLICT(date) DO UPDATE SET active_calories=coalesce(active_calories,0)+${cal},exercise_minutes=coalesce(exercise_minutes,0)+${mins};`);
    }

    executeSQLFile(stmts);
    totalWorkouts += workoutRows.length;
    totalSummaries += byDate.size;
    console.log(`  Inserted ${workoutRows.length} workouts, ${byDate.size} summaries`);
    await sleep(500);
  }
  return { totalWorkouts, totalSummaries };
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== Backfill to remote D1 ===');

  const env = loadEnv();
  console.log('Logging into Tidepool...');
  const session = await tidepoolLogin(env.TIDEPOOL_EMAIL, env.TIDEPOOL_PASSWORD);
  console.log(`Authenticated as ${session.userId}`);

  let glucoseChunks, insulinChunks, activityChunks;

  if (cliArgs.from && cliArgs.to) {
    const from = parseInt(cliArgs.from, 10), to = parseInt(cliArgs.to, 10);
    console.log(`\nRange: ${from}→${to} days ago (${CHUNK_DAYS}-day chunks)`);
    glucoseChunks = generateChunks(from, to, CHUNK_DAYS);
    insulinChunks = generateChunks(from, to, CHUNK_DAYS);
    activityChunks = generateChunks(from, to, 30);
  } else {
    glucoseChunks = [[112, 111]];
    insulinChunks = [[175, 174], [127, 126], [110, 109], [106, 105], [103, 102], [102, 101]];
    activityChunks = [];
  }

  const glucoseTotal = SKIP_GLUCOSE ? 0 : await backfillGlucose(session, glucoseChunks);
  const insulinTotal = SKIP_INSULIN ? 0 : await backfillInsulin(session, insulinChunks);
  const activityResult = SKIP_ACTIVITY ? { totalWorkouts: 0, totalSummaries: 0 } : await backfillActivity(session, activityChunks);

  console.log(`\n=== Done ===`);
  console.log(`Glucose: ~${glucoseTotal} readings`);
  console.log(`Insulin: ~${insulinTotal} doses`);
  console.log(`Activity: ~${activityResult.totalWorkouts} workouts, ~${activityResult.totalSummaries} summaries`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
