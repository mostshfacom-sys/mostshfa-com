# إعادة تعيين قاعدة بيانات الأدوية
# Reset Drugs Database Script

Write-Host "🔄 إعادة تعيين قاعدة بيانات الأدوية" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# التحقق من وجود Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js متوفر: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js غير متوفر. يرجى تثبيت Node.js أولاً" -ForegroundColor Red
    exit 1
}

# التحقق من وجود المجلد
if (-not (Test-Path "scripts")) {
    Write-Host "❌ مجلد scripts غير موجود" -ForegroundColor Red
    exit 1
}

# التحقق من وجود ملف package.json
if (-not (Test-Path "package.json")) {
    Write-Host "❌ ملف package.json غير موجود" -ForegroundColor Red
    exit 1
}

# التحقق من تثبيت dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️ node_modules غير موجود. تثبيت المتطلبات..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ فشل في تثبيت المتطلبات" -ForegroundColor Red
        exit 1
    }
}

# عرض تحذير
Write-Host ""
Write-Host "⚠️  تحذير مهم:" -ForegroundColor Yellow
Write-Host "   • سيتم مسح جميع بيانات الأدوية نهائياً" -ForegroundColor Yellow
Write-Host "   • سيتم الاحتفاظ بالجداول وبنية قاعدة البيانات" -ForegroundColor Yellow
Write-Host "   • قاعدة البيانات المصدر لن تتأثر" -ForegroundColor Yellow
Write-Host ""

# طلب التأكيد
$confirmation = Read-Host "هل تريد المتابعة؟ اكتب 'نعم' للمتابعة"
if ($confirmation -ne "نعم") {
    Write-Host "❌ تم إلغاء العملية" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 بدء عملية إعادة التعيين..." -ForegroundColor Green

# تشغيل السكريبت
try {
    node scripts/reset-drugs-database.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 تمت العملية بنجاح!" -ForegroundColor Green
        Write-Host "✅ قاعدة البيانات جاهزة لإدخال بيانات جديدة" -ForegroundColor Green
    } else {
        Write-Host "❌ فشلت العملية" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ خطأ في تشغيل السكريبت: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📝 ملاحظات:" -ForegroundColor Cyan
Write-Host "   • يمكنك الآن ملء قاعدة البيانات ببيانات جديدة" -ForegroundColor White
Write-Host "   • استخدم scripts أخرى لاستيراد البيانات" -ForegroundColor White
Write-Host "   • تأكد من إنشاء نسخة احتياطية قبل إضافة بيانات جديدة" -ForegroundColor White

Write-Host ""
Write-Host "✅ انتهت العملية" -ForegroundColor Green