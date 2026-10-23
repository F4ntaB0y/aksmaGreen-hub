import React, { useState, useEffect } from 'react';
import { 
  Leaf, Shield, GraduationCap, ArrowRight, Lock, User, School, 
  Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles, ClipboardCheck, 
  Recycle, AlertTriangle, LogOut, ShieldAlert, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { showToast, showError, showWarning } from '../utils/sweetalert';
import { checkRateLimit } from '../utils/security';

export default function Login({ targetRedirect, onLoginSuccess, onCancel }) {
  const { user, isLoggedIn, isAdmin, login, logout } = useAuth();
  
  // Single Unified Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Rate Limiting / Lockout Countdown State
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Feedback Alert State
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 4 && hours < 11) setGreeting('Selamat Pagi di SMA IT Akmala Sabila');
    else if (hours >= 11 && hours < 15) setGreeting('Selamat Siang • Rawat Kebersihan');
    else if (hours >= 15 && hours < 18) setGreeting('Selamat Sore • Cek Laporan Piket');
    else setGreeting('Selamat Malam di AKSMA Green Hub');

    // Cek apakah sistem sedang terkunci (Rate Limiting)
    const initialCheck = checkRateLimit();
    if (initialCheck.isLocked) {
      setLockoutSeconds(initialCheck.remainingSeconds);
    }
  }, []);

  // Countdown timer saat akun terkunci akibat brute force
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setFeedback(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutSeconds > 0) {
      showWarning('Akses Masih Terkunci', `Mohon tunggu ${lockoutSeconds} detik lagi sebelum mencoba login.`);
      return;
    }

    setFeedback(null);
    setIsLoading(true);

    try {
      const res = await login(username, password);

      if (res.success) {
        if (res.role === 'admin') {
          showToast('Login berhasil sebagai Administrator!', 'success');
          setFeedback({ type: 'success', text: 'Login berhasil sebagai Administrator! Mengalihkan ke dashboard...' });
        } else {
          showToast(`Selamat datang, ${res.user.name}!`, 'success');
          setFeedback({ type: 'success', text: `Selamat datang, ${res.user.name}! Mengalihkan ke dashboard...` });
        }

        setTimeout(() => {
          onLoginSuccess(targetRedirect || 'home');
        }, 400);
      } else {
        if (res.isLocked) {
          setLockoutSeconds(res.remainingSeconds || 60);
          showError('Keamanan Diaktifkan!', res.message);
          setFeedback({ type: 'error', text: res.message });
        } else {
          showError('Gagal Masuk', res.message);
          setFeedback({ type: 'error', text: res.message });
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      showError('Kesalahan Sistem', 'Terjadi kesalahan saat memproses otentikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COLUMN: School Showcase & 3 Pillars */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{greeting}</span>
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-4xl text-slate-900 dark:text-white leading-tight">
            Gerbang Digital <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">Kebersihan & Kepedulian</span> Lingkungan
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Sistem terintegrasi SMA IT Akmala Sabila dengan perlindungan keamanan kriptografi akun santri, tabungan sampah daur ulang, dan monitoring fasilitas kampus.
          </p>

          {/* 3 Pillars Card Highlights */}
          <div className="space-y-3">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/80 dark:bg-obsidian-900/60 border border-emerald-500/20 backdrop-blur-md shadow-sm hover:border-emerald-500/40 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">AKSMA Clean Check (Piket Kelas)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Verifikasi kondisi 5R dengan bukti foto fisik dan persetujuan berkala wali kelas.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/80 dark:bg-obsidian-900/60 border border-emerald-500/20 backdrop-blur-md shadow-sm hover:border-emerald-500/40 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <Recycle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">AKSMA Eco-Point (Pilah Sampah & Poin)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Setoran sampah terpilah berbukti foto dikonversi ke poin kelas setelah verifikasi Admin.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/80 dark:bg-obsidian-900/60 border border-emerald-500/20 backdrop-blur-md shadow-sm hover:border-emerald-500/40 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">AKSMA Green Report (Aduan Fasilitas)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pelaporan kerusakan sarpras dan pemantauan titik koordinat GPS interaktif.</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-obsidian-900 border border-emerald-500/25 border-l-4 border-l-emerald-600 dark:border-l-emerald-400 text-xs text-emerald-950 dark:text-emerald-200 italic shadow-sm transition-colors">
            "Ath-thuhuru syathrul iman — Kebersihan itu sebagian dari iman." (HR. Muslim)
            <span className="block not-italic text-emerald-700 dark:text-emerald-400 font-bold mt-1">
              SMA IT Akmala Sabila • Keamanan Akun Terproteksi Kriptografi SHA-256
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Luxury Interactive Login Glass Card */}
        <div className="lg:col-span-5">
          <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-glow border border-emerald-500/35 relative overflow-hidden">
            
            {/* Top decorative line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"></div>

            {/* Active Session Alert if currently logged in */}
            {isLoggedIn && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                    {isAdmin ? <Shield className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{user.name}</div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">{isAdmin ? 'Administrator' : `Siswa: ${user.kelas}`}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => onLoginSuccess(targetRedirect || 'home')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                  >
                    Lanjut
                  </button>
                  <button 
                    onClick={logout}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition"
                    title="Keluar / Ganti Akun"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
                <Shield className="w-3.5 h-3.5" /> Autentikasi Terenkripsi
              </span>
              <h2 className="font-heading font-black text-2xl text-slate-900 dark:text-white">Masuk ke Sistem</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Sistem otomatis membedakan hak akses Siswa dan Administrator secara aman.
              </p>
            </div>

            {/* Lockout Warning Banner if brute-force detected */}
            {lockoutSeconds > 0 && (
              <div className="p-3.5 rounded-xl mb-4 text-xs bg-rose-50 dark:bg-rose-950/60 border border-rose-500/50 text-rose-800 dark:text-rose-200 flex items-center gap-3 animate-pulse">
                <Clock className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <div>
                  <div className="font-bold">Akses Dikunci Sementara (Anti Brute-Force)</div>
                  <div className="text-[11px] mt-0.5">
                    Terdeteksi 5x percobaan salah. Silakan tunggu <strong>{lockoutSeconds} detik</strong> sebelum mencoba lagi.
                  </div>
                </div>
              </div>
            )}

            {/* Target Redirect Notification */}
            {targetRedirect && !feedback && lockoutSeconds === 0 && (
              <div className="p-3 rounded-xl mb-4 text-xs bg-amber-50 dark:bg-amber-500/15 border border-amber-500/35 text-amber-800 dark:text-amber-200 flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span>Halaman ini memerlukan autentikasi. Silakan masuk dengan akun Anda.</span>
              </div>
            )}

            {/* Feedback Alert */}
            {feedback && lockoutSeconds === 0 && (
              <div className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
                feedback.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300' 
                  : 'bg-rose-50 dark:bg-rose-500/20 border border-rose-500/40 text-rose-800 dark:text-rose-300'
              }`}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{feedback.text}</span>
              </div>
            )}

            {/* UNIFIED LOGIN FORM WITH SECURITY CONTROLS */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Username Akun <span className="text-rose-500">*</span></span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={lockoutSeconds > 0 || isLoading}
                    placeholder="Masukkan username Anda..."
                    className="w-full bg-white dark:bg-obsidian-950 border border-emerald-500/30 rounded-xl px-9 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                  <span>Password <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400">Proteksi SHA-256</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={lockoutSeconds > 0 || isLoading}
                    placeholder="Masukkan password Anda..."
                    className="w-full bg-white dark:bg-obsidian-950 border border-emerald-500/30 rounded-xl px-9 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={lockoutSeconds > 0 || isLoading}
                    className="absolute right-3 top-3 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 disabled:opacity-40"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={lockoutSeconds > 0 || isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white font-bold text-xs shadow-glow hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <span>Memverifikasi Keamanan...</span>
                ) : lockoutSeconds > 0 ? (
                  <span>Terkunci ({lockoutSeconds}s)</span>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Security Badges */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                <Shield className="w-3.5 h-3.5 text-emerald-500" /> Anti Brute-Force Active
              </span>
              <span>Proteksi 5x Percobaan</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
