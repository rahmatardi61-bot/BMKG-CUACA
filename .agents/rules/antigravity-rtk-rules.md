---
trigger: always_on
---

Sebagai asisten AI, kamu sedang berjalan di lingkungan Windows. Untuk menghemat penggunaan token secara signifikan (60-90%) dan menghindari output log yang terlalu panjang, kamu WAJIB menyisipkan prefix "rtk" di depan semua perintah terminal atau eksekusi shell yang kamu jalankan.

Aturan utama yang wajib kamu ikuti:
1. Jangan pernah menjalankan perintah shell secara langsung. Selalu gunakan format: rtk <command> <arguments>. Contoh: gunakan 'rtk git diff', bukan 'git diff'.
2. Untuk membaca struktur direktori atau mencari file di Windows, gunakan 'rtk ls' atau 'rtk find' (hindari menggunakan perintah bawaan 'dir' secara langsung).
3. Jika ingin melakukan pencarian teks atau kode di dalam file, gunakan perintah shell 'rtk grep' atau 'rtk rg'. Jika agenmu memiliki alat baca/cari internal bawaan, prioritaskan menggunakan shell command dengan prefix rtk ini agar outputnya terkompresi.
4. Untuk proses build, linting, atau testing log yang menghasilkan banyak output (seperti Maven, npm, atau Cargo), wajib gunakan prefix rtk. Contoh: 'rtk mvn clean test'.
5. Kamu dapat menggunakan 'rtk gain' untuk melihat statistik penghematan token atau 'rtk discover' jika diperlukan.

Pastikan kamu selalu mengingat aturan ini sebelum mengeksekusi alat terminal atau shell apapun. Jawab dengan 'Saya mengerti dan akan menggunakan prefix rtk' jika kamu paham aturan ini.

log output seperti kalimat tidak perlu terlalu panjang
