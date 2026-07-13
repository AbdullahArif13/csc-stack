// Logic ini SENGAJA dibuat identik dengan `src/utils/templateEngine.js` di
// backend (csc-dashboard-backend), supaya preview yang tampil di frontend
// selalu sama persis dengan pesan yang benar-benar dikirim lewat backend.

/**
 * Menemukan semua {{variabel}} unik di dalam teks, urut sesuai kemunculan
 * pertama. Spasi di dalam kurung ditoleransi, mis. {{ nama }} tetap
 * dianggap variabel "nama".
 */
export function extractVariableNames(text) {
  const seen = new Set();
  const names = [];
  for (const match of String(text ?? "").matchAll(/{{\s*([\w]+)\s*}}/g)) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

/** Replaces {{variabel}} placeholders in a template body with entered values. */
export function fillTemplate(text, values = {}) {
  return String(text ?? "").replace(/{{\s*([\w]+)\s*}}/g, (match, key) => {
    const value = values[key];
    return value ? value : match;
  });
}

/**
 * Nama variabel yang wajib diisi tapi masih kosong di `values`.
 * Dipakai untuk menonaktifkan tombol "Kirim" sebelum data lengkap,
 * sebelum request sempat ditolak oleh backend.
 */
export function findMissingVariables(templateBody, values = {}) {
  return extractVariableNames(templateBody).filter((name) => !values[name]?.trim());
}
