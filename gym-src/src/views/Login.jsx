import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { webauthnOK, passkeyLogin, passkeyRegister, api, BIO } from '../lib/api.js'
import { hasData } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import { DEMO, REPO } from '../lib/demo.js'
import { useState, useRef, useEffect } from 'react'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'

function RegisterSheet({ close }) {
  const { setUser, pushState, pullState } = useStore()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [inviteOnly, setInviteOnly] = useState(false)
  const ref = useRef(null)
  useEffect(() => { setTimeout(() => ref.current?.focus(), 250) }, [])
  useEffect(() => { api('/api/config').then(c => setInviteOnly(!!c.invite_only)).catch(() => {}) }, [])
  const go = async () => {
    const n = name.trim()
    if (!n) { useUI.getState().toast(t('Enter a name')); return }
    if (inviteOnly && !code.trim()) { useUI.getState().toast(t('An invite code is required')); return }
    try {
      const u = await passkeyRegister(n, code.trim())
      setUser(u); close()
      if (hasData(useStore.getState().S)) { await pushState(); useUI.getState().toast(t('Profile created — data from this device moved into it')) }
      else { await pullState(); useUI.getState().toast(t('Welcome, {0}', u.name)) }
    } catch (e) { if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') useUI.getState().toast(e.message || t('Registration failed')) }
  }
  return <>
    <h3>{t('Create your profile')}</h3>
    <div className="muted small" style={{ marginBottom: 14 }}>{t('Pick a name, then confirm with {0}. The passkey is saved in your device — no password needed.', BIO)}</div>
    <input ref={ref} className="input" placeholder={t('Your name')} maxLength={40} value={name} onChange={e => setName(e.target.value)} />
    {inviteOnly && <>
      <div style={{ height: 10 }} />
      <input className="input" placeholder={t('Invite code')} maxLength={40} value={code}
        onChange={e => setCode(e.target.value.toUpperCase())} style={{ letterSpacing: '.14em', fontWeight: 600, textAlign: 'center' }} />
      <div className="dim small" style={{ marginTop: 6 }}>{t('This app is invite-only — enter the code you were given.')}</div>
    </>}
    <div style={{ height: 12 }} />
    <Button variant="primary" onClick={go}>{t('Create passkey')}</Button>
  </>
}

export default function Login() {
  const { setUser, pullState, setGuest } = useStore()
  const signIn = async () => {
    try { const u = await passkeyLogin(); setUser(u); await pullState(); useUI.getState().toast(t('Welcome back, {0}', u.name)) }
    catch (e) { if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') useUI.getState().toast(e.message || t('Sign-in failed')) }
  }
  const head = <>
    <img src="icon-512.png" alt="" className="welcome-logo" />
    <h1 className="brand" style={{ fontSize: 34, margin: '14px 0 4px' }}>Safsf Gym Plan <span className="brand-heart">❤️</span></h1>
  </>
  const wrap = { display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '78vh', textAlign: 'center' }

  // Demo build: no backend to sign in against — the only way in is the local guest profile.
  if (DEMO) return <Welcome onStart={() => setGuest(true)} />

  return (
    <div className="narrow" style={wrap}>
      {head}
      <div className="muted" style={{ marginBottom: 34 }}>{t('Your workouts. Your weights. Your profile.')}</div>
      {webauthnOK() ? <>
        <Button variant="primary" icon="person" onClick={signIn}>{t('Sign in with passkey')}</Button>
        <div style={{ height: 10 }} />
        <Button icon="sparkles" onClick={() => useUI.getState().openSheet(close => <RegisterSheet close={close} />)}>{t('Create new profile')}</Button>
        <div style={{ height: 10 }} />
      </> : <div className="card small muted" style={{ textAlign: 'left' }}>{t("This browser doesn't support passkeys — you can still use openGym locally on this device.")}</div>}
      <Button variant="ghost" className="dim" onClick={() => setGuest(true)}>{t('Continue without account')}</Button>
      <div className="dim small" style={{ marginTop: 26, lineHeight: 1.5 }}>{t('Passkeys use {0} — no passwords.', BIO)}<br />{t('Each profile keeps its own plan, workouts & body weight.')}</div>
    </div>
  )
}

// First launch. Instead of a slogan, it shows the thing she came for: her week from the trainer.
const ORDER = [1, 2, 3, 4, 5, 6, 0]
const DSHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
function Welcome({ onStart }) {
  const S = useStore(s => s.S)
  const pin = S.style === 'pin'
  const days = ORDER.map(d => {
    const r = S.routines.find(x => x.id === S.week[d])
    return { d, name: r ? r.name.split(' · ')[0] : '', sub: r && r.name.includes(' · ') ? r.name.split(' · ')[1] : '' }
  })
  const n = days.filter(x => x.name).length
  const week = <div className="w-week">{days.map(x => <div key={x.d} className={'w-day' + (x.name ? ' on' : '')}>
    <span className="w-dn">{t(DSHORT[x.d])}</span>
    {x.name ? <><b>{t(x.name)}</b><small>{x.sub}</small></> : <i>{t('rest')}</i>}
  </div>)}</div>
  if (pin) return <div className="welcome-pin">
    <div className="wp-collage" aria-hidden="true">
      {['deco/peony.jpg', 'deco/vase.jpg', 'deco/hydrangea.jpg', 'deco/petals.jpg', 'icon-512.png', 'deco/peony.jpg'].map((src, i) => <img key={i} src={src} alt="" className={'wp' + i} />)}
    </div>
    <div className="wp-card">
      <div className="wp-mark">Safsf’s Gym</div>
      <h1>{t('Your plan, pinned.')}</h1>
      <p>{t('{0} training days a week from your trainer — every set and weight saved.', n)}</p>
      {week}
      <button className="wp-btn" onClick={onStart}>{t('Start my plan')}</button>
    </div>
  </div>
  return <div className="narrow welcome2">
    <div className="w-trip" aria-hidden="true">
      <div className="arch a1"><img src="deco/hydrangea.jpg" alt="" /></div>
      <div className="arch a2"><img src="deco/peony.jpg" alt="" /></div>
      <div className="arch a3"><img src="deco/vase.jpg" alt="" /></div>
    </div>
    <div className="brandmark rise">Safsf’s Gym</div>
    <h1 className="rise d1">{t('Your plan is')}<span className="script">{t('ready, Safsf')}</span></h1>
    <p className="rise d2">{t('{0} training days a week from your trainer. Every set and weight you lift is saved, so you can see yourself getting stronger.', n)}</p>
    <div className="rise d3">{week}</div>
    <button className="pill rise d4" onClick={onStart}>{t('Open my plan')}<span className="arr"><Icon name="chevronRight" /></span></button>
    <div className="privacy rise d4"><Icon name="heart" />{t('Made with love, just for you')}</div>
  </div>
}
