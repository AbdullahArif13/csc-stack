-- Dijalankan OTOMATIS oleh container Postgres sekali saja, pas volume-nya
-- masih kosong (pertama kali `docker compose up`).
-- Kalau mau reset total (hapus semua data & bikin ulang dari file ini):
--   docker compose down -v && docker compose up -d

CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  body TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Approve',
  -- v3: soft-delete flag. Klik icon "hapus" di dashboard_tamplate HANYA
  -- mengubah is_active jadi false (non-aktifkan) -- BUKAN menghapus baris.
  -- Baris betul-betul dihapus (DELETE FROM ...) hanya lewat tombol
  -- "Delete" di dalam popup detail template (lihat handleDeleteTemplate
  -- di messageController.js), sesuai alur dashboard_popup_tamplate.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- v3: tabel kontak. Diisi lewat 2 jalur:
--   1. OTOMATIS, tiap ada request masuk ke POST /api/send-message (field
--      no_wa + nama_wa di body-nya) -- lihat upsertContactFromMessage di
--      csc-backend/src/data/contacts.js.
--   2. MANUAL, lewat form "Add Contact" di dashboard (POST /api/contacts).
-- no_wa disimpan dalam bentuk digit ternormalisasi (awalan "0" -> "62")
-- supaya "089..." dari satu sumber dan "6289..." dari sumber lain dianggap
-- kontak yang sama, tidak dobel.
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  no_wa VARCHAR(20) NOT NULL UNIQUE,
  nama_wa VARCHAR(255) NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'manual', -- 'manual' | 'send_message'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Postgres tidak punya "ON UPDATE CURRENT_TIMESTAMP" bawaan seperti MySQL,
-- jadi updated_at di-refresh pakai trigger kecil ini tiap kali baris di
-- tabel contacts di-UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON contacts;
CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Data contoh, biar begitu backend dinyalakan langsung ada isinya
-- (sama seperti 2 template contoh yang tadinya hardcode di templates.js).
INSERT INTO templates (name, body, status, is_active) VALUES
  (
    'spct_order',
    E'Halo Bapak/Ibu {{nama}},\n\nKami informasikan terdapat Request Part pada Web E-Picking SPCT dengan rincian berikut:\n\nNomor Request : {{nomor_request}}\nRequester : {{requester}}\n\nDetail Item Request:\n{{item}}\n\nSilakan melakukan pengecekan atas request tersebut sesuai kebutuhan.\n\nTerima kasih atas perhatian Anda.',
    'Approve',
    true
  ),
  (
    'Reminder_Switch_Alert',
    E'Selamat pagi {{nama}}, mohon konfirmasi status switch {{lokasi}} sebelum pukul {{jam}}.',
    'Approve',
    true
  )
ON CONFLICT (name) DO NOTHING;
