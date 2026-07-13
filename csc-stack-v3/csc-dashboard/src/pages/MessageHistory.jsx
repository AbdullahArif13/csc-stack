import { useEffect, useState } from "react";
import { History, RefreshCw } from "lucide-react";
import Layout from "../components/Layout.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { getMessageLogs } from "../services/api.js";

/**
 * Halaman ini READ-ONLY. FrontEnd TIDAK memicu pengiriman pesan -- pesan
 * benar-benar dikirim oleh sistem permintaan (mis. Web E-Picking) yang
 * memanggil backend secara langsung lewat POST /api/send-message.
 *
 * Fungsi halaman ini hanya menampilkan riwayat: ke nomor & nama siapa saja
 * setiap request itu ditujukan, pakai template apa, dan berhasil atau tidak.
 */
export default function MessageHistory() {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"
  const [errorMessage, setErrorMessage] = useState("");
  const [viewingLog, setViewingLog] = useState(null);

  async function loadLogs() {
    setStatus("loading");
    try {
      const data = await getMessageLogs();
      setLogs(data);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error.message || "Gagal mengambil riwayat pesan.");
      setStatus("error");
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <Layout showWatermark={status === "ready" && logs.length === 0}>
      <PageHeader title="Riwayat Pengiriman" actionLabel="Refresh" onAction={loadLogs} />

      <div className="px-8 pb-8">
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Riwayat Pesan dari Sistem Permintaan</h2>
            <p className="text-sm text-gray-400">
              Daftar pesan yang sudah dikirim oleh sistem permintaan lewat backend, lengkap dengan tujuannya.
            </p>
          </div>
        </div>

        {status === "loading" && (
          <p className="flex items-center gap-2 text-sm text-gray-400">
            <RefreshCw size={16} className="animate-spin" /> Memuat riwayat...
          </p>
        )}

        {status === "error" && (
          <p className="text-sm text-red-500">{errorMessage} — pastikan backend sedang berjalan.</p>
        )}

        {status === "ready" && (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="px-5 py-3 font-semibold text-gray-900">Nama Tujuan</th>
                <th className="px-5 py-3 font-semibold text-gray-900">No. WA</th>
                <th className="px-5 py-3 font-semibold text-gray-900">Template</th>
                <th className="px-5 py-3 font-semibold text-gray-900">Status</th>
                <th className="px-5 py-3 font-semibold text-gray-900">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-gray-400">
                    Belum ada pesan yang tercatat. Riwayat akan muncul di sini begitu sistem permintaan
                    mengirim pesan lewat backend.
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100">
                  <td className="px-5 py-3 text-gray-700">
                    {log.recipient_name || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{log.no_wa}</td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => setViewingLog(log)}
                      className="text-gray-700 underline-offset-2 transition-colors hover:text-brand hover:underline"
                    >
                      {log.template_wa}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="px-5 py-3 text-gray-500">{formatTimestamp(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewingLog && <LogDetailModal log={viewingLog} onClose={() => setViewingLog(null)} />}
    </Layout>
  );
}

function StatusBadge({ status }) {
  const isSent = status === "terkirim";
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        isSent ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
      }`}
    >
      {isSent ? "Terkirim" : "Gagal"}
    </span>
  );
}

function formatTimestamp(isoString) {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LogDetailModal({ log, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="flex w-full max-w-lg flex-col gap-4 rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <History size={18} /> {log.template_wa}
            </h3>
            <p className="text-sm text-gray-400">
              Ke {log.recipient_name ?? "-"} ({log.no_wa}) &middot; {formatTimestamp(log.created_at)}
            </p>
          </div>
          <StatusBadge status={log.status} />
        </div>

        {log.status === "gagal" && log.error_message && (
          <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-500">{log.error_message}</p>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold text-gray-900">Isi Pesan</p>
          <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg bg-gray-100 p-4 text-sm text-gray-700">
            {log.final_message}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-gray-900">Data Variabel yang Dikirim</p>
          <div className="max-h-40 overflow-y-auto rounded-lg bg-gray-100 p-4 text-sm text-gray-700">
            {Object.entries(log.values ?? {}).map(([key, value]) => (
              <p key={key}>
                <span className="font-medium">{key}</span>: {value}
              </p>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="self-end rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
