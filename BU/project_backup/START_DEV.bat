@echo off
echo ========================================
echo Starting Mostshfa New Development Server
echo ========================================
echo.

REM Clear cache
if exist ".next" (
    echo Clearing .next cache...
    rmdir /s /q .next 2>nul
)

REM Start dev server
echo Starting server on http://localhost:3000
echo Press Ctrl+C to stop
echo.
npm run dev
