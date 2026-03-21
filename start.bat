@echo off
echo ==========================================
echo   InvestIQ Pro - Startup Script
echo ==========================================

echo.
echo [1/2] Starting FastAPI Backend (port 8000)...
start "InvestIQ Backend" cmd /k "cd /d %~dp0backend && uvicorn main:app --reload --port 8000"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Next.js Frontend (port 3000)...
start "InvestIQ Frontend" cmd /k "cd /d %~dp0frontend && npx next dev"

echo.
echo ==========================================
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo   API Docs: http://localhost:8000/docs
echo ==========================================
echo.
echo Esperando que los servidores inicien...
timeout /t 5 /nobreak >nul
start http://localhost:3000
