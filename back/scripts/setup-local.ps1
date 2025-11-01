# Lumon Backend - Local Setup Script (PowerShell)
# Настройка локальной среды разработки для n8n + Supabase

Write-Host "🚀 Настройка Lumon Backend (n8n + Supabase)" -ForegroundColor Green

# Проверка наличия Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker не установлен. Установите Docker Desktop и попробуйте снова." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose не установлен. Установите Docker Desktop и попробуйте снова." -ForegroundColor Red
    exit 1
}

# Создание .env файла если его нет
if (-not (Test-Path ".env")) {
    Write-Host "📝 Создание .env файла..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "✅ Файл .env создан. Отредактируйте его при необходимости." -ForegroundColor Green
} else {
    Write-Host "ℹ️  Файл .env уже существует" -ForegroundColor Cyan
}

# Создание необходимых директорий
Write-Host "📁 Создание директорий..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "n8n\workflows" | Out-Null
New-Item -ItemType Directory -Force -Path "..\base\supabase\migrations" | Out-Null
Write-Host "✅ Директории созданы" -ForegroundColor Green

# Запуск Docker Compose
Write-Host "🐳 Запуск Docker Compose..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при запуске Docker Compose" -ForegroundColor Red
    exit 1
}

Write-Host "⏳ Ожидание запуска сервисов..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Проверка статуса
Write-Host "`n📊 Статус сервисов:" -ForegroundColor Cyan
docker-compose ps

Write-Host "`n✅ Настройка завершена!" -ForegroundColor Green
Write-Host "`n🌐 Доступные сервисы:" -ForegroundColor Cyan
Write-Host "   - Supabase Studio: http://localhost:3001" -ForegroundColor White
Write-Host "   - n8n: http://localhost:5678" -ForegroundColor White
Write-Host "   - PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host "`n📝 Следующие шаги:" -ForegroundColor Yellow
Write-Host "   1. Откройте Supabase Studio: http://localhost:3001" -ForegroundColor White
Write-Host "   2. Откройте n8n: http://localhost:5678" -ForegroundColor White
Write-Host "   3. Начните создавать workflows в n8n" -ForegroundColor White
Write-Host "`nДля остановки: docker-compose down" -ForegroundColor Gray
Write-Host "Для просмотра логов: docker-compose logs -f" -ForegroundColor Gray

