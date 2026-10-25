@echo off
title SMK Go Global - Local Development Server
echo ========================================================
echo   Menjalankan SMK Go Global di Local
echo ========================================================
echo.

cd /d "%~dp0"

REM Cek dan nyalakan MySQL jika belum aktif
netstat -ano | findstr :3306 >nul
if %errorlevel% neq 0 (
    echo Menyalakan database MySQL...
    start "MySQL Database" /min "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysqld.exe" --datadir="C:\laragon\data\mysql-8"
    timeout /t 2 /nobreak >nul
)

REM Buka tab / window untuk Laravel Backend
start "Backend Laravel (PHP 8.2)" cmd /k "cd /d "%~dp0backend" && "C:\laragon\bin\php\php-8.2.20-nts-Win32-vs16-x64\php.exe" artisan serve --port=8000"

REM Buka tab / window untuk Frontend Vite HMR
start "Frontend Vite" cmd /k "cd /d "%~dp0" && pnpm.cmd dev"

echo.
echo Server telah dijalankan!
echo - URL Aplikasi: http://localhost:8000
echo - URL Login:    http://localhost:8000/login
echo.
echo Akun Demo:
echo   Username : admin-demo
echo   Password : DemoAdminPassword123!
echo ========================================================
pause
