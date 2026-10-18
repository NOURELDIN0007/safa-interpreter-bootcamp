// Safsf's program from her trainer (client 28186): the gym split, the fitness (cardio + core)
// days, the mobility warm-up and the post-workout stretches. Loaded once on first launch and
// again from Settings → "Load my trainer plan".
import { uid } from './format.js'

// [exercise id, sets, reps | {extra cfg}, superset group]. Rep ranges use double progression
// (reps = top of the range, repsMin = bottom): work up to 12, then the weight goes up.
const range = (lo, hi) => ({ reps: hi, repsMin: lo })
const timed = sec => ({ mode: 'time', sec })
const cardio = (min, speed) => ({ mode: 'cardio', min, speed })

const SPEC = [
  { key: 'lower1', name: 'Lower · Day 1', emoji: 'legs', prog: 'double', ex: [
    ['0585', 3, range(10, 12)],                      // leg extension
    ['0599', 3, range(10, 12)],                      // leg curl
    ['1459', 3, range(10, 12)],                      // dumbbell romanian deadlift
    ['0168', 3, range(10, 12)],                      // cable adduction (HOLD)
    ['1760', 3, range(10, 12), 'a'],                 // goblet squat ─┐ superset
    ['0417', 3, range(10, 12), 'a']                  // suitcase calf ─┘
  ] },
  { key: 'upper', name: 'Upper · Day 2', emoji: 'arm', prog: 'double', ex: [
    ['0289', 3, range(10, 12)],                      // dumbbell bench press
    ['0245', 3, range(10, 12)],                      // underhand lat pulldown
    ['0314', 3, range(10, 12)],                      // incline dumbbell press
    ['0861', 3, range(10, 12)],                      // seated cable row
    ['0396', 3, range(10, 12)],                      // seated DB lateral raise
    ['0602', 3, range(10, 12)],                      // machine rear delt fly
    ['0241', 3, range(10, 12)],                      // triceps pushdown V-grip
    ['0165', 3, range(10, 12)]                       // cable hammer curl
  ] },
  { key: 'lower2', name: 'Lower · Day 3', emoji: 'legs', prog: 'double', ex: [
    ['0739', 3, range(10, 12)],                      // leg press
    ['0585', 3, range(10, 12)],                      // leg extension
    ['0599', 3, range(10, 12)],                      // leg curl
    ['3013', 3, range(10, 12)],                      // bridge
    ['0597', 3, range(10, 12), 'b'],                 // hip abduction ─┐ superset
    ['2335', 3, range(10, 12), 'b']                  // seated calf    ─┘
  ] },
  { key: 'tread', name: 'Cardio · Treadmill run/walk', emoji: 'figureRun', ex: [
    ['3666', 3, cardio(2, 8)]                        // run 2 min Z2 / walk 1 min Z1
  ] },
  { key: 'bike', name: 'Cardio · Bike intervals', emoji: 'bike', ex: [
    ['2138', 3, cardio(2, 20)]                       // 5' Z2 + 3 × 2' Z3 (1' easy) + 5' Z2
  ] },
  { key: 'coreA', name: 'Core A · knees, legs, bridge', emoji: 'abs', ex: [
    ['3636', 3, { ...timed(20), side: true }],       // sprinter knee
    ['0620', 3, timed(30)],                          // leg raises
    ['3013', 3, range(10, 12)]                       // bridge
  ] },
  { key: 'coreB', name: 'Core B · wall sit, plank, dead bug', emoji: 'abs', ex: [
    ['0624', 3, timed(30)],                          // wall sit
    ['sf08', 3, range(10, 12)],                      // side plank leg raises
    ['0276', 3, range(10, 12)]                       // dead bug
  ] },
  { key: 'mobility', name: 'Mobility warm-up', emoji: 'stretch', prog: 'off', ex: [
    ['sf05', 3, 10], ['sf02', 3, 12], ['sf06', 3, 12], ['sf03', 3, 10], ['sf07', 3, 10], ['sf01', 3, 10]
  ] },
  { key: 'stretch', name: 'Stretching (after workout)', emoji: 'stretch', prog: 'off', ex: [
    // 3 × 5 holds of 20 s each — chest high/low, back, lower back, shoulders, arms, legs
    ...['1167', '1271', '1346', '0690', 'sf04', '0669', '0643', '1355', '1585', '1564', '1494', '1377'].map(id => [id, 3, 5])
  ] }
]

// Weekly schedule from the trainer: Tue lower, Thu upper, Fri lower (getDay(): 0 = Sunday).
const WEEK = { 2: 'lower1', 4: 'upper', 5: 'lower2' }

export function safsfPlan() {
  const ids = {}
  const routines = SPEC.map(r => {
    const id = uid()
    ids[r.key] = id
    const sg = {}
    const ex = r.ex.map(([exId, sets, cfg, group]) => {
      const e = { id: exId, sets, weight: 0, ...(typeof cfg === 'number' ? { reps: cfg } : cfg) }
      if (group) e.sg = sg[group] || (sg[group] = 'sg' + uid())
      return e
    })
    return { id, name: r.name, emoji: r.emoji, ...(r.prog ? { prog: r.prog } : {}), ex }
  })
  const week = {}
  Object.entries(WEEK).forEach(([d, k]) => { week[d] = ids[k] })
  return { routines, week }
}
