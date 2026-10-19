import { describe, it, expect, beforeEach } from 'vitest'
import { logChanges } from './cloudsync.js'

let logged
beforeEach(() => { logged = []; globalThis.window = { SafsfCloud: { key: () => 'k'.repeat(24), log: (app, text) => logged.push([app, text]) } } })

describe('activity log', () => {
  it('describes a finished workout set by set', () => {
    const prev = { workouts: [], bodyweight: [] }
    const next = { workouts: [{ id: 'w', name: 'Upper · Day 2', start: 0, end: 45 * 60000, entries: [
      { id: '0289', sets: [{ w: 10, r: 12, done: true }, { w: 12, r: 10, done: true }, { w: 12, r: 8, done: false }] },
      { id: '3666', sets: [{ min: 2, speed: 8, done: true }] }] }], bodyweight: [] }
    logChanges(prev, next, id => ({ '0289': 'dumbbell bench press', 3666: 'treadmill' })[id])
    expect(logged.map(x => x[1])).toEqual([
      'Finished Upper · Day 2 · 2 exercises, 3 sets · 45 min',
      'dumbbell bench press: 10 kg × 12, 12 kg × 10 (top 12 kg)',
      'treadmill: 2 min @ 8 km/h'])
    expect(logged.every(x => x[0] === 'gym')).toBe(true)
  })
  it('logs body weight, nothing when unchanged', () => {
    const a = { workouts: [], bodyweight: [] }
    logChanges(a, a, x => x)
    expect(logged).toEqual([])
    logChanges(a, { ...a, bodyweight: [{ w: 61.4 }] }, x => x)
    expect(logged.map(x => x[1])).toEqual(['Body weight: 61.4 kg'])
  })
  it('stays quiet when the cloud is off', () => {
    globalThis.window = {}
    logChanges({ workouts: [] }, { workouts: [{ id: 'x', entries: [] }] }, x => x)
    expect(logged).toEqual([])
  })
})
