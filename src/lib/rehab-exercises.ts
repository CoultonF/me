export type RehabCategory = 'strengthening' | 'mobility' | 'pre-run';

export interface RehabExercise {
  id: string;
  name: string;
  category: RehabCategory;
  sets: string;
  description: string;
  progression?: string;
}

export const REHAB_CATEGORIES: Record<RehabCategory, { label: string; colorVar: string }> = {
  strengthening: { label: 'Strengthening', colorVar: '--color-rehab-strength' },
  mobility: { label: 'Mobility', colorVar: '--color-rehab-mobility' },
  'pre-run': { label: 'Pre-Run Activation', colorVar: '--color-rehab-prerun' },
};

export const REHAB_EXERCISES: RehabExercise[] = [
  // ── Strengthening ──
  { id: 'single-leg-calf-raise', name: 'Single-Leg Calf Raise', category: 'strengthening', sets: '3×15', description: 'Slow eccentric (3s down), full ROM on step edge', progression: 'Add weight via backpack' },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', category: 'strengthening', sets: '3×15', description: 'Bent-knee isolation of soleus, controlled tempo' },
  { id: 'toe-yoga', name: 'Toe Yoga (Big Toe Isolations)', category: 'strengthening', sets: '3×10', description: 'Lift big toe only, then 4 toes only — alternate' },
  { id: 'towel-scrunches', name: 'Towel Scrunches', category: 'strengthening', sets: '3×30s', description: 'Seated, scrunch towel toward you with toes' },
  { id: 'single-leg-rdl', name: 'Single-Leg RDL', category: 'strengthening', sets: '3×10', description: 'Hinge at hip, light weight, focus on arch stability' },
  { id: 'banded-ankle-inversion', name: 'Banded Ankle Inversion', category: 'strengthening', sets: '3×15', description: 'Resistance band around forefoot, invert against band', progression: 'Increase band resistance' },
  { id: 'tibialis-raise', name: 'Tibialis Raise', category: 'strengthening', sets: '3×15', description: 'Lean against wall, raise toes off ground' },

  // ── Mobility ──
  { id: 'calf-wall-stretch', name: 'Calf Wall Stretch', category: 'mobility', sets: '2×30s', description: 'Straight knee + bent knee variations, each side' },
  { id: 'ankle-circles', name: 'Ankle Circles', category: 'mobility', sets: '2×10', description: '10 clockwise + 10 counterclockwise each ankle' },
  { id: 'plantar-fascia-roll', name: 'Plantar Fascia Roll', category: 'mobility', sets: '2×60s', description: 'Lacrosse ball or frozen water bottle under arch' },
  { id: 'eccentric-heel-drops', name: 'Eccentric Heel Drops', category: 'mobility', sets: '3×12', description: 'Off step edge, slow 3s lower, both legs to rise' },

  // ── Pre-Run Activation ──
  { id: 'short-foot', name: 'Short Foot Drill', category: 'pre-run', sets: '2×30s', description: 'Shorten foot by doming arch without curling toes' },
  { id: 'single-leg-balance', name: 'Single-Leg Balance', category: 'pre-run', sets: '2×30s', description: 'Eyes open, then eyes closed progression' },
  { id: 'ankle-dorsiflexion', name: 'Ankle Dorsiflexion Mobilization', category: 'pre-run', sets: '2×10', description: 'Knee-to-wall lunges, measuring distance from wall' },
  { id: 'heel-walk', name: 'Heel Walk', category: 'pre-run', sets: '2×20m', description: 'Walk on heels to activate tibialis anterior' },
];

export const TOTAL_EXERCISES = REHAB_EXERCISES.length;

export function getExercisesByCategory(): Record<RehabCategory, RehabExercise[]> {
  const result: Record<RehabCategory, RehabExercise[]> = {
    strengthening: [],
    mobility: [],
    'pre-run': [],
  };
  for (const ex of REHAB_EXERCISES) {
    result[ex.category].push(ex);
  }
  return result;
}
