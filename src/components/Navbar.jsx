import React, { useState, useEffect } from 'react';
import { Leaf, LogOut, Shield, User, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { showConfirm, showToast } from '../utils/sweetalert';

export default function Navbar({ activePage, setActivePage }) {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const day = days[now.getDay()];
      setTimeStr(`${day}, ${hours}:${mins} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      title: 'Keluar dari Sistem?',
      text: 'Apakah Anda yakin ingin mengakhiri sesi akun ini?',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Tetap Masuk',
      icon: 'question'
    });
    if (confirmed) {
      logout();
      showToast('Sesi akun telah diakhiri', 'info');
      setActivePage('login');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-obsidian-950/90 backdrop-blur-xl border-b border-emerald-500/20 px-4 py-3 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand (Klik untuk kembali ke Beranda jika sudah login) */}
        <div 
          onClick={() => {
            if (isLoggedIn) setActivePage('home');
          }}
          className={`flex items-center gap-3 select-none ${isLoggedIn ? 'cursor-pointer group' : ''}`}
          title={isLoggedIn ? "Klik untuk kembali ke Beranda" : "AKSMA GREEN HUB"}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-glow group-hover:scale-105 transition-transform flex-shrink-0">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-black text-lg text-slate-900 dark:text-white tracking-tight">AKSMA GREEN HUB</h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                PLP MPI 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              SMA IT Akmala Sabila • Portal Kebersihan & Lingkungan Sekolah
            </p>
          </div>
        </div>

        {/* Right side: Live clock, Theme Switcher & Auth Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 dark:bg-obsidian-900/80 dark:hover:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/25 transition-all shadow-sm"
            title={isDark ? "Ubah ke Tema Terang (Putih & Hijau)" : "Ubah ke Tema Gelap (Hitam & Hijau)"}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-emerald-700 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Live Academic Clock */}
          {timeStr && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
              <span>{timeStr}</span>
            </div>
          )}

          {isLoggedIn && isAdmin && (
            <button
              onClick={() => setActivePage('admin-dashboard')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
                activePage === 'admin-dashboard'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-glow'
                  : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
              }`}
              title="Buka Panel Administrator & Statistik"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Panel Admin</span>
            </button>
          )}

          {isLoggedIn ? (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-500/30 shadow-sm">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs ${
                isAdmin ? 'bg-gradient-to-tr from-amber-600 to-amber-400' : 'bg-gradient-to-tr from-emerald-600 to-emerald-400'
              }`}>
                {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="text-left leading-tight hidden sm:block">
                <div className="text-xs font-bold text-slate-900 dark:text-white max-w-[120px] truncate">{user.name}</div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                  {isAdmin ? 'Administrator' : `User (${user.kelas || 'Siswa'})`}
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                className="p-1 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-md transition-colors"
                title="Keluar / Ganti Akun"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              Autentikasi Diperlukan
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
