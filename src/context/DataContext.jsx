import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_CLEAN_CHECK = 'aksma_clean_check_v4';
const STORAGE_ECO_POINT = 'aksma_eco_point_v4';
const STORAGE_GREEN_REPORT = 'aksma_green_report_v4';
const STORAGE_FORM_CONFIG = 'aksma_form_config_v4';
const STORAGE_CLASSES = 'aksma_classes_v4';
const STORAGE_FACILITIES = 'aksma_facilities_v4';

export const DEFAULT_FACILITIES = [
  {
    id: 'z-toilet-1',
    name: 'Toilet Santri Putra Lt. 1',
    category: 'Sanitasi & Air',
    location: 'Gedung Utama (Barat)',
    coords: { lat: -6.74420, lng: 108.53975 },
    iconType: 'Droplets',
    desc: '4 Bilik toilet santri putra, 3 kran wudhu & wastafel cuci tangan'
  },
  {
    id: 'z-toilet-2',
    name: 'Toilet Santri Putri Lt. 2',
    category: 'Sanitasi & Air',
    location: 'Gedung Utama (Timur)',
    coords: { lat: -6.74405, lng: 108.53990 },
    iconType: 'Droplets',
    desc: '4 Bilik toilet santri putri & cermin sanitasi higienis'
  },
  {
    id: 'z-tps',
    name: 'TPS Terpadu & Bank Sampah',
    category: 'Pengelolaan Sampah',
    location: 'Area Belakang Kampus',
    coords: { lat: -6.74435, lng: 108.53965 },
    iconType: 'Recycle',
    desc: 'Pusat pemilahan sampah organik, anorganik & pos timbang Eco-Point'
  },
  {
    id: 'z-wastafel',
    name: 'Wastafel Koridor Utama',
    category: 'Kebersihan Harian',
    location: 'Depan Ruang Guru & Lobi',
    coords: { lat: -6.74410, lng: 108.53980 },
    iconType: 'Sparkles',
    desc: 'Titik cuci tangan santri & sabun antiseptik'
  },
  {
    id: 'z-kelas',
    name: 'Kompleks Ruang Kelas X, XI, XII',
    category: 'Sarana Belajar',
    location: 'Gedung A & B',
    coords: { lat: -6.74400, lng: 108.53985 },
    iconType: 'School',
    desc: 'Area kegiatan belajar mengajar & titik pelaksanaan piket 5R harian'
  },
  {
    id: 'z-kantin',
    name: 'Kantin Sehat & Masjid Sekolah',
    category: 'Fasilitas Umum',
    location: 'Sayap Selatan Kampus',
    coords: { lat: -6.74425, lng: 108.53995 },
    iconType: 'UtensilsCrossed',
    desc: 'Penyediaan tempat sampah terpilah 3 warna & tempat wudhu bersih'
  }
];

export const DEFAULT_CLASSES = [
  { id: 'c1', name: 'X-A', waliKelas: 'Ust. H. Ahmad Fauzi, S.Pd', siswaCount: 32, gedung: 'Gedung A Lantai 1' },
  { id: 'c2', name: 'X-B', waliKelas: 'Usth. Siti Maryam, M.Pd', siswaCount: 30, gedung: 'Gedung A Lantai 1' },
  { id: 'c3', name: 'X-C', waliKelas: 'Ust. Ridwan Kamil, S.Si', siswaCount: 31, gedung: 'Gedung A Lantai 2' },
  { id: 'c4', name: 'XI-MIPA 1', waliKelas: 'Ust. Deden S., M.T', siswaCount: 28, gedung: 'Gedung B Lantai 1' },
  { id: 'c5', name: 'XI-MIPA 2', waliKelas: 'Usth. Nurul Hayati, S.Pd', siswaCount: 29, gedung: 'Gedung B Lantai 1' },
  { id: 'c6', name: 'XI-IPS', waliKelas: 'Ust. Agus Salim, S.Sos', siswaCount: 26, gedung: 'Gedung B Lantai 2' },
  { id: 'c7', name: 'XII-MIPA', waliKelas: 'Ust. Hendra Gunawan, M.Sc', siswaCount: 27, gedung: 'Gedung C Lantai 1' },
  { id: 'c8', name: 'XII-IPS', waliKelas: 'Usth. Laila Rahmawati, S.Pd', siswaCount: 25, gedung: 'Gedung C Lantai 2' }
];

