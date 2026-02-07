export interface GlucoseReading {
  timestamp: string;
  value: number;
  trend?: string | null;
}

export interface GlucoseStats {
  min: number;
  max: number;
  avg: number;
  count: number;
  timeInRange: {
    low: number;
    normal: number;
    high: number;
    veryHigh: number;
  };
}

export interface GlucoseDailyTIR {
  date: string;
  tirPercent: number;
  count: number;
}

export interface GlucoseAPIResponse {
  latest: GlucoseReading | null;
  readings: GlucoseReading[];
  stats: GlucoseStats;
  dailyTIR?: GlucoseDailyTIR[];
}
