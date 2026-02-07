export interface MergedDay {
  date: string;
  tirPercent: number | null;
  glucoseReadingCount: number;
  exerciseMinutes: number | null;
  workoutCount: number;
  workoutNames: string[];
  totalDistanceKm: number;
  insulinTotal: number | null;
  bolusTotal: number;
  basalTotal: number;
}

export interface CorrelationSummary {
  activeDayAvgTIR: number;
  restDayAvgTIR: number;
  activeDays: number;
  restDays: number;
  activeDayAvgInsulin: number;
  restDayAvgInsulin: number;
  daysWithAllData: number;
}

export interface WeeklyAggregate {
  weekLabel: string;
  avgTIR: number | null;
  totalExercise: number;
  avgInsulin: number | null;
}
