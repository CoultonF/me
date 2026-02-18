export interface TrainingWorkout {
  id: number;
  date: string;
  title: string;
  description: string | null;
  workoutType: string | null;
  distanceKm: number | null;
  targetPace: string | null;
  status: string | null;
}

export interface TrainingStats {
  totalWorkouts: number;
  totalPlannedKm: number;
  completedKm: number;
  completedCount: number;
  skippedCount: number;
  upcomingCount: number;
  planStartDate: string | null;
  planEndDate: string | null;
  weeklyVolume: { weekStart: string; distanceKm: number; workoutCount: number }[];
  nextWorkout: TrainingWorkout | null;
}

export interface TrainingAPIResponse {
  workouts: TrainingWorkout[];
  stats: TrainingStats;
}
