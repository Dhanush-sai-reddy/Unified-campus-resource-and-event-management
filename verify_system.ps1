$ErrorActionPreference = "Stop"

Write-Host "🔍 Verifying Campus System Endpoints..." -ForegroundColor Cyan

# 1. Check Frontend
try {
    $ws = Invoke-WebRequest -Uri "http://localhost:3005" -UseBasicParsing
    if ($ws.StatusCode -eq 200) {
        Write-Host "✅ Frontend (Port 3005) is UP" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend (Port 3005) is DOWN" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# 2. Check Login (via Nginx Proxy)
Write-Host "`n🔑 Testing Login via Proxy (http://localhost:3005/api/auth/login)..." -ForegroundColor Cyan
$loginUrl = "http://localhost:3005/api/auth/login"
$body = @{
    email = "admin@campus.edu"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $body -ContentType "application/json"
    
    if ($response.token) {
        Write-Host "✅ Login SUCCESS! Token received." -ForegroundColor Green
        $token = $response.token
        
        # 3. Check Protected Data
        Write-Host "`n📊 Testing Protected Data Fetch..." -ForegroundColor Cyan
        $dataUrl = "http://localhost:3005/api/events"
        $headers = @{
            Authorization = "Bearer $token"
        }
        
        $events = Invoke-RestMethod -Uri $dataUrl -Headers $headers -Method Get
        Write-Host "✅ Fetched $($events.Count) events from API." -ForegroundColor Green
        
        foreach ($e in $events) {
            Write-Host "   - Event: $($e.title) ($($e.status))" -ForegroundColor Gray
        }
        
    } else {
        Write-Host "❌ Login failed (No token in response)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Login Request Failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "   Server Response: $($reader.ReadToEnd())" -ForegroundColor Yellow
    }
}
