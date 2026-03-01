# Nuclear Fix for Webpack Module Factory Error
# This script completely cleans and reinstalls everything

Write-Host "========================================" -ForegroundColor Red
Write-Host "  NUCLEAR FIX - Complete Clean Install" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Step 1: Stop all Node processes
Write-Host "[1/6] Stopping all Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "  Done!" -ForegroundColor Green

# Step 2: Remove ALL cache directories
Write-Host "[2/6] Removing ALL cache directories..." -ForegroundColor Yellow
$foldersToRemove = @(
    ".next",
    "node_modules\.cache",
    "node_modules\.pnpm\.cache",
    ".turbo"
)

foreach ($folder in $foldersToRemove) {
    if (Test-Path $folder) {
        Remove-Item -Recurse -Force $folder -ErrorAction SilentlyContinue
        Write-Host "  - Removed $folder" -ForegroundColor Gray
    }
}

# Remove TypeScript build info
if (Test-Path "tsconfig.tsbuildinfo") {
    Remove-Item -Force "tsconfig.tsbuildinfo" -ErrorAction SilentlyContinue
    Write-Host "  - Removed tsconfig.tsbuildinfo" -ForegroundColor Gray
}
Write-Host "  Done!" -ForegroundColor Green

# Step 3: Remove node_modules completely
Write-Host "[3/6] Removing node_modules (this may take a while)..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    Write-Host "  - Removed node_modules" -ForegroundColor Gray
}
Write-Host "  Done!" -ForegroundColor Green

# Step 4: Clear pnpm store cache
Write-Host "[4/6] Clearing pnpm store cache..." -ForegroundColor Yellow
pnpm store prune 2>$null
Write-Host "  Done!" -ForegroundColor Green

# Step 5: Reinstall dependencies
Write-Host "[5/6] Reinstalling dependencies..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "pnpm install failed, trying npm..." -ForegroundColor Yellow
    npm install
}
Write-Host "  Done!" -ForegroundColor Green

# Step 6: Generate Prisma client
Write-Host "[6/6] Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "  Done!" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Nuclear fix complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Now run: npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "If error persists, try:" -ForegroundColor Yellow
Write-Host "  1. Open http://localhost:3000/test first" -ForegroundColor Gray
Write-Host "  2. If /test works but / doesn't, the issue is in components" -ForegroundColor Gray
Write-Host ""
