import os
import docx

# artefak (docx) ada di parent dir
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DOCX_PATH = 'Proposal_Persetujuan_Redesign_BMKG_Cuaca.docx'

def sync_descriptions():
    doc = docx.Document(DOCX_PATH)
    
    # Check paragraphs and update
    updates = {
        10: "Selain mode dasar (Light/Dark/Auto), aplikasi ini mendeteksi kota yang sedang dipilih oleh pengguna dan mengubah skema warna kartu cuaca utama (*Hero Weather Card*) serta gambar siluet landmark kota secara dinamis menggunakan gradien modern:",
        
        14: "Berada di bagian paling atas aplikasi, modul ini mencakup bilah navigasi (Header), pemilih wilayah geografis interaktif lengkap dengan tombol GPS 'Lokasi Saya', serta kartu utama Hero Weather Card yang dipadukan secara berdampingan dengan kartu promosi aplikasi resmi Info BMKG Mobile. Hero Weather Card menyajikan nama kelurahan/kecamatan terpilih, latar belakang landmark visual kota, suhu aktual (°C), status cuaca dan 'Feels Like', ikon cuaca animasi responsif, serta deretan ringkasan prakiraan cuaca 7 hari ke depan.",
        
        19: "Sistem peringatan dini cuaca buruk dan bencana geofisika yang ditempatkan pada posisi teratas dashboard aplikasi untuk memprioritaskan keselamatan publik. Modul ini secara otomatis aktif memunculkan kartu berkode warna darurat (Waspada/Siaga/Awas) saat terdapat ancaman hidrometeorologi (seperti angin kencang, gelombang panas, hujan lebat, atau potensi banjir rob). Pada tampilan desktop tersaji dalam kartu memanjang, sedangkan pada layar ponsel dikompresi menjadi slider korsel horizontal yang hemat ruang dan ramah sentuhan.",
        
        24: "Modul komprehensif parameter atmosferik daerah terpilih yang tersusun atas 8 kartu metrik visual interaktif: Suhu Udara terkini, Kecepatan & Hembusan Angin, Arah Tiupan Angin dengan visual kompas dinamis, Tingkat Kelembapan udara, Indeks Radiasi Sinar UV, Jarak Pandang (Visibilitas udara bersih), Siklus & Fase Bulan (disertai persentase iluminasi serta waktu terbit/terbenam), serta visual kurva waktu Terbit dan Terbenam Matahari.",
        
        39: "Modul analisis sektoral harian yang terletak pada bilah sisi (sidebar) aplikasi. Modul ini dilengkapi widget ringkasan Indeks Kenyamanan (Heat Index / Paparan Panas) dan Kualitas Udara (Indeks Standar Pencemar Udara - ISPU / PM2.5), diikuti oleh kartu aktivitas sektoral: Aktivitas Darat, Aktivitas Pesisir & Laut, serta Penerbangan. Setiap kartu didukung ilustrasi SVG tematik, parameter cuaca kunci, rekomendasi kelayakan aktivitas, serta tombol 'Selengkapnya' untuk membuka drawer panduan interaktif.",
        
        59: "Korsel interaktif 10 kota besar di Indonesia yang dilengkapi fitur auto-slide cerdas dan penanda landmark khas daerah. Menampilkan kartu rekomendasi tingkat kenyamanan cuaca pada landmark wisata populer (taman kota, lapangan olahraga/golf, kawasan pesisir, dan cagar budaya) dengan estimasi jarak radius dari posisi pengguna. Membantu masyarakat dan wisatawan merencanakan waktu kunjungan terbaik sesuai kondisi cuaca aktual kota tujuan."
    }
    
    for idx, text in updates.items():
        if idx < len(doc.paragraphs):
            print(f'Updating P[{idx}]:')
            print('  OLD:', doc.paragraphs[idx].text[:60], '...')
            # Preserve formatting by setting text on first run or paragraph
            p = doc.paragraphs[idx]
            p.text = text
            print('  NEW:', doc.paragraphs[idx].text[:60], '...')
            
    doc.save(DOCX_PATH)
    print(f'Successfully updated descriptions in {DOCX_PATH}!')

if __name__ == '__main__':
    sync_descriptions()
