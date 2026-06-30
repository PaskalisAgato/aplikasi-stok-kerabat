# 📖 PANDUAN PENGGUNA APLIKASI STOK KERABAT
### Versi: 2025 | Dokumen Referensi Operasional Resmi

> Dokumen ini adalah panduan resmi untuk seluruh karyawan, kasir, dan admin dalam mengoperasikan aplikasi **Stok Kerabat**. Pelajari setiap fitur sesuai peran Anda. Hubungi Admin/Manajer jika menemukan kesulitan.

---

## DAFTAR ISI
1. [POS — Point of Sale (Kasir)](#1-pos--point-of-sale-kasir)
2. [Attendance — Absensi Masuk & Pulang](#2-attendance--absensi-masuk--pulang)
3. [Attendance History — Riwayat Absensi](#3-attendance-history--riwayat-absensi-khusus-admin)
4. [Shifts — Jadwal Giliran Kerja](#4-shifts--jadwal-giliran-kerja)
5. [Inventory — Manajemen Stok Bahan Baku](#5-inventory--manajemen-stok-bahan-baku)
6. [Opname — Stock Opname / Audit Fisik](#6-opname--stock-opname--audit-fisik)
7. [Waste — Analisis & Laporan Produk Terbuang](#7-waste--analisis--laporan-produk-terbuang)
8. [Expenses — Pengeluaran & Arus Kas](#8-expenses--pengeluaran--arus-kas)
9. [Members — Loyalitas Pelanggan & Promo](#9-members--loyalitas-pelanggan--promo)
10. [Vouchers — Sistem Voucher Pemasaran](#10-vouchers--sistem-voucher-pemasaran)
11. [Reports — Laporan Keuangan](#11-reports--laporan-keuangan)
12. [Employees — Manajemen Karyawan](#12-employees--manajemen-karyawan-khusus-admin)
13. [Todo List — Checklist Tugas Harian](#13-todo-list--checklist-tugas-harian)
14. [Print Agent & Printer Settings — Pengaturan Printer](#14-print-agent--printer-settings--pengaturan-printer)
15. [HPP & COGS — Harga Pokok Penjualan](#15-hpp--cogs--harga-pokok-penjualan-khusus-admin)

---

## 1. POS — Point of Sale (Kasir)

### Tujuan Fitur
Halaman utama kasir untuk menerima pesanan, menyusun keranjang belanja, mengelola bill (bon), menerapkan diskon/voucher, dan memproses pembayaran hingga mencetak struk.

### Antarmuka Utama
Layar POS terbagi menjadi **3 kolom** (desktop/tablet):
| Kolom | Isi |
|---|---|
| **Kiri** | Daftar Bill (Bon) aktif |
| **Tengah** | Grid Menu & Pencarian |
| **Kanan** | Keranjang & Detail Order |

Di **mobile**, terdapat navigasi bawah: **Menu | Cart | Bills**.

---

### A. Membuka Shift (Wajib Sebelum Mulai)

> 🚨 **PENTING!** Kasir/Karyawan **tidak dapat memproses transaksi** tanpa membuka shift terlebih dahulu. Admin memiliki akses tanpa shift.

1. Buka halaman POS. Jika shift belum dibuka, sistem akan menampilkan layar **"Shift Required"**.
2. Klik tombol **"Buka Shift"**.
3. Sistem akan mengecek apakah Anda sudah absen masuk hari ini. Jika belum, akan muncul peringatan.
4. Isi **nominal uang modal** (kas awal) di laci kasir. Contoh: `150000` untuk Rp 150.000.
5. Tekan **"Buka Shift"** → Anda siap menerima pesanan.

---

### B. Menerima Pesanan & Mengisi Keranjang

1. **Cari menu:** Gunakan kotak pencarian di atas grid (atau tekan `Alt+S` di keyboard).
2. **Filter kategori:** Klik tombol kategori (contoh: "Minuman", "Makanan") di bawah search bar.
3. **Pilih menu:** Klik kartu produk yang diinginkan. Klik `+` untuk menambah jumlah, `-` untuk mengurangi.
4. **Ganti sumber pesanan:** Di bagian bawah keranjang, pilih sumber: `DIRECT` (langsung di toko), `STAND` (harga stand berbeda), `GRABFOOD`, `GOFOOD`, atau `SHOPEEFOOD`. Harga akan otomatis menyesuaikan jika ada harga khusus.
5. **Tambahkan catatan item:** Klik ikon catatan 📝 di samping item di keranjang untuk menulis permintaan khusus (contoh: "tanpa gula", "es sedikit").

---

### C. Mengelola Bill (Multi-Meja)

**Membuat bill baru (untuk meja/pelanggan berbeda):**
1. Di kolom kiri, klik **"Bill Baru"** di kanan atas atau tekan `Esc` untuk mengosongkan keranjang dan membuat bill baru.
2. Masukkan nama meja atau pelanggan di field **Customer Info**.
3. Tambahkan item ke keranjang, lalu klik **"Simpan Bill"** (`F2`).

**Berpindah antar bill:**
1. Klik bill yang diinginkan di daftar bill (kolom kiri).
2. Keranjang akan otomatis terisi dengan item dari bill tersebut.

**Merge (Gabungkan) Bill:**
1. Di kartu bill yang ingin dijadikan tujuan, klik tombol **"Merge"**.
2. Centang bill-bill lain yang akan digabungkan ke dalamnya.
3. Klik **"Konfirmasi Merge"** → seluruh item dari bill sumber akan dipindahkan.

**Split (Pisahkan) Bill:**
1. Di kartu bill, klik **"Split"**.
2. Pilih item mana yang akan dipindahkan ke bill baru, atau masukkan nama meja tujuan.
3. Tentukan jumlah masing-masing item yang dipindahkan.
4. Klik **"Konfirmasi Split"**.

> 🚨 **CATATAN!** Aksi **Merge** akan **menghapus** bill sumber secara permanen dan memindahkan semua itemnya. Pastikan sudah benar sebelum konfirmasi.

---

### D. Scan Voucher / Terapkan Promo

1. Di halaman tengah, klik tombol **"Scan Voucher QR"** (ikon QR scanner, berwarna aksen).
2. Modal scan akan terbuka. Ada 2 cara:
   - **Scan QR fisik:** Arahkan kamera ke kode QR voucher pelanggan.
   - **Ketik kode manual:** Masukkan kode voucher di kolom yang tersedia lalu klik "Gunakan".
3. Sistem akan memvalidasi voucher secara real-time (cek apakah sudah dipakai, apakah valid untuk pesanan ini).
4. Jika valid, diskon akan **otomatis diterapkan** di ringkasan keranjang kanan bawah.
5. Tutup modal → lanjutkan ke pembayaran.

> 🚨 **CATATAN!** Sistem voucher bersifat **sekali pakai**. Voucher yang sudah pernah di-redeem TIDAK BISA digunakan lagi dan sistem akan menolaknya secara otomatis.

---

### E. Terapkan Member & Poin Loyalty

1. Di header aplikasi (atas kanan), klik ikon **"Member"** atau **"Diskon"**.
2. Cari member dengan mengetikkan nama atau nomor HP.
3. Pilih member dari hasil pencarian → poin loyalty mereka akan tampil.
4. Pilih berapa poin yang ingin ditukarkan oleh pelanggan → nominal diskon akan muncul di keranjang.

---

### F. Proses Pembayaran (Checkout)

1. Di panel keranjang (kanan), pastikan semua item sudah benar.
2. Lihat ringkasan di bagian bawah:
   - **Subtotal** → **Diskon** → **Total Akhir**
3. Pilih **metode pembayaran:** `CASH`, `QRIS`, atau `CARD`.
4. Jika `CASH`: masukkan **nominal uang diterima**. Kembalian akan otomatis terhitung.
5. Klik tombol **"Bayar"** (atau tekan `F1` di keyboard).

> 🚨 **CATATAN!** Transaksi yang telah berhasil diproses **tidak dapat dibatalkan** oleh karyawan biasa. Pembatalan/void memerlukan PIN Supervisor/Admin.

---

### G. Menutup / Handover Shift

1. Di header, klik menu aksi (⋮ atau tombol shift).
2. Pilih **"Tutup Shift"** atau **"Handover Shift"**.
   - **Tutup Shift:** Hitung uang secara fisik, masukkan total uang yang ada di laci. Sistem akan menampilkan ringkasan transaksi per metode bayar & selisihnya.
   - **Handover:** Alihkan shift ke kasir berikutnya tanpa menutup operasional.
3. Sistem akan **sinkronisasi data cloud** terlebih dahulu sebelum shift ditutup.

---

### Pintasan Keyboard POS
| Tombol | Fungsi |
|---|---|
| `F1` | Bayar / Checkout |
| `F2` | Simpan / Update Bill |
| `Alt+S` | Fokus ke kotak pencarian menu |
| `Esc` | Bersihkan keranjang / tutup menu aksi |

---

## 2. Attendance — Absensi Masuk & Pulang

### Tujuan Fitur
Sistem presensi digital berbasis **foto selfie + GPS** untuk membuktikan kehadiran fisik karyawan di lokasi toko.

### Langkah-Langkah

**Absen Masuk (Awal Kerja):**
1. Buka halaman **Attendance**. Kamera akan aktif otomatis untuk mengambil foto Anda.
2. Posisikan wajah Anda di depan kamera dengan pencahayaan yang cukup.
3. Klik tombol **"ABSEN MASUK"** (berwarna biru/aksen).
4. Sistem akan **mencari lokasi GPS** Anda (ikon lokasi akan berputar).
5. Setelah foto dan lokasi terdeteksi, muncul **layar pratinjau** menampilkan:
   - Foto selfie Anda
   - Alamat lokasi GPS Anda
6. Jika foto sudah jelas dan lokasi benar, klik **"KIRIM ABSENSI"**.
7. Jika foto kurang baik, klik **"Ambil Ulang"**.
8. Sukses → status berubah menjadi "Sudah Masuk" dan jam masuk tercatat.

**Absen Pulang (Akhir Kerja):**
1. Buka kembali halaman **Attendance**.
2. Klik tombol **"ABSEN PULANG"** (berwarna merah).
3. Ulangi proses yang sama: foto + lokasi → pratinjau → Kirim.
4. Sukses → status berubah menjadi "Sudah Pulang" dan jam pulang tercatat.

> 🚨 **CATATAN PENTING!**
> - Sistem **memerlukan izin kamera dan lokasi GPS** dari browser/perangkat. Pastikan izin sudah diberikan.
> - Absen **harus dilakukan di lokasi toko**. Absen dari luar lokasi dapat terdeteksi.
> - Jika tombol **"ABSEN MASUK"** tampak abu-abu/tidak bisa diklik, artinya Anda sudah absen masuk hari ini.
> - Foto yang dikirim akan disimpan sebagai **bukti sah absensi** yang dapat dilihat Admin.

---

## 3. Attendance History — Riwayat Absensi *(Khusus Admin)*

### Tujuan Fitur
Memantau dan mengaudit seluruh data kehadiran karyawan, termasuk melihat foto bukti absen, dengan kemampuan filter dan ekspor laporan.

> 🔒 **Halaman ini HANYA BISA diakses oleh Admin.** Karyawan biasa akan ditolak masuk.

### Langkah-Langkah

**Melihat Riwayat Absensi:**
1. Buka **Attendance History**.
2. Gunakan filter di bagian atas:
   - **Cari Karyawan:** Ketik nama karyawan.
   - **Periode:** Atur tanggal "Mulai" dan "Selesai".
3. Tabel akan menampilkan: Nama Karyawan, Tanggal, Jam Check-In, Jam Check-Out, Status (Hadir/Terlambat/Absen).

**Melihat Foto Bukti Absen:**
1. Di kolom "Foto (In/Out)", klik tombol **"Masuk"** (biru) atau **"Pulang"** (amber).
2. Foto selfie karyawan akan tampil di layar modal untuk diverifikasi.

**Ekspor Data:**
1. Klik **"Excel"** → unduh file .xlsx laporan absensi periode tersebut.
2. Klik **"CSV"** → unduh file .csv.

**Menghapus Data Absensi:**
1. Klik **"Hapus Riwayat"** → modal akan muncul.
2. Tentukan rentang tanggal data yang akan dihapus.
3. Baca peringatan, lalu klik **"Hapus Sekarang"**.
4. Sistem akan meminta Anda mengetik **`HAPUS`** untuk konfirmasi.

> 🚨 **PERINGATAN KRITIS!** Penghapusan data absensi bersifat **PERMANEN** termasuk foto-foto bukti. Data yang sudah dihapus **TIDAK BISA DIPULIHKAN**. Lakukan dengan sangat hati-hati.

---

## 4. Shifts — Jadwal Giliran Kerja

### Tujuan Fitur
Admin membuat dan mengatur jadwal shift mingguan karyawan secara visual menggunakan tabel interaktif. Karyawan hanya bisa melihat jadwal mereka sendiri.

### Tampilan untuk Karyawan (Mode Read-Only)

1. Buka **Shifts**.
2. Anda akan melihat **Jadwal Saya** → deretan kartu per hari yang menampilkan jenis shift Anda.
3. Terdapat 3 jenis shift: **P (Pagi)**, **S (Sore)**, **M (Malam)** dengan jam masing-masing yang ditetapkan Admin.

### Langkah-Langkah untuk Admin (Membuat Jadwal)

**Mengatur Jam Shift:**
1. Di bagian **Pengaturan Shift**, tentukan jam masuk dan pulang untuk masing-masing shift (P/S/M).
2. Aktifkan/nonaktifkan jenis shift dengan toggle di sebelah kanan.

**Mengatur Rentang Waktu Jadwal:**
1. Isi **"Mulai Dari"** dan **"Sampai Dengan"** (biasanya satu minggu: Senin–Minggu).

**Mengisi Jadwal di Tabel:**
1. Tabel menampilkan baris (nama karyawan) × kolom (tanggal).
2. **Klik dan tahan** pada sel → seret ke sel lain untuk memilih area.
3. Setelah lepas klik, muncul **menu popover** with pilihan: `P` (Pagi), `S` (Sore), `M` (Malam), `OFF`.
4. Klik pilihan → sel yang dipilih akan terisi dengan kode shift.
5. Gunakan tombol **Zoom** untuk memperbesar/memperkecil tabel.

**Menambah/Menghapus Karyawan dari Jadwal:**
- Dropdown **"+ Tambah Karyawan"** → pilih nama karyawan untuk menambahkan baris baru.
- Klik ikon **"×"** di baris karyawan untuk menghapus baris tersebut dari jadwal.

**Menyimpan Jadwal:**
1. Klik tombol **"Simpan State HRIS"** (tombol mengambang di bawah layar).
2. Sistem akan memvalidasi (contoh: Shift Malam tidak boleh langsung dilanjut Pagi) → jika ada kesalahan, akan muncul pesan error.
3. Jika valid → data tersimpan ke server.

**Ekspor ke Excel:**
1. Klik ikon **unduh (↓)** untuk mengunduh jadwal dalam format .xlsx.

> 🚨 **CATATAN!** Jika sistem mendeteksi **Shift M (Malam) diikuti Shift P (Pagi)** pada hari berikutnya untuk karyawan yang sama, jadwal **tidak akan bisa disimpan**. Ini adalah perlindungan kesehatan karyawan.

---

## 5. Inventory — Manajemen Stok Bahan Baku

### Tujuan Fitur
Melihat, menambah, mengedit, dan menghapus data bahan baku. Memantau status stok (Normal/Kritis/Habis) dan mendapat notifikasi jika ada bahan yang hampir habis.

### Langkah-Langkah

**Melihat Daftar Bahan Baku:**
1. Buka **Inventory**.
2. Gunakan **filter sidebar** (kiri) atau filter di atas untuk menyaring:
   - **Status:** Semua / Kritis / Normal
   - **Kategori:** Bar / Dapur / Frezer / Showcase / Lainnya
3. Gunakan kotak **pencarian** untuk mencari nama bahan secara spesifik.
4. Klik **"Tampilkan Lebih Banyak"** untuk memuat item berikutnya (per 20 item).

**Melihat Detail Bahan:**
1. Klik kartu bahan baku. Modal **Stock Detail** akan terbuka menampilkan info lengkap (stok saat ini, stok ideal, harga per unit, supplier, dll.).

**Menambah Stok (Dari Penerimaan Barang):**
1. Klik tombol **"Input Stok"** di footer mobile atau pilih bahan lalu klik **"Update Stok"** di detail modal.
2. Isi jumlah stok yang baru diterima.
3. Simpan → stok akan bertambah.

**Menambah Bahan Baru:**
1. Klik **"Bahan Baru"** di sidebar atau footer.
2. Isi semua data: Nama, Kategori, Satuan, Stok Awal, Stok Minimal, Harga per Unit.
3. Simpan.

**Mengedit Data Bahan:**
1. Di kartu bahan, klik ikon **pensil (edit)**.
2. Ubah data yang diperlukan → Simpan.

**Menghapus Bahan:**
1. Di kartu bahan, klik ikon **tempat sampah (delete)**.
2. Konfirmasi penghapusan di modal yang muncul.

**Notifikasi Stok Kritis:**
- Klik ikon **lonceng 🔔** di header → daftar bahan yang statusnya "Kritis" atau "Habis" akan tampil.

**Ekspor ke Excel:**
- Klik ikon **tabel/Excel** di header untuk mengunduh data inventaris.

> 🚨 **CATATAN!** Menghapus bahan baku bersifat **permanen** dan akan mempengaruhi resep yang menggunakan bahan tersebut. Pastikan bahan benar-benar tidak digunakan sebelum dihapus.

---

## 6. Opname — Stock Opname / Audit Fisik

### Tujuan Fitur
Mencocokkan stok fisik nyata di gudang dengan data stok di sistem. Setiap selisih (lebih/kurang) akan tercatat dan stok sistem akan diperbarui.

### Langkah-Langkah

**Persiapan:**
1. Pastikan tidak ada transaksi penjualan aktif saat opname berlangsung.
2. Hitung semua bahan baku secara fisik terlebih dahulu, catat di kertas.

**Proses Opname:**
1. Buka **Opname**.
2. Gunakan filter **Kategori** (Bar/Dapur/Frezer/dll.) dan **pencarian** untuk menemukan bahan yang akan di-opname.
3. Untuk setiap bahan, isi kolom-kolom berikut:
   
   | Kolom | Penjelasan |
   |---|---|
   | **Kotor (Gross)** | Berat total bahan + wadah (timbangan bruto) |
   | **Wadah (Tare)** | Berat wadah/kontainer saja. Bisa dipilih dari **Master Wadah** (klik ikon database 🗄️ untuk memilih wadah terdaftar) |
   | **Stok Fisik** | Berat bersih (terisi otomatis: Gross - Tare). Bisa juga diisi manual langsung |
   | **Varian (Diff)** | Selisih antara stok fisik vs stok sistem (otomatis, tidak perlu diisi). Merah = kurang, Hijau = lebih |
   | **Memo Penyesuaian** | Pilih alasan jika ada selisih: Kerusakan/Tumpah, Kesalahan Hitung, Kehilangan, Kadaluwarsa |

4. Setelah semua bahan terisi, klik **"FINALISASI STOK OPNAME"** di bagian bawah.
5. Konfirmasi → sistem akan menyimpan semua perubahan stok sekaligus.

**Catatan Metode Pengisian:**
- Jika menggunakan timbangan: isi Gross → pilih Tare → Stok Fisik terisi otomatis.
- Jika menghitung langsung: isi langsung Stok Fisik.

> 🚨 **CATATAN PENTING!** Menekan tombol **"FINALISASI STOK OPNAME"** akan **langsung menimpa stok sistem** dengan stok fisik yang Anda masukkan. Hanya bahan yang mengalami perubahan yang akan diperbarui. **Periksa kembali semua angka SEBELUM menekan tombol ini** — tindakan ini tidak bisa dibatalkan!

---

## 7. Waste — Analisis & Laporan Produk Terbuang

### Tujuan Fitur
Mencatat dan menganalisis bahan baku atau produk yang terbuang, rusak, dikonsumsi internal (staff/owner), atau digunakan untuk R&D. Ini memotong stok tanpa mencatat sebagai penjualan.

### Langkah-Langkah

**Melihat Dashboard Waste:**
1. Buka **Waste (Analisis Waste)**.
2. Halaman menampilkan:
   - **Total Pengeluaran Sia-Sia**: Total rupiah kerugian bulan ini.
   - **Top Waste Offenders**: Daftar produk yang paling banyak menyebabkan kerugian.
   - **Aktivitas Terakhir**: Log riwayat seluruh catatan waste.
   - **Penyebab Kerugian**: Diagram batang persentase berdasarkan kategori penyebab.

**Mencatat Waste Baru:**
1. Klik tombol **"Input Data Waste"** (tombol merah di bagian bawah halaman).
2. Modal **Log Waste** akan terbuka.
3. Pilih **bahan baku** yang akan dicatat sebagai waste dari daftar.
4. Masukkan **jumlah/kuantitas** yang dibuang.
5. Pilih **kategori alasan:**
   - **Owner** → Konsumsi/penggunaan langsung oleh pemilik
   - **Staff** → Konsumsi makan karyawan/staff
   - **R&D** → Percobaan menu baru / trial
   - **Lainnya (Kadaluwarsa, Tumpah, dll.)** → Kerusakan/pembuangan
6. Klik **"Simpan"** → stok bahan otomatis berkurang dan data terekam.

> 🚨 **CATATAN PENTING!** Jangan lewatkan mencatat waste sekecil apapun. Data ini sangat penting agar selisih stok tidak disalahartikan sebagai pencurian. Setiap karyawan yang mengonsumsi bahan (makan karyawan, dsb.) WAJIB dicatat di sini.

---

## 8. Expenses — Pengeluaran & Arus Kas

### Tujuan Fitur
Mencatat setiap pengeluaran operasional toko yang diambil dari kas (laci kasir atau rekening), seperti pembelian bahan dadakan, biaya parkir, dsb.

### Langkah-Langkah

**Mencatat Pengeluaran Baru:**
1. Buka **Expenses** (Pengeluaran).
2. Klik **"Tambah Pengeluaran"** di sidebar atau tombol di bagian bawah (mobile).
3. Isi form pengeluaran:
   - **Judul / Keterangan:** Nama pengeluaran (contoh: "Beli Galon Air", "Biaya Parkir Motor")
   - **Kategori:** Pilih kategori pengeluaran
   - **Tanggal & Waktu:** Otomatis terisi, bisa disesuaikan
   - **Nominal (Rp):** Jumlah uang yang dikeluarkan
   - **Nota/Kwitansi:** Unggah foto nota fisik jika ada
4. Klik **"Simpan"**.

**Melihat & Filter Laporan Pengeluaran:**
1. Atur filter **"Dari"** dan **"Sampai"** di bagian atas (format: tanggal-waktu).
2. Klik **"Cari"** untuk memuat data periode tersebut.
3. Klik **"Reset"** untuk kembali ke filter bulan berjalan.
4. Rangkuman total biaya & jumlah transaksi tampil di sidebar.

**Ekspor ke Excel:**
1. Klik ikon **Excel** di header atau tombol "Ekspor Excel" di sidebar.

**Mengedit / Menghapus Pengeluaran:**
- Klik ikon **pensil** pada entri untuk mengedit.
- Klik ikon **tempat sampah** untuk menghapus.

> 🚨 **CATATAN!** Menghapus pengeluaran memerlukan **PIN Supervisor (1234 — default, ubah segera!)**. Jika PIN salah, penghapusan **otomatis dibatalkan**. Selalu sertakan foto nota fisik sebagai bukti pengeluaran yang valid.

---

## 9. Members — Loyalitas Pelanggan & Promo

### Tujuan Fitur
Mengelola database pelanggan setia (program poin loyalty) dan mengatur program promo/diskon yang berlaku di toko.

### Tab 1: Member (Pelanggan Loyalty)

**Mendaftarkan Member Baru:**
1. Buka **Members** → Tab **"Member"**.
2. Klik **"Tambah Member"** (ikon person_add).
3. Isi:
   - **Nama Lengkap Pelanggan**
   - **Nomor Handphone (WhatsApp)**
4. Klik **"Daftarkan Member"** → pelanggan otomatis terdaftar di level **Bronze**.

**Mencari Member:**
1. Gunakan kotak pencarian → ketik nama atau nomor HP.

**Level Loyalty:**
| Level | Simbol |
|---|---|
| Bronze | 🥉 |
| Silver | 🥈 |
| Gold | 🥇 |

Level naik otomatis berdasarkan akumulasi poin dari transaksi.

**Menyesuaikan Poin Manual (Adjust Points):**
1. Hover atau klik ikon bintang ⭐ di baris member.
2. Isi **nilai penyesuaian** (positif untuk tambah, negatif dengan tanda `-` untuk kurangi. Contoh: `-50`).
3. Isi **alasan penyesuaian**.
4. Klik **"Simpan Perubahan"**.

**Mengedit / Menghapus Member:**
- Klik ikon pensil untuk edit, ikon tempat sampah untuk hapus.

---

### Tab 2: Promo / Diskon

**Membuat Promo Baru:**
1. Di halaman Members, pindah ke tab **"Diskon"** atau **"Promo"**.
2. Klik **"Buat Promo Baru"**.
3. Isi konfigurasi promo (dibagi 3 seksi):

**Seksi 1 — Identitas & Jenis:**
- **Judul Promo:** Nama promo (contoh: "Flash Sale Ramadan")
- **Tipe Diskon:** `% Persen` / `Rp Nominal` / `📦 Bundling`
- **Mode Penggunaan:**
  - *Otomatis* → diterapkan tanpa kode
  - *Perlu Kode* → pelanggan harus memasukkan/scan kode voucher
- **Target Penerima:**
  - *Semua Orang* → berlaku untuk semua pelanggan
  - *Khusus Member* → hanya untuk level Silver ke atas atau Gold
- **Besaran Diskon:** Isi % atau Rp. Untuk tipe Persen, bisa ditambah plafon maksimal potongan.

**Seksi 2 — Keamanan & Quota:**
- **Min. Belanja:** Minimal transaksi agar promo berlaku
- **Budget Maksimal:** Total dana promo (sistem otomatis berhenti jika budget habis)
- **Kuota Total:** Jumlah maksimal klaim promo
- **Maks. Pakai per User:** Berapa kali 1 pelanggan bisa pakai

**Seksi 3 — Optimasi & Jadwal:**
- **Prioritas (1–10):** Promo dengan nilai lebih tinggi diterapkan lebih dulu jika ada beberapa promo aktif.
- **Stackable:** Jika dicentang, promo bisa digabung dengan promo lain.
- **Exclusive:** Hanya satu promo eksklusif yang bisa berlaku, tidak bisa digabung.
- **Tanggal Mulai–Selesai:** Periode aktif promo
- **Hari Aktif:** Pilih hari spesifik promo berlaku (kosong = setiap hari)
- **Jam Aktif:** Tentukan rentang jam (contoh: 15:00–17:00 untuk happy hour)

4. Klik **"Simpan"** → promo aktif.

> 🚨 **CATATAN!** Promo dengan **Budget Maksimal** akan **otomatis berhenti** saat budget habis terpakai. Pantau indikator progres budget di kartu promo. Jika promo sudah hampir habis budget (bar merah), segera beri tahu manajer.

---

## 10. Vouchers — Sistem Voucher Pemasaran

### Tujuan Fitur
Membuat, mencetak, dan memvalidasi voucher QR fisik untuk kampanye pemasaran. Dilengkapi dashboard analitik performa voucher.

### Sub-Halaman di Vouchers:

**1. Dashboard (Overview):**
- Ringkasan statistik: Total voucher diterbitkan, total redempsi, revenue yang dihasilkan, dan jumlah kode aktif.
- Daftar batch voucher terbaru + tombol cetak ulang.

**2. Editor (Visual Designer):**
- Desain template voucher (tata letak, warna, logo) yang akan digunakan saat mencetak.

**3. Generator (Voucher Factory):**
- Membuat batch voucher baru.
- Pilih template, promo yang ditautkan, jumlah voucher yang akan digenerate.
- Sistem akan membuat kode unik untuk setiap voucher.

**4. Scan (Vault Entry):**
- Validasi voucher yang dibawa pelanggan melalui scanner QR.
- Menampilkan apakah voucher valid, sudah digunakan, atau kadaluwarsa.

**5. History:**
- Audit log semua aktivitas voucher (diterbitkan, di-redeem, dibatalkan).

### Alur Kerja Voucher:
```
Admin: Buat Template → Generate Batch → Cetak Fisik
                                          ↓
Pelanggan dapat voucher fisik → Scan di POS saat checkout
                                          ↓
Sistem validasi → Diskon diterapkan → Voucher ditandai "USED"
```

---

## 11. Reports — Laporan Keuangan

### Tujuan Fitur
Menampilkan laporan keuangan komprehensif dalam dua tampilan: Laporan Laba Rugi (P&L) dan Analisis Waste.

### Tab 1: Profit & Loss (P&L)

1. Buka **Reports** → default tab adalah **P&L**.
2. Atur **filter periode** (biasanya otomatis bulan berjalan).
3. Laporan menampilkan:
   - **Total Pendapatan** (Revenue)
   - **Total HPP** (Harga Pokok Penjualan)
   - **Total Pengeluaran Operasional** (Expenses)
   - **Total Waste**
   - **Laba Bersih** (Net Profit)
4. Data dapat dilihat per hari/minggu/bulan.

### Tab 2: Waste Analysis

1. Klik tombol/tab **"Waste"** untuk beralih tampilan.
2. Analisis ini memperlihatkan:
   - Tren waste dari waktu ke waktu
   - Breakdown per kategori bahan
   - Estimasi kerugian finansial

> 🔒 **Halaman ini direkomendasikan hanya diakses oleh Admin/Owner.** Data ini bersifat rahasia finansial bisnis.

---

## 12. Employees — Manajemen Karyawan *(Khusus Admin)*

### Tujuan Fitur
Mendaftarkan akun karyawan baru, mengatur role/hak akses, dan menonaktifkan akun yang sudah tidak diperlukan.

### Langkah-Langkah

**Menambah Karyawan Baru:**
1. Buka **Employees**.
2. Klik **"Tambah Karyawan"** atau **"Buat Akun Baru"**.
3. Isi data:
   - **Nama Lengkap**
   - **Username** (untuk login)
   - **Password** (sementara, karyawan bisa ganti sendiri)
   - **Role/Hak Akses** (pilih dengan hati-hati):
     - `Karyawan` → Hanya bisa menggunakan POS tanpa akses laporan keuangan
     - `Admin` → Akses penuh ke semua fitur termasuk laporan dan penghapusan data
4. Simpan.

**Mengedit / Menonaktifkan Karyawan:**
- Klik karyawan → edit informasi atau ubah status menjadi non-aktif.

> 🚨 **CATATAN PENTING!** Jangan memberikan role **"Admin"** kepada semua karyawan. Role Admin dapat mengakses laporan keuangan, menghapus data, dan mengubah konfigurasi sistem. Berikan hanya kepada orang yang benar-benar berwenang.

---

## 13. Todo List — Checklist Tugas Harian

### Tujuan Fitur
Daftar tugas rutin harian yang harus diselesaikan karyawan sebelum/sesudah shift (membersihkan area, mematikan peralatan, dsb.) untuk memastikan standar operasional terpenuhi.

### Langkah-Langkah

1. Buka **Todo List**.
2. Lihat daftar tugas yang harus dikerjakan (dibuat oleh Admin/Manajer).
3. Setelah setiap tugas fisik diselesaikan di toko, centang/klik pada tugas tersebut di aplikasi.
4. Tugas yang sudah dicentang akan berubah tampilan (biasanya dicoret atau berwarna berbeda).

**Catatan untuk Admin (Membuat Tugas):**
- Tambah tugas baru → isi nama tugas dan waktunya (contoh: "Buka Pintu Toko 08:00", "Matikan AC", "Buang Sampah").
- Tugas akan tampil di checklist semua karyawan shift tersebut.

> 🚨 **CATATAN!** Karyawan yang bergabung di shift baru **WAJIB membuka Todo List** di awal shift untuk mengetahui standar tugas hari ini. Manajer dapat memantau tugas mana yang belum diselesaikan.

---

## 14. Print Agent & Printer Settings — Pengaturan Printer

### Tujuan Fitur
Menghubungkan aplikasi ke printer struk/dapur agar transaksi dan order dapat dicetak otomatis.

### Printer Settings — Pengaturan Koneksi Printer

1. Buka **Printer Settings** (bisa diakses dari menu POS → aksi → Printer Settings, atau langsung dari sidebar admin).
2. Konfigurasi printer:
   - **Nama Printer:** Beri nama deskriptif (contoh: "Printer Kasir", "Printer Dapur")
   - **Tipe Koneksi:** Pilih metode koneksi (IP/Network, Bluetooth)
   - **Alamat:** Masukkan IP Address printer di jaringan yang sama (contoh: `192.168.1.100`)
3. Klik **"Test Print"** → printer akan mencetak halaman uji. Pastikan kertas keluar dengan benar.
4. Simpan konfigurasi.

### Print Agent — Layanan Latar Belakang

Print Agent adalah aplikasi yang berjalan di komputer/tablet kasir sebagai jembatan antara browser dan printer fisik.

1. Pastikan **aplikasi Print Agent** sudah berjalan (bisa dicek via ikon di system tray atau taskbar).
2. Jika struk gagal tercetak, periksa:
   - Apakah Print Agent aktif?
   - Apakah printer menyala dan kertas mencukupi?
   - Apakah koneksi jaringan stabil?

**Troubleshooting Gagal Print:**
1. Periksa ikon Print Agent → pastikan statusnya "Running".
2. Periksa kabel/koneksi printer.
3. Cek sisa kertas struk.
4. Buka **Printer Settings** → klik "Test Print" ulang.
5. Jika masih gagal, restart Print Agent dan hubungi Admin.

> 🚨 **CATATAN!** Jika printer gagal di jam sibuk, karyawan **tetap harus mencatat transaksi di POS** (tanpa struk). Struk dapat dicetak ulang dari **Histori Transaksi** setelah printer berhasil terhubung kembali.

---

## 15. HPP & COGS — Harga Pokok Penjualan *(Khusus Admin)*

### Tujuan Fitur
Menghitung dan menampilkan Harga Pokok Penjualan (HPP) / Cost of Goods Sold (COGS) untuk setiap menu berdasarkan resep bahan baku dan harga beli bahan. Ini membantu menentukan harga jual yang tepat dan memantau margin keuntungan.

### Langkah-Langkah

1. Buka **HPP** atau **COGS**.
2. Sistem menampilkan tabel perbandingan:
   - **Nama Menu**
   - **HPP (Biaya Bahan):** Total biaya bahan baku per satu porsi berdasarkan resep
   - **Harga Jual:** Harga yang tertera di POS
   - **Margin / Profit:** Selisih harga jual - HPP
   - **Persentase Margin:** (Margin / Harga Jual) × 100%
3. Gunakan data ini untuk mengevaluasi apakah harga jual menu sudah cukup menguntungkan.

> 💡 **Tips:** Jika margin suatu menu terlalu kecil (<30%), pertimbangkan untuk menaikkan harga atau mengurangi komposisi bahan yang mahal. Konsultasikan dengan manajer/owner sebelum mengubah harga menu.

> 🔒 **Halaman ini bersifat SANGAT RAHASIA.** Data ini menunjukkan struktur biaya dan profit bisnis. Jangan biarkan layar ini terbuka tanpa pengawasan.

---

## RESEP (Recipes & Recipe Edit)

### Tujuan Fitur
Mengatur rumus komponen bahan baku setiap menu. Ini adalah penghubung antara penjualan di POS dengan pengurangan stok di Inventory secara otomatis.

### Langkah-Langkah

**Melihat Daftar Resep:**
1. Buka **Recipes**.
2. Daftar semua menu beserta komponen bahan bakunya akan tampil.

**Mengedit/Membuat Resep:**
1. Klik menu yang ingin diedit → atau buka **Recipe Edit**.
2. Tambahkan komponen bahan baku:
   - Pilih **nama bahan** dari daftar inventaris
   - Masukkan **jumlah/takaran** (contoh: `50`)
   - Pilih **satuan** (contoh: `ml`, `gram`, `pcs`)
3. Ulangi untuk setiap bahan dalam resep tersebut.
4. Simpan.

> 🚨 **CATATAN SANGAT PENTING!** Kesalahan input satuan (contoh: menulis `50 liter` padahal yang benar `50 ml`) akan menyebabkan **stok bahan terpotong sangat banyak** setiap kali menu terjual. Periksa ulang satuan dengan teliti sebelum menyimpan resep!

---

## 📌 RINGKASAN CEPAT — SIAPA MENGERJAKAN APA

| Fitur | Kasir/Karyawan | Admin/Manajer |
|---|---|---|
| POS (Kasir) | ✅ | ✅ |
| Attendance (Absen) | ✅ | ✅ |
| Attendance History | ❌ | ✅ |
| Shifts (Melihat) | ✅ | ✅ |
| Shifts (Edit/Simpan) | ❌ | ✅ |
| Inventory | ✅ (Lihat & Update) | ✅ (Full) |
| Opname | Dengan pengawasan | ✅ |
| Waste | ✅ | ✅ |
| Expenses | ✅ | ✅ |
| Members | ✅ | ✅ |
| Vouchers | Scan saja (via POS) | ✅ (Full) |
| Reports | ❌ | ✅ |
| Employees | ❌ | ✅ |
| HPP / COGS | ❌ | ✅ |
| Printer Settings | Troubleshoot saja | ✅ (Full) |
| Recipes | ❌ | ✅ |
| Todo List | ✅ | ✅ |

---

*Dokumen ini terakhir diperbarui berdasarkan source code aplikasi Stok Kerabat — Juni 2025.*
*Jika ada perubahan fitur aplikasi, hubungi Admin untuk pembaruan manual.*
