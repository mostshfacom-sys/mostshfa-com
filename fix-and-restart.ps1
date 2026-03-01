# Quick Fix and Restart Script
Write-Host "Fixing webpack module factory error..." -ForegroundColor Cyan

# Stop Node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Clear caches
Write-Host "Clearing caches..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Remove-Item -Force tsconfig.tsbuildinfo -ErrorAction SilentlyContinue

# Start dev server
Write-Host "Starting dev server..." -ForegroundColor Green
Write-Host ""
Write-Host "Try these URLs:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000/test  (simple test page)" -ForegroundColor Gray
Write-Host "  http://localhost:3000       (home page)" -ForegroundColor Gray
Write-Host ""

npm run dev
