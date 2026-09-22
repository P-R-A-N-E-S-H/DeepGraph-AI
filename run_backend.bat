@echo off
cd /d "%~dp0"
echo ===================================================
echo   Starting DeepGraph AI Backend on http://localhost:8000
echo ===================================================
python -m uvicorn app.main:app --app-dir apps/api --reload --port 8000
pause
