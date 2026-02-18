import { useState, useEffect } from 'react';
import type { TrainingAPIResponse } from '../../lib/types/training';
import type { Workout, ActivityAPIResponse } from '../../lib/types/activity';
import NextWorkoutCard from './NextWorkoutCard';
import WeekSchedule from './WeekSchedule';
import TrainingProgressStats from './TrainingProgressStats';

interface Props {
  data: TrainingAPIResponse;
}

export default function TrainingSchedule({ data }: Props) {
  const { stats, workouts } = data;
  const [actualWorkouts, setActualWorkouts] = useState<Workout[]>([]);

  // Fetch actual activity data to compare against plan
  useEffect(() => {
    fetch('/api/health/activity?range=365d')
      .then((r) => r.ok ? r.json() as Promise<ActivityAPIResponse> : null)
      .then((d) => { if (d) setActualWorkouts(d.workouts); })
      .catch(() => {});
  }, []);

  if (stats.totalWorkouts === 0) return null;

  return (
    <div className="space-y-4">
      <div className="text-xs font-medium text-dim uppercase tracking-wide">Training Plan</div>
      <TrainingProgressStats stats={stats} />
      {stats.nextWorkout && <NextWorkoutCard workout={stats.nextWorkout} />}
      <WeekSchedule allWorkouts={workouts} actualWorkouts={actualWorkouts} planStartDate={stats.planStartDate} planEndDate={stats.planEndDate} />
    </div>
  );
}
