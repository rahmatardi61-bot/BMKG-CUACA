// Probe langsung endpoint API dengan variasi param -> baseline/api_probes/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'baseline', 'api_probes');
fs.mkdirSync(OUT, { recursive: true });

const CITIES = {
  Jakarta: { lat: -6.2, lon: 106.816666 },
  Denpasar: { lat: -8.65, lon: 115.216667 },
  Medan: { lat: 3.595196, lon: 98.672226 },
  Surabaya: { lat: -7.257472, lon: 112.752083 },
  Makassar: { lat: -5.147665, lon: 119.432731 },
  Jayapura: { lat: -2.591602, lon: 140.669389 },
};

const APIKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFjNWFkZWUxYzY5MzM0NjY2N2EzZWM0MWRlMjBmZWZhNDcxOTNjYzcyZDgwMGRiN2ZmZmFlMWVhYjcxZGYyYjQiLCJpYXQiOjE3MDE1ODMzNzl9.D1VNpMoTUVFOUuQW0y2vSjttZwj0sKBX33KyrkaRMcQ';
const H = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126',
  Accept: 'application/json',
  Referer: 'https://cuaca.bmkg.go.id/',
  Origin: 'https://cuaca.bmkg.go.id',
  'X-API-KEY': APIKEY,
};
const jobs = [];
for (const [city, c] of Object.entries(CITIES)) {
  jobs.push([`forecast_${city}.json`, `https://cuaca.bmkg.go.id/api/df/v1/forecast/coord?lat=${c.lat}&lon=${c.lon}`]);
  jobs.push([`adm_${city}.json`, `https://cuaca.bmkg.go.id/api/df/v1/adm/coord?lat=${c.lat}&lon=${c.lon}`]);
  jobs.push([`amandemen_${city}.json`, `https://cuaca.bmkg.go.id/api/df/v1/amandemen/coord?lat=${c.lat}&lon=${c.lon}`]);
  jobs.push([`presentwx_${city}.json`, `https://cuaca.bmkg.go.id/api/presentwx/coord?lat=${c.lat}&lon=${c.lon}`]);
  jobs.push([`warning_${city}.json`, `https://cuaca.bmkg.go.id/api/public/weather/warning?lat=${c.lat}&long=${c.lon}`]);
  jobs.push([`weekly-temp_${city}.json`, `https://cuaca.bmkg.go.id/api/public/weather/weekly-temperature?lat=${c.lat}&long=${c.lon}`]);
  jobs.push([`sunset_${city}.json`, `https://cuaca.bmkg.go.id/api/v1/sunset/json?lat=${c.lat}&lng=${c.lon}`]);
  jobs.push([`maritim-nearest_${city}.json`, `https://cuaca.bmkg.go.id/api/v1/public/maritim/nearest-location?lat=${c.lat}&long=${c.lon}`]);
}
jobs.push(['find-code_active.json', 'https://cuaca.bmkg.go.id/api/v1/setting/find-code?code=active']);
jobs.push(['find-code_inactive.json', 'https://cuaca.bmkg.go.id/api/v1/setting/find-code?code=inactive']);
jobs.push(['tcwc_cyclone_all.json', 'https://cuaca.bmkg.go.id/api/v1/tcwc/cyclone/all']);
jobs.push(['banners.json', 'https://cuaca.bmkg.go.id/api/public/banners']);
jobs.push(['video-latest.json', 'https://cuaca.bmkg.go.id/api/public/weather/video-latest?hashtag=infobmkgpws']);
jobs.push(['sus_modelrun.json', 'https://cuaca.bmkg.go.id/api/v1/sus/modelrun']);
jobs.push(['spartan_modelrun.json', 'https://spartan.bmkg.go.id/map/modelrun']);
jobs.push(['maps_general_tiles.json', 'https://cuaca.bmkg.go.id/api/v1/maps/general/metadata/tiles']);
jobs.push(['maps_warning_tiles.json', 'https://cuaca.bmkg.go.id/api/v1/maps/warning/metadata/tiles']);
jobs.push(['maps_aviation_tiles.json', 'https://cuaca.bmkg.go.id/api/v1/maps/aviation/metadata/tiles']);
jobs.push(['maps_maritim_tiles.json', 'https://cuaca.bmkg.go.id/api/v1/maps/maritim/metadata/tiles']);
jobs.push(['maps_tourism_tiles.json', 'https://cuaca.bmkg.go.id/api/v1/maps/tourism/metadata/tiles']);
jobs.push(['maritim_route.json', 'https://cuaca.bmkg.go.id/api/v1/maritim/route']);
jobs.push(['maritim_waterarea.json', 'https://cuaca.bmkg.go.id/api/v1/maritim/water-area/water_area_point.geojson']);
jobs.push(['suspoi.json', 'https://cuaca.bmkg.go.id/api/v1/sus/tiles/data/suspoi.json']);
jobs.push(['tourism.json', 'https://cuaca.bmkg.go.id/api/v1/tourism/tiles/data/tourism.json']);
jobs.push(['subscribe-type.json', 'https://cuaca.bmkg.go.id/api/v1/user/subscribe-type']);
jobs.push(['developer_token-mgmt.json', 'https://cuaca.bmkg.go.id/api/v1/developer/token-management']);
jobs.push(['developer_token-services.json', 'https://cuaca.bmkg.go.id/api/v1/developer/token-management/services']);
jobs.push(['impact_list_today.json', `https://cuaca.bmkg.go.id/api/v1/api/signature/impact/public/list/${new Date().toISOString().slice(0, 13)}:00:00Z`]);
jobs.push(['err_bad_coord.json', 'https://cuaca.bmkg.go.id/api/df/v1/forecast/coord?lat=999&lon=999']);
jobs.push(['err_no_param.json', 'https://cuaca.bmkg.go.id/api/df/v1/forecast/coord']);
jobs.push(['widis_cgms.json', 'https://widis.bmkg.go.id/ndf/cgms/weather/forward']);

const PUBTOK = process.env.PUBTOK;
const H2 = (url) => {
  const h = { ...H };
  if (PUBTOK) h['x-public-token'] = PUBTOK;
  return h;
};
for (const [name, url] of jobs) {
  try {
    const res = await fetch(url, { headers: H2(url), signal: AbortSignal.timeout(30000) });
    const body = await res.text();
    let out;
    try { out = JSON.stringify(JSON.parse(body), null, 1); } catch { out = body.slice(0, 5000); }
    fs.writeFileSync(path.join(OUT, name), `// ${res.status} ${url}\n` + out.slice(0, 300_000));
    console.log(`${res.status} ${name} (${out.length}b)`);
  } catch (e) { fs.writeFileSync(path.join(OUT, name), `// ERROR ${url}\n${e.message}`); console.log(`ERR ${name}: ${e.message}`); }
}
