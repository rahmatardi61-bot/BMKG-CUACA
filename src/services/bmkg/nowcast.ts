// Parser RSS Nowcast BMKG (peringatan dini cuaca resmi) → WarningAlert.
// Produk ini SELALU terisi (beda dari /api/public/weather/warning internal yang
// sering kosong) dan mencakup seluruh provinsi dalam satu feed.
//
// Murni fungsi parsing — TANPA akses `import.meta.env`/fetch, supaya bisa diuji
// langsung dengan Node (`node --experimental-strip-types src/services/bmkg/nowcast.check.ts`).
// ponytail: severity tidak ada di RSS (hanya di CAP XML per item) → dipetakan kasar
// dari judul. Upgrade: fetch CAP (`<link>`) kalau butuh severity/expires resmi.
import type { WarningAlert } from '../../types/weather';

const SEVERITY_KEYWORDS: Array<[RegExp, WarningAlert['severity']]> = [
  [/puting beliung|sangat lebat|badai|es\b/i, 'Awas'],
  [/petir|lebat|kencang|hujan es/i, 'Waspada'],
];

function decodeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

function tag(body: string, name: string): string {
  const m = body.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? decodeXml(m[1]) : '';
}

/** nama provinsi/wilayah → token pencocokan ('DKI Jakarta' → 'jakarta') */
function provinceKey(province: string | null | undefined): string {
  return (province || '').toLowerCase().replace(/^(dki|di|daerah istimewa)\s+/, '').trim();
}

/**
 * Parse feed RSS nowcast. `province` (opsional) memfilter item yang relevan —
 * feed bersifat nasional, jadi tanpa filter pengguna Jakarta bisa melihat
 * peringatan Jambi.
 */
export function parseNowcastRss(xml: string, province?: string | null): WarningAlert[] {
  const bodies = xml.split(/<item(?:\s[^>]*)?>/).slice(1).map(s => s.split('</item>')[0]);
  const alerts: WarningAlert[] = [];

  bodies.forEach((body, i) => {
    const title = tag(body, 'title');
    if (!title) return;
    const desc = tag(body, 'description').replace(/\s+/g, ' ');
    const pub = tag(body, 'pubDate');
    const guid = tag(body, 'guid') || String(i);
    // judul: "Hujan Lebat disertai Petir di Jambi" → region "Jambi"
    const region = title.match(/\bdi\s+(.+)$/)?.[1]?.trim() || '';
    alerts.push({
      id: `bmkg-nowcast-${guid}`,
      severity: SEVERITY_KEYWORDS.find(([re]) => re.test(title))?.[1] ?? 'Waspada',
      title,
      // buang daftar kecamatan (ratusan nama) — ambil kalimat sebelum "khususnya di"
      description: desc.split(/khususnya\s+di/i)[0].trim().slice(0, 400) || desc.slice(0, 400),
      region,
      date: pub && !Number.isNaN(Date.parse(pub))
        ? new Date(pub).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    });
  });

  const key = provinceKey(province);
  if (!key) return alerts;
  return alerts.filter(a => `${a.title} ${a.description} ${a.region}`.toLowerCase().includes(key));
}
