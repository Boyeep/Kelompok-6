# Starter-FP-LBE-2026: To Do List

Starter project untuk Final Project **LBE Lab RPL 2026**. Fokus utama tugas
ini adalah melatih **workflow Git/GitHub yang benar dalam pengerjaan proyek
secara tim**. Aplikasi yang dibangun sengaja dibuat sederhana (To Do List,
HTML+CSS+JS murni, tanpa framework) agar setiap kelompok dapat berfokus pada
proses kerja tim, bukan pada kompleksitas teknologi.

Kode starter pada folder [`/src`](./src) **sengaja dibuat belum lengkap**.
Setiap kelompok bertugas melengkapi fitur yang belum tersedia secara
kolaboratif, masing-masing melalui branch dan Pull Request tersendiri.

---

## 1. Tujuan Pembelajaran

Setelah mengerjakan proyek ini, mahasiswa diharapkan terbiasa dengan:

- Alur kerja **fork dan Pull Request lintas repository**, sebagaimana lazim
  digunakan pada proyek open source.
- Membuat dan mengelola **backlog** di GitHub (Issues / Projects board).
- Struktur branch **`main` → `dev` → `feature/*`**.
- Alur kerja **Pull Request beserta review**, bukan commit langsung ke
  `main`/`dev`.
- Penulisan **commit message** dan **deskripsi Pull Request** yang jelas.
- Kolaborasi paralel tanpa saling menimpa pekerjaan anggota lain, termasuk
  cara menyelesaikan merge conflict apabila terjadi.

Penilaian utama diberikan berdasarkan **proses kerja**, bukan semata-mata
hasil akhir yang dihasilkan.

---

## 2. Cara Menjalankan Project

Proyek ini **tidak memerlukan instalasi apapun** (tidak ada `npm install`,
tidak ada backend/server, dan tidak ada database).

**Cara paling sederhana:**
1. Buka folder `src/`.
2. Klik dua kali pada `index.html`, halaman akan terbuka otomatis di browser.

**Cara yang lebih nyaman untuk keperluan development (opsional):**
- Bagi pengguna VS Code, dapat memasang extension **Live Server**, lalu klik
  kanan pada `src/index.html` dan pilih `Open with Live Server`. Browser akan
  melakukan refresh otomatis setiap kali perubahan disimpan.
- Alternatif lain adalah menjalankan `npx serve src` (memerlukan Node.js)
  apabila menginginkan server lokal sederhana tanpa extension.

Tidak ada langkah yang bersifat wajib selain membuka berkas HTML tersebut.
Tools di atas bersifat opsional dan dapat dipasang secara mandiri sesuai
kebutuhan masing-masing.

---

## 3. Struktur Folder

```
src/
├── index.html      # struktur halaman + beberapa komentar TODO
├── css/
│   └── style.css   # styling dasar + komentar TODO untuk style fitur baru
└── js/
    └── app.js      # logic dasar (tambah & hapus task) + komentar TODO
```

Fitur yang sudah berfungsi pada starter:
- Menambahkan task baru melalui form.
- Menampilkan daftar task.
- Menghapus task.

Komentar `// TODO (Fitur #...)` pada ketiga berkas di atas menandai titik-titik
yang perlu dilengkapi. Terdapat 6 titik fitur, sebagaimana dijelaskan pada
bagian 6.

---

## 4. Pembagian Kelompok & Role

Kelas dibagi menjadi **8 kelompok, masing-masing beranggotakan 5 orang**.
Karena proyek ini bersifat **frontend-only** (tanpa backend/server),
pembagian role yang disarankan **bukan** FE/BE sebagaimana proyek full-stack
pada umumnya, melainkan sebagai berikut:

| Role | Jumlah | Tanggung Jawab Utama |
|---|---|---|
| **Project Manager (PM)** | 1 orang | Menyusun dan mengelola backlog (Issues/Projects board), membuat branch `dev`, melakukan review dan merge seluruh Pull Request, menjaga timeline pengerjaan, memperbarui README/dokumentasi, serta menjadi pihak yang paling memahami status proyek setiap harinya |
| **Feature Developer** | 4 orang | Masing-masing bertanggung jawab atas 1–2 fitur (lihat bagian 6) secara *vertical slice*: HTML, CSS, dan JS untuk fitur tersebut dikerjakan secara menyeluruh oleh satu orang, pada branch `feature/*` masing-masing |

