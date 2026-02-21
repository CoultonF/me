export interface RehabDayStatus {
  date: string;
  completedIds: string[];
}

export interface RehabStatsResponse {
  currentStreak: number;
  totalDays: number;
  totalExercises: number;
  dailyCounts: { date: string; count: number }[];
}

export interface RehabAPIResponse {
  today: RehabDayStatus;
  stats: RehabStatsResponse;
  injuryPeriod: { start: string; end: string | null } | null;
}
