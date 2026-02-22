export interface CfEnv {
  DB: D1Database;
  WIFE_DB: D1Database;
  TIDEPOOL_EMAIL: string;
  TIDEPOOL_PASSWORD: string;
  STRAVA_CLIENT_ID: string;
  STRAVA_CLIENT_SECRET: string;
  GITHUB_TOKEN: string;
  GITHUB_USERNAME: string;
  ANTHROPIC_ADMIN_KEY: string;
  WIFE_SYNC_SECRET: string;
}

let _cached: CfEnv | null | undefined;

export async function getCloudflareEnv(): Promise<CfEnv | null> {
  if (_cached !== undefined) return _cached;
  try {
    const mod = await import('cloudflare:workers');
    _cached = mod.env as CfEnv;
    return _cached;
  } catch {
    _cached = null;
    return null;
  }
}
