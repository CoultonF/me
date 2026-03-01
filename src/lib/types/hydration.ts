export interface HydrationEntry {
  id: number;
  timestamp: string; // ISO 8601
  amountMl: number;
  note: string | null;
}

export interface HydrationDayTotal {
  date: string;
  totalMl: number;
  entryCount: number;
}

export interface HydrationStatsResponse {
  currentStreak: number;
  avgDailyMl: number;
  totalDays: number;
  dailyTotals: HydrationDayTotal[];
}

export interface HydrationAPIResponse {
  today: {
    date: string;
    totalMl: number;
    goalMl: number;
    entries: HydrationEntry[];
  };
  stats: HydrationStatsResponse;
}
