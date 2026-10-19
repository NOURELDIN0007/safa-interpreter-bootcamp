// Safsf extras: fitness-week card, cloud settings + activity log, ❤️/comments on workouts,
// body measurements and private progress photos. Cloud parts go through window.SafsfCloud
// (../cloud.js); without it they explain what turning the cloud on gives you.
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { applyFitnessWeek, fitWeekOf } from '../lib/safsf-plan.js'
import { cloudOn } from '../lib/cloudsync.js'
import { fmtDate, fmtNum, todayISO } from '../lib/format.js'
import { t } from '../lib/i18n.js'
import { startFlow, confirmSheet } from '../sheets.jsx'
import { Section, Row, Segmented, Button } from './ui.jsx'
import LineChart from './LineChart.jsx'
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
  return <Section title={t('Cloud')} footer={t('Workouts, weights, measurements, photos and comments are saved online, in the same place as Safa’s Corner, so both phones always show the same thing.')}>
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

/* ------------------------------------------------------------ measurements -- */
const PARTS = [['waist', 'Waist'], ['hips', 'Hips'], ['chest', 'Chest'], ['arm', 'Arm'], ['thigh', 'Thigh']]
function MeasureForm({ close }) {
  const update = useStore(s => s.update)
  const last = (useStore(s => s.S).measures || []).slice(-1)[0] || {}
  const [v, setV] = useState({})
  const save = () => {
    const m = { d: todayISO() }
    PARTS.forEach(([k]) => { const n = parseFloat(String(v[k] || '').replace(',', '.')); if (n > 0) m[k] = Math.round(n * 10) / 10 })
    if (Object.keys(m).length < 2) { toast(t('Enter at least one measurement')); return }
    update(s => { s.measures = [...(s.measures || []).filter(x => x.d !== m.d), m] })
    close(); toast(t('Measurements saved'))
  }
  return <>
    <h3>{t('Log measurements')}</h3>
    <div className="muted small" style={{ marginBottom: 12 }}>{t('In cm, measured the same way each time — morning, before eating.')}</div>
    <div className="measure-grid">{PARTS.map(([k, label]) => <label key={k} className="measure-f"><span>{t(label)}</span>
      <input className="input" inputMode="decimal" placeholder={last[k] ? String(last[k]) : 'cm'} value={v[k] || ''} onChange={e => setV(x => ({ ...x, [k]: e.target.value }))} /></label>)}</div>
    <div style={{ height: 14 }} />
    <Button variant="primary" onClick={save}>{t('Save')}</Button>
  </>
}
export function MeasuresCard() {
  const M = useStore(s => s.S).measures || []
  const [part, setPart] = useState('waist')
  const pts = M.filter(m => m[part]).map(m => ({ t: new Date(m.d + 'T00:00:00').getTime(), y: m[part], d: m.d }))
  const first = M.find(m => m[part]), last = [...M].reverse().find(m => m[part])
  return <div className="card">
    <div className="row between" style={{ marginBottom: 8 }}>
      <h2 style={{ margin: 0 }}>{t('Measurements')}</h2>
      <Button size="sm" icon="plus" onClick={() => sheet(close => <MeasureForm close={close} />)}>{t('Log')}</Button>
    </div>
    {M.length ? <>
      <Segmented className="seg-range" value={part} onChange={setPart} options={PARTS.map(([k, l]) => ({ value: k, label: t(l) }))} />
      <div className="chart"><LineChart points={pts} h={140} unit="cm" /></div>
      {first && last && <div className="small muted" style={{ marginTop: 6 }}>{t('Now {0} cm', fmtNum(last[part]))}{first !== last ? ' · ' + (last[part] - first[part] > 0 ? '+' : '') + fmtNum(Math.round((last[part] - first[part]) * 10) / 10) + ' cm ' + t('since {0}', fmtDate(first.d)) : ''}</div>}
    </> : <div className="muted small">{t('Waist, hips, chest, arm and thigh — they show progress the scale can miss.')}</div>}
  </div>
}

/* ---------------------------------------------------------- progress photos -- */
async function shrink(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
    const max = 900, k = Math.min(1, max / Math.max(img.width, img.height))
    const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
    let q = 0.78, out = c.toDataURL('image/jpeg', q)
    while (out.length > 700000 && q > 0.4) { q -= 0.1; out = c.toDataURL('image/jpeg', q) }
    return out
  } finally { URL.revokeObjectURL(url) }
}
const imgCache = {}
function PhotoImg({ id, ...rest }) {
  const [src, setSrc] = useState(imgCache[id] || null)
  useEffect(() => {
    if (imgCache[id]) return
    let live = true
    C().get('photos_img/' + id).then(v => { if (typeof v === 'string') { imgCache[id] = v; live && setSrc(v) } })
    return () => { live = false }
  }, [id])
  return src ? <img src={src} alt="" {...rest} /> : <div className="ph-wait" {...rest} />
}
function PhotoView({ p, close }) {
  return <>
    <h3>{fmtDate(p.d, true)}</h3>
    <PhotoImg id={p.id} style={{ width: '100%', borderRadius: 16, display: 'block', minHeight: 200 }} />
    <div style={{ height: 12 }} />
    <Button variant="danger" onClick={() => confirmSheet({ title: t('Delete photo?'), confirmText: t('Delete'), danger: true, onConfirm: () => { C().remove('photos_idx/' + p.id); C().remove('photos_img/' + p.id); close() } })}>{t('Delete photo')}</Button>
  </>
}
export function PhotosCard() {
  const rows = useWatch('photos_idx', 200)
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const on = cloudOn()
  const pick = async e => {
    const f = e.target.files[0]; e.target.value = ''
    if (!f) return
    setBusy(true)
    try {
      const img = await shrink(f), id = C().newId()
      imgCache[id] = img
      await C().doc('photos_img/' + id).set(img)
      await C().add('photos_idx', { d: todayISO() }, id)
      C().log('gym', 'Added a progress photo'); toast(t('Photo saved'))
    }
    catch (err) { toast(t('Couldn’t save the photo')) }
    setBusy(false)
  }
  const list = rows || []
  const firstP = list[list.length - 1], lastP = list[0]
  return <div className="card">
    <div className="row between" style={{ marginBottom: 8 }}>
      <h2 style={{ margin: 0 }}>{t('Progress photos')}</h2>
      {on && <Button size="sm" icon="plus" disabled={busy} onClick={() => fileRef.current.click()}>{busy ? t('Saving…') : t('Add')}</Button>}
    </div>
    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pick} />
    {!on ? <div className="muted small">{t('Progress photos need the cloud connection.')}</div>
      : !list.length ? <div className="muted small">{t('Same spot, same light, every 2–4 weeks.')}</div>
        : <>
          {list.length > 1 && <div className="ph-compare">
            <figure><PhotoImg id={firstP.id} /><figcaption>{fmtDate(firstP.d)}</figcaption></figure>
            <figure><PhotoImg id={lastP.id} /><figcaption>{fmtDate(lastP.d)}</figcaption></figure>
          </div>}
          <div className="ph-grid">{list.map(p => <PhotoImg key={p.id} id={p.id} onClick={() => sheet(close => <PhotoView p={p} close={close} />)} />)}</div>
        </>}
  </div>
}
