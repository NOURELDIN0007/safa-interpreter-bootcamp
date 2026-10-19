import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { Pin, PinGrid } from '../components/Pins.jsx'
import { FitnessCard } from '../components/Extras.jsx'
import { EXIDX } from '../lib/exercises.js'
import { exerciseDetailSheet, workoutDetailSheet } from '../sheets.jsx'
import PinHome from './PinHome.jsx'
import { dayInfo } from '../lib/day.js'
import { effectiveRoutine, effectiveRoutineId, streakWeeks, lastBW, setsDoneActive, exLine } from '../lib/history.js'
import { fmtNum, fmtDate, todayISO, isoOf, weekKey, DAYS } from '../lib/format.js'
import { t, dateLocale } from '../lib/i18n.js'
import { bwSheet, goalSheet, dayOverrideSheet, calendarSheet, startFlow, loadStarterPlan, bwDeltaColor } from '../sheets.jsx'
import LineChart from '../components/LineChart.jsx'
import { Thumb } from '../components/Media.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import { glyphOf } from '../lib/glyphs.js'

// Home = what to do now + a quick glance. Deep charts & history live in Stats.
export default function Home() {
  const S = useStore(s => s.S)
  return S.style === 'pin' ? <PinHome /> : <CornerHome />
}

function CornerHome() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const user = useStore(s => s.user)
  const [weekOffset, setWeekOffset] = useState(0)
  const [sel, setSel] = useState(todayISO())
  const day = dayInfo(S, sel)

  const today = new Date()
  const routine = effectiveRoutine(S, todayISO())
  const todayOvr = S.dayPlan[todayISO()] !== undefined
  const bw = lastBW(S)
  const prevBW = S.bodyweight.length > 1 ? S.bodyweight[S.bodyweight.length - 2] : null
  const delta = bw && prevBW ? bw.w - prevBW.w : null

  const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7)
  const doneDays = new Set(S.workouts.map(w => w.d))
  const strip = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    const iso = isoOf(d)
    const eff = effectiveRoutineId(S, iso), ovr = S.dayPlan[iso] !== undefined, done = doneDays.has(iso)
    const dot = done ? ' done' : ovr && eff ? ' ovr' : eff ? ' plan' : ''
    strip.push(<div key={i} className={'wday' + (iso === todayISO() ? ' today' : '') + (iso === sel ? ' sel' : '')} onClick={() => setSel(iso)}>
      <div className="lbl">{t(DAYS[d.getDay()])}</div><div className="num">{d.getDate()}</div><div className={'dot' + dot} /></div>)
  }
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  const wkLabel = weekOffset === 0 ? t('This week') : `${monday.getDate()} ${monday.toLocaleDateString(dateLocale(), { month: 'short' })} – ${sunday.getDate()} ${sunday.toLocaleDateString(dateLocale(), { month: 'short' })}`

  const wThisWeek = S.workouts.filter(w => weekKey(w.d) === weekKey(todayISO())).length
  const plannedPerWeek = Object.keys(S.week).filter(k => S.week[k]).length
  const bwPoints = S.bodyweight.slice(-30).map(b => ({ t: b.t || new Date(b.d).getTime(), y: b.w, d: b.d }))


  return <div className="narrow">
    <div className="hero">
      <button className="iconbtn gear" onClick={() => nav('/settings')} aria-label={t('Settings')}><Icon name="gear" /></button>
      <div>
        <div className="eyebrow rise">{t('Hey, Safsf')} <Icon name="heart" /></div>
        <h1 className="rise d1">{(day.diff === 0 ? t('Today is') : t('{0} is', day.diff === 1 ? t('Tomorrow') : day.diff === -1 ? t('Yesterday') : day.d.toLocaleDateString(dateLocale(), { weekday: 'long' }))) + (day.routine ? '' : ' ' + t('a'))}<span className="script">{day.routine ? day.routine.name.split(' · ')[0] : t('rest day')}</span></h1>
        <div className="sub rise d2">{day.routine && day.routine.name.includes(' · ') && <b>{day.routine.name.split(' · ').slice(1).join(' · ')} · </b>}{day.d.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      </div>
      <div className="arch rise d3"><img src={day.routine ? 'deco/peony.jpg' : 'deco/hydrangea.jpg'} alt="" /></div>
      <svg className="spark" style={{ right: 104, bottom: 120 }} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4.6 12 0Z" /></svg>
    </div>

    <div className="card">
      <div className="row between" style={{ marginBottom: 8 }}>
        <button className="iconbtn" style={{ width: 30, height: 30, fontSize: 15 }} onClick={() => setWeekOffset(w => w - 1)} aria-label="Previous week"><Icon name="chevronLeft" /></button>
        <div className="small muted" style={{ fontWeight: 500 }}>{wkLabel}</div>
        <button className="iconbtn" style={{ width: 30, height: 30, fontSize: 15 }} onClick={() => setWeekOffset(w => w + 1)} aria-label="Next week"><Icon name="chevronRight" /></button>
      </div>
      <div className="week">{strip}</div>
      <DayCard S={S} day={day} onBack={() => { setSel(todayISO()); setWeekOffset(0) }} />
    </div>

    {!S.routines.length && !S.active && (
      <div className="card">
        <div className="row" style={{ gap: 10, marginBottom: 6 }}>
          <span className="lrow-i"><Icon name="sparkles" /></span>
          <div className="big" style={{ fontSize: 22 }}>{t('Welcome!')}</div>
        </div>
        <div className="muted small" style={{ marginBottom: 12 }}>{t('Load the plan from your trainer — gym days, cardio, core, mobility and stretching — or build your own.')}</div>
        <Button variant="primary" icon="heart" onClick={() => useStore.getState().loadSafsfPlan()}>{t('Load my trainer plan')}</Button>
        <div style={{ height: 8 }} /><Button onClick={() => nav('/plan')}>{t('Build my own plan')}</Button>
      </div>
    )}

    <div className="card">
      <div className="row between" style={{ marginBottom: 6 }}>
        <h2 style={{ margin: 0 }}>{t('Body weight')}</h2>
        <div className="row" style={{ gap: 8 }}>
          <Button size="sm" icon="target" style={S.targetW ? { color: 'var(--yellow)' } : undefined} onClick={goalSheet}>{S.targetW ? fmtNum(S.targetW) : t('Goal')}</Button>
          <Button size="sm" icon="plus" onClick={() => bwSheet()}>{t('Log')}</Button>
        </div>
      </div>
      {bw ? <>
        <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
          <div className="big">{fmtNum(bw.w)} <span className="muted" style={{ fontSize: '1rem' }}>{S.unit}</span></div>
          {/* only when it actually moved — an unchanged weight used to read as "− 0" */}
          {!!delta && (
            <span className="small row" style={{ gap: 2, fontWeight: 500, color: bwDeltaColor(delta, bw.w) }}>
              <Icon name={delta > 0 ? 'arrowUp' : 'arrowDown'} style={{ fontSize: 12 }} />
              {fmtNum(Math.abs(delta))}
            </span>
          )}
          <span className="dim small" style={{ marginLeft: 'auto' }}>{fmtDate(bw.d, true)}</span>
        </div>
        {S.targetW && (
          <div className="small row" style={{ color: 'var(--yellow)', marginTop: 4, gap: 5 }}>
            <Icon name="target" style={{ fontSize: 13 }} />
            <span>{t('Goal')} {fmtNum(S.targetW)} {S.unit} · {Math.abs(S.targetW - bw.w) < 0.05 ? t('reached!') : t(S.targetW > bw.w ? '{0} to gain' : '{0} to lose', fmtNum(Math.abs(S.targetW - bw.w)) + ' ' + S.unit)}</span>
          </div>
        )}
        <div className="chart" style={{ marginTop: 8 }}><LineChart points={bwPoints} h={130} unit={S.unit} goal={S.targetW} /></div>
      </> : <div className="muted small">{t("No entries yet — log your weight to start the curve. It's also asked before every workout.")}</div>}
    </div>

    <div className="card tappable" style={{ cursor: 'pointer' }} onClick={() => calendarSheet()}>
      <div className="row between">
        <div>
          <div className="row" style={{ gap: 7, fontSize: 22, fontWeight: 600, letterSpacing: '-.021em' }}>
            <Icon name="flame" style={{ color: 'var(--orange)' }} />
            {t('{0} week streak', streakWeeks(S))}
          </div>
          <div className="muted small" style={{ marginTop: 2 }}>{wThisWeek}{plannedPerWeek ? ' / ' + plannedPerWeek : ''} {t('this week')} · {t(S.workouts.length === 1 ? '{0} workout total' : '{0} workouts total', S.workouts.length)}</div>
        </div>
        <Icon name="calendar" className="chev" style={{ fontSize: 20 }} />
      </div>
    </div>
    <FitnessCard />
  </div>
}

