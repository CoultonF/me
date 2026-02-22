export interface StephActivityDay {
  date: string;
  steps: number | null;
  activeCalories: number | null;
  exerciseMinutes: number | null;
  standHours: number | null;
  walkDistanceKm: number | null;
  cycleDistanceKm: number | null;
}

export interface StephWorkout {
  workoutType: string;
  startTime: string;
  endTime: string | null;
  durationSeconds: number | null;
  distanceKm: number | null;
  activeCalories: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
}

export interface StephHeartRateDay {
  date: string;
  restingHR: number | null;
  walkingHRAvg: number | null;
  hrv: number | null;
}

export interface StephSleepSession {
  date: string;
  bedtime: string | null;
  wakeTime: string | null;
  totalMinutes: number | null;
  remMinutes: number | null;
  coreMinutes: number | null;
  deepMinutes: number | null;
  awakeMinutes: number | null;
}

export interface StephVital {
  type: string;
  date: string;
  value: number;
}

export interface StephActivityStats {
  avgCalories: number;
  totalExercise: number;
  totalSteps: number;
  days: number;
}

export interface StephWorkoutStats {
  count: number;
  totalDistanceKm: number;
  avgHR: number;
  totalDurationSeconds: number;
}

export interface StephSleepStats {
  avgTotalMinutes: number;
  avgRemMinutes: number;
  avgDeepMinutes: number;
  avgCoreMinutes: number;
  avgAwakeMinutes: number;
  nights: number;
}

export interface StephHRZoneDistribution {
  zone1: number;
  zone2: number;
  zone3: number;
  zone4: number;
  zone5: number;
}

export interface WorkoutTypeBreakdown {
  type: string;
  totalDurationSeconds: number;
  count: number;
}

export interface WeeklyWorkoutVolume {
  weekStart: string;
  totalDistanceKm: number;
  count: number;
}

export interface StephActivityAPIResponse {
  dailyActivity: StephActivityDay[];
  workouts: StephWorkout[];
  heartRate: StephHeartRateDay[];
  sleep: StephSleepSession[];
  vitals: StephVital[];
  activityStats: StephActivityStats;
  workoutStats: StephWorkoutStats;
  sleepStats: StephSleepStats;
  hrZones: StephHRZoneDistribution;
  workoutTypeBreakdown: WorkoutTypeBreakdown[];
  weeklyWorkoutVolume: WeeklyWorkoutVolume[];
  // Always 90 days for training load computation
  trainingLoadActivity: StephActivityDay[];
  trainingLoadWorkouts: StephWorkout[];
}
