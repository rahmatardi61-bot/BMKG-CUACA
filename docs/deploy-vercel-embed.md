# Deploy widget embed ke Vercel — checklist

Ditulis karena percobaan pertama sering gagal di tempat yang sama. Jalankan berurutan.

## 1. Push branch

```bash
git push github feature/widget-embed     # atau branch apa pun yang di-deploy
```

## 2. Set 3 environment variables (WAJIB, sebelum build)

**Vercel → Project → Settings → Environment Variables** (Production + Preview):

| Nama | Nilai |
|---|---|
| `KEYCLOAK_REALM_URL` | `https://auth-dev-bmkg.vedata.online/realms/bmkg-partner` |
| `KEYCLOAK_CLIENT_ID` | `partner-widget-service` |
| `KEYCLOAK_CLIENT_SECRET` | *(nilai asli — JANGAN di repo)* |

Env dibaca **saat build**, jadi setelah menambahkannya **Redeploy**. Tanpa ini
`/api/embed-token` membalas `502 KEYCLOAK_CLIENT_SECRET belum di-set`, dan semua widget
menampilkan layar "Tidak diotorisasi".

## 3. Cek struktur yang dipakai Vercel

```
api/bmkg.ts          → /api/bmkg          (proxy data BMKG, wajib Bearer)
api/embed-token.ts   → /api/embed-token   (keran token, same-origin only)
api/embed-js.ts      → /api/embed-js      (script loader, wajib Bearer)
api/embed-verify.ts  → /api/embed-verify  (cek token)
api/_lib/jwt.ts           → dipakai bersama (DI LUAR api/, bukan function)
api/_lib/embedSource.ts   → isi script yang dikirim /api/embed-js
```

Penting: helper **tidak** ditaruh di `api/_lib/`. Vercel membuat satu function per file
di `api/`, jadi helper di dalamnya berisiko ikut di-deploy sebagai endpoint tanpa
`export default`. Sekarang di `lib/`.

## 4. Redeploy, lalu uji berurutan

Ganti `DOMAIN` dengan domain Vercel Anda:

```bash
# a. token hidup?
curl -s https://DOMAIN/api/embed-token | head -c 120

# b. gerbang menolak tanpa token  → harap 401
curl -s -o /dev/null -w '%{http_code}\n' https://DOMAIN/api/embed-js
curl -s -o /dev/null -w '%{http_code}\n' https://DOMAIN/api/bmkg?path=x

# c. keran token menolak origin lain → harap 403
curl -s -o /dev/null -w '%{http_code}\n' -H 'Origin: https://www.w3schools.com' https://DOMAIN/api/embed-token

# d. dengan token sah → harap 200
T=$(curl -s https://DOMAIN/api/embed-token | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $T" https://DOMAIN/api/embed-js
curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $T" "https://DOMAIN/api/bmkg?path=api%2Fdf%2Fv1%2Fweather%2Fnowcast"
```

Lalu di browser:

| Halaman | Harapan |
|---|---|
| `/widgets` | chip + tombol Generate; klik → JWT + badge VALID + 12 preview |
| `/embed.html?widget=current&city=Bandung` | layar **"Tidak diotorisasi"** (tanpa token) |
| `/` | minta login, setelah login badge `TOKEN OK <sisa>s` |

## 5. Kalau gagal

| Gejala | Sebab |
|---|---|
| `/api/*` balas HTML `index.html` | file di `api/` tidak terdeteksi sebagai function (cek nama/struktur), atau rewrite catch-all menangkapnya |
| `502 KEYCLOAK_CLIENT_SECRET belum di-set` | env belum diset, atau belum Redeploy setelah set |
| `/api/embed-token` 403 padahal dari browser sendiri | `x-forwarded-host`/`Origin` beda (domain alias vs domain utama) |
| Widget "Tidak diotorisasi" di domain sendiri | `embed-token` gagal → lihat Network tab |
| `Failed to fetch` | https memanggil http://localhost (dilarang Chrome). Di produksi https→https aman |

## 6. Hal yang belum ada di Vercel (dan memang belum perlu)

- Rate limit per partner — belum ada; masih satu `client_id` untuk semua
- Allowlist IP/domain partner — masih manual
- Monitoring kegagalan upstream — belum ada
- `/api/embed-token` sebaiknya **dihapus** saat produksi: token hanya dari backend partner
