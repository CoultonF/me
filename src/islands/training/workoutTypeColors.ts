export const WORKOUT_TYPES: Record<string, { label: string; color: string }> = {
  easy: { label: 'Easy', color: 'var(--color-training-easy)' },
  recovery: { label: 'Recovery', color: 'var(--color-training-recovery)' },
  tempo: { label: 'Tempo', color: 'var(--color-training-tempo)' },
  interval: { label: 'Interval', color: 'var(--color-training-interval)' },
  long: { label: 'Long Run', color: 'var(--color-training-long)' },
  race: { label: 'Race', color: 'var(--color-training-race)' },
  progression: { label: 'Progression', color: 'var(--color-training-progression)' },
  'cross-train': { label: 'Cross-Train', color: 'var(--color-training-cross-train)' },
};

export function getWorkoutColor(type: string | null): string {
  return WORKOUT_TYPES[type ?? '']?.color ?? 'var(--color-training-planned)';
}

export function getWorkoutLabel(type: string | null): string {
  return WORKOUT_TYPES[type ?? '']?.label ?? 'Workout';
}
