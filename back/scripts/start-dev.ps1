# Lumon Backend - Start Development Script (PowerShell)
# Запуск локальной среды разработки

Write-Host "🚀 Запуск Lumon Backend (n8n + Supabase)" -ForegroundColor Green

# Проверка .env файла
if (-not (Test-Path ".env")) {
    Write-Host "❌ Файл .env не найден. Запустите сначала setup-local.ps1" -ForegroundColor Red
    exit 1
}

# Запуск Docker Compose
Write-Host "🐳 Запуск Docker Compose..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при запуске Docker Compose" -ForegroundColor Red
    exit 1
}

Write-Host "⏳ Ожидание запуска сервисов..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n✅ Сервисы запущены!" -ForegroundColor Green
Write-Host "`n🌐 Доступные сервисы:" -ForegroundColor Cyan
Write-Host "   - Supabase Studio: http://localhost:3001" -ForegroundColor White
Write-Host "   - n8n: http://localhost:5678" -ForegroundColor White
Write-Host "`nДля остановки: docker-compose down" -ForegroundColor Gray
Write-Host "Для просмотра логов: docker-compose logs -f" -ForegroundColor Gray

