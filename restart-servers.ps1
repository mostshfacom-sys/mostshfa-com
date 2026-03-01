# Mostshfa New - Restart Dev Server (PowerShell)
$Host.UI.RawUI.WindowTitle = "Mostshfa New - Restart Dev Server"

Set-Location $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mostshfa New - Restart Dev Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Stopping node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Clearing cache..." -ForegroundColor Yellow
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue }
if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue }
if (Test-Path "tsconfig.tsbuildinfo") { Remove-Item -Force "tsconfig.tsbuildinfo" -ErrorAction SilentlyContinue }

Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
  Write-Host "Failed to generate Prisma client." -ForegroundColor Red
  Read-Host "Press Enter to exit"
  exit 1
}

Write-Host "" 
Write-Host "Server starting on http://localhost:3000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Gray
Write-Host ""

npm run dev
