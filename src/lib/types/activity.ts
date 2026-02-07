export interface Workout {
  startTime: string;
  distanceKm: number | null;
  durationSeconds: number | null;
  avgPaceSecPerKm: number | null;
  avgHeartRate: number | null;
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

export interface RunningExtendedStats extends RunningStats {
  longestRunKm: number;
  fastestPaceSecPerKm: number;
  totalElevationGainM: number;
  totalActiveCalories: number;
}

export interface WeeklyDistance {
  weekStart: string;
  totalDistanceKm: number;
  runCount: number;
  runningDistanceKm: number;
  cyclingDistanceKm: number;
}

export interface PaceDataPoint {
  startTime: string;
  avgPaceSecPerKm: number;
  distanceKm: number;
  activityName: string;
}

export interface HRZoneDistribution {
  zone1: number;
  zone2: number;
  zone3: number;
  zone4: number;
  zone5: number;
}

export interface PaceHRPoint {
  avgPaceSecPerKm: number;
  avgHeartRate: number;
  distanceKm: number;
  startTime: string;
}

export interface ActivityAPIResponse {
  workouts: Workout[];
  dailySummaries: ActivityDay[];
  activityStats: ActivityStats;
  runningStats: RunningExtendedStats;
  weeklyDistances: WeeklyDistance[];
  paceHistory: PaceDataPoint[];
  hrZones: HRZoneDistribution;
  paceHRCorrelation: PaceHRPoint[];
}
