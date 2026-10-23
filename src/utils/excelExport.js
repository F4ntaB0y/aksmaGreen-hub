import * as XLSX from 'xlsx';
import { showWarning, showError, showToast } from './sweetalert';

/**
 * Utility untuk mengekspor array of objects ke file Microsoft Excel (.xlsx)
 * @param {Array<Object>} data - Array objek data yang akan diekspor
 * @param {string} fileName - Nama file (tanpa .xlsx)
 * @param {string} sheetName - Nama tab worksheet (maks 31 karakter)
 */
export const exportToExcel = (data, fileName = 'Data_Export', sheetName = 'Sheet1') => {
  try {
    if (!data || data.length === 0) {
      showWarning('Data Belum Tersedia', 'Tidak ada baris data yang dapat diekspor ke format Excel!');
      return false;
    }

    // 1. Buat worksheet dari JSON
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 2. Auto-fit column widths
    const keys = Object.keys(data[0] || {});
    const colWidths = keys.map(key => {
      let maxLen = key.length;
      data.forEach(row => {
        const val = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: Math.min(Math.max(maxLen + 3, 10), 50) };
    });
    worksheet['!cols'] = colWidths;

    // 3. Buat workbook
    const workbook = XLSX.utils.book_new();
    const safeSheetName = sheetName.replace(/[:\\/?*\[\]]/g, '').slice(0, 31) || 'Data';
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

    // 4. Generate timestamp untuk nama file
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const finalFileName = `${fileName}_${dateStr}.xlsx`;

    // 5. Tulis & download file .xlsx
    XLSX.writeFile(workbook, finalFileName);
    showToast(`File Excel ${finalFileName} berhasil diunduh!`, 'success');
    return true;
  } catch (error) {
    console.error('Gagal mengekspor file Excel:', error);
    showError('Gagal Ekspor Excel', 'Terjadi kendala saat mengonversi data: ' + error.message);
    return false;
  }
};

/**
 * Utility untuk mengekspor beberapa sheet sekaligus ke dalam satu file workbook Excel
 * @param {Array<{ data: Array<Object>, sheetName: string }>} sheets - Array sheet konfigurasi
 * @param {string} fileName - Nama file workbook
 */
export const exportMultipleSheetsToExcel = (sheets, fileName = 'Laporan_Komprehensif_AKSMA') => {
  try {
    if (!sheets || sheets.length === 0) {
      showWarning('Sheet Kosong', 'Tidak ada data lembar kerja untuk diekspor!');
      return false;
    }

    const workbook = XLSX.utils.book_new();

    sheets.forEach(({ data, sheetName }) => {
      if (data && data.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const keys = Object.keys(data[0] || {});
        worksheet['!cols'] = keys.map(key => {
          let maxLen = key.length;
          data.forEach(row => {
            const val = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
            if (val.length > maxLen) maxLen = val.length;
          });
          return { wch: Math.min(Math.max(maxLen + 3, 10), 50) };
        });
        const safeName = (sheetName || 'Sheet').replace(/[:\\/?*\[\]]/g, '').slice(0, 31);
        XLSX.utils.book_append_sheet(workbook, worksheet, safeName);
      }
    });

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const finalFileName = `${fileName}_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, finalFileName);
    showToast(`Laporan komprehensif Excel ${finalFileName} berhasil diunduh!`, 'success');
    return true;
  } catch (error) {
    console.error('Gagal mengekspor multiple sheet Excel:', error);
    showError('Gagal Ekspor Excel', 'Terjadi kesalahan saat mengonversi data: ' + error.message);
    return false;
  }
};
