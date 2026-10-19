/* SafsfCloud — shared cloud layer for Safa's Corner and Safsf Gym.
   Uses the same Firebase Realtime Database the study site already syncs to (safas-corner),
   over plain REST + live EventSource streams: no SDK, no login. Everything lives under /safa:
     /safa/progress      study-site ticks (written by the site's own sync, not by this file)
     /safa/gym/state     the gym app's whole training log, as JSON
     /safa/log/<id>      activity log of both apps (who, when, what)
     /safa/notes/<id>    ❤️ and comments on workouts
     /safa/photos_idx/<id> + /safa/photos_img/<id>   progress photos (list kept small)
   Writes that fail offline are kept in an outbox and sent when the phone is back online. */
(function () {
  var DB = 'https://safas-corner-default-rtdb.europe-west1.firebasedatabase.app'
  var BASE = DB + '/safa/'
  var WHO = 'safsf_who', OUT = 'safsf_outbox'
  var ls = {
    get: function (k) { try { return localStorage.getItem(k) } catch (e) { return null } },
    set: function (k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch (e) { } }
  }
  var status = 'connecting', subs = []
  function setStatus(s) { if (s === status) return; status = s; subs.forEach(function (f) { try { f(s) } catch (e) { } }) }
  var url = function (path, q) { return BASE + path + '.json' + (q ? '?' + q : '') }

  // ---- writes, with an offline outbox -------------------------------------------------
  function send(method, path, body) {
    return fetch(url(path), { method: method, headers: { 'Content-Type': 'application/json' }, body: body == null ? undefined : JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); setStatus('online'); return r.json() })
  }
  function outbox() { try { return JSON.parse(ls.get(OUT)) || [] } catch (e) { return [] } }
  function queue(op) { var o = outbox(); o.push(op); ls.set(OUT, JSON.stringify(o.slice(-300))) }
  function write(method, path, body) {
    return send(method, path, body).catch(function (e) {
      setStatus(navigator.onLine ? 'error' : 'offline')
      queue([method, path, body])
      return null
    })
  }
  var flushing = false
  function flushOutbox() {
    if (flushing) return
    var o = outbox(); if (!o.length) return
    flushing = true
    ;(function next() {
      var o2 = outbox(); if (!o2.length) { flushing = false; return }
      send(o2[0][0], o2[0][1], o2[0][2]).then(function () {
        var o3 = outbox(); o3.shift(); ls.set(OUT, JSON.stringify(o3)); next()
      }).catch(function () { flushing = false })
    })()
  }
  addEventListener('online', function () { setStatus('online'); flushOutbox() })
  addEventListener('offline', function () { setStatus('offline') })

  // Firebase-style push id: time-ordered, so ordering by key = ordering by time.
  var PUSH = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'
  function pushId() {
    var t = Date.now(), s = ''
    for (var i = 0; i < 8; i++) { s = PUSH.charAt(t % 64) + s; t = Math.floor(t / 64) }
    for (var j = 0; j < 12; j++) s += PUSH.charAt(Math.floor(Math.random() * 64))
    return s
  }

  // ---- live reads ---------------------------------------------------------------------
  // Keeps a local copy of `path` in step with the database and calls cb(copy) on change.
  function stream(path, q, cb) {
    var data = null, es = null, off = false, retry = null
    function setAt(p, v) {
      if (p === '/' || p === '') { data = v; return }
      var parts = p.replace(/^\//, '').split('/')
      if (data == null || typeof data !== 'object') data = {}
      var o = data
      for (var i = 0; i < parts.length - 1; i++) { if (o[parts[i]] == null || typeof o[parts[i]] !== 'object') o[parts[i]] = {}; o = o[parts[i]] }
      if (v == null) delete o[parts[parts.length - 1]]; else o[parts[parts.length - 1]] = v
    }
    function open() {
      if (off) return
      if (typeof EventSource === 'undefined') { setStatus('error'); return }
      es = new EventSource(url(path, q))
      es.addEventListener('put', function (e) { var m = JSON.parse(e.data); setAt(m.path, m.data); setStatus('online'); flushOutbox(); cb(data) })
      es.addEventListener('patch', function (e) { var m = JSON.parse(e.data); for (var k in m.data) setAt((m.path === '/' ? '' : m.path) + '/' + k, m.data[k]); cb(data) })
      es.onerror = function () {
        setStatus(navigator.onLine ? 'connecting' : 'offline')
        if (es && es.readyState === 2) { es.close(); clearTimeout(retry); retry = setTimeout(open, 5000) }
      }
    }
    open()
    return function () { off = true; clearTimeout(retry); if (es) es.close() }
  }

  var who = function () { return ls.get(WHO) || 'Safa' }
  var stamp = function (o) { var r = {}; for (var k in o) r[k] = o[k]; r.at = Date.now(); r.who = who(); return r }

  window.SafsfCloud = {
    start: function () { flushOutbox(); return Promise.resolve(true) },
    get status() { return status },
    onStatus: function (f) { subs.push(f); f(status); return function () { subs = subs.filter(function (x) { return x !== f }) } },
    // doc(path): onSnapshot(cb({exists, data()})) / set(obj) / update(obj)
    doc: function (path) {
      return {
        onSnapshot: function (cb) { return stream(path, '', function (d) { cb({ exists: d != null, data: function () { return d } }) }) },
        set: function (o) { return write('PUT', path, o) },
        update: function (o) { return write('PATCH', path, o) }
      }
    },
    get: function (path) { return fetch(url(path)).then(function (r) { return r.ok ? r.json() : null }).catch(function () { return null }) },
    add: function (coll, o, id) { id = id || pushId(); return write('PUT', coll + '/' + id, stamp(o)).then(function () { return id }) },
    put: function (path, o) { return write('PATCH', path, o) },
    remove: function (path) { return write('DELETE', path) },
    // Live list of a collection, newest first (push ids sort by time, so no index is needed).
    watch: function (coll, cb, opts) {
      var n = (opts && opts.n) || 100
      return stream(coll, 'orderBy=%22$key%22&limitToLast=' + n, function (d) {
        var rows = []
        for (var k in (d || {})) { var v = d[k]; if (v && typeof v === 'object') { v.id = k; rows.push(v) } }
        rows.sort(function (a, b) { return (b.at || 0) - (a.at || 0) })
        cb(rows)
      })
    },
    log: function (app, text, extra) {
      var o = { app: app, text: String(text).slice(0, 300) }
      for (var k in (extra || {})) o[k] = extra[k]
      return this.add('log', o)
    },
    newId: pushId,
    who: who,
    setWho: function (v) { ls.set(WHO, v) },
    key: function () { return 'safa' }       // always on: the database is shared by both apps
  }
})()
