export interface InsulinDose {
  timestamp: string;
  units: number;
  type: 'bolus' | 'basal';
  subType?: string | null;
  duration?: number | null;
}

export interface InsulinDailyTotal {
  date: string;
  bolusTotal: number;
  basalTotal: number;
}

export interface InsulinStats {
  totalBolus: number;
  totalBasal: number;
  total: number;
  avgDailyTotal: number;
  bolusPercent: number;
  basalPercent: number;
  bolusCount: number;
  days: number;
}

export interface InsulinAPIResponse {
  doses?: InsulinDose[];
  dailyTotals: InsulinDailyTotal[];
  stats: InsulinStats;
}
