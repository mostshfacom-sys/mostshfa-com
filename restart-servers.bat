@echo off
setlocal

set "ROOT=%~dp0"
cd /d "%ROOT%"

echo ========================================
echo Mostshfa New - Restart Dev Server
echo ========================================
echo.

echo Stopping node processes...
taskkill /F /IM node.exe >nul 2>&1

ping 127.0.0.1 -n 2 >nul

echo Clearing cache...
if exist ".next" rmdir /s /q ".next"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
if exist "tsconfig.tsbuildinfo" del /f /q "tsconfig.tsbuildinfo"

echo Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
  echo Failed to generate Prisma client.
  pause
  exit /b 1
)

echo.
echo Server starting on http://localhost:3000
echo Press Ctrl+C to stop the server.
echo.

npm run dev

endlocal