// What the selected day holds: its workout (or what was done), every exercise with its
// sets × reps, and the actions for that day.
export function DayCard({ S, day, onBack }) {
  const nav = useNavigate()
  const r = day.routine
  const active = S.active && day.diff === 0
  const exs = r ? r.ex.map(e => ({ e, ex: EXIDX[e.id] })).filter(x => x.ex) : []
  const start = () => { if (S.active) nav('/workout'); else if (r) startFlow(r.id) }
  return <div className="daycard">
    <div className="row between" style={{ alignItems: 'flex-start' }}>
      <div style={{ minWidth: 0 }}>
        <div className="lbl2">{day.label}{day.moved && r ? ' · ' + t('moved') : ''}</div>
        <div className="ttl">{active ? t('{0} — in progress', S.active.name) : r ? r.name : t('Rest day')}</div>
        {r && <div className="small muted">{t(exs.length === 1 ? '{0} exercise' : '{0} exercises', exs.length)}{r.note ? ' · ' + r.note : ''}</div>}
      </div>
      {day.diff !== 0 && <button className="linkbtn" onClick={onBack}>{t('Back to today')}</button>}
    </div>
    {day.done.length > 0 && day.done.map(w => <div key={w.id} className="day-done" onClick={() => workoutDetailSheet(w)}>
      <Icon name="checkCircle" /> {t('Done: {0}', w.name)} <Icon name="chevronRight" className="chev" /></div>)}
    {exs.length > 0 && <div className="day-ex">{exs.map(({ e, ex }, i) => <div key={i} className="day-exrow" onClick={() => exerciseDetailSheet(ex)}>
      <Thumb ex={ex} /><span className="capitalize grow">{ex.n}</span><span className="small muted nowrap">{exLine(e, S.unit)}</span></div>)}</div>}
    <div className="row" style={{ gap: 8, marginTop: 12 }}>
      {(r || active) && <Button variant="primary" icon={active ? 'play' : 'play'} onClick={start} style={{ flex: 2 }}>{active ? t('Resume') : day.diff === 0 ? t('Start') : t('Do it now')}</Button>}
      <Button icon={r ? 'shuffle' : 'plus'} onClick={() => dayOverrideSheet(day.iso)} style={{ flex: 1 }}>{r ? t('Change') : t('Plan a workout')}</Button>
    </div>
  </div>
}