**Alasan pembagian per-fitur (vertical slice), bukan per-layer** (misalnya
HTML oleh satu anggota, CSS oleh anggota lain, dan JS oleh anggota berikutnya):
karena fitur-fitur yang dikerjakan berukuran kecil dan relatif independen satu
sama lain (toggle complete, edit, filter, dan seterusnya), pembagian per-fitur
membuat setiap anggota memiliki branch tersendiri dengan **risiko merge
conflict yang jauh lebih kecil** dibandingkan apabila beberapa orang bergantian
mengedit berkas yang sama untuk layer yang berbeda. Pendekatan ini juga lebih
merepresentasikan cara kerja tim yang sesungguhnya (feature-based, bukan
layer-based).

PM **tetap diperkenankan** mengambil satu fitur berukuran kecil apabila
beban kerjanya memungkinkan, namun prioritas utamanya tetap menjaga backlog,
melakukan review Pull Request, dan mengoordinasikan tim, bukan mengerjakan
fitur secara mandiri.

> Apabila suatu kelompok lebih sesuai dengan pembagian lain (misalnya dua
> anggota berfokus pada seluruh aspek styling/UX dan dua anggota lainnya
> berfokus pada seluruh logic JS), pembagian tersebut tetap dapat diterima,
> selama alur kerja Git tetap benar (branch per pekerjaan, Pull Request, dan
> review). Pembagian **yang tidak disarankan** adalah 1 PM + 2 FE + 2 BE ala
> proyek full-stack, mengingat proyek ini tidak memiliki backend.

---

## 5. Timeline Pengerjaan (14–20 September 2026)

Pengumuman final project disampaikan pada Senin, 14 September 2026.
Pengerjaan efektif berlangsung **6 hari**, Selasa 15 September s.d. Minggu 20
September 2026, dengan batas pengumpulan pukul **23.59** pada hari terakhir.

| Hari | Tanggal | Fokus |
|---|---|---|
| Senin | 14 Sept | **Pengumuman FP**: final project diumumkan ke seluruh kelas, pembagian 8 kelompok (masing-masing 5 orang), dan akses ke repo starter ini dibagikan. Belum ada pengerjaan kode pada hari ini. |
| Selasa | 15 Sept | **Kickoff**: PM melakukan fork repo starter ini ke akun/organisasi kelompok, menyiapkan board, memecah backlog menjadi Issues, dan membuat branch `dev` pada fork tersebut. Seluruh anggota melakukan `git clone` dari fork kelompok, memastikan starter dapat dijalankan, dan mulai coding pada branch `feature/*` masing-masing hari itu juga. Fitur #4 (localStorage) sebaiknya dikerjakan **lebih dahulu** apabila memungkinkan, lihat catatan pada bagian 6. |
| Rabu | 16 Sept | Pengerjaan berlanjut. Pull Request pertama mulai diajukan dan direview. |
| Kamis | 17 Sept | Pengerjaan dan review Pull Request berlanjut. Diharapkan minimal 2–3 fitur sudah ter-merge ke `dev`. |
| Jumat | 18 Sept | Fitur yang tersisa diselesaikan, Pull Request terakhir diajukan. |
| Sabtu | 19 Sept | **Integrasi dan pengujian**: seluruh fitur diuji bersama pada branch `dev`, kemudian bug hasil integrasi diperbaiki. |
| Minggu | 20 Sept | **Batas akhir, pukul 23.59**: penyempurnaan tampilan (polishing), pembaruan README apabila diperlukan, merge `dev` ke `main` pada fork kelompok, kemudian ajukan Pull Request dari fork ke repo starter ini sebagai bentuk pengumpulan tugas. |

Timeline dapat disesuaikan sepanjang ritmenya tetap terjaga: **hindari
mengerjakan seluruh pekerjaan pada hari terakhir**. Progres harian (siapa
yang mengajukan Pull Request, siapa yang melakukan review, kapan proses merge
dilakukan) justru menjadi salah satu aspek yang dinilai, lihat bagian 7.

---

## 6. Fitur yang Harus Dibuat

