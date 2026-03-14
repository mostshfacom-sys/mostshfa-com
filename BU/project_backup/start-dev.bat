@echo off
chcp 65001 >nul
echo ========================================
echo    تشغيل سيرفر mostshfa_new
echo ========================================
echo.

cd /d "%~dp0"

echo جاري تثبيت الحزم...
call npm install

echo.
echo جاري إنشاء قاعدة البيانات...
call npx prisma generate

echo.
echo ========================================
echo    السيرفر يعمل على: http://localhost:3000
echo ========================================
echo.

npm run dev
pause
