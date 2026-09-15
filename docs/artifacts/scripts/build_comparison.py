import os

# artefak (comparison.html, output_screenshots/, orig_bak_images/) ada di parent dir
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

html = '''<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Compare Original vs New</title>
<style>
body { font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; }
.section { border: 1px solid #334155; background: #1e293b; margin-bottom: 30px; padding: 15px; border-radius: 8px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px; }
.col { background: #0b0f19; padding: 10px; border-radius: 6px; border: 1px solid #475569; }
img { max-width: 100%; height: auto; display: block; border-radius: 4px; border: 1px solid #64748b; }
h2 { color: #38bdf8; border-bottom: 2px solid #38bdf8; padding-bottom: 5px; }
h3 { margin: 5px 0 10px 0; font-size: 14px; }
.orig-title { color: #f59e0b; }
.new-title { color: #10b981; }
</style></head><body>
<h1>Perbandingan Screenshot Asli vs Screenshot Baru</h1>
'''

sections = [
    '2.1 Dashboard Utama & Wilayah Aktif',
    '2.2 Panel Peringatan Dini (Alerts Panel)',
    '2.3 Kartu Kondisi Cuaca Terkini (Current Weather)',
    '2.4 Grafik Prakiraan Cuaca Per Jam (Forecast Panel)',
    '2.5 Pemantau Gempa Terdekat (Seismic Monitor)',
    '2.6 Modul Aktivitas & Analisis Cuaca Sektoral',
    '2.7 Rute Cuaca Transportasi Darat (Land Advisor)',
    '2.8 Layanan Panduan Kemaritiman (Maritime Advisor)',
    '2.9 Prakiraan Cuaca Penerbangan (Aviation Advisor)',
    '2.10 Cities Carousel & App Download CTA'
]

modes = [
    ('Desktop Light', 1),
    ('Mobile Light', 2),
    ('Desktop Dark', 3),
    ('Mobile Dark', 4)
]

for sec_idx, sec_name in enumerate(sections):
    html += f'<div class="section"><h2>{sec_name}</h2>'
    for mode_name, offset in modes:
        img_num = sec_idx * 4 + offset
        orig_img = f'orig_bak_images/word/media/image{img_num}.png'
        new_img = f'output_screenshots/image{img_num}.png'
        html += f'<h3>Mode: {mode_name} (image{img_num}.png)</h3>'
        html += '<div class="grid">'
        html += f'<div class="col"><div class="orig-title"><b>ORIGINAL (DOCX ASLI)</b></div><img src="{orig_img}"></div>'
        html += f'<div class="col"><div class="new-title"><b>BARU (HASIL CAPTURE)</b></div><img src="{new_img}"></div>'
        html += '</div>'
    html += '</div>'

html += '</body></html>'

with open('comparison.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Wrote comparison.html')
