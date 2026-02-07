import type { Workout, RunningStats } from './activity';

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

export interface RunningExtendedStats extends RunningStats {
  longestRunKm: number;
  fastestPaceSecPerKm: number;
  totalElevationGainM: number;
  totalActiveCalories: number;
}

export interface RunningAPIResponse {
  workouts: Workout[];
  weeklyDistances: WeeklyDistance[];
  paceHistory: PaceDataPoint[];
  hrZones: HRZoneDistribution;
  paceHRCorrelation: PaceHRPoint[];
  stats: RunningExtendedStats;
}
