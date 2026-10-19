import { describe, it, expect } from 'vitest'
import { safsfPlan, applyFitnessWeek, fitWeekOf, FIT } from './safsf-plan.js'

const iso = daysAgo => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString().slice(0, 10) }

describe('trainer plan', () => {
  it('schedules the gym split on Tue / Thu / Fri', () => {
    const { routines, week } = safsfPlan()
    expect(routines.find(r => r.id === week[2]).name).toBe('Lower · Day 1')
    expect(routines.find(r => r.id === week[4]).name).toBe('Upper · Day 2')
    expect(routines.find(r => r.id === week[5]).name).toBe('Lower · Day 3')
    expect(routines.filter(r => r.fit)).toHaveLength(4)
  })
})

describe('fitness weeks', () => {
  it('fills week 1 on first load and follows the PDF', () => {
    const S = safsfPlan()
    applyFitnessWeek(S, true)
    expect(S.fitWeek).toBe(1)
    const [d1, d2, d3, d4] = [1, 2, 3, 4].map(n => S.routines.find(r => r.fit === n))
    expect(d1.name).toBe('Fitness 1 · Treadmill')
    expect(d1.ex[0]).toMatchObject({ id: '3666', sets: 3, mode: 'cardio', min: 2 })
    expect(d2.name).toBe('Fitness 2 · Bike')
    expect(d3.ex.map(e => e.id)).toEqual(['3636', '0620', '3013'])
    expect(d4.ex[0]).toMatchObject({ sets: 3, min: 3 })
  })
  it('moves on each week and stops at week 6', () => {
    const S = safsfPlan()
    applyFitnessWeek(S, true)
    const ids = S.routines.filter(r => r.fit).map(r => r.id)
    S.fitStart = iso(15)
    expect(applyFitnessWeek(S)).toBe(true)
    expect(S.fitWeek).toBe(3)
    expect(S.routines.find(r => r.fit === 2).name).toBe('Fitness 2 · Core')
    expect(S.routines.filter(r => r.fit).map(r => r.id)).toEqual(ids)   // same routines, history carries on
    expect(applyFitnessWeek(S)).toBe(false)
    S.fitStart = iso(400)
    expect(fitWeekOf(S)).toBe(6)
    applyFitnessWeek(S)
    expect(S.routines.find(r => r.fit === 4).ex[0]).toMatchObject({ sets: 3, min: 5 })
  })
  it('replaces the older fixed cardio/core routines', () => {
    const S = { routines: [{ id: 'a', name: 'Lower · Day 1', ex: [] }, { id: 'b', name: 'Cardio · Bike intervals', ex: [] }, { id: 'c', name: 'Core A · knees, legs, bridge', ex: [] }], week: { 0: 'b', 2: 'a' } }
    applyFitnessWeek(S)
    expect(S.routines.map(r => r.name)).toEqual(['Lower · Day 1', 'Fitness 1 · Treadmill', 'Fitness 2 · Bike', 'Fitness 3 · Core', 'Fitness 4 · Treadmill'])
    expect(S.week).toEqual({ 2: 'a' })
  })
  it('has 6 weeks of 4 days', () => { expect(FIT.map(w => w.length)).toEqual([4, 4, 4, 4, 4, 4]) })
})
