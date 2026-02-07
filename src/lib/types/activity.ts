export interface Workout {
  id: number;
  startTime: string;
  endTime: string | null;
  distanceKm: number | null;
  durationSeconds: number | null;
  avgPaceSecPerKm: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  elevationGainM: number | null;
  activityName: string | null;
  activeCalories: number | null;
}

export interface ActivityDay {
  date: string;
  activeCalories: number | null;
  exerciseMinutes: number | null;
  steps: number | null;
  standHours: number | null;
}

export interface ActivityStats {
  totalCalories: number;
  totalExerciseMinutes: number;
  avgCalories: number;
  avgExerciseMinutes: number;
  days: number;
}

export interface RunningStats {
  totalDistanceKm: number;
  totalDurationSeconds: number;
  avgPaceSecPerKm: number;
  avgHeartRate: number;
  workoutCount: number;
}

export interface ActivityAPIResponse {
  workouts: Workout[];
  dailySummaries: ActivityDay[];
  activityStats: ActivityStats;
  runningStats: RunningStats;
}
