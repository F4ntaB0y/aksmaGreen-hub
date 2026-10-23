import React, { useState } from 'react';
import { 
  AlertTriangle, ArrowLeft, CheckCircle2, Clock, 
  MapPin, Tag, Plus, Trash2, Edit3, ShieldAlert, Sparkles, Filter,
  Navigation, Crosshair, Check, X, Map as MapIcon, LayoutGrid,
  FileSpreadsheet, Building, Layers, Compass, Shield, Info, CheckSquare,
  Droplets, Recycle, School, UtensilsCrossed, RefreshCw
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import ReportMap from '../components/ReportMap';
import { exportToExcel } from '../utils/excelExport';
import { showSuccess, showError, showWarning, showConfirm, showPrompt, showToast } from '../utils/sweetalert';

// Dynamic Icon Resolver for Facilities
const getZoneIcon = (iconType) => {
  switch (iconType) {
    case 'Droplets': return Droplets;
    case 'Recycle': return Recycle;
    case 'Sparkles': return Sparkles;
    case 'School': return School;
    default: return Building;
  }
};

// Preset Titik Lokasi Kampus SMA IT Akmala Sabila untuk Pengaturan GPS Cepat
const CAMPUS_PRESETS = [
  { name: 'Gedung Utama & Kelas', lat: -6.74412, lng: 108.53982 },
  { name: 'Toilet & Sanitasi Siswa', lat: -6.74390, lng: 108.53960 },
  { name: 'Kantin & Selasar', lat: -6.74435, lng: 108.53995 },
  { name: 'TPS & Bank Sampah', lat: -6.74450, lng: 108.54010 },
  { name: 'Masjid Kampus', lat: -6.74400, lng: 108.54020 },
  { name: 'Lapangan Olahraga', lat: -6.74425, lng: 108.53940 }
];

export default function GreenReport({ setActivePage }) {
  const { 
    greenReports, 
    formConfig, 
    facilities = [],
    addFacility,
    deleteFacility,
    clearAllFacilities,
    loadDefaultFacilities,
    addGreenReport, 
    updateReportStatus, 
    deleteGreenReport, 
    updateLocations, 
    updateReportCategories 
  } = useData();
  const { user, isAdmin } = useAuth();

  // Role Rule:
  // User (siswa): HANYA BISA MELIHAT 'denah' dan 'monitoring' (riwayat aduan)
  // Admin: Mengisi 'lapor' (laporan sarpras & kebersihan), memantau 'denah', 'monitoring', dan 'editor'
  const [activeTab, setActiveTab] = useState(isAdmin ? 'lapor' : 'denah'); // 'denah' | 'monitoring' | 'lapor' | 'editor'
  const [monitoringView, setMonitoringView] = useState('card'); // 'card' | 'map'
  const [selectedZone, setSelectedZone] = useState(null);

  // Facility Modal State (Tambah Titik Fasilitas)
  const [showAddFacilityModal, setShowAddFacilityModal] = useState(false);
  const [facName, setFacName] = useState('');
  const [facCategory, setFacCategory] = useState('Sanitasi & Air');
  const [facLocation, setFacLocation] = useState('');
  const [facDesc, setFacDesc] = useState('');
  const [facIconType, setFacIconType] = useState('Droplets');
  const [facLat, setFacLat] = useState(-6.74412);
  const [facLng, setFacLng] = useState(108.53982);

  // Form State (Hanya untuk Admin)
  const [reporterName, setReporterName] = useState(user?.name || (isAdmin ? 'Admin Sarpras & Lingkungan' : ''));
  const [location, setLocation] = useState(formConfig.locations[0] || 'Kamar Mandi / Toilet Santri Putra');
  const [category, setCategory] = useState(formConfig.reportCategories[0] || 'Sampah Menumpuk / Liar');
  const [urgency, setUrgency] = useState('Sedang'); // 'Rendah' | 'Sedang' | 'Darurat'
  const [description, setDescription] = useState('');

  // GPS State (Mendukung Otomatis & Atur Manual)
  const [gpsMode, setGpsMode] = useState('manual'); // 'manual' | 'auto'
  const [manualLat, setManualLat] = useState('-6.744120');
  const [manualLng, setManualLng] = useState('108.539820');
  const [gpsCoords, setGpsCoords] = useState({ lat: -6.74412, lng: 108.53982, accuracy: 5 });
  const [gpsVerified, setGpsVerified] = useState(true);
  const [showGpsConfirmModal, setShowGpsConfirmModal] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const handleManualCoordChange = (newLatStr, newLngStr) => {
    setManualLat(newLatStr);
    setManualLng(newLngStr);
    const parsedLat = parseFloat(newLatStr);
    const parsedLng = parseFloat(newLngStr);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      setGpsCoords({ lat: parsedLat, lng: parsedLng, accuracy: 5 });
      setGpsVerified(true);
    }
  };

  const handleSelectPreset = (preset) => {
    setManualLat(preset.lat.toFixed(6));
    setManualLng(preset.lng.toFixed(6));
    setGpsCoords({ lat: preset.lat, lng: preset.lng, accuracy: 5 });
    setGpsVerified(true);
    showToast(`Lokasi GPS disetel ke: ${preset.name}`, 'success');
  };

  // Status Filter in Monitoring
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Admin Editor State
  const [newLoc, setNewLoc] = useState('');
  const [newCat, setNewCat] = useState('');

  // Handlers for Facility Management
  const handleLoadDefaultFacilities = async () => {
    const isConfirmed = await showConfirm({
      title: 'Muat Template Fasilitas?',
      text: 'Sistem akan menambahkan 6 titik fasilitas standar (Toilet, TPS, dsb) untuk demonstrasi.',
      icon: 'question',
      confirmButtonText: 'Ya, Muat Template'
    });
    if (isConfirmed) {
      loadDefaultFacilities();
      showSuccess('Template Dimuat', '6 titik fasilitas standar telah ditambahkan.');
    }
  };

  const handleClearAllFacilities = async () => {
    const isConfirmed = await showConfirm({
      title: 'Kosongkan Semua Fasilitas?',
      text: 'Seluruh data direktori fasilitas & sanitasi kampus akan dihapus sehingga data menjadi kosong.',
      icon: 'warning',
      confirmButtonText: 'Ya, Kosongkan',
      isDanger: true
    });
    if (isConfirmed) {
      clearAllFacilities();
      showSuccess('Dikosongkan', 'Seluruh data fasilitas kampus telah dikosongkan.');
    }
  };

  const handleDeleteFacility = async (id, name) => {
    const isConfirmed = await showConfirm({
      title: `Hapus ${name}?`,
      text: 'Titik fasilitas ini akan dihapus dari direktori.',
      icon: 'warning',
      confirmButtonText: 'Ya, Hapus',
      isDanger: true
    });
    if (isConfirmed) {
      deleteFacility(id);
      showToast({ title: `${name} dihapus`, icon: 'success' });
    }
  };

  const handleSaveFacility = (e) => {
    e.preventDefault();
    if (!facName.trim()) {
      showError('Nama Fasilitas Kosong', 'Harap isi nama fasilitas.');
      return;
    }
    addFacility({
      name: facName.trim(),
      category: facCategory.trim(),
      location: facLocation.trim() || 'Kampus Utama',
      desc: facDesc.trim() || 'Fasilitas kebersihan dan sanitasi sekolah',
      coords: { lat: Number(facLat) || -6.74412, lng: Number(facLng) || 108.53982 },
      iconType: facIconType
    });
    setShowAddFacilityModal(false);
    setFacName('');
    setFacLocation('');
    setFacDesc('');
    showSuccess('Berhasil Disimpan', `Fasilitas "${facName}" berhasil didaftarkan ke direktori.`);
  };

  // Step 1: Click "Ambil GPS Saya" -> trigger confirmation modal
  const handleGpsClick = () => {
    setShowGpsConfirmModal(true);
  };

  // Step 2: Confirm GPS
  const handleConfirmGps = () => {
    setShowGpsConfirmModal(false);
    setGpsLoading(true);
    setGpsError('');

    if (!navigator.geolocation) {
      setGpsError('Perangkat Anda tidak mendukung fitur Geolocation/GPS.');
      const fallback = { lat: -6.74412, lng: 108.53982, accuracy: 15 };
      setGpsCoords(fallback);
      setManualLat(fallback.lat.toFixed(6));
      setManualLng(fallback.lng.toFixed(6));
      setGpsVerified(true);
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const coords = {
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy)
        };
        setGpsCoords(coords);
        setManualLat(latitude.toFixed(6));
        setManualLng(longitude.toFixed(6));
        setGpsVerified(true);
        setGpsLoading(false);
      },
      (error) => {
        console.warn('Geolocation warning, using campus reference:', error.message);
        const campusCenter = { 
          lat: -6.74412 + (Math.random() - 0.5) * 0.0006, 
          lng: 108.53982 + (Math.random() - 0.5) * 0.0006, 
          accuracy: 8 
        };
        setGpsCoords(campusCenter);
        setManualLat(campusCenter.lat.toFixed(6));
        setManualLng(campusCenter.lng.toFixed(6));
        setGpsVerified(true);
        setGpsLoading(false);
        setGpsError('GPS satelit otomatis dipetakan ke area kampus SMA IT Akmala Sabila.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Handler: Admin Submit Official Sarpras Report
  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!isAdmin) {
      showWarning('Akses Khusus Admin', 'Pembuatan laporan masalah kebersihan & sarpras hanya dapat dilakukan oleh Admin Sarpras. Akun pengguna/siswa hanya dapat melihat denah fasilitas dan riwayat aduan!');
      setActiveTab('denah');
      return;
    }

    if (!reporterName.trim()) {
      showWarning('Nama Pelapor Kosong', 'Silakan masukkan nama penanggung jawab / pelapor sarpras!');
      return;
    }
    if (!description.trim()) {
      showWarning('Deskripsi Masalah Kosong', 'Silakan tuliskan deskripsi masalah sarpras/kebersihan yang ditemukan!');
      return;
    }

    const finalCoords = gpsCoords || { 
      lat: parseFloat(manualLat) || -6.74412, 
      lng: parseFloat(manualLng) || 108.53982, 
      accuracy: 5 
    };

    addGreenReport({
      reporter: reporterName.trim(),
      location,
      category,
      urgency,
      description: description.trim(),
      coords: finalCoords,
      gpsVerified: !!gpsVerified,
      date: new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
    });

    showSuccess('Laporan Terdaftar!', 'Laporan masalah kebersihan & sarpras resmi berhasil didaftarkan oleh Admin! Titik lokasi telah masuk ke peta dan antrean penanganan.');
    setDescription('');
    setActiveTab('monitoring');
  };

  const handleStatusChange = async (id, newStatus) => {
    const notes = await showPrompt({
      title: 'Perbarui Status Aduan',
      text: `Ubah status tiket ke: ${newStatus.toUpperCase()}`,
      inputPlaceholder: 'Tuliskan catatan tindak lanjut sarpras (opsional)...',
      confirmButtonText: 'Simpan Perubahan'
    });
    if (notes !== null) {
      updateReportStatus(id, newStatus, notes.trim() || undefined);
      showToast(`Status aduan diperbarui: ${newStatus.toUpperCase()}`, 'success');
    }
  };

  const handleDeleteReport = async (id) => {
    const confirmed = await showConfirm({
      title: 'Hapus Laporan Aduan?',
      text: 'Hapus tiket laporan aduan sarpras ini dari database?',
      isDanger: true,
      confirmButtonText: 'Ya, Hapus'
    });
    if (confirmed) {
      if (deleteGreenReport) {
        deleteGreenReport(id);
      } else {
        updateReportStatus(id, 'selesai', 'Dihapus oleh admin');
      }
      showToast('Laporan aduan berhasil dihapus', 'success');
    }
  };

  const handleAddLocation = (e) => {
    e.preventDefault();
    if (!newLoc.trim()) return;
    updateLocations([...formConfig.locations, newLoc.trim()]);
    setNewLoc('');
    showSuccess('Lokasi Ditambahkan', 'Titik lokasi fasilitas baru berhasil ditambahkan!');
  };

  const handleDeleteLocation = async (loc) => {
    const confirmed = await showConfirm({
      title: 'Hapus Lokasi?',
      text: `Hapus titik lokasi fasilitas "${loc}" dari sistem?`,
      isDanger: true,
      confirmButtonText: 'Ya, Hapus'
    });
    if (confirmed) {
      updateLocations(formConfig.locations.filter(l => l !== loc));
      showToast('Titik lokasi berhasil dihapus', 'success');
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    updateReportCategories([...formConfig.reportCategories, newCat.trim()]);
    setNewCat('');
    showSuccess('Kategori Ditambahkan', 'Kategori masalah baru berhasil ditambahkan!');
  };

  const handleDeleteCategory = async (cat) => {
    const confirmed = await showConfirm({
      title: 'Hapus Kategori?',
      text: `Hapus kategori masalah "${cat}" dari daftar?`,
      isDanger: true,
      confirmButtonText: 'Ya, Hapus'
    });
    if (confirmed) {
      updateReportCategories(formConfig.reportCategories.filter(c => c !== cat));
      showToast('Kategori masalah berhasil dihapus', 'success');
    }
  };

  // Filtered reports
  const filteredReports = statusFilter === 'ALL'
    ? greenReports
    : greenReports.filter(r => r.status === statusFilter);

  // Export Riwayat Aduan ke Excel (.xlsx)
  const handleExportReports = () => {
    if (filteredReports.length === 0) {
      showWarning('Data Kosong', 'Belum ada data aduan sarpras untuk diekspor ke Excel!');
      return;
    }
    const dataToExport = filteredReports.map((r, index) => ({
      'No': index + 1,
      'ID Laporan': r.id,
      'Tanggal Lapor': r.date,
      'Pelapor / Penanggung Jawab': r.reporter,
      'Titik Lokasi Fasilitas': r.location,
      'Kategori Masalah': r.category,
      'Tingkat Urgensi': r.urgency,
      'Status Penanganan': r.status === 'selesai' ? 'Selesai Ditangani' : r.status === 'proses' ? 'Sedang Diproses' : 'Laporan Baru',
      'Koordinat GPS': r.coords ? `${r.coords.lat.toFixed(5)}, ${r.coords.lng.toFixed(5)}` : 'Area Sekolah',
      'Deskripsi Kerusakan/Masalah': r.description,
      'Catatan Tindak Lanjut Sarpras': r.adminNotes || '-'
    }));
    const filterLabel = statusFilter === 'ALL' ? 'Semua_Status' : `Status_${statusFilter}`;
    exportToExcel(dataToExport, `Rekap_Aduan_Sarpras_${filterLabel}`, 'Riwayat Aduan Sarpras');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* ================= MODAL NOTIFIKASI GPS SAYA ================= */}
      {showGpsConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl shadow-2xl border-2 border-emerald-500/40 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white">
                Konfirmasi Lokasi Real-Time GPS
              </h3>
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs leading-relaxed font-medium">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>Pastikan Anda saat ini berada di lokasi sarpras yang dilaporkan!</span>
                </div>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  Koordinat GPS presisi akan dicatat dan disematkan pada peta kampus sekolah agar tim sarpras dapat langsung menuju titik perbaikan.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowGpsConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmGps}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-glow hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Ya, Saya di Lokasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                Fitur 3 • Sarpras & Lingkungan
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                {isAdmin ? (
                  <>
                    <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Mode Penuh Admin</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Mode Pantau Denah & Aduan</span>
                  </>
                )}
              </span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
              AKSMA Green Report
            </h1>
          </div>
        </div>

        {/* Tab Controls (User HANYA melihat Denah dan Riwayat Aduan; Admin memiliki Form Lapor) */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-obsidian-900/90 border border-emerald-500/20 self-start sm:self-auto">
          {/* TAB 1: DENAH FASILITAS (Tersedia untuk User & Admin) */}
          <button
            onClick={() => setActiveTab('denah')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'denah'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Denah & Peta Fasilitas</span>
          </button>

          {/* TAB 2: RIWAYAT ADUAN (Tersedia untuk User & Admin) */}
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'monitoring'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isAdmin ? 'Monitoring Sarpras' : 'Riwayat Aduan'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px]">
              {greenReports.length}
            </span>
          </button>

          {/* TAB 3: INPUT LAPORAN SARPRAS (HANYA UNTUK ADMIN) */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('lapor')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'lapor'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Input Laporan Sarpras</span>
            </button>
          )}

          {/* TAB 4: ADMIN SETTINGS EDITOR (HANYA UNTUK ADMIN) */}
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
              <span>Kelola Lokasi & Kategori</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= USER NOTICE BANNER ================= */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl glass-card border border-emerald-500/30 flex items-start gap-3 bg-emerald-50/60 dark:bg-emerald-950/20">
          <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-white">Transparansi Sarpras & Sanitasi Kampus:</strong> Sebagai siswa/pengguna, Anda dapat meninjau <strong>Denah Titik Fasilitas Sekolah</strong> serta memantau perkembangan <strong>Riwayat Penanganan Aduan</strong> secara berkala. Pembuatan dan entri laporan masalah kebersihan & sarpras dikontrol langsung oleh Petugas/Administrator Sarpras sekolah.
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DENAH DAN PETA FASILITAS SANITASI (USER & ADMIN)                   */}
      {/* ========================================================================= */}
      {activeTab === 'denah' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-emerald-500/20">
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Denah Interaktif Fasilitas & Titik Sanitasi Sekolah</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pemetaan sarana sanitasi, toilet, tempat cuci tangan, dan TPS terpadu SMA IT Akmala Sabila
              </p>
            </div>

            <button
              onClick={() => setActiveTab('monitoring')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 dark:bg-obsidian-900 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 border border-emerald-500/25 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>Lihat Riwayat Aduan ({greenReports.length})</span>
            </button>
          </div>

          {/* Interactive Leaflet GPS Map */}
          <div className="glass-card rounded-3xl p-5 border border-emerald-500/25 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Peta Satelit & Sebaran Fasilitas Kampus
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Sanitasi Normal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Sedang Ditangani
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Laporan Sarpras Baru
                </span>
              </div>
            </div>

            <ReportMap 
              reports={greenReports} 
              height="380px" 
              zoom={18} 
            />
          </div>

          {/* Interactive Campus Directory Cards (Dynamic from State) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Direktori Zona Fasilitas & Sanitasi Kampus</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {facilities.length > 0 
                    ? `${facilities.length} Titik Fasilitas Sekolah Terdaftar & Terpantau`
                    : 'Data titik fasilitas saat ini kosong bersih (tanpa data dummy)'}
                </p>
              </div>

              {isAdmin && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddFacilityModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Fasilitas</span>
                  </button>

                  {facilities.length === 0 ? (
                    <button
                      type="button"
                      onClick={handleLoadDefaultFacilities}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-obsidian-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 border border-emerald-500/25 text-xs font-bold transition flex items-center gap-1.5"
                      title="Muat 6 titik fasilitas standar sekolah"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Muat Contoh (6 Titik)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleClearAllFacilities}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5"
                      title="Kosongkan seluruh data fasilitas kampus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Kosongkan Semua</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {facilities.length === 0 ? (
              /* EMPTY STATE FASILITAS KAMPUS */
              <div className="p-8 sm:p-10 rounded-3xl glass-card border border-dashed border-emerald-500/30 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Building className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    Belum Ada Titik Fasilitas Terdaftar (Data Bersih)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Data fasilitas kampus saat ini telah dikosongkan. Administrator dapat mendaftarkan titik toilet, wastafel, tempat sampah, atau fasilitas sekolah lainnya secara mandiri.
                  </p>
                </div>

                {isAdmin && (
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddFacilityModal(true)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 text-white font-bold text-xs shadow-glow transition flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Daftarkan Titik Fasilitas Pertama</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadDefaultFacilities}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-obsidian-900 hover:bg-slate-200 dark:hover:bg-obsidian-800 text-slate-700 dark:text-slate-300 border border-emerald-500/25 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-4 h-4 text-emerald-500" />
                      <span>Muat Template Fasilitas Sekolah</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* GRID KARTU FASILITAS DINAMIS */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {facilities.map((zone) => {
                  const ZoneIcon = getZoneIcon(zone.iconType || zone.icon);
                  const activeZoneReports = greenReports.filter(
                    r => r.location?.toLowerCase().includes(zone.name.toLowerCase().split(' ')[0]) && r.status !== 'selesai'
                  );
                  const hasPending = activeZoneReports.length > 0;
                  const coords = zone.coords || { lat: -6.74412, lng: 108.53982 };

                  return (
                    <div
                      key={zone.id}
                      className={`p-4 rounded-2xl glass-card border transition flex flex-col justify-between space-y-3 hover:border-emerald-500/60 hover:shadow-glow ${
                        hasPending 
                          ? 'border-amber-500/40 bg-amber-500/5' 
                          : 'border-emerald-500/20'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <ZoneIcon className="w-5 h-5" />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                              hasPending
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                            }`}>
                              {hasPending ? (
                                <>
                                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                                  <span>{activeZoneReports.length} Aduan Aktif</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  <span>Bersih & Prima</span>
                                </>
                              )}
                            </span>

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFacility(zone.id, zone.name);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                                title={`Hapus ${zone.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                            {zone.name}
                          </h4>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              {zone.location}
                            </span>
                            <span>•</span>
                            <span>{zone.category}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {zone.desc}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-emerald-500/15 flex items-center justify-between text-[11px]">
                        <span className="font-mono text-slate-400 text-[10px]">
                          GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            showSuccess(
                              zone.name,
                              `Lokasi: ${zone.location} | Kategori: ${zone.category}\n${zone.desc}\nKoordinat: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                            );
                          }}
                          className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                        >
                          Detail Fasilitas →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RIWAYAT ADUAN & MONITORING SARPRAS (USER & ADMIN)                   */}
      {/* ========================================================================= */}
      {activeTab === 'monitoring' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-emerald-500/20">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Filter Status:</span>
              <div className="flex gap-1.5">
                {[
                  { id: 'ALL', label: 'Semua' },
                  { id: 'baru', label: 'Baru' },
                  { id: 'proses', label: 'Diproses' },
                  { id: 'selesai', label: 'Selesai' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      statusFilter === f.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-obsidian-900 text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions: View Toggle & Excel Export Button */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Tombol Ekspor Excel Spreadsheet */}
              <button
                type="button"
                onClick={handleExportReports}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                title="Unduh seluruh riwayat aduan sarpras ke format Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Unduh Laporan Excel (.xlsx)</span>
              </button>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-obsidian-900 p-1 rounded-xl border border-emerald-500/20">
                <button
                  onClick={() => setMonitoringView('card')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    monitoringView === 'card'
                      ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Daftar Kartu</span>
                </button>
                <button
                  onClick={() => setMonitoringView('map')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    monitoringView === 'map'
                      ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Peta GPS</span>
                </button>
              </div>
            </div>
          </div>

          {/* VIEW: PETA SEBARAN GPS */}
          {monitoringView === 'map' && (
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-4 border border-emerald-500/25 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Peta Sebaran Laporan Sarpras & Titik Aduan GPS</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Klik pin marker pada peta untuk melihat detail pelapor dan status penanganan
                    </p>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Baru</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Diproses</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Selesai</span>
                  </div>
                </div>

                <ReportMap 
                  reports={filteredReports} 
                  height="460px" 
                  zoom={17} 
                />
              </div>
            </div>
          )}

          {/* VIEW: KARTU LAPORAN */}
          {monitoringView === 'card' && (
            filteredReports.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center border border-emerald-500/20 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  Tidak Ada Laporan Aduan dengan Status Ini
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Seluruh sarana dan lingkungan sekolah dalam kondisi bersih, aman, dan terpantau dengan baik.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.map((report) => (
                  <div 
                    key={report.id}
                    className="glass-card rounded-2xl p-5 border border-emerald-500/20 flex flex-col justify-between space-y-3 relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                          {report.id}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1.5 ${
                          report.status === 'baru'
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                            : report.status === 'proses'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            report.status === 'baru' ? 'bg-rose-500 animate-pulse' : report.status === 'proses' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          <span>{report.status === 'baru' ? 'Baru' : report.status === 'proses' ? 'Diproses' : 'Selesai'}</span>
                        </span>
                      </div>

                      <div>
                        <div className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{report.location}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            {report.category}
                          </span>
                          <span>•</span>
                          <span className={`font-semibold ${
                            report.urgency === 'Darurat' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            Urgensi: {report.urgency}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-obsidian-900/70 p-3 rounded-xl border border-slate-200 dark:border-emerald-500/15 leading-relaxed">
                        "{report.description}"
                      </p>

                      {/* GPS Badge */}
                      {report.coords && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          <Crosshair className="w-3 h-3" />
                          <span>GPS: {report.coords.lat.toFixed(5)}, {report.coords.lng.toFixed(5)}</span>
                          {report.gpsVerified && (
                            <span className="font-sans font-bold text-emerald-600 dark:text-emerald-400 ml-auto flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Terverifikasi</span>
                            </span>
                          )}
                        </div>
                      )}

                      {report.adminNotes && (
                        <div className="text-[11px] text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 p-2.5 rounded-xl border border-teal-500/20">
                          <strong>Tindak Lanjut Sarpras:</strong> {report.adminNotes}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-emerald-500/15 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Oleh: <strong className="text-slate-700 dark:text-slate-300">{report.reporter}</strong> • {report.date}
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1.5">
                          {report.status !== 'proses' && (
                            <button
                              onClick={() => handleStatusChange(report.id, 'proses')}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-sm transition"
                              title="Tandai sedang diproses"
                            >
                              Proses
                            </button>
                          )}
                          {report.status !== 'selesai' && (
                            <button
                              onClick={() => handleStatusChange(report.id, 'selesai')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition"
                              title="Tandai tuntas selesai"
                            >
                              Selesai
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Hapus Aduan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FORMULIR INPUT LAPORAN SARPRAS (HANYA UNTUK ADMIN)                  */}
      {/* ========================================================================= */}
      {isAdmin && activeTab === 'lapor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleReportSubmit} className="lg:col-span-2 space-y-5">
            <div className="glass-card rounded-2xl p-6 border-2 border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-500/15">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Formulir Laporan Masalah Kebersihan & Sarpras</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-extrabold uppercase border border-amber-500/30">
                        Akses Khusus Admin
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Entri resmi penanganan kerusakan sarpras atau timbulan sampah oleh Tim Administrator
                    </p>
                  </div>
                </div>
              </div>

              {/* Pelapor & Lokasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Admin / Petugas Pencatat
                  </label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Nama Admin / Tim Sarpras"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Titik Lokasi Fasilitas Sekolah
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {formConfig.locations.map((loc, idx) => (
                      <option key={idx} value={loc} className="dark:bg-obsidian-900 text-slate-900 dark:text-white">{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* GPS SAYA SECTION: DUAL MODE (MANUAL & SENSOR OTOMATIS) */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-emerald-500/20">
                  <div>
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Penentuan Titik Koordinat GPS Sarpras
                      </span>
                      {gpsVerified && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-500/30">
                          <Check className="w-3 h-3" /> Koordinat Terkunci
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Pilih koordinat satelit otomatis atau atur angka & klik peta secara manual
                    </p>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-obsidian-900 border border-emerald-500/30 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setGpsMode('manual')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        gpsMode === 'manual'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
                      }`}
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>Atur Manual & Peta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGpsMode('auto')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        gpsMode === 'auto'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Sensor Satelit (Auto)</span>
                    </button>
                  </div>
                </div>

                {/* MODE 1: ATUR MANUAL & INPUT KOORDINAT */}
                {gpsMode === 'manual' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Latitude (Garis Lintang)
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          value={manualLat}
                          onChange={(e) => handleManualCoordChange(e.target.value, manualLng)}
                          placeholder="-6.744120"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-obsidian-900 border border-emerald-500/40 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Longitude (Garis Bujur)
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          value={manualLng}
                          onChange={(e) => handleManualCoordChange(manualLat, e.target.value)}
                          placeholder="108.539820"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-obsidian-900 border border-emerald-500/40 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Preset Cepat Kampus */}
                    <div>
                      <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Preset Lokasi Cepat Kampus:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {CAMPUS_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handleSelectPreset(preset)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-obsidian-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 border border-emerald-500/30 hover:border-emerald-500 transition"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Map Picker */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Peta Interaktif (Klik atau geser pin untuk memindahkan posisi):</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}
                        </span>
                      </div>
                      <ReportMap 
                        center={[gpsCoords.lat, gpsCoords.lng]} 
                        selectedPoint={gpsCoords} 
                        onPointSelect={(pt) => {
                          setGpsCoords(pt);
                          setManualLat(pt.lat.toFixed(6));
                          setManualLng(pt.lng.toFixed(6));
                          setGpsVerified(true);
                        }}
                        zoom={18} 
                        height="220px" 
                      />
                    </div>
                  </div>
                )}

                {/* MODE 2: AUTO SATELIT GEOLOCATION */}
                {gpsMode === 'auto' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Klik tombol di bawah untuk mengambil titik koordinat langsung dari satelit GPS ponsel/laptop Anda:
                      </p>
                      <button
                        type="button"
                        onClick={handleGpsClick}
                        disabled={gpsLoading}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-glow transition flex items-center gap-2 flex-shrink-0"
                      >
                        <Crosshair className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                        <span>{gpsLoading ? 'Mencari Satelit...' : gpsVerified ? 'Perbarui dari Sensor' : 'Ambil Koordinat Satelit'}</span>
                      </button>
                    </div>

                    {gpsCoords && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 dark:text-emerald-300">
                          <span className="bg-white dark:bg-obsidian-900 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-bold">
                            Lat: {gpsCoords.lat.toFixed(5)}
                          </span>
                          <span className="bg-white dark:bg-obsidian-900 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-bold">
                            Lng: {gpsCoords.lng.toFixed(5)}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            (Akurasi ±{gpsCoords.accuracy}m)
                          </span>
                        </div>
                        <ReportMap 
                          center={[gpsCoords.lat, gpsCoords.lng]} 
                          selectedPoint={gpsCoords} 
                          zoom={18} 
                          height="200px" 
                        />
                      </div>
                    )}

                    {gpsError && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        ℹ️ {gpsError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Kategori & Urgensi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kategori Masalah
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {formConfig.reportCategories.map((cat, idx) => (
                      <option key={idx} value={cat} className="dark:bg-obsidian-900 text-slate-900 dark:text-white">{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tingkat Urgensi
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Rendah', 'Sedang', 'Darurat'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setUrgency(lvl)}
                        className={`py-2 rounded-xl text-xs font-bold transition border ${
                          urgency === lvl
                            ? lvl === 'Darurat'
                              ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                              : lvl === 'Sedang'
                              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                              : 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : 'bg-slate-50 dark:bg-obsidian-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-emerald-500/20 hover:border-emerald-500/40'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Deskripsi & Rincian Masalah Sarpras
                </label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Kran wastafel nomor 2 patah, air meluber ke koridor. Perlu penggantian fitting baru..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  required
                ></textarea>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white font-bold text-xs shadow-glow hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Simpan & Daftarkan Laporan Sarpras Resmi</span>
              </button>
            </div>
          </form>

          {/* Info Card */}
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5 border border-emerald-500/25 space-y-3">
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Prosedur Pelaporan Admin Sarpras</span>
              </h3>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Setiap temuan fisik sarpras atau sampah liar diinput melalui akun Admin dengan verifikasi GPS.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>Data laporan otomatis tampil di <strong>Denah & Riwayat Aduan</strong> sehingga seluruh warga sekolah dapat memantau transparansi.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>Setelah perbaikan fisik selesai, Admin memperbarui status menjadi <strong>Selesai</strong> dan dapat mengunduh rekap Excel.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ADMIN EDITOR LOKASI & KATEGORI (HANYA UNTUK ADMIN)                  */}
      {/* ========================================================================= */}
      {isAdmin && activeTab === 'editor' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lokasi Editor */}
          <div className="glass-card rounded-2xl p-6 border border-emerald-500/25 space-y-4">
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Kelola Titik Fasilitas Sekolah</span>
            </h3>

            <form onSubmit={handleAddLocation} className="flex gap-2">
              <input
                type="text"
                value={newLoc}
                onChange={(e) => setNewLoc(e.target.value)}
                placeholder="Nama lokasi fasilitas baru..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </form>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {formConfig.locations.map((loc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-obsidian-900/60 border border-slate-200 dark:border-emerald-500/20 text-xs">
                  <span className="text-slate-800 dark:text-slate-200">{loc}</span>
                  <button
                    onClick={() => handleDeleteLocation(loc)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition"
                    title="Hapus lokasi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Kategori Editor */}
          <div className="glass-card rounded-2xl p-6 border border-emerald-500/25 space-y-4">
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Kelola Kategori Masalah</span>
            </h3>

            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="Nama kategori masalah baru..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </form>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {formConfig.reportCategories.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-obsidian-900/60 border border-slate-200 dark:border-emerald-500/20 text-xs">
                  <span className="text-slate-800 dark:text-slate-200">{cat}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition"
                    title="Hapus kategori"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH TITIK FASILITAS BARU ================= */}
      {showAddFacilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-lg w-full p-6 rounded-3xl border border-emerald-500/30 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                    Tambah Titik Fasilitas Sekolah
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Daftarkan fasilitas sanitasi & kebersihan ke direktori kampus
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddFacilityModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFacility} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Titik Fasilitas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={facName}
                  onChange={(e) => setFacName(e.target.value)}
                  placeholder="Contoh: Toilet Santri Putra Lt. 1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Zona
                  </label>
                  <select
                    value={facCategory}
                    onChange={(e) => setFacCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Sanitasi & Air">Sanitasi & Air</option>
                    <option value="Pengelolaan Sampah">Pengelolaan Sampah</option>
                    <option value="Kebersihan Harian">Kebersihan Harian</option>
                    <option value="Sarana Belajar">Sarana Belajar</option>
                    <option value="Fasilitas Umum">Fasilitas Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ikon Tampilan
                  </label>
                  <select
                    value={facIconType}
                    onChange={(e) => setFacIconType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Droplets">Air & Sanitasi (Droplets)</option>
                    <option value="Recycle">Bank Sampah (Recycle)</option>
                    <option value="Sparkles">Wastafel & Bersih (Sparkles)</option>
                    <option value="School">Gedung / Kelas (School)</option>
                    <option value="UtensilsCrossed">Kantin / Masjid (Utensils)</option>
                    <option value="Building">Fasilitas Umum (Building)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Lokasi / Gedung
                </label>
                <input
                  type="text"
                  value={facLocation}
                  onChange={(e) => setFacLocation(e.target.value)}
                  placeholder="Contoh: Gedung Utama (Barat) Lantai 1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Sarana & Kebersihan
                </label>
                <textarea
                  rows={2}
                  value={facDesc}
                  onChange={(e) => setFacDesc(e.target.value)}
                  placeholder="Keterangan jumlah bilik, kran air, tempat sampah, dll..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-900 border border-slate-300 dark:border-emerald-500/25 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFacilityModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-obsidian-900 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-glow hover:brightness-110 transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simpan Fasilitas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