export const DEFAULT_CRITERIA = [
  { id: 'lantai', title: 'Kebersihan & Kerapian Lantai', desc: 'Disapu, dipel bersih, bebas debu dan sampah berserakan di bawah meja', points: 25 },
  { id: 'meja_kursi', title: 'Kerapian Meja & Kursi Santri', desc: 'Berjajar lurus rapi, laci meja kosong tanpa sampah makanan tersimpan', points: 20 },
  { id: 'papan_tulis', title: 'Papan Tulis & Area Guru', desc: 'Dihapus bersih, spidol & penghapus tertata rapi di wadahnya', points: 15 },
  { id: 'jendela_ventilasi', title: 'Jendela, Kaca & Ventilasi', desc: 'Kaca bening bebas debu/bercak, gorden terikat rapi', points: 20 },
  { id: 'tempat_sampah', title: 'Tempat Sampah & Sarana 5R', desc: 'Sampah kelas telah dipilah dan dikosongkan ke tong luar kelas', points: 20 }
];

export const DEFAULT_WASTE_TYPES = [
  { id: 'plastik', name: 'Botol & Gelas Plastik PET', pointsPerUnit: 10, unit: 'botol/cup', desc: 'Botol mineral, cup minuman bersih' },
  { id: 'kertas', name: 'Kertas HVS & Lembar Buku', pointsPerUnit: 5, unit: 'lembar', desc: 'Kertas tugas, lembaran tak terpakai' },
  { id: 'kardus', name: 'Kardus & Box Paket', pointsPerUnit: 15, unit: 'box/lembar', desc: 'Dus snack, karton kemasan tebal' },
  { id: 'kaleng', name: 'Kaleng Minuman & Logam', pointsPerUnit: 25, unit: 'kaleng', desc: 'Kaleng soda, minuman aluminium' }
];

export const DEFAULT_LOCATIONS = [
  'Kamar Mandi / Toilet Santri Putra',
  'Kamar Mandi / Toilet Santri Putri',
  'Area Kantin & Food Court Sekolah',
  'Masjid & Tempat Wudhu Utama',
  'Koridor Lantai 1 (Gedung Utama)',
  'Koridor Lantai 2 (Gedung Sains & Timur)',
  'Lapangan Olahraga & Upacara',
  'Laboratorium Komputer & IPA',
  'Perpustakaan Sekolah'
];

export const DEFAULT_REPORT_CATEGORIES = [
  'Sampah Menumpuk / Liar',
  'Kran Air Rusak / Bocor',
  'Toilet Mampet / Kotor',
  'Lampu / Kelistrikan Padam',
  'Fasilitas Rusak / Patah',
  'Lainnya'
];

