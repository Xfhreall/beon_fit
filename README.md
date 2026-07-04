# RT Finance & Resident Management

Aplikasi web untuk administrasi iuran, penghuni, rumah, pembayaran, pengeluaran, dan laporan keuangan RT.

## Scope

Produk mengikuti `PRD.md`:

- Authentication admin RT.
- Dashboard ringkasan rumah, penghuni, pemasukan, pengeluaran, saldo, dan tagihan belum lunas.
- CRUD penghuni dengan upload dan preview foto KTP.
- CRUD rumah, penetapan penghuni aktif, dan riwayat hunian.
- Generate tagihan bulanan untuk rumah yang dihuni.
- Pembayaran iuran satpam dan kebersihan, termasuk pembayaran multi-bulan.
- Pengeluaran rutin dan non-rutin dengan upload dan preview bukti.
- Laporan bulanan dan grafik tahunan.

Implementasi saat ini memakai Laravel + Inertia React dalam satu repository. Backend dan frontend tetap dipisahkan secara struktur: kode Laravel di `app/`, `routes/`, `database/`; kode React di `resources/js/`.

## Tech Stack

- PHP 8.3
- Laravel 13
- Laravel Fortify
- Inertia Laravel 3
- React 19
- Tailwind CSS 4
- shadcn/ui
- Recharts
- MySQL
- Pest 4

## Requirements

- PHP 8.3+
- Composer
- Node.js dan npm
- MySQL

## Installation

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan storage:link
```

Set database di `.env`:

```env
APP_NAME="RT Finance"
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=rt_finance
DB_USERNAME=root
DB_PASSWORD=
```

Buat database MySQL, lalu jalankan migration dan seeder:

```bash
php artisan migrate --seed
```

Seeder membuat:

- 20 rumah awal.
- 15 rumah dihuni.
- 5 rumah kosong.
- Master iuran satpam Rp100.000.
- Master iuran kebersihan Rp15.000.
- Kategori pengeluaran awal.
- Akun admin demo.

## Run Locally

Jalankan backend dan frontend dev server:

```bash
composer run dev
```

Alternatif manual:

```bash
php artisan serve
npm run dev
```

Buka aplikasi:

```text
http://127.0.0.1:8000
```

## Default Login

```text
Email    : admin@rt.test
Password : password
```

## Main Routes

| Menu | URL |
|---|---|
| Login | `/login` |
| Dashboard | `/dashboard` |
| Penghuni | `/residents` |
| Rumah | `/houses` |
| Pembayaran / Tagihan | `/payments` |
| Pengeluaran | `/expenses` |
| Laporan | `/reports` |

## Feature Rules

Billing:

- Rumah dihuni dengan penghuni tetap ditagih setiap bulan.
- Rumah kontrak ditagih selama penghuni aktif.
- Rumah kosong tidak ditagih.
- Tagihan dibuat per rumah, jenis iuran, bulan, dan tahun.
- Pembayaran multi-bulan didukung melalui `months_paid`.

Financial data:

- Pembayaran dan update status tagihan berjalan dalam database transaction.
- Pengeluaran dicatat dengan kategori, nominal, tanggal, dan keterangan.
- Laporan menghitung pemasukan dari pembayaran dan pengeluaran dari transaksi expense.

UI:

- Summary memakai card.
- Detail data memakai table.
- CRUD memakai dialog atau alert dialog.
- Chart memakai Recharts dengan pola shadcn/ui chart.
- Upload gambar menampilkan preview sebelum submit.

## ERD

```mermaid
erDiagram
    USERS {
        bigint id PK
        varchar name
        varchar email
        varchar password
    }

    RESIDENTS {
        bigint id PK
        varchar name
        varchar phone
        varchar resident_status
        varchar marital_status
        varchar ktp_photo_path
    }

    HOUSES {
        bigint id PK
        varchar number
        varchar block
        varchar status
    }

    OCCUPANCIES {
        bigint id PK
        bigint house_id FK
        bigint resident_id FK
        date started_at
        date ended_at
        varchar resident_status
        boolean is_active
    }

    FEE_TYPES {
        bigint id PK
        varchar code
        varchar name
        integer amount
        boolean is_active
    }

    BILLS {
        bigint id PK
        bigint house_id FK
        bigint resident_id FK
        bigint fee_type_id FK
        tinyint period_month
        smallint period_year
        integer amount_due
        integer amount_paid
        varchar status
    }

    PAYMENTS {
        bigint id PK
        bigint house_id FK
        bigint resident_id FK
        bigint fee_type_id FK
        date paid_at
        tinyint period_month
        smallint period_year
        tinyint months_paid
        integer amount
        varchar payment_method
        text notes
    }

    EXPENSE_CATEGORIES {
        bigint id PK
        varchar name
        boolean is_routine
    }

    EXPENSES {
        bigint id PK
        bigint expense_category_id FK
        date spent_at
        integer amount
        text description
        varchar receipt_path
        boolean is_routine
    }

    HOUSES ||--o{ OCCUPANCIES : has
    RESIDENTS ||--o{ OCCUPANCIES : lives_in
    HOUSES ||--o{ BILLS : billed_to
    RESIDENTS ||--o{ BILLS : billed_to
    FEE_TYPES ||--o{ BILLS : defines
    HOUSES ||--o{ PAYMENTS : paid_from
    RESIDENTS ||--o{ PAYMENTS : paid_by
    FEE_TYPES ||--o{ PAYMENTS : paid_for
    EXPENSE_CATEGORIES ||--o{ EXPENSES : categorizes
```

## Verification

```bash
php artisan test --compact
npm run lint:check
npm run types:check
npm run build
```

## Screenshot Checklist

PRD deliverable screenshot list:

- Login.
- Dashboard dengan card statistik.
- Dashboard dengan chart line, bar, dan donut.
- Penghuni.
- Dialog tambah/edit penghuni.
- Preview foto KTP.
- Rumah.
- Riwayat penghuni rumah.
- Pembayaran.
- Dialog tambah pembayaran.
- Pengeluaran.
- Preview bukti pengeluaran.
- Laporan summary.
- Grafik tahunan.
- Detail laporan bulanan.
