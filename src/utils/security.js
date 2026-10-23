// =========================================================================
// AKSMA GREEN HUB - SISTEM KEAMANAN & KRIPTOGRAFI OTENTIKASI
// Web Crypto API (SHA-256) + Salt + Rate Limiting + Sanitasi Input
// =========================================================================

const APP_SALT = 'aksma_greenhub_sec_salt_v2026_akmala';
const SECURITY_STORAGE_KEY = 'aksma_security_ratelimit_v1';
const AUDIT_LOGS_KEY = 'aksma_security_audit_logs_v1';

// Max percobaan gagal sebelum akun dikunci sementara
export const MAX_FAILED_ATTEMPTS = 5;
// Durasi penguncian (detik)
export const LOCKOUT_DURATION_SECONDS = 60;

/**
 * Hash password menggunakan algoritma SHA-256 bawaan browser (Web Crypto API)
 * Password tidak pernah disimpan dalam bentuk teks biasa (plain text).
 */
export async function hashPassword(plainText, customSalt = APP_SALT) {
  if (!plainText) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(customSalt + ':' + plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return 'sha256:' + hashHex;
  } catch (err) {
    console.warn('Crypto subtle unavailable, using fallback hash:', err);
    // Simple fast fallback for older environments
    let hash = 0;
    const str = customSalt + ':' + plainText;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 'fallback:' + Math.abs(hash).toString(16);
  }
}

/**
 * Verifikasi password masukan terhadap password tersimpan (bisa berupa hash atau teks)
 */
export async function verifyPassword(inputPassword, storedPasswordOrHash) {
  if (!inputPassword || !storedPasswordOrHash) return false;
  
  // Jika password tersimpan sudah berbentuk hash
  if (storedPasswordOrHash.startsWith('sha256:') || storedPasswordOrHash.startsWith('fallback:')) {
    const inputHash = await hashPassword(inputPassword);
    return inputHash === storedPasswordOrHash;
  }
  
  // Jika masih plain text (backward compatibility saat migrasi awal)
  return inputPassword === storedPasswordOrHash;
}

/**
 * Sanitasi string input untuk mencegah XSS, script injection, dan karakter berbahaya
 */
export function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>'"`;()&$]/g, '') // Hapus karakter eksekusi berbahaya
    .trim();
}

/**
 * Evaluasi kekuatan password (Skor 0 - 100)
 */
export function evaluatePasswordStrength(password) {
  if (!password) return { score: 0, label: 'Kosong', color: 'text-slate-400', isStrong: false };
  
  let score = 0;
  if (password.length >= 6) score += 25;
  if (password.length >= 10) score += 25;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^A-Za-z0-9]/.test(password)) score += 10;

  if (score >= 80) return { score, label: 'Sangat Kuat', color: 'text-emerald-500', isStrong: true };
  if (score >= 60) return { score, label: 'Kuat', color: 'text-teal-500', isStrong: true };
  if (score >= 40) return { score, label: 'Sedang', color: 'text-amber-500', isStrong: false };
  return { score, label: 'Lemah', color: 'text-rose-500', isStrong: false };
}

/**
 * Memeriksa status rate limit (brute force protection)
 */
export function checkRateLimit() {
  try {
    const raw = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (!raw) return { isLocked: false, remainingSeconds: 0, failedCount: 0 };
    
    const data = JSON.parse(raw);
    const now = Date.now();
    
    if (data.lockoutUntil && data.lockoutUntil > now) {
      const remainingSeconds = Math.ceil((data.lockoutUntil - now) / 1000);
      return { isLocked: true, remainingSeconds, failedCount: data.failedCount || MAX_FAILED_ATTEMPTS };
    }
    
    // Jika lockout sudah berakhir, reset
    if (data.lockoutUntil && data.lockoutUntil <= now) {
      resetRateLimit();
      return { isLocked: false, remainingSeconds: 0, failedCount: 0 };
    }
    
    return { isLocked: false, remainingSeconds: 0, failedCount: data.failedCount || 0 };
  } catch {
    return { isLocked: false, remainingSeconds: 0, failedCount: 0 };
  }
}

/**
 * Catat percobaan login gagal dan aktifkan lockout jika mencapai limit
 */
export function recordFailedLogin(username = 'unknown') {
  try {
    const current = checkRateLimit();
    const newCount = (current.failedCount || 0) + 1;
    const now = Date.now();
    
    let lockoutUntil = null;
    if (newCount >= MAX_FAILED_ATTEMPTS) {
      lockoutUntil = now + (LOCKOUT_DURATION_SECONDS * 1000);
      recordSecurityAudit('BRUTE_FORCE_LOCKOUT', `Akun dikunci sementara karena 5x salah password berturut-turut pada username "${username}".`);
    } else {
      recordSecurityAudit('LOGIN_FAILED', `Percobaan login gagal (${newCount}/${MAX_FAILED_ATTEMPTS}) untuk username "${username}".`);
    }
    
    const payload = {
      failedCount: newCount,
      lastAttemptAt: now,
      lockoutUntil
    };
    
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(payload));
    return { isLocked: !!lockoutUntil, failedCount: newCount, remainingSeconds: LOCKOUT_DURATION_SECONDS };
  } catch (err) {
    console.error('Error recording failed login:', err);
    return { isLocked: false, failedCount: 1, remainingSeconds: 0 };
  }
}

/**
 * Reset status rate limit setelah login sukses
 */
export function resetRateLimit() {
  try {
    localStorage.removeItem(SECURITY_STORAGE_KEY);
  } catch {}
}

/**
 * Catat audit keamanan (audit trail) untuk pemantauan Admin
 */
export function recordSecurityAudit(type, description, actor = 'System') {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    const logs = raw ? JSON.parse(raw) : [];
    
    const newEntry = {
      id: 'SEC-' + Date.now(),
      type, // 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'BRUTE_FORCE_LOCKOUT' | 'PASSWORD_CHANGED' | 'ADMIN_CREDENTIAL_UPDATED'
      description,
      actor,
      timestamp: new Date().toISOString(),
      formattedTime: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' })
    };
    
    // Simpan maksimal 100 log terakhir
    const updated = [newEntry, ...logs.slice(0, 99)];
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving security audit log:', err);
  }
}

/**
 * Ambil daftar log audit keamanan untuk Administrator
 */
export function getSecurityAuditLogs() {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Bersihkan riwayat log audit keamanan
 */
export function clearSecurityAuditLogs() {
  try {
    localStorage.removeItem(AUDIT_LOGS_KEY);
    return true;
  } catch {
    return false;
  }
}
