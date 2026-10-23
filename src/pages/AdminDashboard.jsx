import React, { useState } from 'react';
import { 
  Shield, Users, GraduationCap, BarChart3, MapPin, 
  ClipboardCheck, Recycle, AlertTriangle, Plus, Edit3, Trash2, 
  CheckCircle2, XCircle, ArrowLeft, Search, Filter, RefreshCw,
  Key, UserPlus, Building, Sparkles, PieChart, TrendingUp,
  Crosshair, Check, X, ShieldAlert, Award, FileSpreadsheet, Download,
  Lock, ShieldCheck, Eye, EyeOff, History, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import ReportMap from '../components/ReportMap';
import { exportToExcel, exportMultipleSheetsToExcel } from '../utils/excelExport';
import { showSuccess, showError, showWarning, showConfirm, showToast } from '../utils/sweetalert';
import { getSecurityAuditLogs, clearSecurityAuditLogs, evaluatePasswordStrength } from '../utils/security';
import ClassScoreBarChart from '../components/charts/ClassScoreBarChart';
import WasteCompositionDoughnutChart from '../components/charts/WasteCompositionDoughnutChart';
import ReportStatusChart from '../components/charts/ReportStatusChart';

export default function AdminDashboard({ setActivePage }) {
  const { user, users, addUser, updateUser, deleteUser, updateAdminCredentials } = useAuth();
  const { 
    classes, addClass, updateClass, deleteClass,
    cleanChecks, ecoPoints, greenReports, formConfig,
    addCriteria, updateCriteriaItem, deleteCriteria, resetCriteria,
    resetAllData
  } = useData();

  // Active Admin Sub-tab
  const [activeTab, setActiveTab] = useState(() => {
    const target = window.sessionStorage.getItem('aksma_admin_target_tab');
    if (target) {
      window.sessionStorage.removeItem('aksma_admin_target_tab');
      return target;
    }
    return 'statistik';
  }); 
  // 'statistik' | 'users' | 'kelas' | 'map' | 'checklist'

  // User CRUD states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUserData, setNewUserData] = useState({
    username: '',
    name: '',
    role: 'user',
    kelas: classes[0]?.name || 'X-A',
    password: ''
  });

  // Class CRUD states
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [newClassData, setNewClassData] = useState({
    name: '',
    waliKelas: '',
    siswaCount: 30,
    gedung: 'Gedung Utama'
  });

  // Checklist Criteria edit states
  const [editingCriteria, setEditingCriteria] = useState(null);
  const [newCriteriaData, setNewCriteriaData] = useState({
    title: '',
    desc: '',
    points: 20
  });

  // Admin Credential Modal & Security Audit states
  const [showAdminCredModal, setShowAdminCredModal] = useState(false);
  const [adminCredForm, setAdminCredForm] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [adminCredLoading, setAdminCredLoading] = useState(false);
  const [showCredPass, setShowCredPass] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [securityLogs, setSecurityLogs] = useState(() => getSecurityAuditLogs());

  const refreshAuditLogs = () => {
    setSecurityLogs(getSecurityAuditLogs());
  };

  // ================= KPI CALCULATIONS =================
  const totalUsers = users.length;
  const totalClasses = classes.length;
  
  // Hanya hitung skor yang sudah diverifikasi oleh admin
  const verifiedCleanChecks = cleanChecks.filter(c => c.status === 'verified');
  const pendingCleanChecks = cleanChecks.filter(c => c.status === 'pending').length;
  const totalCleanChecks = cleanChecks.length;
  const avgCleanScore = verifiedCleanChecks.length > 0
    ? Math.round(verifiedCleanChecks.reduce((s, c) => s + (c.score || 0), 0) / verifiedCleanChecks.length)
    : 0;
  
  const totalWastePcs = ecoPoints
    .filter(p => p.status === 'verified')
    .reduce((s, p) => s + (p.quantity || 0), 0);

  const totalEcoPoints = ecoPoints
    .filter(p => p.status === 'verified')
    .reduce((s, p) => s + (p.points || 0), 0);

  const totalReports = greenReports.length;
  const solvedReports = greenReports.filter(r => r.status === 'selesai').length;
  const inProgressReports = greenReports.filter(r => r.status === 'proses').length;
  const newReports = greenReports.filter(r => r.status === 'baru').length;

  // Chart 1 Data: Clean Check Scores by Class (Hanya skor terverifikasi admin)
  const classScoresData = classes.map(c => {
    const list = cleanChecks.filter(x => x.kelas === c.name && x.status === 'verified');
    const score = list.length > 0 
      ? Math.round(list.reduce((s, x) => s + (x.score || 0), 0) / list.length) 
      : 0;
    return { name: c.name, score, count: list.length };
  });

  // Chart 2 Data: Waste Breakdown by Type (pcs)
  const wasteBreakdown = formConfig.wasteTypes.map(w => {
    const totalPcs = ecoPoints
      .filter(p => p.wasteTypeId === w.id && p.status === 'verified')
      .reduce((s, p) => s + (p.quantity || 0), 0);
    return { name: w.name, unit: w.unit, total: totalPcs };
  });

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    const matchSearch = 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.kelas && u.kelas.toLowerCase().includes(userSearch.toLowerCase()));
    const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  // ================= HANDLERS: USER CRUD =================
  const handleCreateUser = (e) => {
    e.preventDefault();
    const res = addUser(newUserData);
    if (!res.success) {
      showError('Gagal Menambah Pengguna', res.message);
      return;
    }
    setShowAddUserModal(false);
    setNewUserData({
      username: '',
      name: '',
      role: 'user',
      kelas: classes[0]?.name || 'X-A',
      password: ''
    });
    showSuccess('Pengguna Ditambahkan', 'Akun pengguna baru berhasil ditambahkan!');
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    if (!editingUser) return;
    const res = updateUser(editingUser.username, editingUser);
    if (!res.success) {
      showError('Gagal Memperbarui', res.message);
      return;
    }
    setEditingUser(null);
    showSuccess('Pengguna Diperbarui', 'Data akun pengguna berhasil diperbarui!');
  };

  const handleDeleteUser = async (username) => {
    const confirmed = await showConfirm({
      title: 'Hapus Pengguna?',
      text: `Yakin ingin menghapus pengguna "${username}"? Tindakan ini tidak dapat dibatalkan.`,
      isDanger: true,
      confirmButtonText: 'Ya, Hapus'
    });
    if (confirmed) {
      const res = deleteUser(username);
      if (!res.success) {
        showError('Gagal Menghapus', res.message);
      } else {
        showToast('Pengguna berhasil dihapus', 'success');
      }
    }
  };

  // ================= EXPORT EXCEL SPREADSHEET HANDLERS =================
  const handleExportAllComprehensive = () => {
    const kpiData = [
      { 'Indikator / Metrik': 'Total Pengguna Terdaftar', 'Nilai': totalUsers, 'Keterangan': 'Akun aktif di sistem' },
      { 'Indikator / Metrik': 'Total Rombongan Belajar (Kelas)', 'Nilai': totalClasses, 'Keterangan': 'Kelas aktif' },
      { 'Indikator / Metrik': 'Total Laporan Piket Clean Check', 'Nilai': totalCleanChecks, 'Keterangan': 'Checklist harian' },
      { 'Indikator / Metrik': 'Rata-rata Skor Kebersihan 5R (%)', 'Nilai': `${avgCleanScore}%`, 'Keterangan': 'Standar target 80%' },
      { 'Indikator / Metrik': 'Total Sampah Daur Ulang (pcs)', 'Nilai': totalWastePcs, 'Keterangan': 'Unit fisik terverifikasi' },
      { 'Indikator / Metrik': 'Total Poin Hijau Beredar', 'Nilai': totalEcoPoints, 'Keterangan': 'Akumulasi poin prestasi' },
      { 'Indikator / Metrik': 'Total Aduan Sarpras & Lingkungan', 'Nilai': totalReports, 'Keterangan': 'Semua status' },
      { 'Indikator / Metrik': 'Aduan Selesai Ditangani', 'Nilai': solvedReports, 'Keterangan': 'Tuntas' },
      { 'Indikator / Metrik': 'Aduan Sedang Diproses', 'Nilai': inProgressReports, 'Keterangan': 'Pengerjaan lapangan' },
      { 'Indikator / Metrik': 'Aduan Baru', 'Nilai': newReports, 'Keterangan': 'Menunggu tindakan' }
    ];

    const usersData = users.map((u, i) => ({
      'No': i + 1,
      'Username': u.username,
      'Nama Lengkap': u.name,
      'Peran (Role)': u.role === 'admin' ? 'Administrator' : 'Siswa / User',
      'Kelas / Unit': u.kelas || '-',
      'Tanggal Dibuat': u.createdAt || '-'
    }));

    const classesData = classes.map((c, i) => ({
      'No': i + 1,
      'Nama Kelas': c.name,
      'Wali Kelas / Pembina': c.waliKelas,
      'Jumlah Santri': c.siswaCount,
      'Gedung / Lokasi': c.gedung || 'Gedung Utama'
    }));

    const cleanChecksData = cleanChecks.map((item, i) => ({
      'No': i + 1,
      'Tanggal': item.date,
      'Kelas': item.kelas,
      'Petugas Piket': item.petugas,
      'Kriteria Terpenuhi': `${item.checkedCount}/${item.totalCriteria}`,
      'Skor Kebersihan (%)': item.score,
      'Catatan': item.notes || '-'
    }));

    const ecoPointsData = ecoPoints.map((item, i) => ({
      'No': i + 1,
      'Tanggal': item.date,
      'Kelas': item.kelas,
      'Penyetor': item.contributor,
      'Jenis Sampah': item.wasteTypeName,
      'Jumlah': item.quantity,
      'Satuan': item.unit || 'pcs',
      'Poin': item.points,
      'Status': item.status === 'verified' ? 'Terverifikasi' : item.status === 'pending' ? 'Menunggu' : 'Ditolak'
    }));

    const greenReportsData = greenReports.map((r, i) => ({
      'No': i + 1,
      'ID Aduan': r.id,
      'Tanggal': r.date,
      'Pelapor': r.reporter,
      'Lokasi': r.location,
      'Kategori': r.category,
      'Urgensi': r.urgency,
      'Status': r.status === 'selesai' ? 'Selesai' : r.status === 'proses' ? 'Diproses' : 'Baru',
      'Deskripsi': r.description,
      'Tindak Lanjut Admin': r.adminNotes || '-'
    }));

    exportMultipleSheetsToExcel([
      { sheetName: 'Ringkasan KPI', data: kpiData },
      { sheetName: 'Data Pengguna', data: usersData },
      { sheetName: 'Data Kelas', data: classesData },
      { sheetName: 'Rekap Clean Check', data: cleanChecksData },
      { sheetName: 'Setoran Eco-Point', data: ecoPointsData },
      { sheetName: 'Riwayat Green Report', data: greenReportsData }
    ], 'Laporan_Komprehensif_AKSMA_GREEN_HUB');
  };

  const handleExportUsers = () => {
    if (filteredUsers.length === 0) {
      showWarning('Data Kosong', 'Belum ada data pengguna untuk diekspor!');
      return;
    }
    const dataToExport = filteredUsers.map((u, i) => ({
      'No': i + 1,
      'Username': u.username,
      'Nama Lengkap': u.name,
      'Peran (Role)': u.role === 'admin' ? 'Administrator' : 'Siswa / User',
      'Kelas / Unit': u.kelas || '-',
      'Password Akun': u.password || '123',
      'Tanggal Terdaftar': u.createdAt || '-'
    }));
    exportToExcel(dataToExport, 'Data_Pengguna_AKSMA', 'Data Pengguna');
  };

  const handleExportClasses = () => {
    if (classes.length === 0) {
      showWarning('Data Kosong', 'Belum ada data kelas untuk diekspor!');
      return;
    }
    const dataToExport = classes.map((c, i) => ({
      'No': i + 1,
      'Nama Kelas': c.name,
      'Wali Kelas / Pembina': c.waliKelas,
      'Jumlah Santri': c.siswaCount,
      'Gedung / Lokasi': c.gedung || 'Gedung Utama'
    }));
    exportToExcel(dataToExport, 'Data_Kelas_Sekolah_AKSMA', 'Data Kelas');
  };

  const handleExportReportsAdmin = () => {
    if (greenReports.length === 0) {
      showWarning('Data Kosong', 'Belum ada data aduan sarpras untuk diekspor!');
      return;
    }
    const dataToExport = greenReports.map((r, i) => ({
      'No': i + 1,
      'ID Aduan': r.id,
      'Tanggal': r.date,
      'Pelapor': r.reporter,
      'Lokasi': r.location,
      'Kategori': r.category,
      'Urgensi': r.urgency,
      'Status': r.status === 'selesai' ? 'Selesai' : r.status === 'proses' ? 'Diproses' : 'Baru',
      'Koordinat GPS': r.coords ? `${r.coords.lat.toFixed(5)}, ${r.coords.lng.toFixed(5)}` : 'Area Sekolah',
      'Deskripsi': r.description,
      'Tindak Lanjut Admin': r.adminNotes || '-'
    }));
    exportToExcel(dataToExport, 'Peta_Aduan_Sarpras_AKSMA', 'Aduan Sarpras');
  };

  // ================= HANDLERS: CLASS CRUD =================
  const handleCreateClass = (e) => {
    e.preventDefault();
    const res = addClass(newClassData);
    if (!res.success) {
      showError('Gagal Menambah Kelas', res.message);
      return;
    }
    setShowAddClassModal(false);
    setNewClassData({
      name: '',
      waliKelas: '',
      siswaCount: 30,
      gedung: 'Gedung Utama'
    });
    showSuccess('Kelas Ditambahkan', 'Kelas baru berhasil ditambahkan!');
  };

  const handleUpdateClass = (e) => {
    e.preventDefault();
    if (!editingClass) return;
    const res = updateClass(editingClass.id, editingClass);
    if (!res.success) {
      showError('Gagal Memperbarui', res.message);
      return;
    }
    setEditingClass(null);
    showSuccess('Kelas Diperbarui', 'Data kelas berhasil diperbarui!');
  };

  const handleDeleteClass = async (id, name) => {
    const confirmed = await showConfirm({
      title: 'Hapus Kelas?',
      text: `Hapus kelas "${name}"? Pastikan tidak ada data santri yang sedang aktif di kelas ini.`,
      isDanger: true,
      confirmButtonText: 'Ya, Hapus'
    });
    if (confirmed) {
      const res = deleteClass(id);
      if (!res.success) {
        showError('Gagal Menghapus', res.message);
      } else {
        showToast('Kelas berhasil dihapus', 'success');
      }
    }
  };

  // ================= HANDLERS: CHECKLIST CRITERIA CRUD =================
  const handleAddCriteria = (e) => {
    e.preventDefault();
    if (!newCriteriaData.title.trim()) return;
    addCriteria(newCriteriaData);
    setNewCriteriaData({ title: '', desc: '', points: 20 });
    showSuccess('Kriteria Ditambahkan', 'Kriteria checklist baru berhasil ditambahkan!');
  };

  const handleUpdateCriteria = (e) => {
    e.preventDefault();
    if (!editingCriteria || !editingCriteria.title.trim()) return;
    updateCriteriaItem(editingCriteria.id, {
      title: editingCriteria.title.trim(),
      desc: editingCriteria.desc?.trim() || '',
      points: Number(editingCriteria.points) || 20
    });
    setEditingCriteria(null);
  };

  // ================= HANDLERS: ADMIN CREDENTIALS & SECURITY =================
  const handleOpenAdminCredModal = () => {
    setAdminCredForm({
      currentPassword: '',
      newUsername: user?.username || 'admin_aksma',
      newPassword: '',
      confirmPassword: ''
    });
    setShowCredPass({ current: false, new: false, confirm: false });
    setShowAdminCredModal(true);
  };

  const handleUpdateAdminCreds = async (e) => {
    e.preventDefault();
    if (!adminCredForm.currentPassword) {
      showError('Validasi Gagal', 'Harap masukkan password saat ini untuk verifikasi keamanan!');
      return;
    }
    if (!adminCredForm.newUsername || adminCredForm.newUsername.trim().length < 4) {
      showError('Validasi Gagal', 'Username baru minimal 4 karakter (hanya huruf, angka, underscore)!');
      return;
    }
    if (!adminCredForm.newPassword || adminCredForm.newPassword.length < 6) {
      showError('Validasi Gagal', 'Password baru minimal 6 karakter!');
      return;
    }
    if (adminCredForm.newPassword !== adminCredForm.confirmPassword) {
      showError('Validasi Gagal', 'Konfirmasi password baru tidak cocok dengan password baru!');
      return;
    }

    setAdminCredLoading(true);
    try {
      const res = await updateAdminCredentials(
        adminCredForm.currentPassword,
        adminCredForm.newUsername,
        adminCredForm.newPassword
      );

      if (!res.success) {
        showError('Gagal Memperbarui', res.message);
      } else {
        showSuccess('Kredensial Berhasil Diperbarui', 'Username dan password Administrator telah diperbarui dengan aman menggunakan enkripsi SHA-256. Harap ingat atau catat kredensial baru Anda.');
        setShowAdminCredModal(false);
        refreshAuditLogs();
      }
    } catch (err) {
      showError('Terjadi Kesalahan', err.message || 'Gagal mengubah kredensial');
    } finally {
      setAdminCredLoading(false);
    }
  };

  const handleClearAuditLogs = async () => {
    const confirmed = await showConfirm({
      title: 'Bersihkan Log Audit?',
      text: 'Semua riwayat audit keamanan login dan perubahan data keamanan akan dihapus.',
      isDanger: true,
      confirmButtonText: 'Ya, Bersihkan'
    });
    if (confirmed) {
      clearSecurityAuditLogs();
      refreshAuditLogs();
      showToast('Riwayat audit keamanan dibersihkan', 'success');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto">
      
      {/* ================= MODAL: GANTI KREDENSIAL ADMINISTRATOR ================= */}
      {showAdminCredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleUpdateAdminCreds} className="glass-card max-w-lg w-full p-6 sm:p-7 rounded-3xl shadow-2xl border-2 border-amber-500/40 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">
                    Edit Kredensial Administrator
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Perbarui username dan password login Administrator secara aman
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAdminCredModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Password akan di-hash secara aman menggunakan algoritma <strong>SHA-256 + Salt Kriptografis</strong>. Setelah diubah, gunakan kredensial baru ini untuk sesi login berikutnya.
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Password Saat Ini */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password Administrator Saat Ini <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCredPass.current ? 'text' : 'password'}
                    value={adminCredForm.currentPassword}
                    onChange={(e) => setAdminCredForm({ ...adminCredForm, currentPassword: e.target.value })}
                    placeholder="Masukkan password admin saat ini..."
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-amber-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCredPass(p => ({ ...p, current: !p.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showCredPass.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Username Baru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Username Administrator Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={adminCredForm.newUsername}
                  onChange={(e) => setAdminCredForm({ ...adminCredForm, newUsername: e.target.value })}
                  placeholder="Contoh: admin_aksma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-amber-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                  required
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Minimal 4 karakter, huruf kecil, angka, atau underscore.</span>
              </div>

              {/* Password Baru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password Administrator Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCredPass.new ? 'text' : 'password'}
                    value={adminCredForm.newPassword}
                    onChange={(e) => setAdminCredForm({ ...adminCredForm, newPassword: e.target.value })}
                    placeholder="Minimal 6 karakter, kombinasi simbol & angka..."
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-amber-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCredPass(p => ({ ...p, new: !p.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showCredPass.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {adminCredForm.newPassword && (() => {
                  const strength = evaluatePasswordStrength(adminCredForm.newPassword);
                  return (
                    <div className="mt-2 space-y-1 p-2.5 rounded-xl bg-slate-100 dark:bg-obsidian-900/60 border border-slate-200 dark:border-emerald-500/20">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-500 dark:text-slate-400">Tingkat Keamanan:</span>
                        <span className={strength.color}>{strength.label} ({strength.score}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-obsidian-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            strength.score < 40 ? 'bg-rose-500' :
                            strength.score < 70 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${strength.score}%` }}
                        />
                      </div>
                      {strength.suggestion && (
                        <p className="text-[10px] text-amber-500 dark:text-amber-400 mt-1">{strength.suggestion}</p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Konfirmasi Password Baru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ulangi Password Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCredPass.confirm ? 'text' : 'password'}
                    value={adminCredForm.confirmPassword}
                    onChange={(e) => setAdminCredForm({ ...adminCredForm, confirmPassword: e.target.value })}
                    placeholder="Ketik ulang password baru..."
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-amber-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCredPass(p => ({ ...p, confirm: !p.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showCredPass.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {adminCredForm.confirmPassword && adminCredForm.newPassword !== adminCredForm.confirmPassword && (
                  <span className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Konfirmasi password belum sama
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAdminCredModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={adminCredLoading}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-glow transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {adminCredLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{adminCredLoading ? 'Memproses...' : 'Simpan Kredensial Baru'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: TAMBAH USER ================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleCreateUser} className="glass-card max-w-md w-full p-6 rounded-3xl shadow-2xl border-2 border-emerald-500/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <h3 className="font-heading font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Tambah Pengguna Baru</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username Akun (Untuk Login)
                </label>
                <input
                  type="text"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  placeholder="contoh: farhan_x"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="Nama lengkap santri / pembina"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Peran (Role)
                  </label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="user" className="dark:bg-obsidian-900">User / Siswa</option>
                    <option value="admin" className="dark:bg-obsidian-900">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kelas
                  </label>
                  <select
                    value={newUserData.kelas}
                    onChange={(e) => setNewUserData({ ...newUserData, kelas: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.name} className="dark:bg-obsidian-900">
                        {c.name}
                      </option>
                    ))}
                    <option value="Semua Kelas" className="dark:bg-obsidian-900">Semua Kelas (Admin)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password Akun
                </label>
                <input
                  type="text"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Minimal 3 karakter..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow transition flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Simpan Pengguna</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: EDIT USER ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleUpdateUser} className="glass-card max-w-md w-full p-6 rounded-3xl shadow-2xl border-2 border-emerald-500/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <h3 className="font-heading font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Edit Pengguna: @{editingUser.username}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Peran (Role)
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="user" className="dark:bg-obsidian-900">User / Siswa</option>
                    <option value="admin" className="dark:bg-obsidian-900">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kelas
                  </label>
                  <select
                    value={editingUser.kelas || 'X-A'}
                    onChange={(e) => setEditingUser({ ...editingUser, kelas: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.name} className="dark:bg-obsidian-900">
                        {c.name}
                      </option>
                    ))}
                    <option value="Semua Kelas" className="dark:bg-obsidian-900">Semua Kelas (Admin)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ganti Password
                </label>
                <input
                  type="text"
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  placeholder="Password akun..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: TAMBAH KELAS ================= */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleCreateClass} className="glass-card max-w-md w-full p-6 rounded-3xl shadow-2xl border-2 border-emerald-500/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <h3 className="font-heading font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Tambah Kelas Baru</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddClassModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kelas
                </label>
                <input
                  type="text"
                  value={newClassData.name}
                  onChange={(e) => setNewClassData({ ...newClassData, name: e.target.value })}
                  placeholder="Contoh: X-D atau XII-AGAMA"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Wali Kelas / Pembina
                </label>
                <input
                  type="text"
                  value={newClassData.waliKelas}
                  onChange={(e) => setNewClassData({ ...newClassData, waliKelas: e.target.value })}
                  placeholder="Contoh: Ust. H. Syarifuddin, M.Pd"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Santri
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={newClassData.siswaCount}
                    onChange={(e) => setNewClassData({ ...newClassData, siswaCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gedung / Lokasi
                  </label>
                  <input
                    type="text"
                    value={newClassData.gedung}
                    onChange={(e) => setNewClassData({ ...newClassData, gedung: e.target.value })}
                    placeholder="Gedung A Lt. 1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAddClassModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow transition flex items-center justify-center gap-1.5"
              >
                <Building className="w-3.5 h-3.5" />
                <span>Simpan Kelas</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: EDIT KELAS ================= */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleUpdateClass} className="glass-card max-w-md w-full p-6 rounded-3xl shadow-2xl border-2 border-emerald-500/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <h3 className="font-heading font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Edit Kelas: {editingClass.name}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingClass(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kelas
                </label>
                <input
                  type="text"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Wali Kelas / Pembina
                </label>
                <input
                  type="text"
                  value={editingClass.waliKelas}
                  onChange={(e) => setEditingClass({ ...editingClass, waliKelas: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Santri
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={editingClass.siswaCount}
                    onChange={(e) => setEditingClass({ ...editingClass, siswaCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gedung / Lokasi
                  </label>
                  <input
                    type="text"
                    value={editingClass.gedung || ''}
                    onChange={(e) => setEditingClass({ ...editingClass, gedung: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: EDIT KRITERIA CHECKLIST ================= */}
      {editingCriteria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleUpdateCriteria} className="glass-card max-w-md w-full p-6 rounded-3xl shadow-2xl border-2 border-emerald-500/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <h3 className="font-heading font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Edit Aspek Checklist 5R</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingCriteria(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Aspek
                </label>
                <input
                  type="text"
                  value={editingCriteria.title}
                  onChange={(e) => setEditingCriteria({ ...editingCriteria, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Standar 5R
                </label>
                <textarea
                  rows="2"
                  value={editingCriteria.desc}
                  onChange={(e) => setEditingCriteria({ ...editingCriteria, desc: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bobot Poin (Maks. 50)
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={editingCriteria.points}
                  onChange={(e) => setEditingCriteria({ ...editingCriteria, points: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditingCriteria(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= HEADER PANEL ADMIN ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl glass-card border-2 border-emerald-500/30 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('home')}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-emerald-50 text-slate-700 dark:bg-obsidian-900 dark:hover:bg-emerald-500/20 dark:text-slate-300 transition flex items-center gap-1.5 text-xs font-bold"
            title="Kembali ke Beranda Hub"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Beranda</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40">
                Pusat Kontrol Utama
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Tim Sarpras & PLP MPI 2026</span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Shield className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              <span>Panel Administrator Monitoring</span>
            </h1>
          </div>
        </div>

        {/* Global Admin Subtabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-obsidian-900 border border-emerald-500/25">
          <button
            onClick={() => setActiveTab('statistik')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'statistik'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Statistik & Grafik</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Kelola User ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('kelas')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'kelas'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Kelola Kelas ({classes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Peta Aduan GPS</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'checklist'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Edit Form 5R</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('keamanan');
              refreshAuditLogs();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'keamanan'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Keamanan & Audit</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdminCredModal}
            className="px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-sm"
            title="Ganti Username & Password Akun Administrator"
          >
            <Key className="w-3.5 h-3.5 text-amber-500" />
            <span>Kredensial Admin</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: STATISTIK & GRAFIK LENGKAP ================= */}
      {activeTab === 'statistik' && (
        <div className="space-y-6">
          {/* Top Bar with Excel Comprehensive Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-emerald-500/25">
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Pusat Statistik & Analitik Monitoring Kampus</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data terintegrasi dari Piket 5R, Bank Sampah Eco-Point, dan Sarpras Sekolah
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportAllComprehensive}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 text-white font-bold text-xs shadow-glow transition flex items-center gap-2 self-start sm:self-auto"
              title="Unduh seluruh rekapitulasi data sistem dalam 1 file Excel multi-sheet"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh Laporan Lengkap (.xlsx Multi-Sheet)</span>
            </button>
          </div>
          
          {/* Top 6 KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="glass-card rounded-2xl p-4 border border-emerald-500/25">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Total User</span>
                <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="font-heading font-black text-2xl text-slate-900 dark:text-white">{totalUsers}</div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">Akun Terdaftar</div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-emerald-500/25">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Total Kelas</span>
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="font-heading font-black text-2xl text-slate-900 dark:text-white">{totalClasses}</div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">Rombel Aktif</div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-emerald-500/25">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Skor Rata-rata 5R</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="font-heading font-black text-2xl text-emerald-600 dark:text-emerald-400">{avgCleanScore}%</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {verifiedCleanChecks.length} Terverifikasi {pendingCleanChecks > 0 && `(${pendingCleanChecks} Pending)`}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-emerald-500/25">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Total Sampah</span>
                <Recycle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="font-heading font-black text-2xl text-slate-900 dark:text-white">{totalWastePcs}</div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mt-0.5">Unit/Pcs Terpilah</div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-emerald-500/25">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Poin Beredar</span>
                <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="font-heading font-black text-2xl text-amber-600 dark:text-amber-400">{totalEcoPoints}</div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mt-0.5">Poin Hijau Kelas</div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-emerald-500/25">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span>Aduan Sarpras</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
              </div>
              <div className="font-heading font-black text-2xl text-slate-900 dark:text-white">{totalReports}</div>
              <div className="text-[10px] text-teal-700 dark:text-teal-400 font-bold mt-0.5">{solvedReports} Tuntas Selesai</div>
            </div>
          </div>

          {/* ================= 2 COLUMN CHARTS SECTION (CHART.JS) ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* GRAFIK 1: SKOR KEBERSIHAN 5R TIAP KELAS (CHART.JS BAR) */}
            <div className="glass-card rounded-3xl p-6 border border-emerald-500/25 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Grafik Skor Kebersihan 5R per Kelas (Chart.js)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Standar minimal target sekolah: 80%
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Target: 80%
                </span>
              </div>

              {/* Chart.js Bar Component */}
              <ClassScoreBarChart data={classScoresData} />
            </div>

            {/* GRAFIK 2: KOMPOSISI JUMLAH SAMPAH TERPILAH (CHART.JS DOUGHNUT) */}
            <div className="glass-card rounded-3xl p-6 border border-emerald-500/25 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>Komposisi Sampah Daur Ulang (Chart.js)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Berdasarkan unit fisik daur ulang terverifikasi
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-500/20">
                  Total: {totalWastePcs} Pcs
                </span>
              </div>

              {/* Chart.js Doughnut Component */}
              <WasteCompositionDoughnutChart data={wasteBreakdown} total={totalWastePcs} />
            </div>

            {/* GRAFIK 3: RASIO STATUS ADUAN SARPRAS (CHART.JS DOUGHNUT) */}
            <div className="glass-card rounded-3xl p-6 border border-emerald-500/25 space-y-4 lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Distribusi & Rasio Status Penanganan Sarpras (Chart.js)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pemantauan efektivitas penyelesaian masalah kebersihan & fasilitas sekolah
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>{solvedReports} Selesai</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>{inProgressReports} Diproses</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>{newReports} Baru</span>
                  </span>
                </div>
              </div>

              {/* Chart.js Report Status Doughnut Component */}
              <ReportStatusChart 
                solved={solvedReports} 
                inProgress={inProgressReports} 
                fresh={newReports} 
              />
            </div>
          </div>

          {/* Quick Shortcuts to feature managers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setActivePage('clean-check')}
              className="p-4 rounded-2xl glass-card border border-emerald-500/20 hover:border-emerald-500/50 transition text-left space-y-1"
            >
              <div className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                <span>Rekap Piket Kelas</span>
                <ClipboardCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Buka tabel rekap detail & checklist santri harian</p>
            </button>

            <button
              onClick={() => setActivePage('eco-point')}
              className="p-4 rounded-2xl glass-card border border-amber-500/20 hover:border-amber-500/50 transition text-left space-y-1"
            >
              <div className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                <span>Verifikasi Setoran Sampah</span>
                <Recycle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Validasi jumlah sampah & beri poin ke akun kelas</p>
            </button>

            <button
              onClick={() => setActivePage('green-report')}
              className="p-4 rounded-2xl glass-card border border-rose-500/20 hover:border-rose-500/50 transition text-left space-y-1"
            >
              <div className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                <span>Monitoring Aduan & Peta</span>
                <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tindak lanjuti laporan kerusakan & sampah di lokasi</p>
            </button>
          </div>

        </div>
      )}

      {/* ================= TAB 2: MANAJEMEN USER (CRUD USER) ================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-emerald-500/25">
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Manajemen Pengguna Sistem (CRUD User)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Admin berwenang melihat semua user, menambah, mengedit, dan menghapus akun
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cari user / nama / kelas..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Role filter */}
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="ALL">Semua Peran</option>
                <option value="user">User / Siswa</option>
                <option value="admin">Administrator</option>
              </select>

              {/* Tombol Ekspor User Excel */}
              <button
                type="button"
                onClick={handleExportUsers}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                title="Unduh seluruh data pengguna ke format Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Unduh Data User (.xlsx)</span>
              </button>

              {/* Tambah User Button */}
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow transition flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tambah User</span>
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="glass-card rounded-2xl overflow-hidden border border-emerald-500/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-50/80 dark:bg-emerald-950/50 border-b border-emerald-500/20 text-slate-700 dark:text-emerald-300">
                  <tr>
                    <th className="py-3 px-4 font-bold">Username</th>
                    <th className="py-3 px-4 font-bold">Nama Lengkap</th>
                    <th className="py-3 px-4 font-bold">Peran (Role)</th>
                    <th className="py-3 px-4 font-bold">Kelas</th>
                    <th className="py-3 px-4 font-bold">Password</th>
                    <th className="py-3 px-4 font-bold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/10">
                  {filteredUsers.map((u) => (
                    <tr key={u.username} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        @{u.username}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {u.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border inline-flex items-center gap-1 ${
                          u.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                        }`}>
                          {u.role === 'admin' ? (
                            <>
                              <Shield className="w-3 h-3" />
                              <span>Administrator</span>
                            </>
                          ) : (
                            <>
                              <Users className="w-3 h-3" />
                              <span>User Siswa</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-semibold">
                        {u.kelas || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                        •••• ({u.password})
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingUser({ ...u })}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                            title="Edit User"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.username)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Hapus User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: MANAJEMEN KELAS (CRUD KELAS) ================= */}
      {activeTab === 'kelas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-emerald-500/25">
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Manajemen Data Kelas Sekolah (CRUD Kelas)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola rombel kelas aktif, nama wali kelas/pembina, dan jumlah santri
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleExportClasses}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                title="Unduh data kelas ke format Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Unduh Data Kelas (.xlsx)</span>
              </button>

              <button
                onClick={() => setShowAddClassModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow transition flex items-center gap-1.5"
              >
                <Building className="w-3.5 h-3.5" />
                <span>Tambah Kelas Baru</span>
              </button>
            </div>
          </div>

          {/* Classes Table */}
          <div className="glass-card rounded-2xl overflow-hidden border border-emerald-500/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-50/80 dark:bg-emerald-950/50 border-b border-emerald-500/20 text-slate-700 dark:text-emerald-300">
                  <tr>
                    <th className="py-3 px-4 font-bold">Nama Kelas</th>
                    <th className="py-3 px-4 font-bold">Wali Kelas / Pembina</th>
                    <th className="py-3 px-4 font-bold text-center">Jumlah Santri</th>
                    <th className="py-3 px-4 font-bold">Lokasi / Gedung</th>
                    <th className="py-3 px-4 font-bold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/10">
                  {classes.map((c) => (
                    <tr key={c.id} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 transition">
                      <td className="py-3 px-4 font-heading font-black text-sm text-slate-900 dark:text-white">
                        Kelas {c.name}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {c.waliKelas}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-700 dark:text-emerald-400">
                        {c.siswaCount} Siswa
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {c.gedung || 'Gedung Utama'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingClass({ ...c })}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                            title="Edit Kelas"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClass(c.id, c.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Hapus Kelas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: PETA SEBARAN ADUAN GPS (ADMIN MAP) ================= */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-emerald-500/25">
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Peta Interaktif Sebaran Titik Aduan GPS Kampus</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Peta geospasial titik kerusakan fasilitas dan timbunan sampah yang dilaporkan santri & tim
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportReportsAdmin}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                title="Unduh rekap aduan sarpras ke format Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Unduh Rekap Sarpras (.xlsx)</span>
              </button>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 font-semibold"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Baru</span>
                <span className="flex items-center gap-1 font-semibold"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Diproses</span>
                <span className="flex items-center gap-1 font-semibold"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Selesai</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-4 border border-emerald-500/30">
            <ReportMap reports={greenReports} height="520px" zoom={17} />
          </div>
        </div>
      )}

      {/* ================= TAB 5: EDIT FORMULIR CHECKLIST 5R ================= */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-emerald-500/25">
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Editor Formulir Lembar Checklist Kebersihan Harian (5R)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ubah, tambah, atau hapus butir indikator penilaian piket yang tampil pada formulir santri
              </p>
            </div>

            <button
              onClick={async () => {
                const confirmed = await showConfirm({
                  title: 'Reset Standar 5R?',
                  text: 'Kembalikan semua kriteria formulir checklist ke standar awal 5R?',
                  confirmButtonText: 'Ya, Reset'
                });
                if (confirmed) {
                  resetCriteria();
                  showSuccess('Berhasil Direset', 'Kriteria berhasil direset ke standar 5R.');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-obsidian-900 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950 transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Standar 5R</span>
            </button>
          </div>

          {/* Form Tambah Indikator */}
          <form onSubmit={handleAddCriteria} className="glass-card rounded-2xl p-5 border border-emerald-500/25 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Tambah Indikator Penilaian Baru</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Judul Aspek Kebersihan</label>
                <input
                  type="text"
                  value={newCriteriaData.title}
                  onChange={(e) => setNewCriteriaData({ ...newCriteriaData, title: e.target.value })}
                  placeholder="Contoh: Kerapian Mading Kelas & Tanaman Hias"
                  className="w-full bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Deskripsi Standar 5R</label>
                <input
                  type="text"
                  value={newCriteriaData.desc}
                  onChange={(e) => setNewCriteriaData({ ...newCriteriaData, desc: e.target.value })}
                  placeholder="Contoh: Bebas debu, disiram rapi"
                  className="w-full bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bobot Poin</label>
                <input
                  type="number"
                  value={newCriteriaData.points}
                  onChange={(e) => setNewCriteriaData({ ...newCriteriaData, points: Number(e.target.value) })}
                  min={5}
                  max={50}
                  className="w-full bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white text-center font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambahkan ke Formulir</span>
            </button>
          </form>

          {/* List Criteria with Edit & Delete */}
          <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Daftar Indikator Formulir Aktif ({formConfig.criteria.length} Butir)
            </h4>

            <div className="space-y-2">
              {formConfig.criteria.map((crit, idx) => (
                <div key={crit.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-obsidian-900/60 border border-slate-200 dark:border-emerald-500/15">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 w-5">#{idx + 1}</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{crit.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{crit.desc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      {crit.points} Poin
                    </span>
                    <button
                      onClick={() => setEditingCriteria({ ...crit })}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                      title="Edit Indikator Ini"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        const confirmed = await showConfirm({
                          title: 'Hapus Indikator?',
                          text: 'Hapus indikator ini dari checklist?',
                          isDanger: true,
                          confirmButtonText: 'Ya, Hapus'
                        });
                        if (confirmed) {
                          deleteCriteria(crit.id);
                          showToast('Indikator berhasil dihapus', 'success');
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Hapus Indikator Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 6: KEAMANAN & AUDIT ================= */}
      {activeTab === 'keamanan' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Banner Card: Akun Admin & Quick Action */}
          <div className="glass-card rounded-3xl p-6 border-2 border-emerald-500/30 relative overflow-hidden shadow-xl">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-emerald-500/20 to-teal-500/0 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-glow">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Sistem Keamanan Aktif
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Enkripsi SHA-256 + Anti Brute Force</span>
                  </div>
                  <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white mt-1">
                    Kredensial & Audit Keamanan Sistem
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Akun Administrator Aktif: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">@{user?.username}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAdminCredModal}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-glow transition flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Ganti Username & Password Admin</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Security Architecture Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Pilar 1: Anti Brute Force */}
            <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white">
                  Proteksi Anti Brute-Force
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Maksimal <strong>5 kali percobaan salah</strong>, akun otomatis dikunci dengan countdown <strong>60 detik</strong>.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-emerald-500/20 flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-500">Status Rate Limit</span>
                <span className="text-emerald-600 dark:text-emerald-400">Aktif & Siaga</span>
              </div>
            </div>

            {/* Pilar 2: Cryptographic Hashing */}
            <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white">
                  Enkripsi Kriptografis
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Hashing menggunakan <strong>SHA-256 Web Crypto API</strong> dan perkuatan salt terisolasi, password tidak disimpan polos.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-emerald-500/20 flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-500">Algoritma</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">SHA-256 + Salt</span>
              </div>
            </div>

            {/* Pilar 3: Zero Backdoors */}
            <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white">
                  Anti-Bypass & Sanitasi
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Semua jalan pintas/hardcoded bypass dihapus total. Input disaring terhadap injeksi kode XSS dan karakter berbahaya.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-emerald-500/20 flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-500">Injeksi & Bypass</span>
                <span className="text-emerald-600 dark:text-emerald-400">Terproteksi</span>
              </div>
            </div>

            {/* Pilar 4: Audit Log */}
            <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <History className="w-5 h-5" />
                </div>
                <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white">
                  Pencatatan Log Audit
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Setiap aktivitas login sukses, kegagalan sandi, pemblokiran brute force, dan perubahan kredensial tercatat otomatis.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-emerald-500/20 flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-500">Total Log Tercatat</span>
                <span className="text-blue-600 dark:text-blue-400">{securityLogs.length} Entri</span>
              </div>
            </div>

          </div>

          {/* Security Audit Log Table */}
          <div className="glass-card rounded-3xl p-6 border border-emerald-500/20 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-emerald-500/20">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">
                    Riwayat Audit Keamanan Sistem
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Memantau riwayat login, upaya pembobolan brute-force, dan perubahan kredensial
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={refreshAuditLogs}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-emerald-500/30 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-obsidian-900 transition flex items-center gap-1.5 text-xs font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAuditLogs}
                  className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center gap-1.5 text-xs font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bersihkan Log</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-emerald-500/20 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Waktu</th>
                    <th className="py-3 px-3">Tipe Event</th>
                    <th className="py-3 px-3">Keterangan Aktivitas</th>
                    <th className="py-3 px-3">Pengguna / Subjek</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-emerald-500/10">
                  {securityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                        Belum ada catatan aktivitas keamanan di sistem.
                      </td>
                    </tr>
                  ) : (
                    securityLogs.slice(0, 30).map((log) => {
                      const isSuccess = log.type === 'LOGIN_SUCCESS' || log.type === 'ADMIN_CREDENTIALS_CHANGED';
                      const isDanger = log.type === 'BRUTE_FORCE_LOCKOUT' || log.type === 'LOGIN_BLOCKED_RATE_LIMIT';
                      const isWarning = log.type === 'FAILED_LOGIN_ATTEMPT' || log.type === 'PASSWORD_CHANGE_FAILED';

                      const badgeClass = isDanger
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        : isWarning
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : isSuccess
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-obsidian-900/40 transition">
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                              {log.type}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-medium">
                            {log.details}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                            {log.user || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
