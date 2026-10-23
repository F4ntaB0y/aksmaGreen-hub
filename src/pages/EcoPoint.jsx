import React, { useState } from 'react';
import { 
  Recycle, ArrowLeft, Award, CheckCircle2, XCircle, Clock, 
  TrendingUp, Plus, Trash2, Edit3, ShieldAlert, Sparkles, Hash, Gift,
  FileSpreadsheet, Shield, Settings, Camera, Image as ImageIcon, Eye,
  AlertTriangle, X
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { exportToExcel } from '../utils/excelExport';
import { showSuccess, showError, showWarning, showConfirm, showPrompt, showToast } from '../utils/sweetalert';

export default function EcoPoint({ setActivePage }) {
  const { 
    classes, 
    ecoPoints, 
    formConfig, 
    addEcoPointSubmission, 
    verifyEcoPoint, 
    updateEcoPointSubmission,
    rejectEcoPoint, 
    updateWasteTypes 
  } = useData();
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState(isAdmin ? 'antrean' : 'setor'); // 'setor' | 'leaderboard' | 'antrean' | 'editor'

  // Form State (Murni Jumlah Sampah, tanpa berat)
  const [selectedClass, setSelectedClass] = useState(user?.kelas || classes[0]?.name || 'X-A');
  const [contributor, setContributor] = useState(user?.name || '');
  const [wasteTypeId, setWasteTypeId] = useState(formConfig.wasteTypes[0]?.id || 'plastik');
  const [quantity, setQuantity] = useState(10);
  const [photoProof, setPhotoProof] = useState(null);
  const [previewPhotoModal, setPreviewPhotoModal] = useState(null);

  // Admin Waste Editor State
  const [newTypeName, setNewTypeName] = useState('');
  const [newPointsPerUnit, setNewPointsPerUnit] = useState(10);
  const [newUnitName, setNewUnitName] = useState('pcs');
  const [newTypeDesc, setNewTypeDesc] = useState('');

  // Selected Waste Type & Points calculation
  const currentWaste = formConfig.wasteTypes.find(w => w.id === wasteTypeId) || formConfig.wasteTypes[0];
  const pointsPerUnit = currentWaste?.pointsPerUnit || 10;
  const unitLabel = currentWaste?.unit || 'pcs';
  const estimatedPoints = Math.round((Number(quantity) || 0) * pointsPerUnit);

  // Handle Photo Upload with Image Compression (Max 900px, 0.75 quality)
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError('Ukuran Terlalu Besar', 'Maksimal ukuran foto adalah 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 900;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          setPhotoProof(compressed);
          showToast('Foto bukti berhasil dimuat!', 'success');
        } catch {
          setPhotoProof(event.target.result);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSetorSubmit = (e) => {
    e.preventDefault();
    if (isAdmin) {
      showWarning('Akses Khusus Siswa', 'Akun Admin bertugas untuk memverifikasi setoran & monitoring poin. Pengisian setoran sampah hanya dilakukan oleh akun Siswa/User!');
      setActiveTab('antrean');
      return;
    }

    if (!contributor.trim()) {
      showWarning('Nama Penyetor Kosong', 'Silakan masukkan nama penyetor sampah!');
      return;
    }
    if (Number(quantity) <= 0) {
      showWarning('Jumlah Tidak Valid', 'Jumlah sampah yang disetor harus lebih dari 0!');
      return;
    }
    if (!photoProof) {
      showWarning('Foto Bukti Wajib', 'Silakan lampirkan foto fisik sampah daur ulang sebagai bukti sebelum mengajukan!');
      return;
    }

    addEcoPointSubmission({
      kelas: selectedClass,
      contributor: contributor.trim(),
      wasteTypeName: currentWaste.name,
      wasteTypeId: currentWaste.id,
      quantity: Number(quantity),
      unit: unitLabel,
      points: estimatedPoints,
      photoProof: photoProof,
      date: new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
    });

    setPhotoProof(null);
    showSuccess(
      'Setoran Berhasil Diajukan!', 
      `Setoran ${quantity} ${unitLabel} (${currentWaste.name}) berhasil dikirim.\n\nPoin kelas akan bertambah setelah diverifikasi oleh Admin.`
    );
    setActiveTab('antrean');
  };

  const handleVerify = (id, curQty, curPoints) => {
    verifyEcoPoint(id, curQty, curPoints);
    showToast('Setoran berhasil diverifikasi! Poin kelas telah bertambah.', 'success');
  };

  // Koreksi / Edit Poin Admin (jika laporan direkayasa)
  const handleEditEcoPoint = async (item) => {
    const isDark = document.documentElement.classList.contains('dark');
    const { value: formValues } = await Swal.fire({
      title: '<span style="font-size: 16px; font-weight: 800;">Koreksi / Sesuaikan Poin Setoran</span>',
      html: `
        <div style="text-align: left; font-size: 13px; color: ${isDark ? '#cbd5e1' : '#334155'};">
          <div style="margin-bottom: 12px; padding: 10px; background: ${isDark ? '#0f172a' : '#f1f5f9'}; border-radius: 10px; border: 1px solid ${isDark ? '#1e293b' : '#e2e8f0'};">
            <div><strong>Kelas:</strong> ${item.kelas} • <strong>Penyetor:</strong> ${item.contributor}</div>
            <div><strong>Kategori:</strong> ${item.wasteTypeName}</div>
            <div><strong>Data Asli:</strong> ${item.originalQuantity || item.quantity} ${item.unit || 'pcs'} (${item.originalPoints || item.points} Poin)</div>
          </div>
          <div style="margin-bottom: 10px;">
            <label style="display:block; font-weight: 600; margin-bottom: 4px;">Jumlah Sampah Riil Terverifikasi (${item.unit || 'pcs'}):</label>
            <input id="swal-edit-qty" type="number" min="0" value="${item.quantity}" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #10b981; background: ${isDark ? '#020617' : '#ffffff'}; color: inherit;" />
          </div>
          <div style="margin-bottom: 10px;">
            <label style="display:block; font-weight: 600; margin-bottom: 4px;">Poin Akhir yang Diberikan ke Kelas:</label>
            <input id="swal-edit-points" type="number" min="0" value="${item.points}" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #10b981; background: ${isDark ? '#020617' : '#ffffff'}; color: inherit;" />
            <small style="color: #f59e0b; display: block; margin-top: 3px;">* Admin dapat menurunkan poin jika laporan terbukti direkayasa/dilebih-lebihkan.</small>
          </div>
          <div>
            <label style="display:block; font-weight: 600; margin-bottom: 4px;">Catatan Koreksi Admin (Alasan):</label>
            <textarea id="swal-edit-notes" rows="2" placeholder="Contoh: Jumlah riil pada foto hanya 5 botol, bukan 20 botol." style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #94a3b8; background: ${isDark ? '#020617' : '#ffffff'}; color: inherit;">${item.adminNotes || ''}</textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan & Konfirmasi Poin',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      background: isDark ? '#0b1322' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      preConfirm: () => {
        const qty = parseInt(document.getElementById('swal-edit-qty').value, 10);
        const pts = parseInt(document.getElementById('swal-edit-points').value, 10);
        const notes = document.getElementById('swal-edit-notes').value;
        if (isNaN(qty) || isNaN(pts)) {
          Swal.showValidationMessage('Jumlah sampah dan poin harus berupa angka!');
          return false;
        }
        return { qty, pts, notes };
      }
    });

    if (formValues) {
      if (item.status === 'pending') {
        verifyEcoPoint(item.id, formValues.qty, formValues.pts, formValues.notes);
      } else {
        updateEcoPointSubmission(item.id, formValues.pts, formValues.qty, formValues.notes);
      }
      showToast('Poin dan jumlah sampah berhasil dikoreksi!', 'success');
    }
  };

  const handleReject = async (id) => {
    const reason = await showPrompt({
      title: 'Tolak Setoran Sampah',
      text: 'Masukkan alasan penolakan (misal: sampah kotor / belum terpilah / direkayasa):',
      inputPlaceholder: 'Tuliskan alasan penolakan...',
      confirmButtonText: 'Tolak Setoran',
      required: true
    });
    if (reason !== null && reason.trim()) {
      rejectEcoPoint(id, reason.trim());
      showToast('Setoran sampah ditolak', 'warning');
    }
  };

  const handleAddWasteType = (e) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    const newItem = {
      id: 'waste_' + Date.now(),
      name: newTypeName.trim(),
      pointsPerUnit: Number(newPointsPerUnit) || 10,
      unit: newUnitName.trim() || 'pcs',
      desc: newTypeDesc.trim() || 'Kategori sampah terpilah'
    };
    updateWasteTypes([...formConfig.wasteTypes, newItem]);
    setNewTypeName('');
    setNewUnitName('pcs');
    setNewTypeDesc('');
    showSuccess('Kategori Ditambahkan', 'Kategori jenis sampah baru berhasil ditambahkan!');
  };

  const handleDeleteWasteType = async (id) => {
    const confirmed = await showConfirm({
      title: 'Hapus Kategori Sampah?',
      text: 'Hapus jenis kategori sampah ini dari sistem?',
      isDanger: true,
      confirmButtonText: 'Ya, Hapus'
    });
    if (confirmed) {
      updateWasteTypes(formConfig.wasteTypes.filter(w => w.id !== id));
      showToast('Kategori sampah berhasil dihapus', 'success');
    }
  };

  // Leaderboard Calculation by Class
  const classLeaderboard = classes.map(c => {
    const verifiedClassSubmissions = ecoPoints.filter(p => p.kelas === c.name && p.status === 'verified');
    const totalPoints = verifiedClassSubmissions.reduce((sum, item) => sum + (item.points || 0), 0);
    const totalItems = verifiedClassSubmissions.reduce((sum, item) => sum + (item.quantity || 0), 0);
    return {
      className: c.name,
      waliKelas: c.waliKelas,
      totalPoints,
      totalItems,
      submissionsCount: verifiedClassSubmissions.length
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  const totalVerifiedItems = ecoPoints
    .filter(p => p.status === 'verified')
    .reduce((sum, item) => sum + (item.quantity || 0), 0);

  const totalVerifiedPoints = ecoPoints
    .filter(p => p.status === 'verified')
    .reduce((sum, item) => sum + (item.points || 0), 0);

  // Export Riwayat Setoran ke Excel Spreadsheet (.xlsx)
  const handleExportTransactions = () => {
    if (ecoPoints.length === 0) {
      showWarning('Data Kosong', 'Belum ada data setoran sampah untuk diekspor!');
      return;
    }
    const dataToExport = ecoPoints.map((item, index) => ({
      'No': index + 1,
      'Tanggal': item.date,
      'Kelas': item.kelas,
      'Nama Penyetor': item.contributor,
      'Kategori Sampah': item.wasteTypeName,
      'Jumlah Sampah': item.quantity,
      'Satuan': item.unit || 'pcs',
      'Poin Diperoleh': item.points,
      'Status Verifikasi': item.status === 'verified' ? 'Terverifikasi' : item.status === 'pending' ? 'Menunggu Verifikasi' : 'Ditolak',
      'Alasan Ditolak': item.rejectReason || '-'
    }));
    exportToExcel(dataToExport, 'Data_Setoran_Sampah_EcoPoint', 'Riwayat Setoran');
  };

  // Export Klasemen Peringkat Hijau ke Excel (.xlsx)
  const handleExportLeaderboard = () => {
    if (classLeaderboard.length === 0) {
      showWarning('Data Kosong', 'Belum ada data klasemen untuk diekspor!');
      return;
    }
    const dataToExport = classLeaderboard.map((item, index) => ({
      'Peringkat': index + 1,
      'Nama Kelas': item.className,
      'Wali Kelas': item.waliKelas,
      'Total Sampah (pcs)': item.totalItems,
      'Total Transaksi Setoran': item.submissionsCount,
      'Akumulasi Poin Hijau': item.totalPoints
    }));
    exportToExcel(dataToExport, 'Klasemen_Poin_Hijau_AKSMA', 'Klasemen Poin');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* ================= TOP HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('home')}
            className="p-2 rounded-xl bg-white/80 dark:bg-obsidian-900/80 border border-emerald-500/20 text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition shadow-sm"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                Fitur 2 • Bank Sampah
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Daur Ulang Berbasis Jumlah</span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
              AKSMA Eco-Point
            </h1>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-obsidian-900/90 border border-emerald-500/20 self-start sm:self-auto">
          {!isAdmin && (
            <button
              onClick={() => setActiveTab('setor')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'setor'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
              }`}
            >
              Setor Sampah
            </button>
          )}
          <button
            onClick={() => setActiveTab('antrean')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'antrean'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
            }`}
          >
            {isAdmin && <Shield className="w-3.5 h-3.5" />}
            <span>{isAdmin ? 'Verifikasi Setoran' : 'Riwayat & Status'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px]">
              {ecoPoints.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Klasemen Poin</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'editor'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Kelola Kategori</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= SUMMARY STATS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-emerald-500/20">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Total Sampah Terkumpul</div>
          <div className="font-heading font-black text-2xl text-slate-900 dark:text-white mt-1">
            {totalVerifiedItems.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">unit/pcs</span>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-emerald-500/20">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Total Poin Diberikan</div>
          <div className="font-heading font-black text-2xl text-amber-600 dark:text-amber-400 mt-1">
            {totalVerifiedPoints.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">pts</span>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-emerald-500/20">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Menunggu Verifikasi</div>
          <div className="font-heading font-black text-2xl text-slate-900 dark:text-white mt-1">
            {ecoPoints.filter(p => p.status === 'pending').length} <span className="text-xs font-normal text-slate-500">antrean</span>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-emerald-500/20">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Kelas Teratas</div>
          <div className="font-heading font-black text-lg text-emerald-600 dark:text-emerald-400 mt-1 truncate">
            {classLeaderboard[0]?.className || '-'}
          </div>
        </div>
      </div>

      {/* ================= TAB 1: FORMULIR SETOR SAMPAH (USER) ================= */}
      {activeTab === 'setor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSetorSubmit} className="lg:col-span-2 space-y-5">
            <div className="glass-card rounded-2xl p-6 border border-emerald-500/25 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-emerald-500/15">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Recycle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    Formulir Setoran Sampah Daur Ulang
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Input jumlah sampah yang disetorkan untuk dikonversikan menjadi poin kelas
                  </p>
                </div>
              </div>

              {/* Kelas & Penyetor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kelas Penyetor
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.name} className="dark:bg-obsidian-900 text-slate-900 dark:text-white">
                        Kelas {c.name} ({c.waliKelas})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Penyetor / Anggota
                  </label>
                  <input
                    type="text"
                    value={contributor}
                    onChange={(e) => setContributor(e.target.value)}
                    placeholder="Nama siswa/santri..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Jenis Sampah Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Pilih Kategori Sampah Terpilah
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formConfig.wasteTypes.map((waste) => (
                    <div
                      key={waste.id}
                      onClick={() => setWasteTypeId(waste.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                        wasteTypeId === waste.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50/80 dark:bg-obsidian-900/60 border-slate-200 dark:border-emerald-500/15 hover:border-emerald-500/40'
                      }`}
                    >
                      <div>
                        <div className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                          {waste.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {waste.desc}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-black">
                          +{waste.pointsPerUnit || 10} pts
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">/{waste.unit || 'pcs'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ================= JUMLAH SAMPAH INPUT (BUKAN BERAT) ================= */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Jumlah Sampah ({unitLabel})</span>
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tarif: <strong>{pointsPerUnit} poin</strong> per {unitLabel}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-32 px-3.5 py-2.5 rounded-xl bg-white dark:bg-obsidian-900 border border-emerald-500/40 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  
                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {[5, 10, 25, 50, 100].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setQuantity(val)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition border ${
                          quantity === val
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-obsidian-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-emerald-500/20 hover:border-emerald-500'
                        }`}
                      >
                        {val} {unitLabel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Estimasi Poin */}
                <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20 text-xs">
                  <span className="text-slate-600 dark:text-slate-300">Estimasi Perolehan Poin:</span>
                  <span className="font-heading font-black text-lg text-amber-600 dark:text-amber-400">
                    +{estimatedPoints} Poin
                  </span>
                </div>
              </div>

              {/* Bukti Foto Sampah Daur Ulang */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-obsidian-900/60 border border-emerald-500/25 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Foto Bukti Fisik Sampah Daur Ulang <span className="text-rose-500">*</span></span>
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Max 5MB (Kompresi Otomatis)
                  </span>
                </div>

                {photoProof ? (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-black/40 p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={photoProof} 
                        alt="Bukti Sampah" 
                        className="w-16 h-16 object-cover rounded-lg border border-white/20 cursor-pointer hover:opacity-90 transition"
                        onClick={() => setPreviewPhotoModal(photoProof)}
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Foto Bukti Fisik Terlampir</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Klik gambar untuk melihat pratinjau penuh
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotoProof(null)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 hover:bg-rose-100 text-xs font-semibold transition"
                    >
                      Hapus / Ganti
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 dark:border-emerald-500/30 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition group">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Ambil Foto Sampah atau Pilih dari Galeri
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Wajib melampirkan foto fisik tumpukan sampah daur ulang
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoChange} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white font-bold text-xs shadow-glow hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2"
              >
                <Recycle className="w-4 h-4" />
                <span>Ajukan Setoran Sampah</span>
              </button>
            </div>
          </form>

          {/* Info Card */}
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5 border border-emerald-500/25 space-y-3">
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Sistem Poin Hijau</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Poin dihitung murni berdasarkan <strong>jumlah fisik sampah</strong> yang berhasil diselamatkan dari TPS liar.
              </p>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-obsidian-900/60">
                  <span>10 Botol Plastik</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">100 Poin</strong>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-obsidian-900/60">
                  <span>20 Lembar Kertas</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">100 Poin</strong>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-obsidian-900/60">
                  <span>4 Kaleng Logam</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">100 Poin</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: ANTREAN & VERIFIKASI (ADMIN & RIWAYAT) ================= */}
      {activeTab === 'antrean' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-emerald-500/20">
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                {isAdmin ? 'Daftar Antrean Setoran Sampah (Verifikasi & Kontrol Admin)' : 'Riwayat Setoran Sampah'}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Total {ecoPoints.length} Pengajuan • {totalVerifiedPoints} Poin Terverifikasi
              </span>
            </div>

            <button
              type="button"
              onClick={handleExportTransactions}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
              title="Unduh seluruh data setoran sampah ke format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unduh Setoran Excel (.xlsx)</span>
            </button>
          </div>

          {ecoPoints.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center border border-emerald-500/20 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Recycle className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Belum Ada Pengajuan Setoran
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kumpulkan botol, kertas, kardus, atau kaleng untuk menyumbang poin bagi kelas Anda!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ecoPoints.map((item) => (
                <div
                  key={item.id}
                  className="glass-card rounded-2xl p-4 sm:p-5 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Thumbnail Bukti Foto */}
                    {item.photoProof ? (
                      <div className="relative group shrink-0">
                        <img 
                          src={item.photoProof} 
                          alt="Bukti" 
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-emerald-500/30 cursor-pointer shadow-sm group-hover:opacity-90 transition"
                          onClick={() => setPreviewPhotoModal(item.photoProof)}
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewPhotoModal(item.photoProof)}
                          className="absolute inset-0 bg-black/40 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          title="Perbesar Foto Bukti"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 dark:bg-obsidian-900 border border-dashed border-slate-300 dark:border-emerald-500/20 flex flex-col items-center justify-center text-slate-400 shrink-0">
                        <ImageIcon className="w-5 h-5" />
                        <span className="text-[9px] mt-1">Tanpa Foto</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                          Kelas {item.kelas}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {item.contributor}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.date}</span>
                      </div>

                      <div className="font-heading font-bold text-sm text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                        <span>{item.wasteTypeName}</span>
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                          — Jumlah: <strong>{item.quantity} {item.unit || 'pcs'}</strong>
                        </span>
                        {item.originalQuantity && item.originalQuantity !== item.quantity && (
                          <span className="text-[10px] text-slate-400 line-through">
                            (Asli: {item.originalQuantity} {item.unit || 'pcs'})
                          </span>
                        )}
                      </div>

                      {/* Catatan Koreksi Admin jika direkayasa */}
                      {item.adminNotes && (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/25">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>Koreksi Admin: {item.adminNotes}</span>
                        </div>
                      )}

                      {item.rejectReason && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400">
                          Alasan Ditolak: {item.rejectReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-emerald-500/15">
                    <div className="text-right">
                      <div className="font-heading font-black text-base text-amber-600 dark:text-amber-400">
                        +{item.points} pts
                      </div>
                      {item.originalPoints && item.originalPoints !== item.points && (
                        <div className="text-[10px] text-slate-400 line-through">
                          Semula: +{item.originalPoints} pts
                        </div>
                      )}
                      <div className="text-[10px] uppercase font-bold mt-0.5">
                        {item.status === 'verified' ? (
                          <span className="text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Terverifikasi
                          </span>
                        ) : item.status === 'pending' ? (
                          <span className="text-amber-700 dark:text-amber-400 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Menunggu Validasi
                          </span>
                        ) : (
                          <span className="text-rose-700 dark:text-rose-400 inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Ditolak
                          </span>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        {item.status === 'pending' && (
                          <button
                            onClick={() => handleVerify(item.id, item.quantity, item.points)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition flex items-center gap-1"
                            title="Konfirmasi & Tambah Poin Kelas"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Validasi</span>
                          </button>
                        )}

                        {/* Tombol Edit/Koreksi Poin (Jika Direkayasa) */}
                        <button
                          onClick={() => handleEditEcoPoint(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1"
                          title="Koreksi / Sesuaikan Jumlah & Poin (jika laporan direkayasa)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{item.status === 'verified' ? 'Edit Poin' : 'Koreksi'}</span>
                        </button>

                        {item.status === 'pending' && (
                          <button
                            onClick={() => handleReject(item.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold transition flex items-center gap-1"
                            title="Tolak Pengajuan"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: LEADERBOARD KELAS ================= */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-emerald-500/20">
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Klasemen Peringkat Hijau Antar Kelas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Akumulasi poin dari total jumlah sampah daur ulang yang berhasil disetorkan
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportLeaderboard}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
              title="Unduh data klasemen peringkat kelas ke format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unduh Klasemen Excel (.xlsx)</span>
            </button>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border border-emerald-500/25">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-50/80 dark:bg-emerald-950/50 border-b border-emerald-500/20 text-slate-700 dark:text-emerald-300">
                  <tr>
                    <th className="py-3 px-4 font-bold">Peringkat</th>
                    <th className="py-3 px-4 font-bold">Kelas</th>
                    <th className="py-3 px-4 font-bold">Wali Kelas</th>
                    <th className="py-3 px-4 font-bold text-center">Jumlah Sampah</th>
                    <th className="py-3 px-4 font-bold text-center">Total Setoran</th>
                    <th className="py-3 px-4 font-bold text-right">Total Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/10">
                  {classLeaderboard.map((item, idx) => (
                    <tr 
                      key={item.className}
                      className={`hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 transition ${
                        idx === 0 ? 'bg-amber-500/10 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                          idx === 0 ? 'bg-amber-400 text-slate-950' :
                          idx === 1 ? 'bg-slate-300 text-slate-950' :
                          idx === 2 ? 'bg-amber-700 text-white' :
                          'text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        Kelas {item.className}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {item.waliKelas}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {item.totalItems} pcs
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {item.submissionsCount}x
                      </td>
                      <td className="py-3 px-4 text-right font-heading font-black text-amber-600 dark:text-amber-400 text-sm">
                        {item.totalPoints.toLocaleString('id-ID')} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: ADMIN EDITOR KATEGORI SAMPAH ================= */}
      {isAdmin && activeTab === 'editor' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={handleAddWasteType} className="glass-card rounded-2xl p-6 border border-emerald-500/25 space-y-4">
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Tambah Kategori Sampah Baru</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Kategori Sampah
              </label>
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Contoh: Tutup Botol Galon / Styrofoam"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Poin per Satuan
                </label>
                <input
                  type="number"
                  min="1"
                  value={newPointsPerUnit}
                  onChange={(e) => setNewPointsPerUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Satuan Jumlah
                </label>
                <input
                  type="text"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder="pcs / buah / lembar"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Deskripsi / Contoh Sampah
              </label>
              <input
                type="text"
                value={newTypeDesc}
                onChange={(e) => setNewTypeDesc(e.target.value)}
                placeholder="Contoh: Tutup galon plastik bersih warna biru"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition"
            >
              Simpan Kategori Sampah
            </button>
          </form>

          {/* List Kategori */}
          <div className="glass-card rounded-2xl p-6 border border-emerald-500/25 space-y-3">
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              Daftar Kategori Sampah Aktif
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {formConfig.wasteTypes.map((waste) => (
                <div key={waste.id} className="p-3 rounded-xl bg-slate-50 dark:bg-obsidian-900/60 border border-slate-200 dark:border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{waste.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{waste.desc}</div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">
                      {waste.pointsPerUnit} poin / {waste.unit || 'pcs'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteWasteType(waste.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                    title="Hapus kategori"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhotoModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewPhotoModal(null)}
        >
          <div 
            className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-emerald-500/20 bg-obsidian-900/80">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">Bukti Foto Fisik Sampah Daur Ulang</span>
              </div>
              <button 
                onClick={() => setPreviewPhotoModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/50 max-h-[75vh] overflow-auto">
              <img 
                src={previewPhotoModal} 
                alt="Bukti Foto Sampah" 
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg border border-white/10"
              />
            </div>
            <div className="p-3 bg-obsidian-900/80 border-t border-emerald-500/20 flex justify-end">
              <button
                onClick={() => setPreviewPhotoModal(null)}
                className="py-1.5 px-4 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold transition"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

