# Lumon Backend - Local Setup Script (PowerShell)
# Setup local development environment for n8n + Supabase

Write-Host "Setup Lumon Backend (n8n + Supabase)" -ForegroundColor Green

# Check Docker
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
    Write-Host "Docker is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Write-Host "After installation, restart PowerShell and try again." -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker command failed"
    }
    Write-Host "Found Docker: $dockerVersion" -ForegroundColor Cyan
} catch {
    Write-Host "Docker is installed but not running." -ForegroundColor Red
    Write-Host "Please start Docker Desktop and wait for it to fully start, then try again." -ForegroundColor Yellow
    exit 1
}

# Check Docker Compose (can be standalone or as docker compose)
$dockerComposeCmd = Get-Command docker-compose -ErrorAction SilentlyContinue
if (-not $dockerComposeCmd) {
    # Try 'docker compose' (newer Docker Desktop includes it as subcommand)
    try {
        docker compose version 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Found Docker Compose (docker compose)" -ForegroundColor Cyan
        } else {
            throw "Docker Compose not found"
        }
    } catch {
        Write-Host "Docker Compose is not available." -ForegroundColor Red
        Write-Host "Docker Compose should be included with Docker Desktop." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Found Docker Compose: $(docker-compose --version)" -ForegroundColor Cyan
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host ".env file created. Edit it if needed." -ForegroundColor Green
} else {
    Write-Host ".env file already exists" -ForegroundColor Cyan
}

# Create directories
Write-Host "Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "n8n\workflows" | Out-Null
New-Item -ItemType Directory -Force -Path "..\base\supabase\migrations" | Out-Null
Write-Host "Directories created" -ForegroundColor Green

# Start Docker Compose
Write-Host "Starting Docker Compose..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error starting Docker Compose" -ForegroundColor Red
    exit 1
}

Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check status
Write-Host ""
Write-Host "Service status:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "Setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Available services:" -ForegroundColor Cyan
Write-Host "   - Supabase Studio: http://localhost:3001" -ForegroundColor White
Write-Host "   - n8n: http://localhost:5678" -ForegroundColor White
Write-Host "   - PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "   1. Open Supabase Studio: http://localhost:3001" -ForegroundColor White
Write-Host "   2. Open n8n: http://localhost:5678" -ForegroundColor White
Write-Host "   3. Start creating workflows in n8n" -ForegroundColor White
Write-Host ""
Write-Host "To stop: docker-compose down" -ForegroundColor Gray
Write-Host "To view logs: docker-compose logs -f" -ForegroundColor Gray
