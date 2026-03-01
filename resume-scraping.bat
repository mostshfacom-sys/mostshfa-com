@echo off
:loop
echo Starting Scraping Script...
call npx tsx prisma/seed-real-drugs.ts
echo Script crashed or stopped. Restarting in 5 seconds...
timeout /t 5
goto loop
