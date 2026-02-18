import type { TrainingAPIResponse } from '../../lib/types/training';
import NextWorkoutCard from './NextWorkoutCard';
import WeekSchedule from './WeekSchedule';
import TrainingProgressStats from './TrainingProgressStats';

interface Props {
  data: TrainingAPIResponse;
}

export default function TrainingSchedule({ data }: Props) {
  const { stats, workouts } = data;

  if (stats.totalWorkouts === 0) return null;

  // Get current week workouts for WeekSchedule
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mondayStr = monday.toISOString().slice(0, 10);
  const sundayStr = sunday.toISOString().slice(0, 10);
  const weekWorkouts = workouts.filter((w) => w.date >= mondayStr && w.date <= sundayStr);

  return (
    <div className="space-y-4">
      <div className="text-xs font-medium text-dim uppercase tracking-wide">Training Plan</div>
      <TrainingProgressStats stats={stats} />
      {stats.nextWorkout && <NextWorkoutCard workout={stats.nextWorkout} />}
      <WeekSchedule workouts={weekWorkouts} />
    </div>
  );
}
