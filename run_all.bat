@echo off
cd /d "%~dp0"
echo ===================================================
echo   Launching DeepGraph AI Full-Stack Platform...
echo ===================================================
start "DeepGraph Backend API (Port 8000)" cmd /k "call run_backend.bat"
start "DeepGraph Frontend Web (Port 3000)" cmd /k "call run_frontend.bat"
echo.
echo Both servers are starting in separate windows!
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:8000/docs
echo.
pause
