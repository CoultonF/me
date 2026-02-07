/**
 * End-to-end test: refresh token, fetch activities, match + update remote D1.
 * Mimics what syncStravaHeartRate() does but runs locally against remote D1.
 */
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

// Parse .dev.vars
const vars = Object.fromEntries(
  readFileSync('.dev.vars', 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

// Step 1: Get current refresh token from remote D1
const tokenResult = JSON.parse(
  execSync(`npx wrangler d1 execute coultonf-health --remote --json --command "SELECT value FROM settings WHERE key='strava_refresh_token'"`, { encoding: 'utf8' })
);
const currentRefreshToken = tokenResult[0].results[0].value;
console.log('Current refresh token from D1:', currentRefreshToken.slice(0, 8) + '...');

// Step 2: Refresh access token
console.log('\n--- Refreshing access token ---');
const tokenRes = await fetch('https://www.strava.com/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: vars.STRAVA_CLIENT_ID,
    client_secret: vars.STRAVA_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: currentRefreshToken,
  }),
});

if (!tokenRes.ok) {
  console.error('Token refresh failed:', tokenRes.status, await tokenRes.text());
  process.exit(1);
}

const tokenData = await tokenRes.json();
console.log('Access token obtained ✓');

// Save rotated refresh token
if (tokenData.refresh_token !== currentRefreshToken) {
  console.log('Refresh token rotated — updating remote D1');
  execSync(`npx wrangler d1 execute coultonf-health --remote --command "UPDATE settings SET value='${tokenData.refresh_token}' WHERE key='strava_refresh_token'"`, { stdio: 'inherit' });
}

// Step 3: Fetch activities
console.log('\n--- Fetching Strava activities (last 7 days) ---');
const afterTs = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
const activitiesRes = await fetch(
  `https://www.strava.com/api/v3/athlete/activities?after=${afterTs}&per_page=50`,
  { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
);
const activities = await activitiesRes.json();
const withHR = activities.filter(a => a.average_heartrate != null);
console.log(`${activities.length} activities, ${withHR.length} with HR data`);

for (const a of withHR) {
  console.log(`  ${a.type} — ${a.start_date} — ${(a.distance/1000).toFixed(2)}km — avg HR ${Math.round(a.average_heartrate)} / max ${Math.round(a.max_heartrate)}`);
}

// Step 4: Fetch running_sessions missing HR from remote D1
console.log('\n--- Checking running_sessions in remote D1 ---');
const windowStart = new Date(afterTs * 1000).toISOString();
const sessionsResult = JSON.parse(
  execSync(`npx wrangler d1 execute coultonf-health --remote --json --command "SELECT id, start_time, distance_km, avg_heart_rate, max_heart_rate FROM running_sessions WHERE start_time >= '${windowStart}' AND avg_heart_rate IS NULL"`, { encoding: 'utf8' })
);
const sessions = sessionsResult[0].results;
console.log(`${sessions.length} sessions missing HR data`);

// Step 5: Match and update
let matched = 0;
for (const activity of withHR) {
  const stravaStart = new Date(activity.start_date).getTime();
  const stravaDistKm = activity.distance / 1000;

  const match = sessions.find(s => {
    const sessionStart = new Date(s.start_time).getTime();
    const timeDiff = Math.abs(sessionStart - stravaStart);
    if (timeDiff > 5 * 60 * 1000) return false;
    if (!s.distance_km || stravaDistKm === 0) return true;
    const distDiff = Math.abs(s.distance_km - stravaDistKm) / Math.max(s.distance_km, stravaDistKm);
    return distDiff <= 0.2;
  });

  if (match) {
    const avgHR = Math.round(activity.average_heartrate);
    const maxHR = Math.round(activity.max_heartrate);
    console.log(`\n✓ MATCH: session #${match.id} (${match.start_time}) → avg ${avgHR}, max ${maxHR}`);
    execSync(`npx wrangler d1 execute coultonf-health --remote --command "UPDATE running_sessions SET avg_heart_rate=${avgHR}, max_heart_rate=${maxHR} WHERE id=${match.id}"`, { stdio: 'inherit' });
    matched++;
  }
}

console.log(`\n--- Result: ${matched} sessions updated with HR data ---`);

// Verify
const verifyResult = JSON.parse(
  execSync(`npx wrangler d1 execute coultonf-health --remote --json --command "SELECT id, start_time, distance_km, avg_heart_rate, max_heart_rate FROM running_sessions WHERE start_time >= '${windowStart}' ORDER BY start_time DESC LIMIT 5"`, { encoding: 'utf8' })
);
console.log('\nVerification — recent running_sessions:');
console.table(verifyResult[0].results);
