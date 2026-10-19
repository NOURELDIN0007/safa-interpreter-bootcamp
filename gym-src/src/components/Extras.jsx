// Safsf extras: fitness-week card, cloud settings + activity log and ❤️/comments on workouts. Cloud parts go through window.SafsfCloud
// (../cloud.js); without it they explain what turning the cloud on gives you.
import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { applyFitnessWeek, fitWeekOf } from '../lib/safsf-plan.js'
import { cloudOn } from '../lib/cloudsync.js'
import { todayISO } from '../lib/format.js'
import { t } from '../lib/i18n.js'
import { startFlow } from '../sheets.jsx'
import { Section, Row, Segmented, Button } from './ui.jsx'
import Icon from './Icon.jsx'

const C = () => window.SafsfCloud
const sheet = fn => useUI.getState().openSheet(fn)
const toast = m => useUI.getState().toast(m)

function useCloudStatus() {
  const [st, setSt] = useState(C() ? C().status : 'off')
  useEffect(() => {
    let un = () => {}
    const hook = () => { if (C()) un = C().onStatus(setSt) }
    if (C()) hook(); else addEventListener('load', hook, { once: true })
    return () => un()
  }, [])
  return st
}
function useWatch(coll, n = 100) {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    if (!cloudOn()) { setRows([]); return }
    return C().watch(coll, setRows, { n })
  }, [coll, n])
  return rows
}

/* ------------------------------------------------------------- fitness week -- */
export function FitnessCard() {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const fit = S.routines.filter(r => r.fit && r.ex.length).sort((a, b) => a.fit - b.fit)
  if (!fit.length) return null
  const wk = fitWeekOf(S)
  const shift = d => update(s => {
    const base = new Date((s.fitStart || todayISO()) + 'T00:00:00'); base.setDate(base.getDate() - d * 7)
    s.fitStart = base.toISOString().slice(0, 10)
    applyFitnessWeek(s, true)
  })
  return <div className="card fitcard">
    <div className="row between" style={{ marginBottom: 6 }}>
      <h2 style={{ margin: 0 }}>{t('Fitness program')}</h2>
      <div className="row" style={{ gap: 4 }}>
        <button className="iconbtn" disabled={wk <= 1} onClick={() => shift(-1)} aria-label={t('Previous week')}><Icon name="chevronLeft" /></button>
        <b className="fit-wk">{t('Week {0} of 6', wk)}</b>
        <button className="iconbtn" disabled={wk >= 6} onClick={() => shift(1)} aria-label={t('Next week')}><Icon name="chevronRight" /></button>
      </div>
    </div>
    {fit.map(r => <div key={r.id} className="fit-day" onClick={() => startFlow(r.id)}>
      <span className="lrow-i"><Icon name={r.emoji} /></span>
      <div className="grow"><div className="tt">{r.name}</div><div className="ss">{r.note}</div></div>
      <Icon name="play" className="chev" />
    </div>)}
    <div className="small dim" style={{ marginTop: 8 }}>{t('Moves to the next week by itself. Missed one? Skip it, except the last session of the week.')}</div>
  </div>
}

/* ------------------------------------------------------------------- cloud -- */
const ST = {
  off: 'Not connected — data stays on this phone',
  connecting: 'Connecting…',
  online: 'On — saved for both of you',
  offline: 'Offline — saves when back online',
  error: 'Couldn’t connect — data is safe on this phone'
}
export function CloudSection() {
  const st = useCloudStatus()
  const [who, setWho] = useState(C() ? C().who() : 'Safa')
  return <Section title={t('Cloud')} footer={t('Workouts, weights and comments are saved online, in the same place as Safa’s Corner, so both phones always show the same thing.')}>
    <Row icon="globe" iconTint="var(--acc)" title={t('Sync')} subtitle={t(ST[st] || st)} />
    <Row icon="person" iconTint="var(--acc)" title={t('This phone is')}>
      <Segmented className="seg-inline" options={[{ value: 'Safa', label: 'Safa' }, { value: 'Nour', label: 'Nour' }]}
        value={who} onChange={v => { C() && C().setWho(v); setWho(v) }} />
    </Row>
    <Row icon="history" iconTint="var(--acc)" title={t('Activity log')} subtitle={t('Everything saved, with the time — gym and study')} accessory="chevron" onClick={activitySheet} />
  </Section>
}

function Activity() {
  const rows = useWatch('log', 200)
  const [f, setF] = useState('all')
  if (rows === null) return <div className="muted">{t('Loading…')}</div>
  const list = rows.filter(r => f === 'all' || r.app === f)
  const by = {}
  list.forEach(r => { const k = new Date(r.at).toDateString(); (by[k] = by[k] || []).push(r) })
  return <>
    <h3>{t('Activity log')}</h3>
    <Segmented value={f} onChange={setF} options={[{ value: 'all', label: t('All') }, { value: 'gym', label: t('Gym') }, { value: 'site', label: t('Study') }]} />
    <div style={{ height: 12 }} />
    {!list.length && <div className="muted">{t('Nothing saved yet.')}</div>}
    {Object.entries(by).map(([k, items]) => <div key={k} style={{ marginBottom: 16 }}>
      <h4 className="sec" style={{ marginTop: 0 }}>{new Date(k).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
      <div className="sect-b">{items.map(r => <div key={r.id} className="lrow">
        <div className="lrow-m"><div className="lrow-t" style={{ fontSize: 15 }}>{r.text}</div>
          <div className="lrow-s">{new Date(r.at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} · {r.app === 'gym' ? t('Gym') : (r.area || t('Study'))}{r.who && r.who !== 'Safa' ? ' · ' + r.who : ''}</div></div>
      </div>)}</div>
    </div>)}
  </>
}
export const activitySheet = () => sheet(() => <Activity />)

/* ---------------------------------------------------- ❤️ + comments on a workout -- */
export function WorkoutNotes({ w }) {
  const rows = useWatch('notes', 300)
  const [txt, setTxt] = useState('')
  if (!cloudOn()) return null
  const mine = (rows || []).filter(n => n.w === w.id).sort((a, b) => a.at - b.at)
  const hearts = mine.filter(n => n.heart)
  const me = C().who()
  const iHearted = hearts.find(n => n.who === me)
  const send = () => { const v = txt.trim(); if (!v) return; C().add('notes', { w: w.id, text: v.slice(0, 500) }); setTxt('') }
  return <div className="wnotes">
    <div className="row" style={{ gap: 10, marginBottom: 10 }}>
      <button className={'heart-btn' + (iHearted ? ' on' : '')} onClick={() => iHearted ? C().remove('notes/' + iHearted.id) : C().add('notes', { w: w.id, heart: true })}>
        <Icon name="heart" />{hearts.length ? hearts.length : ''}
      </button>
      <span className="small muted">{hearts.length ? t('Loved by {0}', [...new Set(hearts.map(h => h.who))].join(' & ')) : t('Send some love')}</span>
    </div>
    {mine.filter(n => n.text).map(n => <div key={n.id} className="wnote"><b>{n.who}</b> {n.text}
      <span className="dim small"> · {new Date(n.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span></div>)}
    <div className="row" style={{ gap: 8, marginTop: 8 }}>
      <input className="input grow" placeholder={t('Write a comment…')} value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
      <Button size="sm" variant="tinted" onClick={send}>{t('Send')}</Button>
    </div>
  </div>
}
