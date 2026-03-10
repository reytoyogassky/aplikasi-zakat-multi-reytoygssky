-- ============================================================
-- APLIKASI AMILIN v2 — MIGRASI MULTI-TENANT
-- Jalankan di Supabase SQL Editor (Dashboard > SQL Editor)
-- Aman untuk data yang sudah ada — TIDAK ada DROP TABLE
-- ============================================================

-- ─────────────────────────────────────────
-- LANGKAH 1: Extension UUID (biasanya sudah aktif)
-- ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- LANGKAH 2: Tabel master masjid
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS masjid (
  id          UUID         DEFAULT uuid_generate_v4() PRIMARY KEY,
  kode        VARCHAR(50)  UNIQUE NOT NULL,
  secret_key  VARCHAR(200) NOT NULL,
  nama_masjid VARCHAR(200),
  nama_desa   VARCHAR(200),
  aktif       BOOLEAN      DEFAULT TRUE,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- LANGKAH 3: Insert masjid pertama
-- GANTI 'ganti-kunci-ini' dengan kunci rahasia yang diinginkan!
-- ─────────────────────────────────────────
INSERT INTO masjid (kode, secret_key, nama_masjid, nama_desa)
SELECT
  'masjid-default',
  'ganti-kunci-ini',
  COALESCE(nama_masjid, 'Masjid Default'),
  COALESCE(nama_desa, '')
FROM pengaturan
LIMIT 1
ON CONFLICT (kode) DO NOTHING;

-- ─────────────────────────────────────────
-- LANGKAH 4: Tambah kolom masjid_id ke semua tabel
-- ─────────────────────────────────────────
ALTER TABLE pengaturan ADD COLUMN IF NOT EXISTS masjid_id UUID REFERENCES masjid(id);
ALTER TABLE muzaki     ADD COLUMN IF NOT EXISTS masjid_id UUID REFERENCES masjid(id);
ALTER TABLE mustahik   ADD COLUMN IF NOT EXISTS masjid_id UUID REFERENCES masjid(id);

-- ─────────────────────────────────────────
-- LANGKAH 5: Isi masjid_id pada data lama
-- ─────────────────────────────────────────
UPDATE pengaturan SET masjid_id = (SELECT id FROM masjid WHERE kode = 'masjid-default') WHERE masjid_id IS NULL;
UPDATE muzaki     SET masjid_id = (SELECT id FROM masjid WHERE kode = 'masjid-default') WHERE masjid_id IS NULL;
UPDATE mustahik   SET masjid_id = (SELECT id FROM masjid WHERE kode = 'masjid-default') WHERE masjid_id IS NULL;

-- ─────────────────────────────────────────
-- LANGKAH 6: Set NOT NULL setelah data terisi
-- ─────────────────────────────────────────
ALTER TABLE pengaturan ALTER COLUMN masjid_id SET NOT NULL;
ALTER TABLE muzaki     ALTER COLUMN masjid_id SET NOT NULL;
ALTER TABLE mustahik   ALTER COLUMN masjid_id SET NOT NULL;

-- ─────────────────────────────────────────
-- LANGKAH 7: Index performa
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pengaturan_masjid ON pengaturan(masjid_id);
CREATE INDEX IF NOT EXISTS idx_muzaki_masjid     ON muzaki(masjid_id);
CREATE INDEX IF NOT EXISTS idx_mustahik_masjid   ON mustahik(masjid_id);

-- ─────────────────────────────────────────
-- LANGKAH 8: Row Level Security (RLS)
-- ─────────────────────────────────────────
ALTER TABLE pengaturan ENABLE ROW LEVEL SECURITY;
ALTER TABLE muzaki     ENABLE ROW LEVEL SECURITY;
ALTER TABLE mustahik   ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "isolasi_pengaturan" ON pengaturan;
DROP POLICY IF EXISTS "isolasi_muzaki"     ON muzaki;
DROP POLICY IF EXISTS "isolasi_mustahik"   ON mustahik;

-- Buat policy baru — RLS menggunakan header x-masjid-id yang dikirim client
CREATE POLICY "isolasi_pengaturan" ON pengaturan
  USING (masjid_id::text = (current_setting('request.headers', true)::json->>'x-masjid-id'));

CREATE POLICY "isolasi_muzaki" ON muzaki
  USING (masjid_id::text = (current_setting('request.headers', true)::json->>'x-masjid-id'));

CREATE POLICY "isolasi_mustahik" ON mustahik
  USING (masjid_id::text = (current_setting('request.headers', true)::json->>'x-masjid-id'));

-- Service role bypass RLS (untuk script admin)
ALTER TABLE masjid     ENABLE ROW LEVEL SECURITY;
CREATE POLICY "masjid_service_only" ON masjid USING (true);

-- ─────────────────────────────────────────
-- LANGKAH 9: Update views dengan masjid_id
-- ─────────────────────────────────────────
DROP VIEW IF EXISTS v_laporan_harian;
DROP VIEW IF EXISTS v_laporan_keseluruhan;

CREATE VIEW v_laporan_harian AS
SELECT
  masjid_id,
  hari_ke,
  tanggal_bayar,
  COUNT(*)                          AS jumlah_kk,
  SUM(jumlah_jiwa)                  AS jumlah_jiwa,
  SUM(jumlah_uang)                  AS total_uang,
  SUM(jumlah_beras)                 AS total_beras,
  SUM(jumlah_infak)                 AS total_infak,
  SUM(COALESCE(infak_tambahan,0))   AS total_infak_tambahan,
  SUM(COALESCE(jumlah_sadaqah_uang,0))  AS total_sadaqah_uang,
  SUM(COALESCE(jumlah_sadaqah_beras,0)) AS total_sadaqah_beras
FROM muzaki
GROUP BY masjid_id, hari_ke, tanggal_bayar
ORDER BY hari_ke;

CREATE VIEW v_laporan_keseluruhan AS
SELECT
  masjid_id,
  COUNT(*)                          AS total_kk,
  SUM(jumlah_jiwa)                  AS total_jiwa,
  SUM(jumlah_uang)                  AS total_uang,
  SUM(jumlah_beras)                 AS total_beras,
  SUM(jumlah_infak)                 AS total_infak,
  SUM(COALESCE(infak_tambahan,0))   AS total_infak_tambahan,
  SUM(COALESCE(jumlah_sadaqah_uang,0))  AS total_sadaqah_uang,
  SUM(COALESCE(jumlah_sadaqah_beras,0)) AS total_sadaqah_beras,
  COUNT(CASE WHEN jenis_bayar IN ('uang','keduanya')  THEN 1 END) AS pembayar_uang,
  COUNT(CASE WHEN jenis_bayar IN ('beras','keduanya') THEN 1 END) AS pembayar_beras
FROM muzaki
GROUP BY masjid_id;

-- ─────────────────────────────────────────
-- LANGKAH 10: Trigger updated_at
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$
LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 't_muzaki_upd')   THEN CREATE TRIGGER t_muzaki_upd   BEFORE UPDATE ON muzaki     FOR EACH ROW EXECUTE FUNCTION trigger_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 't_mustahik_upd') THEN CREATE TRIGGER t_mustahik_upd BEFORE UPDATE ON mustahik   FOR EACH ROW EXECUTE FUNCTION trigger_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 't_pg_upd')       THEN CREATE TRIGGER t_pg_upd       BEFORE UPDATE ON pengaturan FOR EACH ROW EXECUTE FUNCTION trigger_updated_at(); END IF;
END $$;

-- ─────────────────────────────────────────
-- VERIFIKASI — jalankan setelah migrasi:
-- ─────────────────────────────────────────
-- SELECT id, kode, nama_masjid FROM masjid;
-- SELECT COUNT(*), masjid_id FROM muzaki   GROUP BY masjid_id;
-- SELECT COUNT(*), masjid_id FROM mustahik GROUP BY masjid_id;
-- SELECT COUNT(*), masjid_id FROM pengaturan GROUP BY masjid_id;
-- ============================================================
-- SELESAI ✅
-- ============================================================
