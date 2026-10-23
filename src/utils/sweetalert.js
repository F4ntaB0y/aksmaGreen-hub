import Swal from 'sweetalert2';

// Cek status Dark Mode secara dinamis
const isDarkMode = () => {
  return document.documentElement.classList.contains('dark') || 
         document.body.classList.contains('dark');
};

// Pengaturan dasar tampilan SweetAlert2 agar selaras dengan desain AKSMA GREEN HUB
const getBaseConfig = () => {
  const isDark = isDarkMode();
  return {
    background: isDark ? '#08140e' : '#ffffff',
    color: isDark ? '#f0fdf4' : '#0f172a',
    backdrop: `rgba(0, 0, 0, ${isDark ? 0.75 : 0.5})`,
    customClass: {
      popup: 'aksma-swal-modal',
      title: 'aksma-swal-title',
      htmlContainer: 'aksma-swal-content',
      confirmButton: 'aksma-swal-confirm-btn',
      cancelButton: 'aksma-swal-cancel-btn',
      input: 'aksma-swal-input'
    },
    buttonsStyling: false,
    showClass: {
      popup: 'swal2-show animate-scale-in'
    },
    hideClass: {
      popup: 'swal2-hide'
    }
  };
};

/**
 * Notifikasi Sukses
 */
export const showSuccess = (title, text = '') => {
  return Swal.fire({
    ...getBaseConfig(),
    icon: 'success',
    iconColor: '#10b981',
    title,
    text,
    confirmButtonText: 'Selesai',
    timer: 3500,
    timerProgressBar: true
  });
};

/**
 * Notifikasi Galat / Gagal
 */
export const showError = (title, text = '') => {
  return Swal.fire({
    ...getBaseConfig(),
    icon: 'error',
    iconColor: '#ef4444',
    title,
    text,
    confirmButtonText: 'Tutup'
  });
};

/**
 * Notifikasi Peringatan
 */
export const showWarning = (title, text = '') => {
  return Swal.fire({
    ...getBaseConfig(),
    icon: 'warning',
    iconColor: '#f59e0b',
    title,
    text,
    confirmButtonText: 'Mengerti'
  });
};

/**
 * Notifikasi Informasi
 */
export const showInfo = (title, text = '') => {
  return Swal.fire({
    ...getBaseConfig(),
    icon: 'info',
    iconColor: '#0ea5e9',
    title,
    text,
    confirmButtonText: 'OK'
  });
};

/**
 * Dialog Konfirmasi (Ganti window.confirm)
 * Mengembalikan Promise<boolean>
 */
export const showConfirm = async ({
  title = 'Konfirmasi Tindakan',
  text = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmButtonText = 'Ya, Lanjutkan',
  cancelButtonText = 'Batal',
  icon = 'warning',
  isDanger = false
} = {}) => {
  const result = await Swal.fire({
    ...getBaseConfig(),
    icon,
    iconColor: isDanger ? '#ef4444' : icon === 'warning' ? '#f59e0b' : '#10b981',
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    customClass: {
      popup: 'aksma-swal-modal',
      title: 'aksma-swal-title',
      htmlContainer: 'aksma-swal-content',
      confirmButton: isDanger ? 'aksma-swal-danger-btn' : 'aksma-swal-confirm-btn',
      cancelButton: 'aksma-swal-cancel-btn'
    }
  });

  return result.isConfirmed;
};

/**
 * Dialog Input Teks / Catatan (Ganti window.prompt)
 * Mengembalikan Promise<string|null>
 */
export const showPrompt = async ({
  title = 'Masukkan Data',
  text = '',
  inputLabel = '',
  inputPlaceholder = '',
  inputValue = '',
  confirmButtonText = 'Kirim / Simpan',
  cancelButtonText = 'Batal',
  required = false
} = {}) => {
  const result = await Swal.fire({
    ...getBaseConfig(),
    title,
    text,
    input: 'text',
    inputLabel,
    inputPlaceholder,
    inputValue,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    inputValidator: (val) => {
      if (required && !val?.trim()) {
        return 'Kolom ini wajib diisi!';
      }
      return null;
    }
  });

  if (result.isConfirmed) {
    return result.value ?? '';
  }
  return null;
};

/**
 * Toast Notifikasi Pojok Kanan Atas
 */
export const showToast = (title, icon = 'success') => {
  const isDark = isDarkMode();
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: isDark ? '#08140e' : '#ffffff',
    color: isDark ? '#f0fdf4' : '#0f172a',
    customClass: {
      popup: 'aksma-swal-toast'
    },
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  return Toast.fire({
    icon,
    iconColor: icon === 'success' ? '#10b981' : icon === 'error' ? '#ef4444' : icon === 'warning' ? '#f59e0b' : '#0ea5e9',
    title
  });
};

export default Swal;
