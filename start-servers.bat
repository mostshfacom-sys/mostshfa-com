@echo off
setlocal

set "ROOT=%~dp0"
cd /d "%ROOT%"

echo ========================================
echo Mostshfa New - Start Dev Server
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed or not in PATH.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  npm install
  if errorlevel 1 (
    echo Failed to install dependencies.
    pause
    exit /b 1
  )
)

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
