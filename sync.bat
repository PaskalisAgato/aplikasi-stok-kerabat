@echo off
echo ===================================
echo [1/3] Menambahkan perubahan...
git add .

set /p msg="Masukkan pesan update: "
if "%msg%"=="" set msg="Update rutin dari sync.bat"

echo.
echo [2/3] Membuat commit: %msg%
git commit -m "%msg%"

echo.
echo [3/3] Mengirim ke GitHub...
git push

echo.
echo ===================================
echo BERHASIL! GitHub Anda sudah terupdate.
echo Website akan terupdate otomatis dalam beberapa menit.
echo ===================================
pause
