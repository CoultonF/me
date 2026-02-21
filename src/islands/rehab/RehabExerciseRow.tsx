import type { RehabExercise } from '../../lib/rehab-exercises';

interface Props {
  exercise: RehabExercise;
  completed: boolean;
  interactive: boolean;
  showHelp: boolean;
  onToggle: (exerciseId: string) => void;
  onToggleHelp: () => void;
}

export default function RehabExerciseRow({ exercise, completed, interactive, showHelp, onToggle, onToggleHelp }: Props) {
  return (
    <div>
      <div className="flex items-center">
        <button
          type="button"
          disabled={!interactive}
          onClick={() => onToggle(exercise.id)}
          className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors ${
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

        {/* Help toggle */}
        <button
          type="button"
          onClick={onToggleHelp}
          className={`shrink-0 size-8 flex items-center justify-center rounded-md mr-1 transition-colors hover:bg-panel ${
            showHelp ? 'text-accent' : 'text-ghost'
          }`}
          aria-label={showHelp ? 'Hide instructions' : 'Show instructions'}
        >
          <svg className="size-4" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6.5 6.5a1.5 1.5 0 1 1 2.1 1.38c-.42.18-.6.46-.6.87V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Collapsible how-to */}
      {showHelp && (
        <div className="px-3 pb-2.5 pl-11">
          <p className="text-xs text-subtle leading-relaxed">{exercise.howTo}</p>
        </div>
      )}
    </div>
  );
}
