# Kelompok 6 — To Do List Bulletin Board

Aplikasi to-do list untuk Final Project LBE Lab RPL 2026. Task disusun pada kertas
seperti papan buletin, dapat dikelompokkan, dan tersimpan di browser. Proyek ini
dibuat dengan HTML, CSS, dan JavaScript murni tanpa framework, library runtime,
backend, atau database.

Proyek dikembangkan dari
[Starter-FP-LBE-2026](https://github.com/Lab-RPL-ITS/Starter-FP-LBE-2026).
Pekerjaan dan review tim dapat dilihat pada
[GitHub Project Kelompok 6](https://github.com/users/Boyeep/projects/2).

## Menjalankan aplikasi

Untuk pemakaian biasa, buka [`src/index.html`](./src/index.html) di browser. Tidak
perlu `npm install` atau proses build.

Untuk memasang PWA dan mengaksesnya saat offline, buka aplikasi melalui localhost
atau HTTPS. Jika Python tersedia, jalankan perintah berikut dari folder proyek:

```sh
python -m http.server 8000 --directory src
```

Buka `http://localhost:8000`, tunggu indikator **Siap offline**, lalu pilih
**Install app** jika browser menawarkannya. Aplikasi dapat dibuka lagi saat
offline setelah berkasnya tersimpan pada kunjungan online pertama. PWA tidak
dapat dipasang dari alamat `file://`.

## Enam fitur wajib

| Fitur | Cara menggunakan |
|---|---|
| Tandai task selesai | Centang kotak pada baris task. Teks task selesai dicoret dan tampak lebih pudar; centang lagi untuk mengaktifkannya kembali. |
| Edit task | Tekan ikon pensil, ubah nama task, lalu tekan **Enter** atau pindahkan fokus untuk menyimpan. |
| Filter task | Pilih **Semua**, **Aktif**, atau **Selesai** pada kertas. Filter terpilih ditandai; daftar kosong menampilkan pesan sesuai kondisinya. |
| Simpan data | Perubahan task disimpan otomatis ke `localStorage` dan dimuat kembali saat halaman di-refresh. Data kosong atau tidak valid ditangani saat pemuatan. |
| Counter task tersisa | Bagian bawah setiap kertas menampilkan jumlah task yang belum selesai dan memperbaruinya setelah perubahan. |
| Hapus task selesai | Tekan **Hapus yang Selesai** untuk menghapus seluruh task yang dicentang pada kertas tersebut. |

Ketik nama task pada form di atas kertas, pilih tanggal bila perlu, lalu tekan
**+** atau **Enter** untuk menambahkannya. Tombol hapus pada setiap baris hanya
menghapus task tersebut.

## Fitur tambahan dan papan

- **Due date dan kalender:** tanggal jatuh tempo muncul pada task. Kalender dapat
  menampilkan task dari grup aktif atau semua grup.
- **Urutkan task:** seret baris task ke posisi baru; urutannya ikut tersimpan.
- **Tema terang/gelap:** tombol tema mengubah papan; kertas tetap terang. Pilihan
  tema tersimpan di browser.
- **Animasi:** penambahan, penghapusan, pencetangan, perpindahan task, dan counter
  memakai transisi yang mengikuti preferensi *reduced motion*.
- **Grup dan kertas:** sidebar memilih grup dan kertas. Tombol tambah membuat
  kertas to-do, memilih satu dari empat tampilan kertas, atau menempel stiker.
  Kertas dan stiker dapat digeser; daftar task yang panjang dapat digulir di
  dalam kertas.
- **Navigasi papan:** tarik area kosong untuk menggeser papan, gunakan slider
  kanan untuk zoom, atau pilih kertas di sidebar untuk memusatkan tampilan.
  Mode fokus menutup sidebar dan toolbar sekaligus.

Posisi kertas/stiker, grup, task, pilihan kertas, dan tampilan papan disimpan
dengan key `my-todo-board-v1` di `localStorage`. Data task lama dengan key
`tasks` dimigrasikan saat pertama kali papan baru dimuat. Data tersimpan per
browser dan per origin: `file://`, localhost, dan domain hosting tidak berbagi
data dan tidak memiliki sinkronisasi akun.

## Struktur proyek

```text
src/
├── index.html              # halaman dan urutan script
├── manifest.webmanifest    # metadata PWA
├── service-worker.js       # cache untuk akses offline
├── assets/
│   ├── icons/             # ikon PWA
│   └── board/             # aset dasar dan SVG kreatif
│       └── creative/      # papers, stickers, tapes, stationery, memes
├── css/                   # tema, layout, papan, dan interaksi
└── js/
    ├── app.js             # operasi task, filter, dan counter per kertas
    ├── task-row.js        # baris task, editor, dan urutan drag
    ├── workspace.js       # grup, kertas, stiker, dan kamera papan
    ├── board-storage.js   # validasi, migrasi, dan penyimpanan data
    ├── asset-catalog.js   # daftar aset papan dan pilihan kertas
    ├── board-calendar.js # kalender task
    ├── calendar-motion.js
    ├── paper-drag.js      # gerak kertas dan aset
    ├── panels.js          # Mode fokus
    ├── dropdowns.js      # pilihan grup bertema
    └── pwa.js             # status offline dan instalasi
```

Lihat [panduan aset papan](./src/assets/board/README.md) untuk struktur SVG dan
pengaturan ukuran. Saat mengubah berkas aplikasi atau aset yang di-cache,
perbarui versi `CACHE` pada `src/service-worker.js` agar PWA mengambil versi baru.

## Alur kerja Git

1. Buat branch `feature/*` dari `dev` untuk setiap pekerjaan, termasuk
   dokumentasi. Jangan commit langsung ke `dev` atau `main`.
2. Push branch fitur dan ajukan Pull Request ke `dev` dengan ringkasan perubahan
   serta tautan issue. Minimal satu anggota lain mereview sebelum merge.
3. Setelah fitur dan dokumentasi terintegrasi serta diuji, ajukan Pull Request
   dari `dev` ke `main` pada fork kelompok. Lakukan review sebelum merge.
4. Untuk pengumpulan, ajukan Pull Request dari `main` fork kelompok ke `main`
   [repo starter](https://github.com/Lab-RPL-ITS/Starter-FP-LBE-2026) dengan
   judul **Kelompok 6**.

Backlog, status pekerjaan, dan histori review tersedia di
[Project #2](https://github.com/users/Boyeep/projects/2) serta daftar
[Pull Request](https://github.com/Boyeep/Kelompok-6/pulls).
