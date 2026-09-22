#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════════════════════
# Build sheet "Audit Card + Screenshot" di docs/bmkg-api-mapping.xlsx
# ---------------------------------------------------------------------------
# Sumber data:
#   docs/screenshots/cards/*.png   — screenshot tiap component/card (Playwright)
#   docs/screenshots/cards/dump.json — hasil window.__apiBox (card→API, URL, sample)
#
# Regenerate:
#   1) npm run build && node server.mjs            (port 8080, data live)
#   2) node docs/scrapping_cuaca-bmkg-go-id/capture_card_screenshots.js
#   3) python3 docs/artifacts/scripts/build_card_audit_sheet.py
# ═══════════════════════════════════════════════════════════════════════════
import json
import os
from PIL import Image
import openpyxl
from openpyxl.drawing.image import Image as XLImage
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))  # repo root (docs/artifacts/scripts → root)
CARD_DIR = os.path.join(BASE, 'docs', 'screenshots', 'cards')
XLSX = os.path.join(BASE, 'docs', 'bmkg-api-mapping.xlsx')
SHEET = 'Audit Card + Screenshot'
SAMPLE_MAX = 1500  # batas aman sel Excel (32.767)

JUDUL = {
    'hero': 'Hero Weather Card — Cuaca Hari Ini',
    'current-weather': 'Kondisi Saat Ini (rincian)',
    'forecast-panel': 'Panel Prakiraan (Per Jam / Mingguan)',
    'alerts': 'Peringatan Dini (Alerts)',
    'news': 'Berita & Video (News Section)',
    'earthquake': 'Gempa Bumi (TEWS)',
    'satellite': 'Citra Satelit Himawari-9',
    'major-cities': 'Carousel Kota Besar (statis)',
    'transport': 'Transportasi (Jalan / Kereta / Maritim)',
    'weather-activity': 'Panduan Aktivitas & Analisis Cuaca',
    'marine-map': 'Peta Laut (Marine Map)',
    'port-tide': 'Pelabuhan & Pasut',
    'around-activity': 'Aktivitas Sekitar (POI)',
    'land-based': 'Aktivitas Darat (Drawer)',
    'maritime-advisor': 'Konsultasi Pelayaran (Drawer)',
    'aviation-advisor': 'Konsultasi Penerbangan (Drawer)',
    'location-search': 'Pencarian Lokasi',
}
STATUS = {
    'live': ('✅ LIVE', 'C6EFCE'),
    'mixed': ('⚠️ CAMPURAN', 'FFEB9C'),
    'mock': ('🔌 MOCK', 'E7E6E6'),
}

dump = json.load(open(os.path.join(CARD_DIR, 'dump.json'), encoding='utf-8'))
cards, defs, calls = dump['cards'], dump['defs'], dump['calls']

# ── siapkan JPEG ter-resize untuk embed (PNG 2x terlalu berat) ──────────────
tmp = os.path.join(CARD_DIR, '.sheet')
os.makedirs(tmp, exist_ok=True)
DISP_W = 460  # px tampilan (kecil, cukup untuk mengenali komponen)
for card_id in cards:
    src = os.path.join(CARD_DIR, f'{card_id}.png')
    if not os.path.exists(src):
        continue
    im = Image.open(src).convert('RGB')
    w, h = im.size
    nh = round(h * DISP_W / w)
    im.resize((DISP_W, nh), Image.LANCZOS).save(os.path.join(tmp, f'{card_id}.jpg'), quality=82)

# ── rakit sheet ──────────────────────────────────────────────────────────────
wb = openpyxl.load_workbook(XLSX)
if SHEET in wb.sheetnames:
    del wb[SHEET]
idx = wb.sheetnames.index('Audit Content Card') + 1
ws = wb.create_sheet(SHEET, index=idx)

thin = Border(*[Side(style='thin', color='D0D5DD')] * 4)
wrap = Alignment(wrap_text=True, vertical='top')
head_fill = PatternFill('solid', fgColor='1F3864')
head_font = Font(bold=True, color='FFFFFF', size=10)

ws.merge_cells('A1:H1')
ws['A1'] = 'AUDIT CONTENT CARD + SCREENSHOT — komponen, API yang dipakai, query, sample response'
ws['A1'].font = Font(bold=True, size=13)
ws.merge_cells('A2:H2')
ws['A2'] = ('Screenshot diambil dari deployment prod (server.mjs + dist, data live) dengan API BOX MARKER aktif '
            '— border merah = live, amber = campuran, abu = mock (lihat kolom Status). '
            'Sumber screenshot: docs/screenshots/cards/ · skrip: docs/scrapping_cuaca-bmkg-go-id/capture_card_screenshots.js')
