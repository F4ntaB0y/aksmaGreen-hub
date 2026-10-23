import React, { useState } from 'react';
import { UserPlus, ShieldAlert, ArrowRight, X, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminSetupNotification({ setActivePage }) {
  const { isAdmin, users } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if current user is admin AND if there are no regular users (students/staff)
  const regularUserCount = users.filter(u => u.role !== 'admin').length;
  const shouldShow = isAdmin && regularUserCount === 0 && !isDismissed;

  if (!shouldShow) return null;

  const handleGoToUsers = () => {
    setActivePage('admin-dashboard');
    // Store requested sub-tab for AdminDashboard
    window.sessionStorage.setItem('aksma_admin_target_tab', 'users');
    setIsDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="glass-card max-w-lg w-full p-6 sm:p-7 rounded-3xl shadow-2xl border-2 border-amber-500/50 space-y-5 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
            title="Tutup pemberitahuan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
            <Info className="w-3 h-3" />
            <span>Pemberitahuan Inisialisasi Administrator</span>
          </div>

          <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white tracking-tight">
            Database Akun Pengguna Masih Kosong
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Selamat datang di portal <strong>AKSMA GREEN HUB</strong>. Saat ini belum ada akun siswa atau pengguna biasa yang terdaftar. Sebagai Administrator, Anda memiliki kontrol penuh untuk membuat dan mengelola akun pengguna (CRUD Data User) agar siswa dapat mengakses formulir checklist piket dan penyetoran sampah daur ulang.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-obsidian-900/80 border border-slate-200 dark:border-emerald-500/20 space-y-1.5 text-xs">
          <div className="font-bold text-slate-800 dark:text-slate-200">
            Langkah Selanjutnya:
          </div>
          <ol className="list-decimal list-inside text-slate-600 dark:text-slate-400 space-y-1">
            <li>Buka menu <strong>Kelola User</strong> di Panel Administrator.</li>
            <li>Klik tombol <strong>Tambah User</strong> untuk mendaftarkan akun siswa/wali kelas.</li>
            <li>Bagikan username & password kepada siswa untuk login.</li>
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition order-2 sm:order-1"
          >
            Tutup Sementara
          </button>

          <button
            type="button"
            onClick={handleGoToUsers}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white font-bold text-xs shadow-glow hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 order-1 sm:order-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Buka Kelola User Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
