@echo off
echo ========================================
echo Restarting Mostshfa Development Server
echo ========================================
echo.

echo [1/4] Stopping any running processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] Clearing build cache...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo Cache cleared successfully!

echo [3/4] Generating Prisma client...
call npm run db:generate
if errorlevel 1 (
    echo Error generating Prisma client!
    pause
    exit /b 1
)

echo [4/4] Starting development server...
echo.
echo ========================================
echo Server starting on http://localhost:3000
echo Press Ctrl+C to stop the server
echo ========================================
echo.

call npm run dev
