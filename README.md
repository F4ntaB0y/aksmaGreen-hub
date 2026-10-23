# 🌿 AKSMA GREEN HUB (v1.0.0)
> **Portal Digital Kebersihan, Bank Sampah & Pemantauan Fasilitas Kampus Terpadu**  
> *SMA IT Akmala Sabila — Tim Pengembang & PLP MPI 2026*

---

## 📋 Daftar Isi
1. [Tentang Sistem](#-tentang-sistem)
2. [Tiga Pilar Layanan Utama](#-tiga-pilar-layanan-utama)
3. [Fitur Unggulan & Keamanan](#-fitur-unggulan--keamanan)
4. [Kredensial Akun Bawaan](#-kredensial-akun-bawaan)
5. [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
6. [Struktur Direktori Proyek](#-struktur-direktori-proyek)
7. [Panduan Instalasi Lokal](#-panduan-instalasi-lokal)
8. [Panduan Deployment ke Server & Hosting](#-panduan-deployment-ke-server--hosting)
9. [Hak Cipta & Lisensi](#-hak-cipta--lisensi)

---

## 📖 Tentang Sistem

**AKSMA GREEN HUB** adalah platform web modern yang dirancang untuk mendukung budaya kepedulian lingkungan dan kebersihan sekolah di lingkungan SMA IT Akmala Sabila. Sistem ini menggantikan pencatatan manual dengan digitalisasi menyeluruh mulai dari evaluasi piket harian kelas, bank sampah daur ulang terkonversi poin, hingga pengaduan kerusakan sarana prasarana sekolah berbasis koordinat GPS.

---

## 🏆 Tiga Pilar Layanan Utama

### 1. 🧹 AKSMA Clean Check (Evaluasi Piket 5R)
- Penilaian standar **5R** *(Ringkas, Rapi, Resik, Rawat, Rajin)* per rombel/kelas.
- Wajib melampirkan **bukti foto fisik** hasil piket kelas.
- Sistem **Verifikasi & Validasi Admin**: Poin kebersihan hanya bertambah ke rekapitulasi kelas setelah diverifikasi oleh Administrator.
- Dilengkapi fitur koreksi nilai jika data piket direkayasa.

### 2. ♻️ AKSMA Eco-Point (Bank Sampah Daur Ulang)
- Pencatatan penyetoran sampah terpilah (Plastik PET, Kertas/Karton, Logam/Kaleng, Kaca, Minyak Jelantah).
- Dilengkapi upload bukti foto penimbangan/penyerahan sampah.
- Konversi otomatis unit sampah menjadi **Poin Hijau Kelas** setelah disetujui Admin.
- Peringkat kelas (*Leaderboard*) dan riwayat kontribusi santri.

### 3. 🚨 AKSMA Green Report (Aduan Kerusakan Sarpras & Kebersihan)
- Pelaporan masalah fasilitas rusak atau titik kotor di area kampus.
- **Dukungan GPS Ganda**: Deteksi koordinat otomatis (*Geolocation*) dan penyesuaian titik koordinat manual.
- **Tingkat Akses Berkeadilan**: Siswa hanya dapat melihat denah interaktif dan riwayat status aduan, sedangkan formulir tindak lanjut dan penugasan perbaikan dikontrol penuh oleh Administrator.

---

## 🛡️ Fitur Unggulan & Keamanan

- 🔐 **Keamanan Kriptografis SHA-256 + Unique Salt**: Password tidak pernah disimpan dalam teks polos (*plain text*), kebal terhadap serangan kebocoran data dan *Rainbow Table*.
- ⏱️ **Proteksi Anti Brute-Force**: Maksimal 5x kegagalan login berturut-turut akan memicu *lockout cooldown* selama 60 detik dengan hitung mundur live.
- 🚫 **Anti-Bypass & XSS Sanitization**: Seluruh jalan pintas/backdoor dihapus total, dilengkapi penyaringan input berbahaya.
- 📊 **Log Audit Keamanan Real-Time**: Pencatatan riwayat setiap event login berhasil, gagal, akun terkunci, dan penggantian password admin.
- 📈 **Grafik Interaktif Chart.js**: Visualisasi analitik performa piket kelas, komposisi jenis sampah daur ulang, dan rasio penyelesaian aduan sarpras.
- 📑 **Export Spreadsheet Komprehensif (.xlsx)**: Unduh seluruh data master (KPI, Pengguna, Kelas, Clean Check, Eco-Point, dan Green Report) dalam format multi-sheet Excel sekali klik.
- 🎨 **Desain Elegan & Responsif**: Palet warna *Obsidian-Emerald*, transisi halus, dukungan Dark/Light mode, dan notifikasi interaktif SweetAlert2 (tanpa icon emoji).

---

## 🔑 Kredensial Akun Bawaan

Sistem menggunakan formulir login tunggal yang otomatis mengarahkan pengguna sesuai hak aksesnya:

| Peran (Role) | Username | Password Bawaan | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin_aksma` | `Akmala@2026!` | Kontrol penuh sistem, verifikasi poin, manajemen user, kelola sarpras, audit keamanan |
| **Siswa / User** | `user` | `user123` | Input piket, setor sampah, lihat peta denah, pantau status aduan |

---

## 💻 Teknologi yang Digunakan

- **Frontend Core**: React.js + Vite
- **Styling**: Tailwind CSS
- **Visualisasi Grafik**: Chart.js + react-chartjs-2
- **Ikon**: Lucide React
- **Notifikasi**: SweetAlert2
- **Export Data**: XLSX (SheetJS)
- **Keamanan**: Native Web Crypto API (SHA-256 Subtitle Digest)

---

## 🚀 Panduan Instalasi Lokal

Pastikan komputer telah terinstal **Node.js** (versi 18.0 atau lebih tinggi).

1. **Install Dependensi**:
   ```bash
   npm install
   ```

2. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```
   Buka browser dan akses alamat: `http://localhost:5173/`

3. **Kompilasi Siap Produksi (Build)**:
   ```bash
   npm run build
   ```

---

## ⚖️ Hak Cipta & Lisensi

Hak Cipta © 2026 Seluruh Hak Cipta Dilindungi Undang-Undang.
