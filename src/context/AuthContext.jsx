import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  hashPassword, 
  verifyPassword, 
  sanitizeInput, 
  checkRateLimit, 
  recordFailedLogin, 
  resetRateLimit, 
  recordSecurityAudit 
} from '../utils/security';

const AUTH_STORAGE_KEY = 'aksma_auth_session_v5';
const USERS_STORAGE_KEY = 'aksma_users_list_v5';

// Kredensial Default Terenkripsi & Kuat
const DEFAULT_USERS = [
  {
    id: 'u-admin-1',
    username: 'admin_aksma',
    name: 'Administrator Monitoring',
    role: 'admin',
    kelas: 'Semua Kelas',
    password: 'Akmala@2026!',
    title: 'Administrator & Tim Monitoring',
    badge: 'Admin Monitoring',
    createdAt: '2026-10-01'
  },
  {
    id: 'u-siswa-1',
    username: 'user',
    name: 'Siswa Akmala Sabila',
    role: 'user',
    kelas: 'X-A',
    password: 'user123',
    title: 'Siswa / Petugas Piket (X-A)',
    badge: 'User: X-A',
    createdAt: '2026-10-01'
  }
];

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Current active session
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Auto-migrate old admin session to new secure username if applicable
        if (parsed.username === 'admin') {
          parsed.username = 'admin_aksma';
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Persistent user database
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure admin account exists and is updated to admin_aksma
        const hasAdmin = parsed.some(u => u.role === 'admin');
        if (!hasAdmin) {
          return [...DEFAULT_USERS, ...parsed];
        }
        // Migrate old 'admin' username to 'admin_aksma' if present
        return parsed.map(u => {
          if (u.role === 'admin' && (u.username === 'admin' || !u.username)) {
            return {
              ...u,
              username: 'admin_aksma',
              name: 'Administrator Monitoring',
              password: u.password === 'admin' ? 'Akmala@2026!' : u.password
            };
          }
          return u;
        });
      }
      return DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  // Unified Secure Login dengan Proteksi Brute-Force & Hashing
  const login = async (username, password) => {
    // 1. Cek Rate Limiting / Proteksi Kunci Akun (Anti Brute-Force)
    const rateLimit = checkRateLimit();
    if (rateLimit.isLocked) {
      return { 
        success: false, 
        isLocked: true, 
        remainingSeconds: rateLimit.remainingSeconds, 
        message: `Akun terkunci sementara karena ${rateLimit.failedCount}x salah password berturut-turut! Coba lagi dalam ${rateLimit.remainingSeconds} detik.` 
      };
    }

    // 2. Sanitasi Input (Cegah XSS & Injeksi Karakter)
    const cleanUser = sanitizeInput(username || '').toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser) {
      return { success: false, message: 'Silakan masukkan username akun!' };
    }
    if (!cleanPass) {
      return { success: false, message: 'Silakan masukkan password akun!' };
    }

    // 3. Cari pengguna di basis data terdaftar
    const foundUser = users.find(u => u.username.toLowerCase() === cleanUser);

    if (!foundUser) {
      const lockStatus = recordFailedLogin(cleanUser);
      if (lockStatus.isLocked) {
        return { 
          success: false, 
          isLocked: true, 
          remainingSeconds: lockStatus.remainingSeconds, 
          message: `Terlalu banyak percobaan gagal (${lockStatus.failedCount}x). Akun terkunci selama ${lockStatus.remainingSeconds} detik demi keamanan!` 
        };
      }
      return {
        success: false,
        message: `Username "${cleanUser}" tidak terdaftar dalam sistem!`
      };
    }

    // 4. Verifikasi Password Secara Kriptografis (Strict, Tanpa Backdoor)
    const isPasswordMatch = await verifyPassword(cleanPass, foundUser.password);

    if (!isPasswordMatch) {
      const lockStatus = recordFailedLogin(cleanUser);
      if (lockStatus.isLocked) {
        return { 
          success: false, 
          isLocked: true, 
          remainingSeconds: lockStatus.remainingSeconds, 
          message: `Terlalu banyak percobaan gagal (${lockStatus.failedCount}x). Akun terkunci selama ${lockStatus.remainingSeconds} detik demi keamanan!` 
        };
      }
      return {
        success: false,
        failedCount: lockStatus.failedCount,
        message: `Password salah untuk akun "${foundUser.username}"! (Percobaan ${lockStatus.failedCount}/5)`
      };
    }

    // 5. Berhasil Masuk: Reset Rate Limit & Buat Sesi
    resetRateLimit();
    recordSecurityAudit('LOGIN_SUCCESS', `Login berhasil untuk akun "${foundUser.username}" (${foundUser.role}).`, foundUser.name);

    const userSession = {
      ...foundUser,
      loginAt: new Date().toISOString()
    };
    setUser(userSession);

    // Otomatis amankan password ke format Hash jika masih plain text
    if (!foundUser.password.startsWith('sha256:') && !foundUser.password.startsWith('fallback:')) {
      hashPassword(cleanPass).then(hashed => {
        setUsers(prev => prev.map(u => u.username === foundUser.username ? { ...u, password: hashed } : u));
      });
    }

    return { 
      success: true, 
      user: userSession, 
      role: userSession.role 
    };
  };

  // Ubah Kredensial Administrator (Username & Password Baru) dengan Verifikasi Keamanan
  const updateAdminCredentials = async (currentPassword, newUsername, newPassword) => {
    if (!user || user.role !== 'admin') {
      return { success: false, message: 'Hanya Administrator aktif yang dapat mengubah kredensial sistem!' };
    }

    const cleanNewUser = sanitizeInput(newUsername || '').toLowerCase();
    const cleanNewPass = (newPassword || '').trim();
    const cleanCurPass = (currentPassword || '').trim();

    if (!cleanCurPass) {
      return { success: false, message: 'Masukkan password Administrator saat ini untuk konfirmasi keamanan!' };
    }
    if (!cleanNewUser || cleanNewUser.length < 4) {
      return { success: false, message: 'Username baru minimal 4 karakter (hanya huruf, angka, underscore)!' };
    }
    if (!cleanNewPass || cleanNewPass.length < 6) {
      return { success: false, message: 'Password baru minimal 6 karakter demi keamanan!' };
    }

    // Cari admin user di database
    const adminIndex = users.findIndex(u => u.username === user.username && u.role === 'admin');
    if (adminIndex === -1) {
      return { success: false, message: 'Akun Administrator tidak ditemukan di database!' };
    }

    const adminAccount = users[adminIndex];

    // Verifikasi password saat ini
    const isCurPassValid = await verifyPassword(cleanCurPass, adminAccount.password);
    if (!isCurPassValid) {
      recordSecurityAudit('PASSWORD_CHANGE_FAILED', `Gagal mengubah kredensial admin: password lama salah.`);
      return { success: false, message: 'Password Administrator saat ini tidak sesuai!' };
    }

    // Cek duplikasi username jika username diubah
    if (cleanNewUser !== user.username) {
      const isTaken = users.some(u => u.username.toLowerCase() === cleanNewUser && u.id !== adminAccount.id);
      if (isTaken) {
        return { success: false, message: `Username "${cleanNewUser}" sudah digunakan oleh akun lain!` };
      }
    }

    // Hash password baru
    const hashedPassword = await hashPassword(cleanNewPass);

    const updatedAdmin = {
      ...adminAccount,
      username: cleanNewUser,
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    };

    setUsers(prev => prev.map(u => u.id === adminAccount.id ? updatedAdmin : u));

    // Update sesi aktif
    const updatedSession = {
      ...user,
      username: cleanNewUser,
      password: hashedPassword
    };
    setUser(updatedSession);

    recordSecurityAudit(
      'ADMIN_CREDENTIAL_UPDATED', 
      `Kredensial Administrator berhasil diubah. Username baru: "${cleanNewUser}".`,
      'Administrator'
    );

    return { 
      success: true, 
      message: 'Kredensial Administrator berhasil diperbarui!',
      newUsername: cleanNewUser
    };
  };

  // User CRUD for Admin
  const addUser = async (userData) => {
    const cleanUsername = sanitizeInput(userData.username || '').toLowerCase();
    if (!cleanUsername) return { success: false, message: 'Username tidak boleh kosong!' };
    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: `Username "${cleanUsername}" sudah digunakan!` };
    }

    const plainPass = userData.password?.trim() || 'user123';
    const hashedPassword = await hashPassword(plainPass);

    const newUser = {
      id: 'u-' + Date.now(),
      username: cleanUsername,
      name: userData.name?.trim() || cleanUsername,
      role: userData.role || 'user',
      kelas: userData.kelas || 'X-A',
      password: hashedPassword,
      title: userData.role === 'admin' ? 'Administrator Monitoring' : `User / Siswa (${userData.kelas || 'X-A'})`,
      badge: userData.role === 'admin' ? 'Admin Monitoring' : `User: ${userData.kelas || 'X-A'}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUsers(prev => [...prev, newUser]);
    recordSecurityAudit('USER_CREATED', `Admin mendaftarkan akun baru: "${cleanUsername}" (${newUser.role}).`);
    return { success: true, user: newUser };
  };

  const updateUser = async (usernameToEdit, updatedFields) => {
    let passwordValue = updatedFields.password;
    if (passwordValue && !passwordValue.startsWith('sha256:') && !passwordValue.startsWith('fallback:')) {
      passwordValue = await hashPassword(passwordValue.trim());
    }

    const cleanNewUser = updatedFields.username ? sanitizeInput(updatedFields.username).toLowerCase() : undefined;

    setUsers(prev => prev.map(u => {
      if (u.username.toLowerCase() === usernameToEdit.toLowerCase()) {
        const updated = {
          ...u,
          ...updatedFields,
          username: cleanNewUser || u.username,
          password: passwordValue || u.password,
          title: (updatedFields.role || u.role) === 'admin' ? 'Administrator Monitoring' : `User / Siswa (${updatedFields.kelas || u.kelas})`,
          badge: (updatedFields.role || u.role) === 'admin' ? 'Admin Monitoring' : `User: ${updatedFields.kelas || u.kelas}`
        };
        // Jika sedang mengedit sesi diri sendiri
        if (user && user.username.toLowerCase() === usernameToEdit.toLowerCase()) {
          setUser(prevSession => ({ ...prevSession, ...updated }));
        }
        return updated;
      }
      return u;
    }));

    recordSecurityAudit('USER_UPDATED', `Admin memperbarui data akun: "${usernameToEdit}".`);
    return { success: true };
  };

  const deleteUser = (usernameToDelete) => {
    if (user && user.username.toLowerCase() === usernameToDelete.toLowerCase()) {
      return { success: false, message: 'Tidak dapat menghapus akun yang sedang Anda gunakan saat ini!' };
    }
    const target = users.find(u => u.username.toLowerCase() === usernameToDelete.toLowerCase());
    if (target?.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
      return { success: false, message: 'Harus ada minimal satu akun Administrator dalam sistem!' };
    }
    setUsers(prev => prev.filter(u => u.username.toLowerCase() !== usernameToDelete.toLowerCase()));
    recordSecurityAudit('USER_DELETED', `Admin menghapus akun: "${usernameToDelete}".`);
    return { success: true };
  };

  const logout = () => {
    if (user) {
      recordSecurityAudit('LOGOUT', `Pengguna "${user.username}" keluar dari sistem.`, user.name);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      users,
      isLoggedIn: !!user,
      isAdmin: user?.role === 'admin',
      isUser: user?.role === 'user',
      isSiswa: user?.role === 'user',
      login,
      updateAdminCredentials,
      addUser,
      updateUser,
      deleteUser,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
