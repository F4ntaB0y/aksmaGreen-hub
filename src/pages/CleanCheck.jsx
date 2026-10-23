import React, { useState } from 'react';
import { 
  ClipboardCheck, ArrowLeft, CheckCircle2, QrCode, Sparkles, 
  Trash2, Plus, Edit3, Filter, Award, ShieldAlert, CheckSquare, Square,
  RotateCcw, Check, X, FileSpreadsheet, Shield, Camera, Image as ImageIcon,
  Clock, XCircle, Eye, AlertTriangle
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { exportToExcel } from '../utils/excelExport';
import { showSuccess, showError, showWarning, showConfirm, showToast, showPrompt } from '../utils/sweetalert';

export default function CleanCheck({ setActivePage }) {
  const { 
    classes, 
    cleanChecks, 
    formConfig, 
    addCleanCheck, 
    verifyCleanCheck,
    updateCleanCheckScore,
    rejectCleanCheck,
    deleteCleanCheck, 
    addCriteria, 
    updateCriteriaItem, 
    deleteCriteria, 
    resetCriteria 
  } = useData();
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState(isAdmin ? 'rekap' : 'form'); // 'form' | 'rekap' | 'editor'
  
  // Form State
  const [selectedClass, setSelectedClass] = useState(user?.kelas || classes[0]?.name || 'X-A');
  const [petugasName, setPetugasName] = useState(user?.name || '');
  const [checkedCriteria, setCheckedCriteria] = useState({});
  const [notes, setNotes] = useState('');
  const [photoProof, setPhotoProof] = useState(null); // DataURL bukti foto
  const [previewPhotoModal, setPreviewPhotoModal] = useState(null);
  const [filterClass, setFilterClass] = useState('ALL');

  // Admin Criteria Editor State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPoints, setNewPoints] = useState(20);

  // Edit Existing Criteria Modal/State
  const [editingCriteria, setEditingCriteria] = useState(null); // { id, title, desc, points }

  // Score Calculation
  const totalPossiblePoints = formConfig.criteria.reduce((sum, c) => sum + (c.points || 0), 0);
  const earnedPoints = formConfig.criteria.reduce((sum, c) => {
    return sum + (checkedCriteria[c.id] ? (c.points || 0) : 0);
  }, 0);
  const scorePercent = totalPossiblePoints > 0 ? Math.round((earnedPoints / totalPossiblePoints) * 100) : 0;

  const toggleCheck = (id) => {
    setCheckedCriteria(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const checkAll = () => {
    const all = {};
    formConfig.criteria.forEach(c => { all[c.id] = true; });
    setCheckedCriteria(all);
  };

  const uncheckAll = () => {
    setCheckedCriteria({});
  };

  // Handle Photo Upload with Image Compression (Max 1000px, 0.75 quality)
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
        } catch {
          setPhotoProof(event.target.result);
        }
      };
      img.onerror = () => {
        setPhotoProof(event.target.result);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isAdmin) {
      showWarning('Akses Khusus Siswa', 'Akun Admin bertugas untuk monitoring & validasi. Pengisian formulir piket dilakukan oleh akun Siswa/User!');
      setActiveTab('rekap');
      return;
    }

    if (!petugasName.trim()) {
      showWarning('Nama Petugas Kosong', 'Silakan masukkan nama petugas piket kelas!');
      return;
    }

    if (!photoProof) {
      showWarning('Bukti Foto Diperlukan', 'Harap sertakan minimal 1 foto bukti kondisi kelas agar Admin dapat memverifikasi!');
      return;
    }

    addCleanCheck({
      kelas: selectedClass,
      petugas: petugasName.trim(),
      score: scorePercent,
      originalScore: scorePercent,
      points: scorePercent,
      checkedCount: Object.values(checkedCriteria).filter(Boolean).length,
      totalCriteria: formConfig.criteria.length,
      photoProof: photoProof,
      notes: notes.trim(),
      date: new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
    });

    showSuccess(
      'Laporan Piket Terkirim!', 
      `Laporan Piket Kelas ${selectedClass} (Skor Diajukan: ${scorePercent}%) beserta bukti foto telah diajukan. Status: Menunggu Konfirmasi Admin.`
    );
    setNotes('');
    setPhotoProof(null);
    setCheckedCriteria({});
    setActiveTab('rekap');
  };

  // Admin Verification Actions
  const handleVerify = (id, currentScore) => {
    verifyCleanCheck(id, currentScore, 'Disetujui sesuai bukti foto');
    showSuccess('Laporan Dikonfirmasi!', `Skor ${currentScore}% berhasil disetujui dan poin telah ditambahkan ke rekapitulasi kelas.`);
  };

  const handleEditScore = async (item) => {
    const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
    const { value: formValues } = await Swal.fire({
      background: isDark ? '#08140e' : '#ffffff',
      color: isDark ? '#f0fdf4' : '#0f172a',
      title: 'Koreksi Skor & Poin Piket',
      html: `
        <div style="text-align:left;font-size:12px;margin-bottom:10px;padding:8px 12px;background:rgba(16,185,129,0.1);border-radius:10px;border:1px solid rgba(16,185,129,0.2);">
          <p style="margin:2px 0;"><strong>Kelas:</strong> ${item.kelas} • <strong>Petugas:</strong> ${item.petugas}</p>
          <p style="margin:2px 0;">Skor Awal Dilaporkan: <span style="color:#10b981;font-weight:bold;">${item.originalScore || item.score}%</span></p>
        </div>
        <div style="text-align:left;margin-bottom:12px;">
          <label style="display:block;font-size:11px;font-weight:bold;margin-bottom:4px;color:${isDark ? '#cbd5e1' : '#475569'};">Skor Hasil Verifikasi Baru (0 - 100%):</label>
          <input id="swal-revised-score" type="number" min="0" max="100" value="${item.score}" style="width:100%;box-sizing:border-box;padding:8px 12px;font-size:13px;border-radius:10px;border:1px solid rgba(16,185,129,0.4);background:${isDark ? '#04100b' : '#f8fafc'};color:${isDark ? '#fff' : '#0f172a'};outline:none;">
        </div>
        <div style="text-align:left;">
          <label style="display:block;font-size:11px;font-weight:bold;margin-bottom:4px;color:${isDark ? '#cbd5e1' : '#475569'};">Catatan Koreksi Admin (Alasan jika direkayasa):</label>
          <textarea id="swal-admin-notes" rows="2" style="width:100%;box-sizing:border-box;padding:8px 12px;font-size:12px;border-radius:10px;border:1px solid rgba(16,185,129,0.4);background:${isDark ? '#04100b' : '#f8fafc'};color:${isDark ? '#fff' : '#0f172a'};outline:none;resize:none;" placeholder="Contoh: Berdasarkan foto, lantai bawah meja masih kotor...">${item.adminNotes || ''}</textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan Koreksi & Konfirmasi',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        const score = document.getElementById('swal-revised-score')?.value;
        const notes = document.getElementById('swal-admin-notes')?.value;
        if (score === '' || isNaN(score) || Number(score) < 0 || Number(score) > 100) {
          Swal.showValidationMessage('Masukkan skor valid antara 0 - 100%');
          return false;
        }
        return { score: Number(score), notes: notes || '' };
      }
    });

    if (formValues) {
      verifyCleanCheck(item.id, formValues.score, formValues.notes);
      showSuccess('Skor Berhasil Dikoreksi!', `Skor kelas ${item.kelas} telah disesuaikan menjadi ${formValues.score}% dan berhasil dikonfirmasi ke sistem.`);
    }
  };

  const handleReject = async (id) => {
    const reason = await showPrompt({
      title: 'Tolak Laporan Piket',
      text: 'Masukkan alasan penolakan (misal: foto tidak sesuai / laporan direkayasa):',
      inputPlaceholder: 'Tuliskan alasan penolakan...',
      confirmButtonText: 'Tolak Laporan',
      required: true
    });
    if (reason !== null && reason.trim()) {
      rejectCleanCheck(id, reason.trim());
      showToast('Laporan piket telah ditolak', 'warning');
    }
  };

  const handleAddCriteria = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addCriteria({
      title: newTitle.trim(),
      desc: newDesc.trim() || 'Standar kebersihan kelas',
      points: Number(newPoints) || 20
    });
    setNewTitle('');
    setNewDesc('');
    showSuccess('Kriteria Ditambahkan', 'Kriteria checklist baru berhasil ditambahkan!');
  };

  const handleSaveEditCriteria = (e) => {
    e.preventDefault();
    if (!editingCriteria || !editingCriteria.title.trim()) return;
    updateCriteriaItem(editingCriteria.id, {
      title: editingCriteria.title.trim(),
      desc: editingCriteria.desc?.trim() || '',
      points: Number(editingCriteria.points) || 20
    });
    setEditingCriteria(null);
    showSuccess('Kriteria Diperbarui', 'Kriteria checklist berhasil disimpan!');
  };

  const handleDeleteCriteria = async (id) => {
    const confirmed = await showConfirm({
      title: 'Hapus Kriteria?',
      text: 'Hapus indikator kriteria ini dari formulir checklist?',
      isDanger: true,
      confirmButtonText: 'Ya, Hapus'
    });
    if (confirmed) {
      const res = deleteCriteria(id);
      if (!res.success) {
        showError('Gagal Menghapus', res.message);
      } else {
        showToast('Kriteria checklist berhasil dihapus', 'success');
      }
    }
  };

  const handleResetCriteria = async () => {
    const confirmed = await showConfirm({
      title: 'Reset Kriteria 5R?',
      text: 'Kembalikan semua kriteria formulir checklist ke standar awal 5R?',
      confirmButtonText: 'Ya, Reset'
    });
    if (confirmed) {
      resetCriteria();
      showSuccess('Berhasil Direset', 'Kriteria berhasil direset ke standar 5R.');
    }
  };

  // Filtered Rekap
  const filteredList = filterClass === 'ALL' 
    ? cleanChecks 
    : cleanChecks.filter(c => c.kelas === filterClass);

  // Export Rekap Piket ke Excel Spreadsheet (.xlsx)
  const handleExportExcel = () => {
    if (filteredList.length === 0) {
      showWarning('Data Kosong', 'Belum ada data rekap piket kelas untuk diekspor!');
      return;
    }
    const dataToExport = filteredList.map((item, index) => ({
      'No': index + 1,
      'Tanggal': item.date,
      'Kelas': item.kelas,
      'Petugas Piket': item.petugas,
      'Indikator Terpenuhi': `${item.checkedCount}/${item.totalCriteria}`,
      'Skor Kebersihan (%)': item.score,
      'Kategori Nilai': item.score >= 90 ? 'Sangat Baik (A)' : item.score >= 75 ? 'Baik (B)' : 'Perlu Perbaikan (C)',
      'Catatan Kondisi Kelas': item.notes || '-'
    }));
    const classLabel = filterClass === 'ALL' ? 'Semua_Kelas' : `Kelas_${filterClass}`;
    exportToExcel(dataToExport, `Rekap_CleanCheck_${classLabel}`, 'Rekap Piket 5R');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 animate-fade-in">
      
      {/* ================= MODAL EDIT KRITERIA ================= */}
      {editingCriteria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleSaveEditCriteria} className="glass-card max-w-md w-full p-6 rounded-3xl shadow-2xl border-2 border-emerald-500/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <h3 className="font-heading font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Edit Kriteria Penilaian 5R</span>
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
                  Judul Kriteria
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

      {/* ================= TOPBAR ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-emerald-500/20 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('home')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 dark:bg-white/5 dark:hover:bg-emerald-500/20 dark:text-slate-300 dark:hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Beranda</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                Fitur 1 • Harian
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Standar 5R Akmala Sabila</span>
            </div>
            <h2 className="font-heading font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>AKSMA Clean Check</span>
            </h2>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-obsidian-900/90 border border-emerald-500/20 self-start sm:self-auto">
          {!isAdmin && (
            <button
              onClick={() => setActiveTab('form')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'form'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
              }`}
            >
              Lembar Checklist
            </button>
          )}
          <button
            onClick={() => setActiveTab('rekap')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'rekap'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
            }`}
          >
            {isAdmin && <Shield className="w-3.5 h-3.5" />}
            <span>{isAdmin ? 'Rekap Pemantauan' : 'Riwayat Piket'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px]">
              {cleanChecks.length}
            </span>
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
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Formulir 5R</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= TAB 1: FORMULIR CHECKLIST PIKET (USER) ================= */}
      {activeTab === 'form' && (
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-emerald-500/25 space-y-5">
            
            {/* Header info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Kelas
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
                  Nama Petugas Piket
                </label>
                <input
                  type="text"
                  value={petugasName}
                  onChange={(e) => setPetugasName(e.target.value)}
                  placeholder="Nama santri/petugas..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Checklist items header */}
            <div className="flex items-center justify-between pt-2 border-t border-emerald-500/15">
              <div>
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Lembar Indikator Kebersihan 5R
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Centang aspek yang telah selesai dibersihkan sesuai standar
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={checkAll}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-bold border border-emerald-500/30"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={uncheckAll}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300 text-[11px] font-semibold"
                >
                  Batal Semua
                </button>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              {formConfig.criteria.map((c, idx) => {
                const isChecked = !!checkedCriteria[c.id];
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleCheck(c.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 select-none ${
                      isChecked
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm'
                        : 'bg-slate-50/70 dark:bg-obsidian-900/50 border-slate-200 dark:border-emerald-500/15 hover:border-emerald-500/35'
                    }`}
                  >
                    <div className="pt-0.5">
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                          #{idx + 1}. {c.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[11px] font-black">
                          +{c.points} pts
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {c.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Score Preview Bar */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Skor Kebersihan Real-time:</span>
                <div className="font-heading font-black text-2xl text-slate-900 dark:text-white">
                  {scorePercent}%
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Poin Terpenuhi:</span>
                <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                  {earnedPoints} / {totalPossiblePoints} pts
                </div>
              </div>
            </div>

            {/* Bukti Foto Kebersihan Kelas 5R */}
            <div className="space-y-2 pt-1 border-t border-emerald-500/15">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Foto Bukti Fisik Kondisi Kelas (Wajib Verifikasi) <span className="text-rose-500">*</span></span>
                </span>
                <span className="text-[10px] text-slate-400">JPG/PNG (Maks 5MB)</span>
              </label>

              {photoProof ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-black/40 max-w-sm">
                  <img 
                    src={photoProof} 
                    alt="Bukti Kebersihan" 
                    className="w-full h-44 object-cover cursor-pointer hover:opacity-90 transition"
                    onClick={() => setPreviewPhotoModal(photoProof)}
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-2.5 flex items-center justify-between">
                    <span className="text-[11px] text-white font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Foto Siap Dikirim
                    </span>
                    <button
                      type="button"
                      onClick={() => setPhotoProof(null)}
                      className="px-2 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white text-[10px] font-bold transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Ganti Foto
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 dark:bg-obsidian-900/40 hover:bg-emerald-50/20 transition group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Klik untuk ambil / unggah foto kondisi kelas
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Foto lantai, meja rapi, atau papan tulis sebagai bukti validasi Admin
                    </p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoChange} 
                    className="hidden" 
                  />
                </label>
              )}
            </div>

            {/* Catatan Piket */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Catatan Piket / Kondisi Khusus (Opsional)
              </label>
              <textarea
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Papan tulis sudah dibersihkan, kran wastafel sedikit rembes..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              ></textarea>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white font-bold text-xs shadow-glow hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Simpan & Ajukan Laporan Piket Harian</span>
            </button>
          </div>
        </form>
      )}

      {/* ================= TAB 2: REKAP PIKET ================= */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-emerald-500/20">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Rekap Pemantauan Piket Kelas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Poin kelas hanya bertambah setelah laporan piket & bukti foto dikonfirmasi oleh Administrator
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Filter Kelas:</span>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="ALL">Semua Kelas ({cleanChecks.length})</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.name}>Kelas {c.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                title="Unduh data rekapitulasi ke format Excel Spreadsheet (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Unduh Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          {filteredList.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center border border-emerald-500/20 space-y-3">
              <ClipboardCheck className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Belum Ada Laporan Piket
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Laporan checklist harian yang diajukan siswa akan tampil di sini untuk divalidasi.
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden border border-emerald-500/20">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-50/80 dark:bg-emerald-950/50 border-b border-emerald-500/20 text-slate-700 dark:text-emerald-300">
                    <tr>
                      <th className="py-3 px-3 font-bold">Tanggal</th>
                      <th className="py-3 px-3 font-bold">Kelas</th>
                      <th className="py-3 px-3 font-bold">Petugas</th>
                      <th className="py-3 px-3 font-bold text-center">Bukti Foto</th>
                      <th className="py-3 px-3 font-bold text-center">Indikator</th>
                      <th className="py-3 px-3 font-bold text-center">Skor Poin</th>
                      <th className="py-3 px-3 font-bold text-center">Status Validasi</th>
                      <th className="py-3 px-3 font-bold">Catatan</th>
                      {isAdmin && <th className="py-3 px-3 font-bold text-center">Aksi Admin</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-500/10">
                    {filteredList.map((item) => (
                      <tr key={item.id} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 transition">
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{item.date}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">Kelas {item.kelas}</td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">{item.petugas}</td>

                        {/* Foto Bukti */}
                        <td className="py-3 px-3 text-center">
                          {item.photoProof ? (
                            <button
                              type="button"
                              onClick={() => setPreviewPhotoModal(item.photoProof)}
                              className="relative group inline-block"
                              title="Klik untuk lihat foto bukti"
                            >
                              <img 
                                src={item.photoProof} 
                                alt="Bukti" 
                                className="w-10 h-10 rounded-lg object-cover border border-emerald-500/40 group-hover:scale-110 transition shadow-sm"
                              />
                              <span className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                                <Eye className="w-3.5 h-3.5" />
                              </span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Tanpa Foto</span>
                          )}
                        </td>

                        {/* Indikator */}
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 font-mono text-[11px]">
                            {item.checkedCount}/{item.totalCriteria}
                          </span>
                        </td>

                        {/* Skor / Poin (Deteksi Koreksi Admin) */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                              item.score >= 90
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                : item.score >= 75
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                            }`}>
                              {item.score}%
                            </span>
                            {item.originalScore !== undefined && item.originalScore !== item.score && (
                              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                                Dikoreksi (Awal: {item.originalScore}%)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status Validasi */}
                        <td className="py-3 px-3 text-center">
                          {item.status === 'verified' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Disetujui
                            </span>
                          ) : item.status === 'rejected' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-500" /> Ditolak
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-500" /> Menunggu Admin
                            </span>
                          )}
                        </td>

                        {/* Catatan Petugas & Catatan Admin */}
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs text-[11px]">
                          {item.notes && <p className="truncate">{item.notes}</p>}
                          {item.adminNotes && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                              Admin: {item.adminNotes}
                            </p>
                          )}
                          {item.rejectReason && (
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                              Alasan Tolak: {item.rejectReason}
                            </p>
                          )}
                        </td>

                        {/* Aksi Khusus Admin */}
                        {isAdmin && (
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {item.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => handleVerify(item.id, item.score)}
                                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
                                  title="Konfirmasi & Setujui Poin"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleEditScore(item)}
                                className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition shadow-sm"
                                title="Koreksi / Edit Poin (Jika Direkayasa)"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {item.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => handleReject(item.id)}
                                  className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 border border-rose-500/30 transition shadow-sm"
                                  title="Tolak Laporan"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => deleteCleanCheck(item.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                                title="Hapus Data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: ADMIN CRITERIA EDITOR ================= */}
      {isAdmin && activeTab === 'editor' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div className="text-xs text-amber-900 dark:text-amber-200">
                <strong>Panel Edit Formulir Checklist Harian:</strong> Anda dapat menambah, mengedit, mengubah bobot poin, atau menghapus aspek penilaian kebersihan kelas.
              </div>
            </div>
            <button
              onClick={handleResetCriteria}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-obsidian-900 border border-amber-500/40 text-amber-800 dark:text-amber-300 font-bold text-xs hover:bg-amber-100 dark:hover:bg-amber-950 transition flex items-center gap-1.5 flex-shrink-0"
              title="Reset ke Standar 5R"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset 5R</span>
            </button>
          </div>

          {/* Add Criteria Form */}
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
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Kerapian Mading Kelas & Tanaman Hias"
                  className="w-full bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Deskripsi Standar</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Contoh: Bebas debu, disiram rapi"
                  className="w-full bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bobot Poin</label>
                <input
                  type="number"
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
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
                      title="Edit Kriteria Ini"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCriteria(crit.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Hapus Kriteria Ini"
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
                <span className="text-sm font-bold text-white">Bukti Foto Kebersihan Kelas</span>
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
                alt="Bukti Foto Kebersihan" 
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
