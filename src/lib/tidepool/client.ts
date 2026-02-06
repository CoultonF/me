const TIDEPOOL_API = 'https://api.tidepool.org';

interface TidepoolSession {
  token: string;
  userId: string;
}

interface TidepoolCBG {
  type: 'cbg';
  time: string;
  value: number; // mmol/L
  units: string;
  trend?: string;
}

export async function tidepoolLogin(email: string, password: string): Promise<TidepoolSession> {
  const res = await fetch(`${TIDEPOOL_API}/auth/login`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${email}:${password}`)}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Tidepool login failed: ${res.status} ${res.statusText}`);
  }

  const token = res.headers.get('x-tidepool-session-token');
  if (!token) {
    throw new Error('Tidepool login response missing session token');
  }

  const body = await res.json() as { userid: string };
  return { token, userId: body.userid };
}

export async function fetchCGMData(
  token: string,
  userId: string,
  startDate: string,
  endDate: string,
): Promise<Array<{ timestamp: string; value: number; trend: string | null }>> {
  const params = new URLSearchParams({
    type: 'cbg',
    startDate,
    endDate,
  });

  const res = await fetch(`${TIDEPOOL_API}/data/${userId}?${params}`, {
    headers: {
      'x-tidepool-session-token': token,
    },
  });

  if (!res.ok) {
    throw new Error(`Tidepool data fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as TidepoolCBG[];

  return data.map((reading) => ({
    timestamp: reading.time,
    value: Math.round(reading.value * 10) / 10,
    trend: reading.trend ?? null,
  }));
}

export async function getTidepoolSession(env: { TIDEPOOL_EMAIL: string; TIDEPOOL_PASSWORD: string }): Promise<TidepoolSession> {
  return tidepoolLogin(env.TIDEPOOL_EMAIL, env.TIDEPOOL_PASSWORD);
}
