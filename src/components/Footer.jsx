import React from 'react';
import { Leaf } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-emerald-500/20 bg-white/80 dark:bg-obsidian-950/80 backdrop-blur-md py-8 px-4 text-center transition-colors">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
          <Leaf className="w-4 h-4" />
          <span>AKSMA GREEN HUB • SMA IT Akmala Sabila</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Dikembangkan sebagai Karya Inovasi Digital Program Pengenalan Lapangan Persekolahan (PLP) Mahasiswa Manajemen Pendidikan Islam (MPI) 2026.
        </p>
        <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-200 dark:border-white/5">
          &copy; 2026 SMA IT Akmala Sabila. Hak Cipta Dilindungi.
        </div>
      </div>
    </footer>
  );
}
