# Auth client — cuplikan dari __NUXT_DATA__ & bundle

## Runtime config (`window.__NUXT__.config`, di HTML tiap render)

```js
{
  public: {
    baseURL: "https://cuaca.bmkg.go.id/api/v1/",
    publicBaseURL: "https://cuaca.bmkg.go.id/api/",
    dfBaseURL: "https://cuaca.bmkg.go.id/api/df",
    presentwxBaseURL: "https://cuaca.bmkg.go.id/api/presentwx",
    defaultURL: "https://weather.bmkg.go.id/api/",
    postBlog: "https://cuaca.bmkg.go.id/blog/wp-json/wp/v2/",
    defaultLang: "id",
  },
  app: { buildId: "d2971517-78e2-4b58-b44e-499af6df6213" },
}
```

## SSR state (`__NUXT_DATA__`)

- `$spublicToken` → `{token: "<JWT type=public_access>", expiresAt: <epoch ms>}` — JWT **short-lived ~30 menit** (`iat`→`exp` 1800s), di-issue server saat render. Dikirim sebagai header **`x-public-token`** untuk `/api/public/*`.
- `$sapiKey` → JWT statis (payload `{id: "1c5adee1...", iat: 1701583379}` = Des 2023). Dikirim sebagai header **`X-API-KEY`** untuk `/api/v1/*`.

## Interceptor (dari bundle `RhJE6rBC.js` / `CSY6jMQr.js`)

```js
// axios instance v1 (timeout 9e6 ms)
r.interceptors.request.use(e => { e.headers["X-API-KEY"] = useState("apiKey").value; ... });
// axios instance devtools (timeout 1e4 ms)
m.interceptors.request.use(o => {
  o.headers.Authorization = "Bearer " + publicToken.value;
  o.headers["X-API-KEY"] = apiKeyStore.value; ...
});
```

## Cara ambil publicToken fresh (untuk probe/diff)

```bash
curl -s -A "<UA browser lengkap>" https://cuaca.bmkg.go.id/ \
  | python3 -c "import sys,re; h=sys.stdin.read(); s=h[h.find('publicToken'):]; print(re.search(r'eyJ[\w-]+\.[\w-]+\.[\w-]+',s).group(0))"
```

## Matriks header per family

| URL family | Header wajib | Tanpa header → |
|---|---|---|
| `/api/v1/*` | `X-API-KEY` | 401 "API KEY not provided!!" |
| `/api/public/*`, `/api/v1/public/*` | `x-public-token` (fresh!) | 401 "Public access token not provided" |
| `/api/df/v1/*` | `Referer` + `Origin` situs | 403 Forbidden |
| `/api/presentwx/*` | — | terbuka |
| `/api/v1/setting/find-code`, `/api/public/banners`, `spartan.bmkg.go.id/map/modelrun`, `maps/{warning,maritim}/metadata/tiles` | — | terbuka |
| `/api/v1/developer/*` | login dev | 401 |
