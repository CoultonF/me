/**
 * Backfill HR data from Strava for all running_sessions missing heart rate.
 * Pages through Strava activity history and matches to D1 sessions.
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const vars = Object.fromEntries(
  readFileSync('.dev.vars', 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

// Step 1: Get refresh token
const tokenResult = JSON.parse(
  execSync(`npx wrangler d1 execute coultonf-health --remote --json --command "SELECT value FROM settings WHERE key = 'strava_refresh_token'"`, { encoding: 'utf8' })
);
const refreshToken = tokenResult[0].results[0].value;

// Step 2: Refresh access token
console.log('Refreshing Strava access token...');
const tokenRes = await fetch('https://www.strava.com/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: vars.STRAVA_CLIENT_ID,
    client_secret: vars.STRAVA_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  }),
});
if (!tokenRes.ok) { console.error('Token refresh failed:', await tokenRes.text()); process.exit(1); }
const tokenData = await tokenRes.json();
const accessToken = tokenData.access_token;
console.log('Access token obtained ✓');

// Save rotated refresh token
if (tokenData.refresh_token !== refreshToken) {
  console.log('Refresh token rotated — updating remote D1 + .dev.vars');
  execSync(`npx wrangler d1 execute coultonf-health --remote --command "UPDATE settings SET value = '${tokenData.refresh_token}' WHERE key = 'strava_refresh_token'"`, { stdio: 'inherit' });
  writeFileSync('.dev.vars', readFileSync('.dev.vars', 'utf8').replace(vars.STRAVA_REFRESH_TOKEN, tokenData.refresh_token));
}

// Step 3: Get all sessions missing HR
console.log('\nFetching running_sessions missing HR...');
const sessionsResult = JSON.parse(
  execSync(`npx wrangler d1 execute coultonf-health --remote --json --command "SELECT id, start_time, distance_km FROM running_sessions WHERE avg_heart_rate IS NULL ORDER BY start_time ASC"`, { encoding: 'utf8' })
);
const sessions = sessionsResult[0].results;
console.log(`${sessions.length} sessions missing HR data`);
if (sessions.length === 0) { console.log('Nothing to backfill!'); process.exit(0); }

const earliest = new Date(sessions[0].start_time);
console.log(`Earliest: ${earliest.toISOString()}`);

// Step 4: Page through all Strava activities back to earliest session
console.log('\nFetching Strava activities...');
const allActivities = [];
let page = 1;
const perPage = 200;
const afterTs = Math.floor(earliest.getTime() / 1000) - 86400; // 1 day before earliest

while (true) {
  const url = `https://www.strava.com/api/v3/athlete/activities?after=${afterTs}&per_page=${perPage}&page=${page}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) { console.error(`Fetch page ${page} failed:`, res.status, await res.text()); break; }
  const batch = await res.json();
  if (batch.length === 0) break;
  allActivities.push(...batch);
  console.log(`  Page ${page}: ${batch.length} activities (total: ${allActivities.length})`);
  page++;
  // Rate limit courtesy
  await new Promise(r => setTimeout(r, 500));
}

const withHR = allActivities.filter(a => a.average_heartrate != null && a.max_heartrate != null);
console.log(`\n${allActivities.length} total Strava activities, ${withHR.length} with HR data`);

// Step 5: Match and update
const FIVE_MIN = 5 * 60 * 1000;
let matched = 0;
let unmatched = 0;
const updates = [];

for (const activity of withHR) {
  const stravaStart = new Date(activity.start_date).getTime();
  const stravaDistKm = activity.distance / 1000;

  const match = sessions.find(s => {
    const sessionStart = new Date(s.start_time).getTime();
    if (Math.abs(sessionStart - stravaStart) > FIVE_MIN) return false;
    if (!s.distance_km || stravaDistKm === 0) return true;
    const distDiff = Math.abs(s.distance_km - stravaDistKm) / Math.max(s.distance_km, stravaDistKm);
    return distDiff <= 0.2;
  });

  if (match) {
    const avgHR = Math.round(activity.average_heartrate);
    const maxHR = Math.round(activity.max_heartrate);
    updates.push({ id: match.id, avgHR, maxHR, date: match.start_time, dist: stravaDistKm });
    matched++;
  } else {
    unmatched++;
  }
}

console.log(`\nMatched: ${matched}, Unmatched Strava activities: ${unmatched}`);

// Step 6: Batch update D1
if (updates.length > 0) {
  console.log('\nUpdating remote D1...');
  // D1 executions one at a time to avoid issues
  for (const u of updates) {
    console.log(`  #${u.id} ${u.date.slice(0,10)} ${u.dist.toFixed(1)}km → avg ${u.avgHR}, max ${u.maxHR}`);
    execSync(`npx wrangler d1 execute coultonf-health --remote --command "UPDATE running_sessions SET avg_heart_rate = ${u.avgHR}, max_heart_rate = ${u.maxHR} WHERE id = ${u.id}"`, { stdio: 'pipe' });
  }
  console.log(`\n✓ Updated ${updates.length} sessions with HR data`);
}
