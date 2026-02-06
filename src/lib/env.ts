export interface CfEnv {
  DB: D1Database;
  TIDEPOOL_EMAIL: string;
  TIDEPOOL_PASSWORD: string;
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
