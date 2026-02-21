import type { RehabExercise } from '../../lib/rehab-exercises';

interface Props {
  exercise: RehabExercise;
  completed: boolean;
  interactive: boolean;
  onToggle: (exerciseId: string) => void;
}

export default function RehabExerciseRow({ exercise, completed, interactive, onToggle }: Props) {
  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={() => onToggle(exercise.id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors ${
        interactive ? 'hover:bg-panel cursor-pointer' : 'cursor-default'
      }`}
    >
      {/* Checkbox */}
      <div
        className={`shrink-0 size-5 rounded border-2 flex items-center justify-center transition-colors ${
          completed
            ? 'bg-accent border-accent'
            : 'border-stroke'
        }`}
      >
        {completed && (
          <svg className="size-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Name */}
      <span className={`flex-1 text-sm ${completed ? 'line-through text-dim' : 'text-body'}`}>
        {exercise.name}
      </span>

      {/* Sets badge */}
      <span className="shrink-0 text-[10px] font-medium text-dim bg-panel px-1.5 py-0.5 rounded">
        {exercise.sets}
      </span>
    </button>
  );
}
