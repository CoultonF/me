export interface CalendarAPIResponse {
  month: string;
  glucoseReadings: { timestamp: string; value: number }[];
  dailyTIR: { date: string; tirPercent: number; count: number }[];
  dailySummaries: {
    date: string;
    exerciseMinutes: number | null;
    activeCalories: number | null;
    steps: number | null;
  }[];
  workouts: {
    startTime: string;
    distanceKm: number | null;
    durationSeconds: number | null;
    avgHeartRate: number | null;
    activityName: string | null;
  }[];
  dailyInsulin: { date: string; bolusTotal: number; basalTotal: number }[];
}

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isFuture: boolean;
  glucoseReadings: { timestamp: string; value: number }[];
  tirPercent: number | null;
  glucoseReadingCount: number;
  exerciseMinutes: number | null;
  activeCalories: number | null;
  workouts: {
    activityName: string | null;
    durationSeconds: number | null;
    distanceKm: number | null;
    avgHeartRate: number | null;
  }[];
  insulinTotal: number | null;
  bolusTotal: number;
  basalTotal: number;
}
