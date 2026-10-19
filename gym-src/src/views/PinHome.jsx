// Home in the Pinterest style: day chips across the top (pick any day), a big board for that
// day's workout with the red Start button, then a masonry feed — that day's exercises as pins,
// mixed with colour pins for streak, body weight, the fitness week and a note from her trainer.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { dayInfo } from '../lib/day.js'
import { EXIDX, imgSrc, gifSrc } from '../lib/exercises.js'
import { effectiveRoutineId, streakWeeks, lastBW, exLine } from '../lib/history.js'
import { fmtNum, todayISO, isoOf, weekKey, DAYS } from '../lib/format.js'
import { fitWeekOf } from '../lib/safsf-plan.js'
import { t, dateLocale } from '../lib/i18n.js'
import { exerciseDetailSheet, workoutDetailSheet, dayOverrideSheet, startFlow, bwSheet, calendarSheet } from '../sheets.jsx'
import { FitnessCard } from '../components/Extras.jsx'
import LineChart from '../components/LineChart.jsx'
import Icon from '../components/Icon.jsx'

const RATIOS = ['1 / 1.15', '1 / 1', '4 / 5', '1 / 1.3', '5 / 4.6', '1 / 1.08']
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
  const pics = exs.map(x => x.ex).filter(x => x.img)
  const start = () => { if (S.active) nav('/workout'); else if (r) startFlow(r.id) }
  const stretch = S.routines.find(x => /stretch/i.test(x.name))

  // ---- feed: the day's exercises (or stretches on a rest day) mixed with colour pins
  const feedEx = exs.length ? exs : (stretch ? stretch.ex.map(e => ({ e, ex: EXIDX[e.id] })).filter(x => x.ex) : [])
  const bw = lastBW(S)
  const bwPts = S.bodyweight.slice(-20).map(b => ({ t: b.t || new Date(b.d).getTime(), y: b.w, d: b.d }))
  const wThis = S.workouts.filter(w => weekKey(w.d) === weekKey(todayISO())).length
  const planned = Object.values(S.week).filter(Boolean).length
  const fit = S.routines.filter(x => x.fit && x.ex.length)
  const info = [
    <div key="streak" className="cpin red" onClick={() => calendarSheet()}>
      <Icon name="flame" /><b>{streakWeeks(S)}</b><span>{t('week streak')}</span>
      <small>{wThis}{planned ? ' / ' + planned : ''} {t('this week')}</small>
    </div>,
    <div key="bw" className="cpin blush" onClick={() => bwSheet()}>
      <span className="cpin-k">{t('Body weight')}</span>
      <b>{bw ? fmtNum(bw.w) : '—'}<em> {S.unit}</em></b>
      {bwPts.length > 1 ? <div className="cpin-chart"><LineChart points={bwPts} h={56} axes={false} unit={S.unit} color="#c2185b" /></div> : null}
      <small>{t('Tap to log today')}</small>
    </div>,
    <div key="quote" className="cpin cream" dir="rtl">
      <span className="cpin-q">”</span>
      <p>الأداء الصحيح والمدى الحركي الكامل… ثم بعدها تأتي الأوزان</p>
      <small>— {t('your trainer')}</small>
    </div>,
    fit.length ? <div key="fit" className="cpin black" onClick={() => useUI.getState().openSheet(() => <FitnessCard />)}>
      <span className="cpin-k">{t('Fitness program')}</span>
      <b>{t('Week {0}', fitWeekOf(S))}<em> / 6</em></b>
      <small>{fit.map(x => x.name.split(' · ')[1]).join(' · ')}</small>
    </div> : null
  ].filter(Boolean)
  const feed = []
  feedEx.forEach((x, i) => {
    feed.push(<div key={'e' + i} className="pin" onClick={() => exerciseDetailSheet(x.ex)}>
      <div className="pin-img" style={{ aspectRatio: RATIOS[i % RATIOS.length] }}>
        {x.ex.img ? <img loading="lazy" src={imgSrc(x.ex)} alt="" /> : <Icon name="dumbbell" />}
        <span className="pin-badge">{exLine(x.e, S.unit)}</span>
      </div>
      <div className="pin-t capitalize">{x.ex.n}</div>
      <div className="pin-s">{t(x.ex.tg || x.ex.bp)}</div>
    </div>)
    if (i % 2 === 1 && info.length) feed.push(info.shift())
  })
  feed.push(...info)

  return <div className="narrow pinhome">
    <div className="pin-head">
      <div><h1>{t('Hi Safsf')}</h1><div className="sub">{day.label} · {active ? S.active.name : r ? r.name : t('Rest day')}</div></div>
      <button className="iconbtn" onClick={() => nav('/settings')} aria-label={t('Settings')}><Icon name="gear" /></button>
    </div>

    <div className="daychips">
      <button className="dchip arrow" onClick={() => setWk(w => w - 1)} aria-label={t('Previous week')}><Icon name="chevronLeft" /></button>
      {chips.map(c => <button key={c.iso} className={'dchip' + (c.iso === sel ? ' on' : '') + (c.iso === todayISO() ? ' today' : '')} onClick={() => setSel(c.iso)}>
        {c.iso === todayISO() ? t('Today') : t(DAYS[c.d.getDay()]) + ' ' + c.d.getDate()}{c.name ? <span> · {c.name}</span> : null}{c.done ? ' ✓' : ''}
      </button>)}
      <button className="dchip arrow" onClick={() => setWk(w => w + 1)} aria-label={t('Next week')}><Icon name="chevronRight" /></button>
    </div>

    {r || active ? <div className="hboard">
      <div className="hboard-c" onClick={() => pics[0] && exerciseDetailSheet(pics[0])}>
        <div className="h0">{pics[0] && <img src={gifSrc(pics[0])} alt="" />}</div>
        <div className="h1">{pics[1] && <img src={imgSrc(pics[1])} alt="" />}</div>
        <div className="h2">{pics[2] && <img src={imgSrc(pics[2])} alt="" />}{pics.length > 3 && <span className="more">+{pics.length - 3}</span>}</div>
        <span className="hboard-day">{day.label}</span>
      </div>
      <div className="hboard-t">{active ? S.active.name : r.name}</div>
      <div className="hboard-s">{t(exs.length === 1 ? '{0} exercise' : '{0} exercises', exs.length)}{r && r.note ? ' · ' + r.note : ''}{day.moved ? ' · ' + t('moved') : ''}</div>
      <div className="hboard-a">
        <button className="pbtn red" onClick={start}><Icon name="play" />{active ? t('Resume') : day.diff === 0 ? t('Start') : t('Do it now')}</button>
        <button className="pbtn" onClick={() => dayOverrideSheet(day.iso)}>{t('Change')}</button>
        {day.diff !== 0 && <button className="pbtn" onClick={() => { setSel(todayISO()); setWk(0) }}>{t('Today')}</button>}
      </div>
    </div> : <div className="hboard rest">
      <div className="rest-c"><b>{t('Rest day')}</b><span>{t('Let your muscles grow. A gentle stretch helps.')}</span></div>
      <div className="hboard-a">
        {stretch && <button className="pbtn red" onClick={() => startFlow(stretch.id)}><Icon name="play" />{t('Stretch now')}</button>}
        <button className="pbtn" onClick={() => dayOverrideSheet(day.iso)}>{t('Plan a workout')}</button>
        {day.diff !== 0 && <button className="pbtn" onClick={() => { setSel(todayISO()); setWk(0) }}>{t('Today')}</button>}
      </div>
    </div>}

    {day.done.map(w => <div key={w.id} className="pin-done" onClick={() => workoutDetailSheet(w)}><Icon name="checkCircle" />{t('Done: {0}', w.name)}<Icon name="chevronRight" /></div>)}

    <h4 className="sec">{exs.length ? t('In this workout') : t('Stretches for today')}</h4>
    <div className="pins">{feed}</div>
  </div>
}
