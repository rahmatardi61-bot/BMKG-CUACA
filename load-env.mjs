// Muat .env lokal SEBELUM modul lain dievaluasi (import di-hoist, jadi harus
// modul terpisah yang di-import paling awal). Di Vercel env sudah disuntikkan.
import { readFileSync } from 'node:fs'
try {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  /* .env tidak ada (deploy) — pakai env platform */
}
