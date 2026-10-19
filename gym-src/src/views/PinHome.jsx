// Home in the Pinterest style, in a fixed order: greeting and day chips, the chosen day's
// workout with Start, its exercises in order, progress tiles, and a note from her trainer.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { dayInfo } from '../lib/day.js'
import { EXIDX, imgSrc } from '../lib/exercises.js'
import { effectiveRoutineId, streakWeeks, lastBW, exLine } from '../lib/history.js'
import { fmtNum, todayISO, isoOf, weekKey, DAYS } from '../lib/format.js'
import { fitWeekOf } from '../lib/safsf-plan.js'
import { t, dateLocale } from '../lib/i18n.js'
import { exerciseDetailSheet, workoutDetailSheet, dayOverrideSheet, startFlow, bwSheet, calendarSheet } from '../sheets.jsx'
import { FitnessCard } from '../components/Extras.jsx'
import LineChart from '../components/LineChart.jsx'
import Icon from '../components/Icon.jsx'
import { glyphOf } from '../lib/glyphs.js'

const short = name => (name || '').split(' · ')[0]

export default function PinHome() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const [sel, setSel] = useState(todayISO())
  const [wk, setWk] = useState(0)
  const day = dayInfo(S, sel)
  const r = day.routine
  const active = S.active && day.diff === 0

  // ---- day chips: the 7 days of the shown week
  const mon = new Date(); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7) + wk * 7)
  const chips = [...Array(7)].map((_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i)
    const iso = isoOf(d)
    const rid = effectiveRoutineId(S, iso)
    const rr = S.routines.find(x => x.id === rid)
    return { iso, d, name: rr ? short(rr.name) : '', done: S.workouts.some(w => w.d === iso) }
  })

  // ---- the board for the day
  const exs = r ? r.ex.map(e => ({ e, ex: EXIDX[e.id] })).filter(x => x.ex) : []
  const start = () => { if (S.active) nav('/workout'); else if (r) startFlow(r.id) }
  const stretch = S.routines.find(x => /stretch/i.test(x.name))

  // ---- what the page lists: the day's exercises in workout order (stretches on a rest day)
  const list = exs.length ? exs : (stretch ? stretch.ex.map(e => ({ e, ex: EXIDX[e.id] })).filter(x => x.ex) : [])
  const bw = lastBW(S)
  const bwPts = S.bodyweight.slice(-20).map(b => ({ t: b.t || new Date(b.d).getTime(), y: b.w, d: b.d }))
  const wThis = S.workouts.filter(w => weekKey(w.d) === weekKey(todayISO())).length
  const planned = Object.values(S.week).filter(Boolean).length
  const fit = S.routines.filter(x => x.fit && x.ex.length)
  const toToday = () => { setSel(todayISO()); setWk(0) }

  return <div className="narrow pinhome">
    {/* 1 — greeting + day picker */}
    <div className="pin-head">
      <div><h1>{t('Hi Safsf')}</h1><div className="sub">{new Date().toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>
      <button className="iconbtn" onClick={() => nav('/settings')} aria-label={t('Settings')}><Icon name="gear" /></button>
    </div>
    <div className="daychips">
      <button className="dchip arrow" onClick={() => setWk(w => w - 1)} aria-label={t('Previous week')}><Icon name="chevronLeft" /></button>
      {chips.map(c => <button key={c.iso} className={'dchip' + (c.iso === sel ? ' on' : '') + (c.iso === todayISO() ? ' today' : '')} onClick={() => setSel(c.iso)}>
        {c.iso === todayISO() ? t('Today') : t(DAYS[c.d.getDay()]) + ' ' + c.d.getDate()}{c.name ? <span> · {c.name}</span> : null}{c.done ? ' ✓' : ''}
      </button>)}
      <button className="dchip arrow" onClick={() => setWk(w => w + 1)} aria-label={t('Next week')}><Icon name="chevronRight" /></button>
    </div>

    {/* 2 — the day's workout */}
    <section className="psec">
      <div className="psec-h">{day.label}</div>
      {r || active ? <div className="wcard">
        <div className="wcard-top">
          <span className="wcard-ic"><Icon name={glyphOf((active ? S.routines.find(x => x.id === S.active.routineId) : r)?.emoji)} /></span>
          <div className="grow">
            <div className="wcard-t">{active ? S.active.name : r.name}</div>
            <div className="wcard-s">{t(exs.length === 1 ? '{0} exercise' : '{0} exercises', exs.length)}{day.moved ? ' · ' + t('moved') : ''}</div>
          </div>
        </div>
        {r && r.note && <div className="wcard-note">{r.note}</div>}
        <div className="hboard-a">
          <button className="pbtn red" onClick={start}><Icon name="play" />{active ? t('Resume') : day.diff === 0 ? t('Start workout') : t('Do it now')}</button>
          <button className="pbtn" onClick={() => dayOverrideSheet(day.iso)}>{t('Change')}</button>
        </div>
      </div> : <div className="wcard rest">
        <div className="wcard-t">{t('Rest day')}</div>
        <div className="wcard-s">{t('Let your muscles grow. A gentle stretch helps.')}</div>
        <div className="hboard-a">
          {stretch && <button className="pbtn red" onClick={() => startFlow(stretch.id)}><Icon name="play" />{t('Stretch now')}</button>}
          <button className="pbtn" onClick={() => dayOverrideSheet(day.iso)}>{t('Plan a workout')}</button>
        </div>
      </div>}
      {day.done.map(w => <div key={w.id} className="pin-done" onClick={() => workoutDetailSheet(w)}><Icon name="checkCircle" />{t('Done: {0}', w.name)}<Icon name="chevronRight" /></div>)}
      {day.diff !== 0 && <button className="linkbtn back" onClick={toToday}>← {t('Back to today')}</button>}
    </section>

    {/* 3 — exercises, in order */}
    {list.length > 0 && <section className="psec">
      <div className="psec-h">{exs.length ? t('Exercises') : t('Stretches')} <span>{list.length}</span></div>
      <div className="exgrid">{list.map((x, i) => <div key={i} className="excard" onClick={() => exerciseDetailSheet(x.ex)}>
        <div className="excard-img">
          {x.ex.img ? <img loading="lazy" src={imgSrc(x.ex)} alt="" /> : <Icon name="dumbbell" />}
          <span className="excard-n">{i + 1}</span>
        </div>
        <div className="excard-t capitalize">{x.ex.n}</div>
        <div className="excard-s">{exLine(x.e, S.unit)}</div>
      </div>)}</div>
    </section>}

    {/* 4 — progress */}
    <section className="psec">
      <div className="psec-h">{t('Your progress')}</div>
      <div className="stats3">
        <div className="cpin red" onClick={() => calendarSheet()}>
          <span className="cpin-k">{t('Week streak')}</span>
          <b>{streakWeeks(S)}</b><small>{wThis}{planned ? '/' + planned : ''} {t('this week')}</small>
        </div>
        <div className="cpin blush" onClick={() => bwSheet()}>
          <span className="cpin-k">{t('Weight')}</span>
          <b>{bw ? fmtNum(bw.w) : '—'}</b><small>{bw ? S.unit : t('Tap to log')}</small>
        </div>
        <div className="cpin black" onClick={() => fit.length && useUI.getState().openSheet(() => <FitnessCard />)}>
          <span className="cpin-k">{t('Fitness')}</span>
          <b>{fitWeekOf(S)}</b><small>{t('week of 6')}</small>
        </div>
      </div>
      {bwPts.length > 1 && <div className="wchart" onClick={() => bwSheet()}><LineChart points={bwPts} h={90} unit={S.unit} color="#e60023" /></div>}
    </section>

    {/* 5 — a word from the trainer */}
    <section className="psec">
      <div className="cpin cream quote" dir="rtl">
        <p>الأداء الصحيح والمدى الحركي الكامل… ثم بعدها تأتي الأوزان</p>
        <small dir="ltr">— {t('your trainer')}</small>
      </div>
    </section>
  </div>
}
