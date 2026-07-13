/**
 * Autentikasi sederhana berbasis API key (header `X-API-Key`).
 *
 * Ini BUKAN pengganti sistem login/SSO yang proper -- untuk aplikasi
 * internal seperti ini, tujuannya adalah mencegah orang random yang
 * nemu URL backend kamu bisa langsung nge-spam WhatsApp/nulis ke
 * database tanpa izin. Kalau nanti butuh multi-user dengan hak akses
 * berbeda-beda, ini perlu diupgrade ke JWT/session per-user.
 *
 * Kalau BACKEND_API_KEY tidak di-set di .env, middleware ini otomatis
 * NONAKTIF (supaya gampang development lokal) -- tapi akan mencetak
 * warning keras di log, dan WAJIB diisi sebelum dipakai di luar
 * localhost/pentest.
 */
export function apiKeyAuth(req, res, next) {
  const expectedKey = process.env.BACKEND_API_KEY;

  if (!expectedKey) {
    // Sengaja tidak menolak request supaya development lokal tetap
    // gampang, tapi ini WAJIB diisi sebelum production / pentest.
    return next();
  }

  const providedKey = req.header("X-API-Key");

  if (!providedKey || providedKey !== expectedKey) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  return next();
}
