@echo off
cd /d "%~dp0apps\web"
echo ===================================================
echo   Starting DeepGraph AI Frontend on http://localhost:3000
echo ===================================================
npm run dev
pause
