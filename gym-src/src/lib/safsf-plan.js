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

// ---- Fitness program (cardio + core), 6 weeks, from the trainer's PDF -------------------
// Four "Fitness" routines whose content follows the current week. The week is counted from
// S.fitStart (set when the plan is first loaded) and the routines are rewritten on launch
// when a new week begins — same routine ids, so history and charts carry on.
const T = (sets, min, rec) => ({ kind: 'tread', sets, min, rec })
const B = (sets, min, zone, extra) => ({ kind: 'bike', sets, min, zone, extra })
const K = list => ({ kind: 'core', list })   // [exId, sets, cfg]
const SK = (n, s) => ['3636', n, { ...timed(s), side: true }]   // sprinter knee
const LR = (n, s) => ['0620', n, timed(s)]                       // leg raises
const BR = (n, lo, hi) => ['3013', n, range(lo, hi)]              // bridge
const WS = (n, s) => ['0624', n, timed(s)]                        // wall sit
const SP = (n, lo, hi) => ['sf08', n, range(lo, hi)]              // side plank leg raises
const DB = (n, lo, hi) => ['0276', n, range(lo, hi)]              // dead bug
export const FIT = [
  [T(3, 2, 1), B(3, 2, 'Z3'), K([SK(3, 20), LR(3, 30), BR(3, 10, 12)]), T(3, 3, 1)],
  [T(3, 3, 1), B(3, 0.5, 'Z4', 'then 1 × 2 min Z3, 1 min easy · 3 min Z2 to finish'), K([WS(3, 30), SP(3, 10, 12), DB(3, 10, 12)]), T(4, 3, 1)],
  [T(4, 3, 1), K([SK(4, 30), LR(4, 30), BR(4, 10, 12)]), B(4, 2, 'Z3'), T(3, 4, 2)],
  [T(3, 2, 1), B(3, 2, 'Z3'), K([WS(3, 30), SP(3, 12, 15), BR(3, 12, 15)]), T(3, 3, 1)],
  [T(3, 4, 2), K([SK(4, 30), LR(4, 30), BR(4, 10, 12)]), B(4, 2, 'Z3'), T(1, 20, 0)],
  [T(3, 4, 2), K([WS(4, 45), SP(4, 12, 15), DB(4, 12, 15)]), B(3, 0.5, 'Z4', 'then 2 × 2 min Z3, 1 min easy · 5 min Z2 to finish'), T(3, 5, 2)]
]
const mm = m => (m < 1 ? m * 60 + ' s' : m + ' min')
function fitDay(d) {
  if (d.kind === 'tread') return {
    title: 'Treadmill', emoji: 'figureRun', ex: [['3666', d.sets, cardio(d.min, 8)]],
    note: d.rec ? `${d.sets} × (run ${mm(d.min)} Z2 + walk ${mm(d.rec)} Z1)` : `${mm(d.min)} steady in Z2`
  }
  if (d.kind === 'bike') return {
    title: 'Bike', emoji: 'bike', ex: [['0798', 1, cardio(5, 20)], ['2138', d.sets, cardio(d.min, 25)]],
    note: `5 min Z2 warm-up · ${d.sets} × ${mm(d.min)} ${d.zone} (1 min easy between)${d.extra ? ' · ' + d.extra : ' · 5 min Z2 to finish'}`
  }
  return { title: 'Core', emoji: 'abs', ex: d.list, note: 'Rest 1 min between sets' }
}
export const fitWeekOf = S => {
  if (!S.fitStart) return 1
  const days = Math.floor((Date.now() - new Date(S.fitStart + 'T00:00:00').getTime()) / 864e5)
  return Math.min(6, Math.max(1, Math.floor(days / 7) + 1))
}
const mondayISO = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10) }
// Plan restart: week 1 of the fitness program begins again on this day (logged history is kept).
export const FIT_RESTART = '2026-10-24'
const OLD_FIT = ['Cardio · Treadmill run/walk', 'Cardio · Bike intervals', 'Core A · knees, legs, bridge', 'Core B · wall sit, plank, dead bug']
// Bring the four Fitness routines to the current week. Returns true when S changed.
export function applyFitnessWeek(S, force) {
  if (!(S.routines || []).length) return false
  let changed = false
  if (!S.fitStart) { S.fitStart = mondayISO(); changed = true }
  if (S.fitStart < FIT_RESTART && S.fitRestart !== FIT_RESTART) { S.fitStart = FIT_RESTART; S.fitRestart = FIT_RESTART; S.fitWeek = 0; changed = true }
  // Older plans had four fixed cardio/core routines: swap them for the weekly ones.
  if (!S.routines.some(r => r.fit)) {
    const at = S.routines.findIndex(r => OLD_FIT.includes(r.name))
    const removed = S.routines.filter(r => OLD_FIT.includes(r.name)).map(r => r.id)
    S.routines = S.routines.filter(r => !OLD_FIT.includes(r.name))
    Object.keys(S.week || {}).forEach(d => { if (removed.includes(S.week[d])) delete S.week[d] })
    const fresh = [1, 2, 3, 4].map(n => ({ id: uid(), fit: n, name: 'Fitness ' + n, emoji: 'figureRun', prog: 'off', ex: [] }))
    S.routines.splice(at < 0 ? 3 : at, 0, ...fresh)
    S.fitWeek = 0
    changed = true
  }
  const wk = fitWeekOf(S)
  if (S.fitWeek === wk && !force) return changed
  S.fitWeek = wk
  FIT[wk - 1].forEach((d, i) => {
    const r = S.routines.find(x => x.fit === i + 1)
    if (!r) return
    const f = fitDay(d)
    r.name = `Fitness ${i + 1} · ${f.title}`
    r.emoji = f.emoji
    r.note = f.note
    r.ex = f.ex.map(([exId, sets, cfg]) => ({ id: exId, sets, weight: 0, ...cfg }))
  })
  return true
}

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
  // Fitness 1–4 go after the gym days; applyFitnessWeek fills them for the current week.
  routines.splice(3, 0, ...[1, 2, 3, 4].map(n => ({ id: uid(), fit: n, name: 'Fitness ' + n, emoji: 'figureRun', prog: 'off', ex: [] })))
  return { routines, week }
}