Starter sudah dapat: menambahkan task, menampilkan daftar task, dan menghapus
task. Berikut 6 fitur yang **wajib** ditambahkan (sesuai untuk 5 orang: PM +
4 developer, masing-masing developer menangani 1 fitur, sedangkan 1 fitur
sisanya dapat dibagi/dirotasi atau ditangani oleh PM).

> **Catatan urutan pengerjaan:** Fitur #4 (localStorage) sebaiknya dikerjakan
> paling awal dan di-merge terlebih dahulu ke `dev`, karena fitur lain
> (toggle complete, edit) idealnya turut tersimpan. Apabila dikerjakan
> belakangan pun tidak menjadi masalah besar, hanya saja pihak yang
> mengerjakannya perlu menyesuaikan fungsi `renderTasks()` yang mungkin
> sudah diubah oleh anggota lain. Hal ini justru menjadi latihan yang baik
> terkait merge conflict dan koordinasi backlog.

### Fitur #1: Tandai Task Selesai (Mark as Complete)
Tambahkan checkbox pada setiap task. Apabila dicentang, task ditandai selesai
(teks dicoret/strikethrough dan warnanya dibuat lebih pudar).

**Hint:**
- Tambahkan properti `completed: false` pada object task (sudah tersedia di
  starter).
- Buat fungsi `toggleComplete(id)` yang membalik nilai `completed`.
- Pada `renderTasks()`, tambahkan `<input type="checkbox">` sebelum teks,
  atur `checked` sesuai `task.completed`, dan tambahkan class `completed`
  pada `<li>` apabila task tersebut sudah selesai. Style untuk class
  `.completed` sudah disiapkan tempatnya pada `style.css`.

### Fitur #2: Edit Task
Pengguna dapat mengubah teks task yang sudah ada tanpa perlu menghapus dan
membuat task baru.

**Hint:**
- Tambahkan tombol "Edit" di samping tombol hapus.
- Saat tombol tersebut diklik, ubah tampilan `<span>` menjadi
  `<input type="text">` berisi teks task saat ini (arahkan fokus ke input
  tersebut).
- Simpan perubahan saat pengguna menekan `Enter` atau mengklik tombol "Save",
  kemudian panggil kembali `renderTasks()`.
- Fungsi `editTask(id, newText)` sudah disiapkan tempatnya (masih kosong)
  pada `app.js`.

### Fitur #3: Filter Task (Semua / Aktif / Selesai)
Tambahkan 3 tombol filter di atas daftar task untuk menampilkan: seluruh
task, task yang belum selesai saja, atau task yang sudah selesai saja.

**Hint:**
- Contoh struktur HTML untuk tombol filter sudah disertakan sebagai komentar
  pada `index.html`.
- Simpan filter yang sedang aktif pada sebuah variabel, misalnya
  `let currentFilter = "all"`.
- Pada `renderTasks()`, lakukan filter terhadap array `tasks` sesuai
  `currentFilter` sebelum di-loop (`tasks.filter(...)`).
- Tambahkan class `active` pada tombol filter yang sedang dipilih agar
  pengguna mengetahui filter mana yang sedang aktif.

### Fitur #4: Simpan Data ke `localStorage`
Data task tidak boleh hilang saat halaman dimuat ulang (refresh).

**Hint:**
- Penyimpanan: `localStorage.setItem("tasks", JSON.stringify(tasks))`,
  panggil setiap kali data `tasks` berubah (cara paling sederhana: tempatkan
  di akhir `renderTasks()`).
- Pemuatan data: saat script pertama kali dijalankan, periksa
  `localStorage.getItem("tasks")`. Apabila terdapat data, lakukan
  `JSON.parse()` dan masukkan ke variabel `tasks` sebelum `renderTasks()`
  dipanggil pertama kali.
- Pastikan `nextId` turut diperbarui saat data dimuat, agar id task baru
  tidak bertabrakan dengan task lama (misalnya
  `nextId = Math.max(...tasks.map(t => t.id), 0) + 1`).

### Fitur #5: Counter Task Tersisa
Tampilkan teks seperti `"3 task tersisa"` yang menghitung jumlah task yang
belum selesai (`completed === false`).

**Hint:**
- Tambahkan elemen (misalnya `<span id="task-counter">`) pada HTML. Contoh
  strukturnya sudah disertakan sebagai komentar pada `index.html`.
- Pada `renderTasks()`, hitung `tasks.filter(t => !t.completed).length` dan
  perbarui `textContent` elemen counter tersebut.

