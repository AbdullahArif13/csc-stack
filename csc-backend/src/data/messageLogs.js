// Riwayat setiap request yang masuk ke POST /api/send-message -- baik yang
// berhasil maupun yang gagal -- supaya FrontEnd bisa menampilkan "ke mana
// saja arah dari sistem permintaan ke orang yang dituju".
//
// PENTING: ini masih in-memory (hilang kalau server di-restart). Begitu
// Anda siapkan database di XAMPP (MySQL), ganti isi file ini dengan query
// ke tabel `message_logs`, tanpa perlu mengubah pemanggilnya di
// `messageController.js`.

const logs = [];

/**
 * Kandidat nama key di dalam `values` yang kemungkinan berisi nama
 * penerima pesan. Dicek case-insensitive, karena nama variabel bisa beda
 * antar template (mis. {{nama}} vs {{Nama_Penerima}}).
 */
const RECIPIENT_NAME_KEYS = ["nama", "name", "penerima", "recipient", "recipient_name", "nama_penerima"];

function guessRecipientName(values = {}) {
  const lowerCaseValues = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key.toLowerCase(), value])
  );
  for (const key of RECIPIENT_NAME_KEYS) {
    if (lowerCaseValues[key]) return lowerCaseValues[key];
  }
  return null;
}

/**
 * Mencatat satu percobaan pengiriman (berhasil atau gagal) ke riwayat.
 * Dipanggil dari `messageController.js` setelah `sendWhatsAppMessage`
 * selesai (baik sukses maupun error).
 */
export function addMessageLog({ template_wa, no_wa, nama_wa, values, final_message, status, error_message }) {
  const log = {
    id: Date.now() + Math.random().toString(36).slice(2, 7),
    template_wa,
    no_wa,
    nama_wa: nama_wa ?? null,
    // "nama_wa" (nama kontak WA tujuan) adalah sumber utama nama yang
    // ditampilkan di Riwayat Pengiriman / Chat. Kalau field itu kosong
    // (mis. request lama sebelum v3), baru fallback ke tebakan dari isi
    // "values" seperti sebelumnya.
    recipient_name: nama_wa ?? guessRecipientName(values),
    values,
    final_message,
    status, // "terkirim" | "gagal"
    error_message: error_message ?? null,
    created_at: new Date().toISOString(),
  };
  logs.unshift(log); // yang terbaru tampil paling atas
  return log;
}

/** Mengambil seluruh riwayat, terbaru lebih dulu. */
export function listMessageLogs() {
  return logs;
}
