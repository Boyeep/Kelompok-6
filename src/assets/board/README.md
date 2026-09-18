# Aset bulletin board

Taruh aset final dari tim kreatif di folder ini. Fondasi sudah berjalan dengan
warna papan, tekstur CSS sederhana, kertas krem, dan perekat CSS sementara.
Slot dekorasi kosong sampai aset dihubungkan; tidak ada gambar yang gagal dimuat.

Tekstur, perekat, dan dekorasi latar dihubungkan melalui
`../../css/creative-assets.css`. Aset yang bisa dipilih dan ditempel pengguna
diatur di `../../js/asset-catalog.js`. Layout papan dasar ada di
`../../css/board-theme.css`; layout banyak card ada di `../../css/workspace.css`.

Katalog berisi aset SVG dasar daun, bintang, dan selotip sementara. Ganti file
atau tambahkan entri ketika artwork final tersedia:

```js
{ id: "sticker-flower", name: "Bunga", src: "assets/board/flower.webp", width: 130, height: 160 }
```

Pertahankan `id` katalog karena penempatan yang tersimpan merujuk pada id itu.
Gunakan URL lokal. Tambahkan file final ke `APP_SHELL` dan naikkan `CACHE` di
`../../service-worker.js` supaya artwork tersedia pada pembukaan offline pertama.
Posisi aset tempel tersimpan per grup, bisa digeser, dan bisa dilepas.

| Aset | Variabel CSS | Format yang cocok |
| --- | --- | --- |
| Tekstur papan | `--board-texture-image` | WebP/PNG dengan tekstur seamless |
| Tekstur kertas | `--paper-texture-image` | WebP/PNG dengan tekstur seamless |
| Perekat atau pin di atas kertas | `--paper-fastener-image` | SVG/WebP/PNG transparan |
| Dekorasi kiri atas | `--board-top-left-image` | SVG/WebP/PNG transparan |
| Dekorasi kanan atas | `--board-top-right-image` | SVG/WebP/PNG transparan |
| Dekorasi kiri bawah | `--board-bottom-left-image` | SVG/WebP/PNG transparan |
| Dekorasi kanan bawah | `--board-bottom-right-image` | SVG/WebP/PNG transparan |

Contoh pemasangan setelah file tersedia:

```css
:root {
  --board-texture-image: url("../assets/board/cork.webp");
  --paper-texture-image: url("../assets/board/paper.webp");
  --paper-fastener-image: url("../assets/board/tape.svg");
  --paper-fastener-color: transparent;
  --paper-fastener-border: transparent;
  --board-top-left-image: url("../assets/board/sticker.svg");
}
```

Gunakan `--board-texture-size` dan `--paper-texture-size` untuk mengatur skala
tekstur. Untuk artwork penuh, ubah ukuran menjadi `100% 100%` dan repeat menjadi
`no-repeat`; gambar akan mengikuti ukuran papan/kertas. Kertas mengikuti tinggi
task, jadi gunakan tekstur seamless bila artwork tidak boleh meregang.

Ukuran perekat dapat diatur lewat `--paper-fastener-width` dan
`--paper-fastener-height`. Set warna dan border perekat menjadi `transparent`
ketika gambar perekat final dipasang agar fallback CSS tidak terlihat.

Judul dan perekat berada di `.paper-drag-handle`, pegangan untuk menggeser kertas.
Hover menunjukkan cursor `grab`; saat ditarik cursor menjadi `grabbing`, kertas
sedikit membesar, dan bayangannya lebih dalam. Saat dilepas kertas kembali ke
ukuran normal. Gerakan mouse, sentuhan, dan keyboard memakai koordinat papan,
sehingga jarak drag tetap benar saat zoom. Papan bisa digeser untuk menemukan
kertas di luar layar; posisi kertas dan kamera tersimpan per grup. Tombol kembali
ke kertas memusatkan tampilan tanpa mengubah posisi yang tersimpan.

Pegangan juga dapat difokuskan dengan Tab: tombol panah menggeser 10px, Shift +
panah menggeser 40px, Home mengembalikan kertas ke tengah, dan Escape membatalkan
drag yang sedang berlangsung. Gerakan kertas diatur oleh `../../js/paper-drag.js`.

Ukuran, rasio, rotasi, dan posisi setiap dekorasi dapat diatur pada kelas slot:

```css
.board-decoration--top-left {
  --decoration-width: clamp(120px, 15vw, 200px);
  --decoration-aspect-ratio: 3 / 4;
  --decoration-rotation: -6deg;
  top: 12%;
  left: 4%;
}
```

Dekorasi latar berada di belakang kertas, tidak menerima klik, dan tidak dibaca screen
reader. Pada lebar layar <= 900px dekorasi disembunyikan agar form tetap lega.
Dark mode menggelapkan papan; kertas, tinta hitam, dan date picker tetap terang.
Tidak perlu aset dark mode terpisah: tekstur papan diredupkan melalui opacity.

Untuk tambahan dekorasi, tambahkan elemen `.board-decoration` di `.board-scene`
pada `index.html`, lalu beri kelas posisi dan `--decoration-image` tersendiri.
Posisi slot sekarang mengikuti area contoh 1200 × 800 pada koordinat papan.
Lapisan tekstur dibentangkan dari -10000 hingga 10000 agar papan dapat digeser;
utamakan tekstur seamless. Untuk hiasan yang dapat dipindahkan pengguna, tambahkan
entri katalog, bukan dekorasi latar.
