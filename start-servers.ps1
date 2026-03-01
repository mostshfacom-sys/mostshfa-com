# Mostshfa New - Start Dev Server (PowerShell)
$Host.UI.RawUI.WindowTitle = "Mostshfa New - Dev Server"

Set-Location $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mostshfa New - Start Dev Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js is not installed or not in PATH." -ForegroundColor Red
  Read-Host "Press Enter to exit"
  exit 1
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing dependencies..." -ForegroundColor Yellow
  npm install
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
  }
}

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
