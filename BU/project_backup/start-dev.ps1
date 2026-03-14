# Mostshfa New - Development Server Script
# PowerShell Version

$Host.UI.RawUI.WindowTitle = "Mostshfa New - Dev Server"

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🏥 Mostshfa New - Development Server   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Check node_modules
Write-Host "[1/3] جاري التحقق من node_modules..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules غير موجود، جاري التثبيت..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ فشل تثبيت الحزم" -ForegroundColor Red
        Read-Host "اضغط Enter للخروج"
        exit 1
    }
}

# Generate Prisma Client
Write-Host "[2/3] جاري إنشاء Prisma Client..." -ForegroundColor Yellow
npx prisma generate

# Start dev server
Write-Host "[3/3] جاري تشغيل السيرفر..." -ForegroundColor Green
Write-Host ""
Write-Host "════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  🌐 السيرفر يعمل على: http://localhost:3000" -ForegroundColor White
Write-Host "  📝 اضغط Ctrl+C لإيقاف السيرفر" -ForegroundColor Gray
Write-Host "════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

npm run dev
