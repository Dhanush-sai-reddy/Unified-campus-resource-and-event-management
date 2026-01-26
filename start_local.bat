@echo off
echo 🧹 Cleaning up old processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM go.exe >nul 2>&1
taskkill /F /IM scheduler.exe >nul 2>&1

echo 🚀 Starting Campus System Locally (Fixing Binaries)...

REM 1. Start Database (Docker - Port 5435)
echo 📦 Checking Database container...
docker-compose up -d timescaledb
timeout /t 3

REM 2. Start Node.js API (Port 48291)
echo 🟢 Starting API on Port 48291...
echo    (Generating Windows Prisma Client - This takes a moment...)
start "Campus API" cmd /k "cd api && npm install && npx prisma generate && set PORT=48291 && set DATABASE_URL=postgresql://postgres:postgres@localhost:5435/campus_db?schema=public && npm run dev"

REM 3. Start Go Scheduler (Port 48292)
echo 🔵 Starting Scheduler on Port 48292...
echo    (Downloading Go dependencies...)
start "Campus Scheduler" cmd /k "cd scheduler && go mod tidy && set PORT=48292 && set DATABASE_URL=postgresql://postgres:postgres@localhost:5435/campus_db && go run main.go"

REM 4. Start Frontend (Port 48293)
echo 🟠 Starting Frontend on Port 48293...
start "Campus Web" cmd /k "cd web && npm install && npm run dev -- --port 48293"

echo ✅ All services launching!
echo 👉 Frontend: http://localhost:48293
echo 👉 API: http://localhost:48291
echo 👉 Scheduler: http://localhost:48292
pause
