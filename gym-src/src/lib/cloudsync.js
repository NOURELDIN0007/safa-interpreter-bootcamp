// Cloud sync for the gym app, on top of window.SafsfCloud (../cloud.js, shared with the
// study site). The whole training state is one document (gym/state) holding the JSON — it
// stays far below Firestore's 1 MB limit for years of workouts, and a JSON string sidesteps
// Firestore's no-nested-arrays rule. Newest _ts wins. Photos and notes are separate
// collections so the state document stays small.
const C = () => window.SafsfCloud

let pushTm = null
let lastJson = ''
let getState = null
// Nothing is uploaded until the first cloud read has been handled: a phone that was just
// set up must take the saved data first, never overwrite it with its own empty plan.
let ready = false

export const cloudOn = () => !!(C() && C().key())

export function startCloud(getS, applyRemote) {
  getState = getS
  const go = () => {
    const c = C()
    if (!c || !c.key()) return
    c.start().then(ok => {
      if (!ok) return
      c.doc('gym/state').onSnapshot(snap => {
        if (!snap.exists) { ready = true; pushNow(getS()); return }   // first device: seed the cloud
        const d = snap.data() || {}
        const first = !ready
        ready = true
        if (!d.json || d.json === lastJson) return
        const local = getS()
        // A phone with nothing logged yet (just installed) always takes the cloud copy, even
        // though loading the plan made its own copy "newer".
        const fresh = !((local.workouts || []).length || (local.bodyweight || []).length || (local.measures || []).length)
        if ((first && fresh) || (d._ts || 0) > (local._ts || 0)) {
          clearTimeout(pushTm); pushTm = null
          try { lastJson = d.json; applyRemote(JSON.parse(d.json)) } catch (e) { /* bad doc */ }
        } else if ((local._ts || 0) > (d._ts || 0)) pushNow(local)
      }, () => {})
    })
  }
  if (window.SafsfCloud) go()
  else addEventListener('load', go)
}

function pushNow(S) {
  const c = C()
  if (!c || !c.key() || !S) return
  const json = JSON.stringify(S)
  if (json === lastJson) return
  lastJson = json
  c.start().then(ok => ok && c.doc('gym/state').set({ json, _ts: S._ts || Date.now(), by: c.who() })).catch(() => { lastJson = '' })
}

// Schedule an upload of the latest state (read when the timer fires, not when scheduled).
export function pushCloud() {
  if (!cloudOn() || !ready) return
  clearTimeout(pushTm)
  pushTm = setTimeout(() => { pushTm = null; pushNow(getState()) }, 1200)
}
export function flushCloud() { if (pushTm && ready) { clearTimeout(pushTm); pushTm = null; pushNow(getState()) } }

// Activity log: what changed between two states, in words.
export function logChanges(prev, next, exName) {
  if (!cloudOn() || !prev) return
  const log = t => C().log('gym', t)
  const newW = (next.workouts || []).filter(w => !(prev.workouts || []).some(p => p.id === w.id))
  newW.forEach(w => {
    const sets = (w.entries || []).reduce((n, e) => n + (e.sets || []).filter(s => s.done).length, 0)
    const mins = w.end && w.start != null ? Math.round((w.end - w.start) / 60000) : null
    log(`Finished ${w.name || 'a workout'} · ${(w.entries || []).length} exercises, ${sets} sets${mins ? ` · ${mins} min` : ''}`)
    ;(w.entries || []).forEach(e => {
      const done = (e.sets || []).filter(s => s.done)
      if (!done.length) return
      const best = done.reduce((a, s) => ((s.w || 0) > (a.w || 0) ? s : a), done[0])
      const fmt = s => s.min != null ? `${s.min} min @ ${s.speed} km/h` : s.sec != null ? `${s.sec}s${s.w ? ' +' + s.w + ' kg' : ''}` : `${s.w ? s.w + ' kg × ' : ''}${s.r}`
      log(`${exName(e.id)}: ${done.map(fmt).join(', ')}${best.w ? ` (top ${best.w} kg)` : ''}`)
    })
  })
  const bw = (next.bodyweight || []).length > (prev.bodyweight || []).length ? next.bodyweight[next.bodyweight.length - 1] : null
  if (bw) log(`Body weight: ${bw.w} kg`)
  const m = (next.measures || []).length > (prev.measures || []).length ? next.measures[next.measures.length - 1] : null
  if (m) log('Measurements: ' + Object.entries(m).filter(([k, v]) => k !== 'd' && v).map(([k, v]) => `${k} ${v} cm`).join(', '))
}
