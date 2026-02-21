import type { RehabExercise, RehabCategory } from '../../lib/rehab-exercises';
import { REHAB_CATEGORIES } from '../../lib/rehab-exercises';
import RehabExerciseRow from './RehabExerciseRow';

interface Props {
  category: RehabCategory;
  exercises: RehabExercise[];
  completedIds: Set<string>;
  interactive: boolean;
  onToggle: (exerciseId: string) => void;
}

export default function RehabCategorySection({ category, exercises, completedIds, interactive, onToggle }: Props) {
  const { label, colorVar } = REHAB_CATEGORIES[category];
  const doneCount = exercises.filter((e) => completedIds.has(e.id)).length;

  return (
    <div
      className="bg-tile border border-stroke rounded-lg overflow-hidden"
      style={{ borderLeftWidth: 3, borderLeftColor: `var(${colorVar})` }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-stroke-soft">
        <span className="text-xs font-medium text-heading">{label}</span>
        <span className="text-[10px] text-dim">{doneCount}/{exercises.length}</span>
      </div>
      <div className="divide-y divide-stroke-soft">
        {exercises.map((ex) => (
          <RehabExerciseRow
            key={ex.id}
            exercise={ex}
            completed={completedIds.has(ex.id)}
            interactive={interactive}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}
