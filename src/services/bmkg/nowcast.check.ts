// Self-check parser nowcast (tanpa framework): node --experimental-strip-types src/services/bmkg/nowcast.check.ts
import { parseNowcastRss } from './nowcast.ts';

const XML = `<?xml version="1.0"?><rss><channel>
<item>
  <title>Hujan Lebat disertai Petir di Jambi</title>
  <link>https://www.bmkg.go.id/alerts/nowcast/id/CJI2026_alert.xml</link>
  <description>Hujan lebat disertai petir akan terjadi pada 12 September 2026, 02:05 WIB di sebagian wilayah Jambi, khususnya di AIR HITAM, BANGKO, BATANG ASAM.
 Kondisi ini berpotensi menimbulkan dampak berupa jarak pandang berkurang.</description>
  <guid isPermaLink="false">2.49.0.1.360.0.2026.09.15.10.15.005</guid>
  <pubDate>Sat, 12 Sep 2026 01:55:00 +0700</pubDate>
</item>
<item>
  <title>Angin Puting Beliung di Kepulauan Riau</title>
  <description>Waspada angin puting beliung.</description>
  <guid isPermaLink="false">guid-2</guid>
</item>
</channel></rss>`;

const all = parseNowcastRss(XML);
console.assert(all.length === 2, `harus 2 item, dapat ${all.length}`);
console.assert(all[0].region === 'Jambi', `region harus "Jambi", dapat "${all[0].region}"`);
console.assert(all[0].severity === 'Waspada', `severity item-1 harus Waspada, dapat ${all[0].severity}`);
console.assert(all[1].severity === 'Awas', `severity item-2 harus Awas, dapat ${all[1].severity}`);
console.assert(all[0].date === '2026-09-11', `tanggal harus 2026-09-11, dapat ${all[0].date}`);
console.assert(!all[0].description.includes('BANGKO'), 'daftar kecamatan harus dipangkas');
console.assert(all[0].id.startsWith('bmkg-nowcast-'), 'id harus ber-prefix');
// filter provinsi: feed nasional → hanya item relevan
const jkt = parseNowcastRss(XML, 'DKI Jakarta');
console.assert(jkt.length === 0, `Jakarta tak relevan dgn feed contoh, dapat ${jkt.length}`);
const jb = parseNowcastRss(XML, 'Jambi');
console.assert(jb.length === 1 && jb[0].region === 'Jambi', 'filter Jambi harus 1 item');
// feed rusak/kosong tidak boleh melempar
console.assert(parseNowcastRss('<rss></rss>').length === 0, 'feed kosong → 0 item');

console.log('nowcast.check.ts OK —', all.length, 'item, filter provinsi bekerja');