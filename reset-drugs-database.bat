@echo off
chcp 65001 >nul
title إعادة تعيين قاعدة بيانات الأدوية

echo.
echo 🔄 إعادة تعيين قاعدة بيانات الأدوية
echo ==================================================

REM التحقق من وجود Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js غير متوفر. يرجى تثبيت Node.js أولاً
    pause
    exit /b 1
)

echo ✅ Node.js متوفر

REM التحقق من وجود المجلد
if not exist "scripts" (
    echo ❌ مجلد scripts غير موجود
    pause
    exit /b 1
)

REM التحقق من وجود ملف package.json
if not exist "package.json" (
    echo ❌ ملف package.json غير موجود
    pause
    exit /b 1
)

REM التحقق من تثبيت dependencies
if not exist "node_modules" (
    echo ⚠️ node_modules غير موجود. تثبيت المتطلبات...
    npm install
    if errorlevel 1 (
        echo ❌ فشل في تثبيت المتطلبات
        pause
        exit /b 1
    )
)

echo.
echo ⚠️  تحذير مهم:
echo    • سيتم مسح جميع بيانات الأدوية نهائياً
echo    • سيتم الاحتفاظ بالجداول وبنية قاعدة البيانات
echo    • قاعدة البيانات المصدر لن تتأثر
echo.

set /p "confirmation=هل تريد المتابعة؟ اكتب 'نعم' للمتابعة: "
if not "%confirmation%"=="نعم" (
    echo ❌ تم إلغاء العملية
    pause
    exit /b 0
)

echo.
echo 🚀 بدء عملية إعادة التعيين...

REM تشغيل السكريبت
node scripts/reset-drugs-database.js
if errorlevel 1 (
    echo ❌ فشلت العملية
    pause
    exit /b 1
)

echo.
echo 🎉 تمت العملية بنجاح!
echo ✅ قاعدة البيانات جاهزة لإدخال بيانات جديدة

echo.
echo 📝 ملاحظات:
echo    • يمكنك الآن ملء قاعدة البيانات ببيانات جديدة
echo    • استخدم scripts أخرى لاستيراد البيانات
echo    • تأكد من إنشاء نسخة احتياطية قبل إضافة بيانات جديدة

echo.
echo ✅ انتهت العملية
pause