import React from 'react';
import { AlertCircle, ArrowLeft, Home, Compass, ShieldAlert, Sparkles } from 'lucide-react';

export default function NotFound({ setActivePage, errorMessage }) {
  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setActivePage('home');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 animate-fade-in">
      <div className="glass-card max-w-lg w-full p-8 sm:p-10 rounded-3xl border-2 border-emerald-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Error icon badge */}
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 border-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-glow">
          <AlertCircle className="w-10 h-10" />
        </div>

        {/* Error Code & Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>HTTP 404 • Not Found</span>
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight">
            Halaman Tidak Ditemukan
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
            {errorMessage || 'Mohon maaf, halaman atau tautan navigasi yang Anda tuju tidak tersedia atau telah dipindahkan dalam portal AKSMA GREEN HUB.'}
          </p>
        </div>

        {/* Suggestion Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-obsidian-900/80 border border-slate-200 dark:border-emerald-500/20 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 text-left">
          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Panduan Navigasi Sistem:</span>
          </div>
          <p>
            Pastikan tautan atau hash URL Anda sesuai dengan fitur utama:
            <span className="font-mono text-emerald-700 dark:text-emerald-300 font-semibold block mt-1">
              #home • #clean-check • #eco-point • #green-report • #admin-dashboard
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={handleGoBack}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Sebelumnya</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage('home')}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-glow hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Menuju Beranda Utama</span>
          </button>
        </div>
      </div>
    </div>
  );
}
