# 🌿 AKSMA GREEN HUB
> **Portal Digital Kebersihan, Bank Sampah & Pengaduan Sarpras Terpadu**  
> *SMA IT Akmala Sabila — Kolaborasi Tim Sarpras & PLP MPI 2026*

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=flat-square&logo=github)](https://github.com/F4ntaB0y/aksmaGreen-hub)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![Security](https://img.shields.io/badge/Security-SHA--256_Encrypted-059669?style=flat-square&logo=shield)](https://github.com/F4ntaB0y/aksmaGreen-hub)

---

## 📑 Daftar Isi
1. [Tentang Sistem](#-tentang-sistem)
2. [Tiga Pilar Layanan Utama](#-tiga-pilar-layanan-utama)
3. [Buku Panduan Penggunaan Format PDF](#-buku-panduan-penggunaan-format-pdf)
4. [Arsitektur Keamanan Siber](#-arsitektur-keamanan-siber)
5. [Kredensial Akun Bawaan](#-kredensial-akun-bawaan)
6. [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
7. [Panduan Instalasi & Menjalankan Lokal](#-panduan-instalasi--menjalankan-lokal)
8. [Panduan Deployment ke Server & Hosting](#-panduan-deployment-ke-server--hosting)
9. [Hak Cipta & Lisensi](#-hak-cipta--lisensi)

---

## 📖 Tentang Sistem

**AKSMA GREEN HUB** adalah platform web modern sekolah yang memadukan budaya kebersihan lingkungan, ekosistem bank sampah daur ulang, serta tata kelola aduan sarana prasarana (sarpras) di **SMA IT Akmala Sabila**.

Sistem ini mentransformasi seluruh pencatatan konvensional berbasis kertas menjadi sistem digital terpusat yang transparan, akuntabel, dan aman dari kecurangan.

---

## 🏛️ Tiga Pilar Layanan Utama

### 1. 🧹 AKSMA Clean Check (Evaluasi Piket 5R)
- **Standar 5R**: Ringkas, Rapi, Resik, Rawat, dan Rajin.
- **Validasi Bukti Foto**: Setiap laporan piket wajib menyertakan foto fisik kelas terkini.
- **Verifikasi Bertingkat**: Skor kebersihan tidak langsung masuk ke nilai kelas sebelum disetujui (*verified*) oleh tim Administrator/Pembina.
- **Fitur Koreksi Nilai**: Administrator berhak mengoreksi skor jika data piket tidak sesuai fakta di lapangan.

### 2. ♻️ AKSMA Eco-Point (Bank Sampah Digital)
- **Klasifikasi Sampah**: Plastik PET, Kertas & Karton, Logam/Kaleng, Kaca, serta Minyak Jelantah.
- **Sistem Poin Prestasi**: Jumlah kilogram/satuan sampah dikonversikan menjadi Poin Hijau kelas setelah diverifikasi admin.
- **Papan Peringkat (Leaderboard)**: Membangun kompetisi sehat antarkelas untuk menciptakan lingkungan sekolah bebas sampah.

### 3. 🚨 AKSMA Green Report (Aduan Fasilitas & Lingkungan)
- **Pelaporan Cepat**: Santri dan guru dapat melaporkan kerusakan sarana prasarana sekolah secara real-time.
- **Dukungan GPS Ganda**: Deteksi koordinat otomatis dari perangkat (*Geolocation*) dan dukungan penyesuaian titik manual jika berada di dalam ruangan.
- **Hak Akses Proporsional**: Siswa dapat memantau denah kampus dan riwayat status penyelesaian aduan (*Baru -> Proses -> Selesai*). Sedangkan modul penugasan teknisi dan catatan penanganan dikontrol penuh oleh Admin.

---

## 📕 Buku Panduan Penggunaan Format PDF

Buku panduan operasional lengkap telah tersedia dalam format PDF siap cetak:

* **Nama File**: [`PANDUAN_PENGGUNAAN_AKSMA_GREEN_HUB.pdf`](./PANDUAN_PENGGUNAAN_AKSMA_GREEN_HUB.pdf)
* **Bab yang Dicakup**:
  - **BAB I**: Pendahuluan & Arsitektur Peran Pengguna (Admin vs Siswa)
  - **BAB II**: Panduan Masuk Akun & Keamanan (SHA-256 & Anti Brute-Force 60s)
  - **BAB III**: Panduan Siswa & Petugas Piket (Clean Check, Eco-Point, Green Report)
  - **BAB IV**: Panduan Administrator (Verifikasi Bukti Foto, Koreksi Poin, CRUD User/Kelas, Form 5R, Ganti Kredensial, Log Audit)
  - **BAB V**: Ekspor Spreadsheet Excel Komprehensif (.xlsx Multi-Sheet)
  - **BAB VI**: Troubleshooting & Solusi Kendala Teknis

---

## 🔐 Arsitektur Keamanan Siber

1. **Hashing Kriptografis SHA-256 + Unique Salt**: Password di-hash secara native menggunakan algoritma SHA-256 Web Crypto API yang diperkuat dengan salt terisolasi sistem. Password asli tidak disimpan dalam teks polos.
2. **Proteksi Anti Brute-Force**: Maksimal 5x kegagalan login berturut-turut akan memicu *lockout cooldown* selama **60 detik** dengan indikator hitung mundur live.
3. **Pemberantasan Total Celah Bypass**: Menghilangkan seluruh backdoor kata sandi bawaan lama.
4. **Sanitasi Input XSS & SQLi**: Input disaring dari karakter berbahaya (`<script>`, `--`, `' OR '1'='1`).
5. **Log Audit Keamanan Real-Time**: Setiap aktivitas login berhasil, percobaan gagal, penguncian akun, dan pembaruan kata sandi dicatat dalam tabel riwayat audit di panel Administrator.

---

## 🔑 Kredensial Akun Bawaan

| Peran (Role) | Username | Password Default | Akses Modul |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin_aksma` | `Akmala@2026!` | Kontrol penuh sistem, verifikasi poin, CRUD pengguna & kelas, peta GPS, form checklist, audit keamanan |
| **Siswa / User** | `user` | `user123` | Checklist piket kelas, setoran bank sampah, pemantauan denah GPS & riwayat aduan |

> 🔒 *Admin dapat mengubah username dan password kapan saja melalui tombol **Kredensial Admin** di Panel Administrator.*

---

## 💻 Teknologi yang Digunakan

- **Frontend Core**: React.js 19 + Vite 6
- **Styling**: Tailwind CSS (Custom HSL Palette & Dark Mode)
- **Visualisasi Grafik**: Chart.js + react-chartjs-2
- **Ikon**: Lucide React
- **Notifikasi**: SweetAlert2
- **Export Data**: XLSX (SheetJS)
- **Keamanan**: Native Web Crypto API (SHA-256)

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

```bash
# 1. Install dependensi
npm install

# 2. Jalankan server lokal development
npm run dev

# 3. Akses di browser
# Buka http://localhost:5173/

# 4. Kompilasi produksi (Build)
npm run build
```

---

## 🌐 Panduan Deployment ke Server & Hosting

- **Netlify (Rekomendasi)**: Repositori ini sudah dilengkapi konfigurasi `netlify.toml` dan `public/_redirects`. Sambungkan ke Netlify atau seret folder `dist/` ke [app.netlify.com/drop](https://app.netlify.com/drop).
- **cPanel / Web Hosting Sekolah**: Unggah seluruh isi folder `dist/` ke direktori `public_html`.
- **VPS Linux (Nginx / Apache)**: Arahkan `root` web server ke folder `dist` dan aktifkan `try_files $uri $uri/ /index.html;`.

---

## ⚖️ Hak Cipta & Lisensi

Hak Cipta © 2026 **SMA IT Akmala Sabila**. Seluruh Hak Cipta Dilindungi Undang-Undang.

Aplikasi ini dilisensikan dengan **Hak Pakai Terbatas (Proprietary / EULA)** untuk operasional internal institusi sekolah.
