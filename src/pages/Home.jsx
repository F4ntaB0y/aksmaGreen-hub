import React from 'react';
import { 
  ClipboardCheck, Recycle, AlertTriangle, ArrowRight, Sparkles, 
  CheckCircle2, TrendingUp, Users, Leaf, Shield, Award 
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function Home({ setActivePage }) {
  const { cleanChecks, ecoPoints, greenReports } = useData();
  const { isLoggedIn, isAdmin, user } = useAuth();

  // Metrics
  const totalPiket = cleanChecks.length;
  const avgScore = totalPiket > 0 
    ? Math.round(cleanChecks.reduce((acc, c) => acc + (c.score || 0), 0) / totalPiket) 
    : 0;

  const totalWastePcs = ecoPoints
    .filter(e => e.status === 'verified')
    .reduce((acc, e) => acc + Number(e.quantity || 0), 0);

  const totalSolvedReports = greenReports.filter(r => r.status === 'selesai').length;

  return (
    <div className="space-y-12 py-6">
      
      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden rounded-3xl glass-card border border-emerald-500/25 p-8 sm:p-12 shadow-glow">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Program PLP Mahasiswa MPI 2026 • Sistem 3 Berkelanjutan</span>
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-5xl text-slate-900 dark:text-white leading-tight tracking-tight">
            Wujudkan Kampus Hijau & <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">Budaya Bersih Terintegrasi</span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Portal digital pemantauan piket harian kelas, konversi tabungan sampah daur ulang menjadi poin prestasi, serta penanganan cepat masalah lingkungan di SMA IT Akmala Sabila.
          </p>
        </div>
      </section>

      {/* ================= LIVE KPI COUNTERS ================= */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-card border border-emerald-500/20">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Laporan Piket</span>
            <ClipboardCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">{totalPiket}</div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" /> Data Tersimpan Lokal
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-emerald-500/20">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Rata-rata Skor 5R</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">{avgScore}%</div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">Standar Kebersihan Kelas</div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-emerald-500/20">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Sampah Terkumpul</span>
            <Recycle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
            {totalWastePcs} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">pcs/unit</span>
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-medium">Daur Ulang Terverifikasi</div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-emerald-500/20">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Aduan Selesai</span>
            <AlertTriangle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">{totalSolvedReports}</div>
          <div className="text-[11px] text-teal-700 dark:text-teal-400 mt-1 font-medium">Tindak Lanjut Sarpras</div>
        </div>
      </section>

      {/* ================= ADMIN PROMINENT CONTROL BANNER ================= */}
      {isAdmin && (
        <section className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-obsidian-900 to-emerald-950/90 border-2 border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase border border-amber-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3 text-amber-400" /> Akses Khusus Administrator
              </span>
            </div>
            <h3 className="font-heading font-black text-xl text-white">
              Pusat Kontrol & Statistik Admin
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Pantau grafik performa kebersihan 5R, kelola seluruh data pengguna & kelas sekolah, lihat peta sebaran GPS aduan kampus, dan ubah formulir checklist harian.
            </p>
          </div>
          <button
            onClick={() => setActivePage('admin-dashboard')}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-black text-xs shadow-glow hover:brightness-110 active:scale-95 transition flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
          >
            <span>Buka Panel Admin & Grafik</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      )}

      {/* ================= 3 CORE PILLARS OVERVIEW ================= */}
      <section className="space-y-6">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">3 Fitur Utama Portal AKSMA</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Pilih modul kerja digital yang ingin Anda akses hari ini</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Clean Check */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between space-y-4 relative overflow-hidden border border-emerald-500/25">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Fitur 1 • Harian</span>
              <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">AKSMA Clean Check</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Pemindaian QR code kelas, formulir checklist kebersihan 5R, pratinjau skor real-time, dan pemantauan wali kelas.
              </p>
            </div>
            <button
              onClick={() => setActivePage('clean-check')}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold dark:hover:bg-emerald-500/30 transition flex items-center justify-between"
            >
              <span>Akses Clean Check</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Eco-Point */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between space-y-4 relative overflow-hidden border border-amber-500/25">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Recycle className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Fitur 2 • Bank Sampah</span>
              <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">AKSMA Eco-Point</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Setor sampah daur ulang (plastik, kertas, kaleng), verifikasi timbangan petugas, akumulasi poin, dan leaderboard kelas.
              </p>
            </div>
            <button
              onClick={() => setActivePage('eco-point')}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold dark:hover:bg-amber-500/30 transition flex items-center justify-between"
            >
              <span>Akses Eco-Point</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Green Report */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between space-y-4 relative overflow-hidden border border-rose-500/25">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Fitur 3 • Pengaduan</span>
              <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">AKSMA Green Report</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {isAdmin 
                  ? 'Entri laporan masalah sarpras & kebersihan resmi, serta pantau sebaran titik aduan pada peta GPS sekolah.'
                  : 'Denah interaktif fasilitas sanitasi sekolah serta pemantauan transparan riwayat penanganan aduan sarpras.'}
              </p>
            </div>
            <button
              onClick={() => setActivePage('green-report')}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/15 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-bold dark:hover:bg-rose-500/30 transition flex items-center justify-between"
            >
              <span>Akses Green Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* ================= ISLAMIC MOTTO ================= */}
      <section className="rounded-2xl p-6 sm:p-8 bg-white dark:bg-obsidian-900 border border-emerald-500/30 dark:border-emerald-500/25 shadow-sm dark:shadow-[0_0_25px_rgba(16,185,129,0.1)] text-center space-y-3 relative overflow-hidden transition-colors">
        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-sm">
          <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="text-emerald-950 dark:text-emerald-200 text-sm sm:text-base italic font-semibold max-w-2xl mx-auto leading-relaxed">
          "Barangsiapa menanam tanaman, lalu buahnya dimakan oleh manusia atau binatang, maka itu menjadi sedekah baginya."
        </div>
        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
          (HR. Bukhari & Muslim) • SMA IT Akmala Sabila
        </div>
      </section>

    </div>
  );
}
