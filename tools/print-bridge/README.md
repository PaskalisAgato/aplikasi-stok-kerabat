# Kerabat Print Bridge (Local)

Jembatan komunikasi antara aplikasi Web PWA dan Printer Thermal Anda.

## Cara Instalasi & Menjalankan:
1. Pastikan Anda sudah menginstal **Node.js** (versi 18 ke atas) di PC Kasir.
2. Buka Terminal / Command Prompt di folder ini: `tools/print-bridge`.
3. Jalankan perintah: 
   ```bash
   npm install
   ```
4. Hubungkan Printer Thermal Anda ke jaringan WiFi yang sama dengan PC/Laptop.
5. Jalankan server jembatan:
   ```bash
   npm start
   ```
6. Server akan berjalan di `http://localhost:3001`.

## Menghubungkan ke POS:
1. Buka aplikasi **Kerabat POS** di browser atau aplikasi terinstal.
2. Klik ikon printer 🖨️ di bagian atas (Header).
3. Masukkan **IP Printer** Thermal Anda (Contoh: `192.168.1.100`).
4. Selesaikan transaksi, dan printer akan mencetak struk secara otomatis.

> [!IMPORTANT]
> Pastikan PC Kasir dan Printer berada dalam satu jaringan WiFi yang sama agar komunikasi lancar.