ws['A2'].font = Font(size=9, italic=True, color='555555')
ws.merge_cells('A3:H3')
ws['A3'] = 'Status: ✅ LIVE = nilai kartu dari API live  |  ⚠️ CAMPURAN = sebagian live/sebagian mock  |  🔌 MOCK = statis/estimasi'
ws['A3'].font = Font(size=9, bold=True, color='555555')

headers = ['No', 'Komponen', 'Screenshot', 'Status', 'API dipakai', 'Query / URL terakhir', 'Sample Response (potongan)', 'Catatan']
for c, h in enumerate(headers, 1):
    cell = ws.cell(row=4, column=c, value=h)
    cell.fill, cell.font, cell.border = head_fill, head_font, thin
    cell.alignment = Alignment(horizontal='center', vertical='center')

row = 5
for no, (card_id, m) in enumerate(cards.items(), 1):
    label, fill = STATUS[m['kind']]
    judul = JUDUL.get(card_id, card_id)

    ws.cell(row=row, column=1, value=no)
    ws.cell(row=row, column=2, value=f'{judul}\n({card_id})')

    img_path = os.path.join(tmp, f'{card_id}.jpg')
    img_h = 0
    if os.path.exists(img_path):
        im = XLImage(img_path)
        img_h = im.height
        im.anchor = f'C{row}'
        ws.add_image(im)
    else:
        ws.cell(row=row, column=3, value='(screenshot tidak tersedia)')

    sc = ws.cell(row=row, column=4, value=label)
    sc.fill = PatternFill('solid', fgColor=fill)
    sc.alignment = Alignment(vertical='top')

    # E: API dipakai — F: query/url — G: sample
    e_lines, f_lines, sample = [], [], ''
    for api_id in m['apis']:
        name = defs.get(api_id, {}).get('name', api_id)
        e_lines.append(f'• {name}')
        call = (calls.get(api_id) or [{}])[-1]
        if call:
            f_lines.append(f'[{call.get("status", "?")}] {call.get("url", "?")}')
            sample = sample or call.get('sample', '')
        else:
            f_lines.append(f'(belum terekam saat capture) — {name}')
    ws.cell(row=row, column=5, value='\n'.join(e_lines) if e_lines else '— (tanpa API live)')
    ws.cell(row=row, column=6, value='\n'.join(f_lines) if f_lines else '—')
    if sample:
        pot = ' '.join(sample[:SAMPLE_MAX].split())  # rapikan: JSON pretty-print → 1 baris (seragam dgn row lain)
        ws.cell(row=row, column=7, value=pot + (' … (dipotong)' if len(sample) > SAMPLE_MAX else ''))
    else:
        ws.cell(row=row, column=7, value='— (tidak ada response live)')

    # estimasi tinggi teks kolom G (sample) — biar tinggi baris mengikuti konten terpanjang
    txt = ws.cell(row=row, column=7).value or ''
    est_lines = sum(max(1, -(-len(seg) // 112)) for seg in str(txt).split('\n'))
    est_h = est_lines * 10.5 + 6

    note = m.get('note', '')
    parts = m.get('parts') or []
    h_lines = [note] if note else []
    h_lines += [f"– {p['label']} ({'live' if p['type'] == 'live' else 'est' if p['type'] == 'est' else 'mock'})" for p in parts]
    ws.cell(row=row, column=8, value='\n'.join(h_lines) or '—')

    # format baris
    for c in range(1, 9):
        cell = ws.cell(row=row, column=c)
        cell.border = thin
        if c in (2, 5, 6, 7, 8):
            cell.alignment = wrap
        if c in (1, 2, 5):
            cell.font = Font(size=9)
        if c in (6, 7):
            cell.font = Font(size=8, name='Courier New')
    # batas tinggi baris Excel = 409,5 pt (teks lebih panjang tetap utuh di sel, tinggal di-klik)
    ws.row_dimensions[row].height = min(409, max(90, est_h, img_h * 0.75 + 8)) if img_h else min(409, max(90, est_h))
    row += 1

for col, w in {'A': 5, 'B': 30, 'C': 70, 'D': 14, 'E': 34, 'F': 52, 'G': 115, 'H': 44}.items():
    ws.column_dimensions[col].width = w
ws.freeze_panes = 'A5'

wb.save(XLSX)
print(f"OK — sheet '{SHEET}': {len(cards)} card, gambar {sum(1 for c in cards if os.path.exists(os.path.join(tmp, f'{c}.jpg')))}")
