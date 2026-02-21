import { useState, useCallback } from 'react';
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
  const [openHelp, setOpenHelp] = useState<Set<string>>(new Set());

  const allOpen = openHelp.size === exercises.length;

  const toggleAll = useCallback(() => {
    if (allOpen) {
      setOpenHelp(new Set());
    } else {
      setOpenHelp(new Set(exercises.map((e) => e.id)));
    }
  }, [allOpen, exercises]);

  const toggleOne = useCallback((id: string) => {
    setOpenHelp((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div
      className="bg-tile border border-stroke rounded-lg overflow-hidden"
      style={{ borderLeftWidth: 3, borderLeftColor: `var(${colorVar})` }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-stroke-soft">
        <span className="text-xs font-medium text-heading">{label}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAll}
            className="text-[10px] text-dim hover:text-accent transition-colors"
          >
            {allOpen ? 'Hide all' : 'Show all'} help
          </button>
          <span className="text-[10px] text-dim">{doneCount}/{exercises.length}</span>
        </div>
      </div>
      <div className="divide-y divide-stroke-soft">
        {exercises.map((ex) => (
          <RehabExerciseRow
            key={ex.id}
            exercise={ex}
            completed={completedIds.has(ex.id)}
            interactive={interactive}
            showHelp={openHelp.has(ex.id)}
            onToggle={onToggle}
            onToggleHelp={() => toggleOne(ex.id)}
          />
        ))}
      </div>
    </div>
  );
}
