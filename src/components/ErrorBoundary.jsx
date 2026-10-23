import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.hash = '#home';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
          <div className="glass-card max-w-lg w-full p-8 rounded-3xl border-2 border-rose-500/40 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Terjadi Gangguan Sistem</span>
              </div>

              <h1 className="font-heading font-black text-2xl text-white">
                Terjadi Kesalahan Aplikasi
              </h1>

              <p className="text-xs text-slate-300 leading-relaxed">
                Sistem mendeteksi adanya kendala saat memuat komponen ini. Anda dapat menyegarkan halaman atau kembali ke beranda utama.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-rose-500/20 text-left font-mono text-[11px] text-rose-300 max-h-24 overflow-y-auto">
              {this.state.error?.message || 'Unknown runtime error'}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-glow hover:brightness-110 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Aplikasi</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
