// Serve hasil `vite build` + proxy /api/bmkg/* ke handler yang sama dengan Vercel.
// ponytail: satu proses Node (bukan nginx) karena proxy butuh header dinamis
// (x-public-token segar) — lihat api/bmkg.ts.
import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import { createGzip, constants as zlibConstants } from 'node:zlib'
import { extname, join, normalize, resolve } from 'node:path'
import handler from './api/bmkg.ts'

const DIST = resolve('dist')
const PORT = Number(process.env.PORT) || 8080

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.map', '.svg', '.txt', '.webmanifest'])

async function serveFile(req, res, pathname) {
  // normalize() + join() mencegah path traversal (../ tidak bisa keluar DIST)
  const file = resolve(join(DIST, normalize(decodeURIComponent(pathname))))
  if (!file.startsWith(DIST)) return false

  let isDirectory = false
  try {
    isDirectory = (await stat(file)).isDirectory()
  } catch {
    return false
  }

  const target = isDirectory ? join(file, 'index.html') : file
  if (isDirectory) {
    try {
      await stat(target)
    } catch {
      return false
    }
  }

  const ext = extname(target).toLowerCase()
  const hashed = /-[a-zA-Z0-9_-]{8,}\./.test(target) || target.includes(`${join(DIST, 'assets')}`)
  const gzip = COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')

  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' || !hashed ? 'public, max-age=3600' : 'public, max-age=31536000, immutable',
    ...(gzip ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : {}),
  })
  if (req.method === 'HEAD') {
    res.end()
    return true
  }

  try {
    await pipeline(createReadStream(target), ...(gzip ? [createGzip({ level: zlibConstants.Z_DEFAULT_COMPRESSION })] : []), res)
  } catch {
    /* client putus koneksi — abaikan */
  }
  return true
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')

  if (url.pathname === '/api-bmkg') {
    // handler membaca path upstream dari ?path= (lihat api/bmkg.ts)
    try {
      const out = await handler(new Request(url, { method: req.method, headers: req.headers }))
      const body = Buffer.from(await out.arrayBuffer())
      res.writeHead(out.status, { ...Object.fromEntries(out.headers), 'Content-Length': String(body.length) })
      res.end(req.method === 'HEAD' ? undefined : body)
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: String(e) }))
    }
    return
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end()
    return
  }

  // SPA fallback (vue-router / deep link)
  if (await serveFile(req, res, url.pathname)) return
  if (await serveFile(req, res, '/index.html')) return
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found')
}).listen(PORT, () => console.log(`bmkg-public listening on :${PORT}`))