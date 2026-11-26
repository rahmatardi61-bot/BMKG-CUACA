// Observability minimal tanpa dependensi: span Zipkin + log JSON (+ opsional Loki).
//
// Kenapa tidak pakai OpenTelemetry SDK: kebutuhan kita cuma "request ini habis
// waktu di mana", dan satu file ~100 baris sudah menjawab itu. Kalau nanti butuh
// instrumentasi otomatis (DB, queue, dst), baru ganti ke OTel SDK.
//
// Env:
//   ZIPKIN_URL    http://host:9411   (kosong = tracing mati)
//   ZIPKIN_USER / ZIPKIN_PASS        (opsional; ingest Zipkin default terbuka)
//   LOKI_URL      http://host:3100   (kosong = log hanya ke stdout)
//   LOKI_USER / LOKI_PASS
//   OBS_SERVICE   nama service di Zipkin/Loki (default: service-isdp)
import { AsyncLocalStorage } from 'node:async_hooks'
import { randomBytes } from 'node:crypto'

const ZIPKIN = (process.env.ZIPKIN_URL || '').replace(/\/+$/, '')
const LOKI = (process.env.LOKI_URL || '').replace(/\/+$/, '')
const SERVICE = process.env.OBS_SERVICE || 'service-isdp'
const ENV = process.env.OBS_ENV || process.env.NODE_ENV || 'dev'
const auth = (u, p) => (u ? { Authorization: 'Basic ' + Buffer.from(`${u}:${p ?? ''}`).toString('base64') } : {})

export const traceEnabled = Boolean(ZIPKIN)
const als = new AsyncLocalStorage()
const micros = () => Date.now() * 1000
const hex16 = () => randomBytes(8).toString('hex')

// ── span ───────────────────────────────────────────────────────────────────
let queue = []
let timer = null

function record(span) {
  if (!traceEnabled) return
  queue.push(span)
  if (!timer) timer = setTimeout(flush, 1000)
}

function flush() {
  timer = null
  if (!queue.length) return
  const body = JSON.stringify(queue)
  queue = []
  fetch(`${ZIPKIN}/api/v2/spans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(process.env.ZIPKIN_USER, process.env.ZIPKIN_PASS) },
    body,
  }).catch(() => {
    /* tracing tidak boleh menjatuhkan request user */
  })
}

/** Span anak. aman dipanggil walau tracing mati (hanya meneruskan fungsi). */
export function span(name, tags, fn) {
  const parent = als.getStore()
  if (!parent || !traceEnabled) return fn()
  const id = hex16()
  const t0 = micros()
  const done = (extra = {}, err) => {
    const t1 = micros()
    record({
      traceId: parent.traceId,
      id,
      parentId: parent.id,
      name,
      kind: 'CLIENT',
      timestamp: t0,
      duration: Math.max(1, t1 - t0),
      localEndpoint: { serviceName: SERVICE },
      tags: { ...tags, ...extra, ...(err ? { error: String(err).slice(0, 200) } : {}) },
    })
    if (err) throw err
  }
  return Promise.resolve(fn()).then(
    (r) => (done(), r),
    (e) => done({}, e),
  )
}

/** Span induk per request HTTP. Mengembalikan { result, traceId }. */
export async function withRequest(req, fn) {
  if (!traceEnabled) return { result: await fn(), traceId: null }
  const traceId = hex16()
  const ctx = { traceId, id: hex16() }
  const t0 = micros()
  const url = new URL(req.url, 'http://x')
  const tags = { 'http.method': req.method, 'http.path': url.pathname }
  let err = null
  let result
  await als.run(ctx, async () => {
    try {
      result = await fn()
      tags['http.status'] = result?.status ?? 0
    } catch (e) {
      err = e
      tags['http.status'] = 502
      tags.error = String(e).slice(0, 200)
    }
  })
  record({
    traceId,
    id: ctx.id,
    name: `${req.method} ${url.pathname}`,
    kind: 'SERVER',
    timestamp: t0,
    duration: Math.max(1, micros() - t0),
    localEndpoint: { serviceName: SERVICE },
    tags,
  })
  if (err) throw err
  return { result, traceId }
}

export const traceId = () => als.getStore()?.traceId ?? null

// ── log ────────────────────────────────────────────────────────────────────
let lines = []
let pushWarned = false
const LOKI_URL_SHOWN = LOKI
let ltimer = null

/** Log terstruktur: JSON ke stdout (untuk docker/promtail) + opsional push Loki. */
export function log(level, msg, extra = {}) {
  const rec = { ts: new Date().toISOString(), level, msg, app: SERVICE, env: ENV, traceId: traceId(), ...extra }
  const line = JSON.stringify(rec)
  process.stdout.write(line + '\n')
  if (!LOKI) return
  lines.push([String(Date.now() * 1e6), line])
  if (!ltimer) ltimer = setTimeout(pushLogs, 2000)
}

function pushLogs() {
  ltimer = null
  if (!lines.length) return
  const streams = [{ stream: { app: SERVICE, env: ENV }, values: lines }]
  lines = []
  fetch(`${LOKI}/loki/api/v1/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(process.env.LOKI_USER, process.env.LOKI_PASS) },
    body: JSON.stringify({ streams }),
  }).catch((e) => {
    // diam-diam gagal = log hilang tanpa jejak; beri tahu sekali saja
    if (!pushWarned) {
      pushWarned = true
      process.stderr.write(`[observability] push Loki gagal (${LOKI_URL_SHOWN}): ${e}\n`)
    }
  })
}
