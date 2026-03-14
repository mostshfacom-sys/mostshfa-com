# Restart Mostshfa Development Server
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Restarting Mostshfa Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop running processes
Write-Host "[1/5] Stopping any running processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Clear ALL cache (aggressive cleaning)
Write-Host "[2/5] Clearing ALL build cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "  - Removed .next folder" -ForegroundColor Gray
}
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
    Write-Host "  - Removed node_modules\.cache" -ForegroundColor Gray
}
if (Test-Path "tsconfig.tsbuildinfo") {
    Remove-Item -Force "tsconfig.tsbuildinfo" -ErrorAction SilentlyContinue
    Write-Host "  - Removed tsconfig.tsbuildinfo" -ForegroundColor Gray
}
# Clear pnpm cache if using pnpm
if (Test-Path "node_modules\.pnpm\.cache") {
    Remove-Item -Recurse -Force "node_modules\.pnpm\.cache" -ErrorAction SilentlyContinue
    Write-Host "  - Removed pnpm cache" -ForegroundColor Gray
}
Write-Host "Cache cleared successfully!" -ForegroundColor Green

# Step 3: Generate Prisma client
Write-Host "[3/5] Generating Prisma client..." -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error generating Prisma client!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 4: Set environment variable to disable webpack cache
Write-Host "[4/5] Setting environment variables..." -ForegroundColor Yellow
$env:NEXT_WEBPACK_CACHE = "false"
Write-Host "  - NEXT_WEBPACK_CACHE=false" -ForegroundColor Gray

# Step 5: Start dev server
Write-Host "[5/5] Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Server starting on http://localhost:3000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

npm run dev
