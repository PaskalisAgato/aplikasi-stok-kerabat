#!/bin/bash
set -e

echo "============================================="
echo "   MEMULAI UPDATE OTOMATIS STOK KERABAT"
echo "============================================="

echo "[1/4] Menarik pembaruan dari repositori Github..."
git pull origin main

echo "[2/4] Menginstal modul dan dependencies (Backend & Frontend)..."
npm install --include=dev

echo "[3/4] Melakukan kompilasi Build menyeluruh menggunakan Turbo..."
# Menjalankan build utama (Vite frontend dan tsc backend) serta konsolidasi
npm run build

echo "[4/4] Memuat ulang (Restart) sistem backend..."
pm2 restart all

echo "============================================="
echo "✅ SELURUH SISTEM BERHASIL DIUPDATE!"
echo "Silakan Hard-Refresh (Ctrl+F5) halaman browser Anda."
echo "============================================="
