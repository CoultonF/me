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

interface TidepoolBolus {
  type: 'bolus';
  subType: 'normal' | 'extended' | 'dual';
  normal?: number;
  extended?: number;
  time: string;
  id: string;
}

interface TidepoolBasal {
  type: 'basal';
  deliveryType: 'scheduled' | 'temp' | 'suspend';
  rate: number;
  duration: number; // milliseconds
  time: string;
  id: string;
}

export interface TidepoolPhysicalActivity {
  type: 'physicalActivity';
  name: string;
  distance?: { units: string; value: number };
  duration?: { units: string; value: number };
  energy?: { units: string; value: number };
  time: string;
  id: string;
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

export async function fetchInsulinData(
  token: string,
  userId: string,
  startDate: string,
  endDate: string,
): Promise<{ boluses: TidepoolBolus[]; basals: TidepoolBasal[] }> {
  const headers = { 'x-tidepool-session-token': token };

  const [bolusRes, basalRes] = await Promise.all([
    fetch(`${TIDEPOOL_API}/data/${userId}?${new URLSearchParams({ type: 'bolus', startDate, endDate })}`, { headers }),
    fetch(`${TIDEPOOL_API}/data/${userId}?${new URLSearchParams({ type: 'basal', startDate, endDate })}`, { headers }),
  ]);

  if (!bolusRes.ok) throw new Error(`Tidepool bolus fetch failed: ${bolusRes.status}`);
  if (!basalRes.ok) throw new Error(`Tidepool basal fetch failed: ${basalRes.status}`);

  const boluses = await bolusRes.json() as TidepoolBolus[];
  const basals = await basalRes.json() as TidepoolBasal[];

  return { boluses, basals };
}

export async function fetchActivityData(
  token: string,
  userId: string,
  startDate: string,
  endDate: string,
): Promise<TidepoolPhysicalActivity[]> {
  const params = new URLSearchParams({ type: 'physicalActivity', startDate, endDate });

  const res = await fetch(`${TIDEPOOL_API}/data/${userId}?${params}`, {
    headers: { 'x-tidepool-session-token': token },
  });

  if (!res.ok) throw new Error(`Tidepool activity fetch failed: ${res.status}`);

  return res.json() as Promise<TidepoolPhysicalActivity[]>;
}

export async function getTidepoolSession(env: { TIDEPOOL_EMAIL: string; TIDEPOOL_PASSWORD: string }): Promise<TidepoolSession> {
  return tidepoolLogin(env.TIDEPOOL_EMAIL, env.TIDEPOOL_PASSWORD);
}
