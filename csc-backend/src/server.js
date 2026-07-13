import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import messageRoutes from "./routes/messageRoutes.js";
import { apiKeyAuth } from "./middleware/apiKeyAuth.js";
import { generalLimiter } from "./middleware/rateLimiter.js";

const app = express();

// Kalau backend ini nanti jalan di belakang reverse proxy (nginx, dsb),
// baris ini bikin express baca IP asli pengunjung dari header
// X-Forwarded-For -- penting supaya rate limiter di atas ngitung per
// pengunjung asli, bukan cuma per-IP reverse proxy.
app.set("trust proxy", 1);

// Security headers standar (nonaktifin X-Powered-By, cegah clickjacking,
// MIME sniffing, dll).
app.use(helmet());

// CORS dibatasi cuma ke origin yang diizinkan lewat .env (CORS_ORIGIN,
// pisahkan dengan koma kalau lebih dari satu). Kalau tidak di-set,
// default ke origin dashboard dev (localhost:5173) SAJA -- bukan "*".
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Request tanpa "origin" (mis. dari curl/Postman) tetap diizinkan,
      // karena endpoint ini juga dipanggil dari sistem lain (server-to-server),
      // bukan cuma dari browser dashboard.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin tidak diizinkan oleh CORS."));
    },
  })
);

app.use(express.json({ limit: "100kb" }));

// Rate limit umum buat semua endpoint /api (rate limit khusus yang lebih
// ketat untuk /api/send-message ada di messageRoutes.js).
app.use("/api", generalLimiter);

// Autentikasi API key (lihat middleware/apiKeyAuth.js -- otomatis
// nonaktif kalau BACKEND_API_KEY belum di-set di .env).
app.use("/api", apiKeyAuth);

app.use("/api", messageRoutes);

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "csc-dashboard-backend" });
});

// Error handler terakhir -- jaga-jaga supaya error tak terduga (mis. dari
// body JSON yang rusak) tidak balik sebagai HTML/stack trace ke client.
app.use((err, _req, res, _next) => {
  console.error("[unhandled error]", err?.message ?? err);
  res.status(500).json({ success: false, message: "Terjadi kesalahan pada server." });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
  if (!process.env.BACKEND_API_KEY) {
    console.warn(
      "[PERINGATAN] BACKEND_API_KEY belum di-set -- endpoint /api/* TIDAK terlindungi API key. " +
        "Jangan expose backend ini ke internet publik sebelum BACKEND_API_KEY diisi."
    );
  }
});
