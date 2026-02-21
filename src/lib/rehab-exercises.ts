export type RehabCategory = 'strengthening' | 'mobility' | 'pre-run';

export interface RehabExercise {
  id: string;
  name: string;
  category: RehabCategory;
  sets: string;
  description: string;
  howTo: string;
  progression?: string;
}

export const REHAB_CATEGORIES: Record<RehabCategory, { label: string; colorVar: string }> = {
  strengthening: { label: 'Strengthening', colorVar: '--color-rehab-strength' },
  mobility: { label: 'Mobility', colorVar: '--color-rehab-mobility' },
  'pre-run': { label: 'Pre-Run Activation', colorVar: '--color-rehab-prerun' },
};

export const REHAB_EXERCISES: RehabExercise[] = [
  // ── Strengthening ──
  {
    id: 'single-leg-calf-raise', name: 'Single-Leg Calf Raise', category: 'strengthening', sets: '3×15',
    description: 'Slow eccentric (3s down), full ROM on step edge',
    howTo: 'Stand on one foot on the edge of a step with your heel hanging off. Push up onto your toes, then slowly lower your heel below the step over 3 seconds. Use a wall for balance if needed.',
    progression: 'Add weight via backpack',
  },
  {
    id: 'seated-calf-raise', name: 'Seated Calf Raise', category: 'strengthening', sets: '3×15',
    description: 'Bent-knee isolation of soleus, controlled tempo',
    howTo: 'Sit in a chair with feet flat on the floor. Press up onto your toes, lifting your heels as high as possible, then slowly lower back down. Keep your knees bent the whole time.',
  },
  {
    id: 'toe-yoga', name: 'Toe Yoga (Big Toe Isolations)', category: 'strengthening', sets: '3×10',
    description: 'Lift big toe only, then 4 toes only — alternate',
    howTo: 'Sit or stand with feet flat. Lift only your big toe while keeping the other four down, then switch — press the big toe down and lift the other four. Alternate back and forth.',
  },
  {
    id: 'towel-scrunches', name: 'Towel Scrunches', category: 'strengthening', sets: '3×30s',
    description: 'Seated, scrunch towel toward you with toes',
    howTo: 'Sit with a towel flat on the floor under your foot. Use your toes to grip and scrunch the towel toward you, then spread it back out. Keep your heel planted on the ground.',
  },
  {
    id: 'single-leg-rdl', name: 'Single-Leg RDL', category: 'strengthening', sets: '3×10',
    description: 'Hinge at hip, light weight, focus on arch stability',
    howTo: 'Stand on one leg and hinge forward at the hip, letting your other leg extend behind you. Reach toward the ground with your hands, keeping your back flat. Return to standing by squeezing your glute.',
  },
  {
    id: 'banded-ankle-inversion', name: 'Banded Ankle Inversion', category: 'strengthening', sets: '3×15',
    description: 'Resistance band around forefoot, invert against band',
    howTo: 'Sit with legs out, loop a resistance band around the ball of your foot and anchor it to the side. Turn the sole of your foot inward against the band\'s pull, then slowly release. Keep your leg still — only the ankle moves.',
    progression: 'Increase band resistance',
  },
  {
    id: 'tibialis-raise', name: 'Tibialis Raise', category: 'strengthening', sets: '3×15',
    description: 'Lean against wall, raise toes off ground',
    howTo: 'Stand with your back against a wall and feet about a foot out in front of you. Lift your toes and the front of your feet off the ground as high as you can, then slowly lower them back down.',
  },

  // ── Mobility ──
  {
    id: 'calf-wall-stretch', name: 'Calf Wall Stretch', category: 'mobility', sets: '2×30s',
    description: 'Straight knee + bent knee variations, each side',
    howTo: 'Face a wall and step one foot back. Press the back heel into the floor and lean forward with a straight back knee to stretch the upper calf. Then slightly bend the back knee to feel the stretch lower down. Hold each for 30 seconds per side.',
  },
  {
    id: 'ankle-circles', name: 'Ankle Circles', category: 'mobility', sets: '2×10',
    description: '10 clockwise + 10 counterclockwise each ankle',
    howTo: 'Sit or stand and lift one foot off the ground. Slowly draw big circles with your toes — 10 clockwise, then 10 counterclockwise. Try to make the circles as wide as your ankle allows.',
  },
  {
    id: 'plantar-fascia-roll', name: 'Plantar Fascia Roll', category: 'mobility', sets: '2×60s',
    description: 'Lacrosse ball or frozen water bottle under arch',
    howTo: 'Stand or sit and place a lacrosse ball (or frozen water bottle) under the arch of your foot. Roll it slowly from the ball of your foot back to your heel, applying moderate pressure. Spend extra time on any tender spots.',
  },
  {
    id: 'eccentric-heel-drops', name: 'Eccentric Heel Drops', category: 'mobility', sets: '3×12',
    description: 'Off step edge, slow 3s lower, both legs to rise',
    howTo: 'Stand on the edge of a step on both feet. Rise up onto your toes with both legs, then shift your weight to one foot and slowly lower that heel below the step over 3 seconds. Use both legs to push back up and repeat.',
  },

  // ── Pre-Run Activation ──
  {
    id: 'short-foot', name: 'Short Foot Drill', category: 'pre-run', sets: '2×30s',
    description: 'Shorten foot by doming arch without curling toes',
    howTo: 'Stand barefoot and try to pull the ball of your foot toward your heel by tightening your arch — your arch should lift but your toes must stay flat on the ground. Hold the squeeze and keep breathing.',
  },
  {
    id: 'single-leg-balance', name: 'Single-Leg Balance', category: 'pre-run', sets: '2×30s',
    description: 'Eyes open, then eyes closed progression',
    howTo: 'Stand on one foot with your knee slightly bent. Hold for 30 seconds, focusing on keeping your ankle steady. Once that\'s easy, try closing your eyes for an extra challenge.',
  },
  {
    id: 'ankle-dorsiflexion', name: 'Ankle Dorsiflexion Mobilization', category: 'pre-run', sets: '2×10',
    description: 'Knee-to-wall lunges, measuring distance from wall',
    howTo: 'Stand facing a wall in a staggered stance. Push your front knee forward over your toes toward the wall, keeping your heel on the ground. Go as far as you can without lifting the heel, then return. Move your foot further from the wall as your mobility improves.',
  },
  {
    id: 'heel-walk', name: 'Heel Walk', category: 'pre-run', sets: '2×20m',
    description: 'Walk on heels to activate tibialis anterior',
    howTo: 'Lift your toes off the ground and walk forward on just your heels for about 20 metres. Keep your toes pulled up the whole time — you should feel the muscles on the front of your shin working.',
  },
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
