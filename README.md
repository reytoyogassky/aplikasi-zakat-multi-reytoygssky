# 🕌 Aplikasi Amilin v2 — Zakat Fitrah Digital (Multi-Tenant)

Sistem pengelolaan zakat fitrah digital berbasis web untuk masjid/mushola.  
Versi 2 mendukung **multi-tenant** — satu server untuk banyak masjid, data terisolasi per masjid.

---

## ✨ Fitur

- ✅ Data Muzaki (pembayar zakat) — CRUD, pagination, export PDF
- ✅ Data Mustahik (penerima zakat) — CRUD, progress penyaluran
- ✅ Laporan Harian per hari ke-1 s/d 7
- ✅ Laporan Keseluruhan + distribusi zakat + export PDF
- ✅ Pengaturan masjid (nama, pengurus, nilai zakat/infak)
- ✅ Dashboard dengan grafik penerimaan & distribusi
- ✅ Multi-masjid — satu server, data masjid terisolasi (RLS)
- ✅ Dark mode
- ✅ Responsive (desktop + mobile)

---

## 🚀 Setup Pertama Kali

### 1. Buat Project Supabase

Buat project di [supabase.com](https://supabase.com), catat URL dan keys.

### 2. Jalankan Migrasi Database

Di **Supabase → SQL Editor**, paste dan jalankan isi file `migration.sql`.

> ⚠️ Edit baris berikut sebelum run:
> ```sql
> 'ganti-kunci-ini',  -- ganti dengan kunci masjid pertama
> ```

### 3. Install Dependensi

```bash
npm install
```

### 4. Konfigurasi Environment

Copy `.env.local.example` menjadi `.env.local` dan isi:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # dari Settings > API > service_role
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

> **PENTING:** `SUPABASE_SERVICE_ROLE_KEY` hanya digunakan di server (API routes).  
> Jangan expose ke client. Jangan commit ke git.

### 5. Jalankan Aplikasi

```bash
npm run dev      # development
npm run build    # production build
npm start        # production server
```

---

## 🏗️ Tambah Masjid Baru

Gunakan script interaktif:

```bash
npm run tambah-masjid
```

Script akan menanyakan nama masjid, kode unik, dan kunci rahasia,  
lalu otomatis membuat record di tabel `masjid` dan `pengaturan` awal.

Kirimkan ke pengurus masjid:
- **Kode masjid** — contoh: `masjid-al-ikhlas`
- **Kunci rahasia** — string acak panjang
- **URL aplikasi**

---

## 🔐 Login

Pengurus masjid login menggunakan:
- **Kode Masjid** — slug unik (contoh: `masjid-al-ikhlas`)
- **Kunci Rahasia** — diberikan oleh admin saat mendaftar

Setelah login, semua data secara otomatis terfilter hanya untuk masjid tersebut  
melalui Row Level Security (RLS) di Supabase.

---

## 📁 Struktur Folder

```
src/
├── app/
│   ├── (app)/              # Halaman utama (butuh login)
│   │   ├── page.js         # Dashboard
│   │   ├── muzaki/         # Data muzaki
│   │   ├── mustahik/       # Data mustahik
│   │   ├── laporan/
│   │   │   ├── harian/     # Laporan per hari
│   │   │   └── keseluruhan/# Laporan + export PDF
│   │   └── pengaturan/     # Konfigurasi masjid
│   ├── (auth)/login/       # Halaman login
│   └── api/auth/           # API login/logout/me
├── components/layout/
│   └── Sidebar.js          # Navigasi sidebar + mobile nav
├── hooks/
│   └── useMasjid.js        # Context: db client per masjid
├── lib/
│   ├── supabase.js         # Supabase client factory
│   ├── export.js           # Export PDF (jsPDF)
│   └── utils.js            # Helpers: formatRupiah, hitungDistribusi
└── middleware.js           # Auth guard + inject masjid header
scripts/
└── tambah-masjid.mjs       # CLI admin tambah masjid baru
migration.sql               # SQL migrasi multi-tenant
```

---

## 🗄️ Arsitektur Multi-Tenant

```
Browser → Next.js Middleware → Supabase (RLS)
              ↓
        Baca cookie: amilin_masjid_id
              ↓
        Inject header: x-masjid-id
              ↓
        Supabase RLS filter otomatis
        WHERE masjid_id = x-masjid-id
```

**Tabel database:**
- `masjid` — master tenant (kode, secret_key, nama)
- `pengaturan` — config per masjid
- `muzaki` — data pembayar zakat per masjid
- `mustahik` — data penerima zakat per masjid

---

## ⚙️ Konfigurasi Default Zakat

| Parameter | Default | Keterangan |
|-----------|---------|------------|
| Beras per jiwa | 2.5 kg | 1 sha' = ±2.5 kg |
| Nilai uang per jiwa | Rp 40.000 | Sesuaikan harga beras lokal |
| Infak wajib per jiwa | Rp 5.000 | |
| Harga beras per kg | Rp 15.000 | Untuk konversi laporan |

**Distribusi zakat:** Fakir/Miskin 65% · UPZ/Desa 20% · Sabilillah 10% · Amilin 5%

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL + RLS)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **PDF Export:** jsPDF + jspdf-autotable
- **Icons:** Lucide React
- **Theme:** next-themes (dark/light)

---

## 📞 Dukungan

Jika ada kendala, periksa:
1. `SUPABASE_SERVICE_ROLE_KEY` sudah diset di `.env.local`
2. `migration.sql` sudah dijalankan di Supabase
3. RLS policies sudah aktif di Supabase → Table Editor → RLS