### Fitur #6: Hapus Semua Task yang Sudah Selesai
Tombol "Hapus yang Selesai" untuk menghapus seluruh task yang telah dicentang
sekaligus.

**Hint:**
- Buat fungsi `clearCompleted()` yang meng-assign ulang `tasks` menjadi
  `tasks.filter(t => !t.completed)`, kemudian panggil `renderTasks()`.
- Tambahkan event listener untuk tombol `#clear-completed`.

### Bonus / Stretch Goals (opsional, bagi kelompok yang selesai lebih awal)
Fitur berikut tidak wajib, namun dapat menjadi nilai tambah sekaligus bahan
diskusi terkait backlog prioritization apabila kelompok menyelesaikan
pekerjaan lebih cepat:
- Menambahkan **due date** pada setiap task.
- **Drag-and-drop** untuk mengurutkan ulang task.
- Toggle **dark mode**.
- Animasi transisi saat task ditambahkan/dihapus.

---

## 7. Alur Kerja Git yang Wajib Diikuti

> [!IMPORTANT]
> **Wajib ditonton sebelum mulai:** [Tutorial GitHub Project](https://links.labse.id/go/Tutorial-GitHub-Project)

Bagian ini merupakan **komponen yang paling menentukan penilaian**. Struktur
branch yang digunakan, di dalam fork masing-masing kelompok:

```
main            ← branch final pada fork kelompok, hanya diperbarui melalui PR dari `dev` (di akhir minggu)
 └── dev        ← branch integrasi/staging, seluruh fitur bertemu di sini
      ├── feature/toggle-complete
      ├── feature/edit-task
      ├── feature/filter-task
      ├── feature/local-storage
      ├── feature/task-counter
      └── feature/clear-completed
```

**Langkah-langkah yang harus diikuti:**

1. **Fork repo starter ini terlebih dahulu.** PM melakukan fork repo
   [Starter-FP-LBE-2026](.) ini ke akun atau organisasi GitHub kelompok.
   Seluruh anggota bekerja pada fork tersebut, bukan langsung pada repo
   starter.
2. **Backlog terlebih dahulu, baru pengerjaan kode.** PM membuat satu Issue
   di GitHub, pada fork kelompok, untuk setiap fitur pada bagian 6 (dapat
   menggunakan GitHub Projects/board agar lebih terstruktur), dan
   meng-assign setiap Issue kepada anggota yang bertanggung jawab.
3. PM membuat branch `dev` dari `main` pada fork kelompok, di awal minggu
   pengerjaan.
4. Setiap anggota membuat branch fitur **dari `dev`**, dengan penamaan yang
   jelas, misalnya `feature/toggle-complete`. **Tidak diperkenankan**
   mengerjakan langsung pada `main` maupun `dev`.
5. Commit disertai pesan yang jelas dan deskriptif, contoh:
   `feat: tambah checkbox untuk toggle task selesai`, bukan sekadar
   `update` atau `fix bug`.
6. Setelah fitur selesai, push branch tersebut dan ajukan **Pull Request ke
   `dev`** pada fork kelompok (bukan ke `main`). Deskripsi Pull Request
   memuat penjelasan pekerjaan yang dilakukan beserta nomor Issue terkait.
7. **Minimal satu anggota lain** wajib melakukan review terhadap Pull
   Request tersebut sebelum di-merge (memberi komentar/approval). Proses
   merge umumnya dilakukan oleh PM setelah Pull Request disetujui.
8. Merge conflict, apabila terjadi, diselesaikan melalui komunikasi antar
   anggota, bukan dengan `--force`.
9. Pada akhir minggu, setelah seluruh fitur berada di `dev` dan telah diuji
   bersama, ajukan Pull Request dari `dev` ke `main` pada fork kelompok,
   lakukan review sekali lagi, kemudian merge.
10. **Sebagai bentuk pengumpulan tugas**, setelah `main` pada fork kelompok
    berisi versi final, ajukan satu **Pull Request dari fork kelompok ke
    repo starter ini** (dari `main` fork ke `main` repo starter). Beri judul
    Pull Request sesuai nama kelompok, misalnya `Kelompok 1`.
11. **Tidak diperkenankan** ada commit langsung ke `main` atau `dev`. Seluruh
    perubahan harus melalui Pull Request, termasuk perubahan berskala kecil
    sekalipun.

Apabila terdapat anggota yang memerlukan bantuan menyelesaikan conflict atau
mengalami kesulitan terkait branch, hal tersebut justru menjadi bagian dari
penilaian, yaitu bagaimana kelompok menyelesaikan permasalahan kolaborasi,
bukan semata-mata hasil akhir yang dicapai.

---

## 8. Kriteria Penilaian

Fokus penilaian terletak pada **workflow pengerjaan**, bukan hanya pada
fitur yang berhasil dibuat. Bobot penilaian yang disarankan:

| Kriteria | Bobot | Aspek yang Dinilai |
|---|---|---|
| **Git & GitHub Workflow** | 45% | Apakah terdapat backlog/Issues yang jelas dan ter-assign? Apakah branch `dev` digunakan sebagai staging? Apakah setiap fitur dikerjakan pada `feature/*` masing-masing (bukan bertumpuk pada satu branch)? Apakah Pull Request digunakan untuk seluruh proses merge (tanpa commit langsung ke `main`/`dev`)? Apakah terdapat review/approval sebelum merge? Apakah commit message jelas dan konsisten? |
| **Kelengkapan Fitur** | 25% | Berapa dari 6 fitur wajib yang berhasil diimplementasikan dan berfungsi dengan benar? |
| **Kualitas Kode** | 15% | Kode tersusun rapi dan konsisten gaya penulisannya, tidak terdapat kode mati atau `console.log` sisa debugging, serta penamaan variabel/fungsi jelas. |
| **Kolaborasi Tim** | 10% | Distribusi kontribusi cukup merata antar anggota (dilihat dari commit/Pull Request pada GitHub Insights), dengan progres harian yang tidak menumpuk pada satu atau dua hari terakhir. |
| **Dokumentasi** | 5% | README proyek diperbarui sesuai fitur yang benar-benar telah selesai, dan deskripsi Pull Request bersifat informatif. |

**Indikator workflow yang baik dibandingkan yang kurang baik:**

| Aspek | Baik ✅ | Kurang Baik ❌ |
|---|---|---|
| Backlog | Terdapat Issues per fitur, ter-assign, disertai label/status | Tidak terdapat Issues sama sekali, koordinasi hanya melalui chat |
| Branch | `main` + `dev` + `feature/*` per anggota/fitur | Seluruh anggota bekerja langsung pada `main`, atau satu branch besar dikerjakan bersama-sama |
| Pull Request | Setiap fitur = satu Pull Request, disertai deskripsi dan review | Tidak ada Pull Request, langsung `git push origin main` |
| Commit | Pesan jelas (`feat: ...`, `fix: ...`), granular | Pesan tidak informatif (`update`, `asdf`, `fix fix fix`), atau satu commit besar berisi seluruh fitur |
| Timeline | Commit tersebar sepanjang minggu | Seluruh commit muncul pada hari terakhir |

---

## 9. Checklist Sebelum Pengumpulan

- [ ] Pekerjaan dilakukan pada fork repo starter ini, bukan pada repo
      starter secara langsung.
- [ ] Branch `main` pada fork kelompok berisi versi final (hasil merge dari
      `dev`).
- [ ] Branch `dev` masih tersedia pada fork kelompok (tidak dihapus) sebagai
      bukti histori pengerjaan.
- [ ] Seluruh fitur pada bagian 6 telah dikerjakan melalui branch `feature/*`
      masing-masing.
- [ ] Terdapat bukti Issues/backlog pada GitHub (screenshot dapat dilampirkan
      apabila diminta).
- [ ] Seluruh merge ke `dev`/`main` dilakukan melalui Pull Request, bukan
      commit langsung.
- [ ] README diperbarui apabila terdapat perubahan struktur folder/fitur.
- [ ] Proyek dapat dijalankan cukup dengan membuka `src/index.html`.
- [ ] Pull Request pengumpulan tugas dari fork kelompok ke repo starter ini
      sudah diajukan, dengan judul sesuai nama kelompok (misalnya
      `Kelompok 1`).

Selamat mengerjakan. Perlu diingat bahwa penilaian tidak ditujukan untuk
menentukan siapa yang paling mahir coding secara individu, melainkan
**seberapa baik tim bekerja secara kolaboratif**.
