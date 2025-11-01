# Lumon Backend - Start Development Script (PowerShell)
# Start local development environment

Write-Host "Starting Lumon Backend (n8n + Supabase)" -ForegroundColor Green

# Check .env file
if (-not (Test-Path ".env")) {
    Write-Host ".env file not found. Run setup-local.ps1 first" -ForegroundColor Red
    exit 1
}

# Start Docker Compose
Write-Host "Starting Docker Compose..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error starting Docker Compose" -ForegroundColor Red
    exit 1
}

Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Available services:" -ForegroundColor Cyan
Write-Host "   - Supabase Studio: http://localhost:3001" -ForegroundColor White
Write-Host "   - n8n: http://localhost:5678" -ForegroundColor White
Write-Host ""
Write-Host "To stop: docker-compose down" -ForegroundColor Gray
Write-Host "To view logs: docker-compose logs -f" -ForegroundColor Gray
