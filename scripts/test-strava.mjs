/**
 * Quick test: refresh Strava token + fetch activities + match to running_sessions.
 * Usage: node scripts/test-strava.mjs
 * Reads .dev.vars for credentials, uses local D1 via wrangler's SQLite files.
 */
import { readFileSync } from 'fs';

// Parse .dev.vars
const vars = Object.fromEntries(
  readFileSync('.dev.vars', 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN } = vars;

console.log('--- Step 1: Refresh access token ---');
const tokenRes = await fetch('https://www.strava.com/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: STRAVA_CLIENT_ID,
    client_secret: STRAVA_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: STRAVA_REFRESH_TOKEN,
  }),
});

if (!tokenRes.ok) {
  console.error('Token refresh failed:', tokenRes.status, await tokenRes.text());
  process.exit(1);
}

const tokenData = await tokenRes.json();
console.log('Access token obtained ✓');
console.log('New refresh token:', tokenData.refresh_token);
if (tokenData.refresh_token !== STRAVA_REFRESH_TOKEN) {
  console.log('⚠ Refresh token rotated — updating .dev.vars and D1');
  // Update .dev.vars
  const devVars = readFileSync('.dev.vars', 'utf8');
  const updated = devVars.replace(STRAVA_REFRESH_TOKEN, tokenData.refresh_token);
  (await import('fs')).writeFileSync('.dev.vars', updated);
  // Update local D1
  const { execSync } = await import('child_process');
  execSync(`npx wrangler d1 execute coultonf-health --local --command "UPDATE settings SET value='${tokenData.refresh_token}' WHERE key='strava_refresh_token'"`, { stdio: 'inherit' });
  // Update remote D1
  execSync(`npx wrangler d1 execute coultonf-health --remote --command "UPDATE settings SET value='${tokenData.refresh_token}' WHERE key='strava_refresh_token'"`, { stdio: 'inherit' });
}

console.log('\n--- Step 2: Fetch recent activities ---');
const afterTs = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
const activitiesRes = await fetch(
  `https://www.strava.com/api/v3/athlete/activities?after=${afterTs}&per_page=50`,
  { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
);

if (!activitiesRes.ok) {
  console.error('Activities fetch failed:', activitiesRes.status, await activitiesRes.text());
  process.exit(1);
}

const activities = await activitiesRes.json();
console.log(`Fetched ${activities.length} activities`);

for (const a of activities) {
  console.log(`  ${a.type} — ${a.start_date} — ${(a.distance / 1000).toFixed(2)}km — HR: avg=${a.average_heartrate ?? 'n/a'} max=${a.max_heartrate ?? 'n/a'}`);
}

const withHR = activities.filter(a => a.average_heartrate != null);
console.log(`\n${withHR.length} activities have HR data`);