// Data awal bersih tanpa dummy
const SEED_CLEAN_CHECKS = [];
const SEED_ECO_POINTS = [];
const SEED_GREEN_REPORTS = [];

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  // Classes State
  const [classes, setClasses] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CLASSES);
      return saved ? JSON.parse(saved) : DEFAULT_CLASSES;
    } catch {
      return DEFAULT_CLASSES;
    }
  });

  // Clean Check data
  const [cleanChecks, setCleanChecks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CLEAN_CHECK);
      return saved ? JSON.parse(saved) : SEED_CLEAN_CHECKS;
    } catch {
      return SEED_CLEAN_CHECKS;
    }
  });

  // Eco Point data (Quantity / Jumlah Sampah)
  const [ecoPoints, setEcoPoints] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ECO_POINT);
      return saved ? JSON.parse(saved) : SEED_ECO_POINTS;
    } catch {
      return SEED_ECO_POINTS;
    }
  });

  // Green Report data (with GPS coordinates)
  const [greenReports, setGreenReports] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_GREEN_REPORT);
      return saved ? JSON.parse(saved) : SEED_GREEN_REPORTS;
    } catch {
      return SEED_GREEN_REPORTS;
    }
  });

  // Dynamic Form Configs (Criteria, Waste Types, Locations, Categories)
  const [formConfig, setFormConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FORM_CONFIG);
      return saved ? JSON.parse(saved) : {
        criteria: DEFAULT_CRITERIA,
        wasteTypes: DEFAULT_WASTE_TYPES,
        locations: DEFAULT_LOCATIONS,
        reportCategories: DEFAULT_REPORT_CATEGORIES
      };
    } catch {
      return {
        criteria: DEFAULT_CRITERIA,
        wasteTypes: DEFAULT_WASTE_TYPES,
        locations: DEFAULT_LOCATIONS,
        reportCategories: DEFAULT_REPORT_CATEGORIES
      };
    }
  });

  // Facilities State (Titik Fasilitas & Sanitasi Sekolah - Default KOSONG)
  const [facilities, setFacilities] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FACILITIES);
      return saved ? JSON.parse(saved) : []; // Default kosong tanpa dummy
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_CLASSES, JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_FACILITIES, JSON.stringify(facilities));
  }, [facilities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_CLEAN_CHECK, JSON.stringify(cleanChecks));
  }, [cleanChecks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ECO_POINT, JSON.stringify(ecoPoints));
  }, [ecoPoints]);

  useEffect(() => {
    localStorage.setItem(STORAGE_GREEN_REPORT, JSON.stringify(greenReports));
  }, [greenReports]);

  useEffect(() => {
    localStorage.setItem(STORAGE_FORM_CONFIG, JSON.stringify(formConfig));
  }, [formConfig]);

  // ================= CRUD KELAS =================
  const addClass = (classData) => {
    const trimmedName = (classData.name || '').trim().toUpperCase();
    if (!trimmedName) return { success: false, message: 'Nama kelas tidak boleh kosong!' };
    if (classes.some(c => c.name.toUpperCase() === trimmedName)) {
      return { success: false, message: `Kelas ${trimmedName} sudah terdaftar!` };
    }
    const newClass = {
      id: 'c_' + Date.now(),
      name: trimmedName,
      waliKelas: classData.waliKelas?.trim() || 'Belum Ditentukan',
      siswaCount: Number(classData.siswaCount) || 30,
      gedung: classData.gedung?.trim() || 'Gedung Utama'
    };
    setClasses(prev => [...prev, newClass]);
    return { success: true, class: newClass };
  };

  const updateClass = (id, updatedData) => {
    setClasses(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          ...updatedData,
          name: updatedData.name ? updatedData.name.trim().toUpperCase() : c.name
        };
      }
      return c;
    }));
    return { success: true };
  };

  const deleteClass = (id) => {
    const target = classes.find(c => c.id === id);
    if (!target) return { success: false, message: 'Kelas tidak ditemukan' };
    if (classes.length <= 1) {
      return { success: false, message: 'Minimal harus ada satu kelas terdaftar!' };
    }
    setClasses(prev => prev.filter(c => c.id !== id));
    return { success: true };
  };

  // ================= CRUD KRITERIA CHECKLIST (CLEAN CHECK) =================
  const addCriteria = (criteriaData) => {
    const title = criteriaData.title?.trim();
    if (!title) return { success: false, message: 'Judul kriteria penilaian tidak boleh kosong!' };
    const newItem = {
      id: 'crit_' + Date.now(),
      title,
      desc: criteriaData.desc?.trim() || 'Standar kebersihan 5R',
      points: Number(criteriaData.points) || 20
    };
    setFormConfig(prev => ({
      ...prev,
      criteria: [...prev.criteria, newItem]
    }));
    return { success: true, item: newItem };
  };

  const updateCriteriaItem = (id, updatedData) => {
    setFormConfig(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => c.id === id ? { ...c, ...updatedData } : c)
    }));
    return { success: true };
  };

  const deleteCriteria = (id) => {
    if (formConfig.criteria.length <= 1) {
      return { success: false, message: 'Minimal harus menyisakan 1 kriteria penilaian!' };
    }
    setFormConfig(prev => ({
      ...prev,
      criteria: prev.criteria.filter(c => c.id !== id)
    }));
    return { success: true };
  };

  const resetCriteria = () => {
    setFormConfig(prev => ({
      ...prev,
      criteria: DEFAULT_CRITERIA
    }));
    return { success: true };
  };

  // ================= CLEAN CHECK ACTIONS =================
  const addCleanCheck = (entry) => {
    const newEntry = {
      id: 'CC-' + Date.now(),
      status: 'pending', // 'pending' | 'verified' | 'rejected'
      createdAt: new Date().toISOString(),
      score: Number(entry.score) || 0,
      originalScore: Number(entry.score) || 0,
      points: Number(entry.points) || Number(entry.score) || 0,
      originalPoints: Number(entry.points) || Number(entry.score) || 0,
      photoProof: entry.photoProof || null, // Bukti foto kebersihan
      adminNotes: '',
      verifiedAt: null,
      verifiedBy: null,
      ...entry
    };
    setCleanChecks(prev => [newEntry, ...prev]);
    return newEntry;
  };

  const verifyCleanCheck = (id, verifiedScore, adminNotes = '') => {
    setCleanChecks(prev => prev.map(item => {
      if (item.id === id) {
        const finalScore = verifiedScore !== undefined && verifiedScore !== null 
          ? Number(verifiedScore) 
          : item.score;
        return {
          ...item,
          status: 'verified',
          score: finalScore,
          points: finalScore,
          adminNotes: adminNotes || item.adminNotes || '',
          verifiedAt: new Date().toISOString(),
          verifiedBy: 'Administrator'
        };
      }
      return item;
    }));
  };

  const updateCleanCheckScore = (id, newScore, adminNotes = '') => {
    setCleanChecks(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          score: Number(newScore),
          points: Number(newScore),
          adminNotes: adminNotes || item.adminNotes || '',
          isEdited: true,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    }));
  };

  const rejectCleanCheck = (id, reason) => {
    setCleanChecks(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'rejected',
          rejectReason: reason || 'Laporan kebersihan tidak sesuai kondisi fisik / direkayasa',
          verifiedAt: new Date().toISOString(),
          verifiedBy: 'Administrator'
        };
      }
      return item;
    }));
  };

  const deleteCleanCheck = (id) => {
    setCleanChecks(prev => prev.filter(c => c.id !== id));
  };

  // ================= ECO POINT ACTIONS (JUMLAH SAMPAH) =================
  const addEcoPointSubmission = (submission) => {
    const newEntry = {
      id: 'EP-' + Date.now(),
      status: 'pending', // 'pending' | 'verified' | 'rejected'
      createdAt: new Date().toISOString(),
      photoProof: submission.photoProof || null, // Bukti foto sampah daur ulang
      originalQuantity: Number(submission.quantity) || 0,
      originalPoints: Number(submission.points) || 0,
      adminNotes: '',
      ...submission
    };
    setEcoPoints(prev => [newEntry, ...prev]);
    return newEntry;
  };

  const verifyEcoPoint = (id, verifiedQty, pointsEarned, adminNotes = '') => {
    setEcoPoints(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'verified',
          quantity: verifiedQty !== undefined && verifiedQty !== null ? Number(verifiedQty) : item.quantity,
          points: pointsEarned !== undefined && pointsEarned !== null ? Number(pointsEarned) : item.points,
          adminNotes: adminNotes || item.adminNotes || '',
          verifiedAt: new Date().toISOString(),
          verifiedBy: 'Administrator'
        };
      }
      return item;
    }));
  };

  const updateEcoPointSubmission = (id, newPoints, newQty, adminNotes = '') => {
    setEcoPoints(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          points: Number(newPoints),
          quantity: newQty !== undefined && newQty !== null ? Number(newQty) : item.quantity,
          adminNotes: adminNotes || item.adminNotes || '',
          isEdited: true,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    }));
  };

  const rejectEcoPoint = (id, reason) => {
    setEcoPoints(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'rejected',
          rejectReason: reason || 'Kondisi sampah belum sesuai pemilahan / direkayasa',
          verifiedAt: new Date().toISOString(),
          verifiedBy: 'Administrator'
        };
      }
      return item;
    }));
  };

  // ================= GREEN REPORT ACTIONS (GPS & MAP) =================
  const addGreenReport = (report) => {
    const newReport = {
      id: 'GR-' + Date.now(),
      status: 'baru', // 'baru' | 'proses' | 'selesai'
      createdAt: new Date().toISOString(),
      coords: report.coords || { lat: -6.74412, lng: 108.53982, accuracy: 10 },
      gpsVerified: !!report.gpsVerified,
      ...report
    };
    setGreenReports(prev => [newReport, ...prev]);
    return newReport;
  };

  const updateReportStatus = (id, status, notes = '') => {
    setGreenReports(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status,
          adminNotes: notes || item.adminNotes,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    }));
  };

  // ================= ADMIN CONFIG EDITORS =================
  const updateWasteTypes = (newWasteList) => {
    setFormConfig(prev => ({ ...prev, wasteTypes: newWasteList }));
  };

  const updateLocations = (newLocList) => {
    setFormConfig(prev => ({ ...prev, locations: newLocList }));
  };

  const updateReportCategories = (newCatList) => {
    setFormConfig(prev => ({ ...prev, reportCategories: newCatList }));
  };

  // ================= FASILITAS KAMPUS CRUD (DEFAULT KOSONG) =================
  const addFacility = (facData) => {
    const trimmedName = (facData.name || '').trim();
    if (!trimmedName) return { success: false, message: 'Nama fasilitas tidak boleh kosong!' };
    const newFacility = {
      id: 'fac_' + Date.now(),
      name: trimmedName,
      category: facData.category?.trim() || 'Sanitasi & Air',
      location: facData.location?.trim() || 'Kampus Utama',
      coords: facData.coords || { lat: -6.74412, lng: 108.53982 },
      desc: facData.desc?.trim() || 'Fasilitas kebersihan & sanitasi sekolah',
      iconType: facData.iconType || 'Building'
    };
    setFacilities(prev => [...prev, newFacility]);
    return { success: true, facility: newFacility };
  };

  const deleteFacility = (id) => {
    setFacilities(prev => prev.filter(f => f.id !== id));
    return { success: true };
  };

  const clearAllFacilities = () => {
    setFacilities([]);
    localStorage.removeItem(STORAGE_FACILITIES);
    return { success: true };
  };

  const loadDefaultFacilities = () => {
    setFacilities(DEFAULT_FACILITIES);
    return { success: true };
  };

  // Clear / Reset All Data
  const resetAllData = () => {
    setCleanChecks(SEED_CLEAN_CHECKS);
    setEcoPoints(SEED_ECO_POINTS);
    setGreenReports(SEED_GREEN_REPORTS);
    setClasses(DEFAULT_CLASSES);
    setFacilities([]);
    setFormConfig({
      criteria: DEFAULT_CRITERIA,
      wasteTypes: DEFAULT_WASTE_TYPES,
      locations: DEFAULT_LOCATIONS,
      reportCategories: DEFAULT_REPORT_CATEGORIES
    });
  };

  return (
    <DataContext.Provider value={{
      classes,
      addClass,
      updateClass,
      deleteClass,

      facilities,
      addFacility,
      deleteFacility,
      clearAllFacilities,
      loadDefaultFacilities,

      cleanChecks,
      addCleanCheck,
      verifyCleanCheck,
      updateCleanCheckScore,
      rejectCleanCheck,
      deleteCleanCheck,

      ecoPoints,
      addEcoPointSubmission,
      verifyEcoPoint,
      updateEcoPointSubmission,
      rejectEcoPoint,

      greenReports,
      addGreenReport,
      updateReportStatus,

      formConfig,
      addCriteria,
      updateCriteriaItem,
      deleteCriteria,
      resetCriteria,
      updateWasteTypes,
      updateLocations,
      updateReportCategories,
      resetAllData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
