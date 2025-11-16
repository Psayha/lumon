#!/bin/bash

# Server Diagnostics and Cleanup Script
# Проверяет сервер на дубликаты, лишние файлы и правильность конфигурации

set -e

echo "🔍 ДИАГНОСТИКА СЕРВЕРА LUMON API"
echo "=================================="
echo ""

# 1. Проверка текущей директории
echo "📂 1. Текущая директория:"
pwd
echo ""

# 2. Проверка Git ветки
echo "🌿 2. Git статус:"
git branch -v
echo ""
git status --short
echo ""

# 3. Проверка дублей node_modules
echo "📦 3. Проверка дублей node_modules:"
find /home/user/lumon -type d -name "node_modules" 2>/dev/null || echo "Нет дублей"
echo ""

# 4. Проверка дублей dist
echo "🏗️  4. Проверка дублей dist:"
find /home/user/lumon -type d -name "dist" 2>/dev/null || echo "Нет дублей"
echo ""

# 5. Проверка размера директорий
echo "💾 5. Размер основных директорий:"
du -sh /home/user/lumon/back/api/node_modules 2>/dev/null || echo "node_modules не найден"
du -sh /home/user/lumon/back/api/dist 2>/dev/null || echo "dist не найден"
du -sh /home/user/lumon/back/api/src 2>/dev/null || echo "src не найден"
echo ""

# 6. Проверка запущенных процессов Node.js
echo "⚙️  6. Запущенные Node.js процессы:"
ps aux | grep node | grep -v grep || echo "Нет запущенных процессов"
echo ""

# 7. Проверка systemd сервиса
echo "🔧 7. Статус systemd сервиса:"
systemctl status lumon-api --no-pager -l || echo "Сервис не найден"
echo ""

# 8. Проверка последних логов
echo "📋 8. Последние 10 строк логов:"
echo "--- STDOUT ---"
tail -10 /var/log/lumon-api.log 2>/dev/null || echo "Лог не найден"
echo ""
echo "--- STDERR ---"
tail -10 /var/log/lumon-api-error.log 2>/dev/null || echo "Лог ошибок не найден"
echo ""

# 9. Проверка портов
echo "🌐 9. Проверка портов:"
netstat -tlnp | grep :3000 || echo "Порт 3000 не занят"
echo ""

# 10. Проверка конфигурации TypeScript
echo "📝 10. Проверка tsconfig.json:"
if [ -f tsconfig.json ]; then
    echo "✅ tsconfig.json существует"
else
    echo "❌ tsconfig.json НЕ НАЙДЕН!"
fi
echo ""

# 11. Проверка package.json
echo "📦 11. Проверка package.json:"
if [ -f package.json ]; then
    echo "✅ package.json существует"
    echo "Версия проекта:"
    grep '"version"' package.json || echo "Версия не указана"
else
    echo "❌ package.json НЕ НАЙДЕН!"
fi
echo ""

# 12. Проверка критических файлов
echo "🔑 12. Проверка критических файлов:"
critical_files=(
    "src/main.ts"
    "src/app.module.ts"
    "src/modules/chat/chat.controller.ts"
    "src/modules/analytics/dto/log-event.dto.ts"
    "src/entities/message.entity.ts"
    ".env"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file НЕ НАЙДЕН!"
    fi
done
echo ""

# 13. Проверка содержимого ключевых файлов
echo "📖 13. Проверка содержимого ключевых файлов:"
echo ""

echo "--- chat.controller.ts (chat-list endpoint) ---"
grep -A 3 "chat-list" src/modules/chat/chat.controller.ts 2>/dev/null || echo "Файл не найден"
echo ""

echo "--- log-event.dto.ts ---"
cat src/modules/analytics/dto/log-event.dto.ts 2>/dev/null || echo "Файл не найден"
echo ""

echo "--- message.entity.ts (enum check) ---"
grep -A 4 "MessageRole" src/entities/message.entity.ts 2>/dev/null | head -10 || echo "Файл не найден"
echo ""

# 14. Рекомендации по очистке
echo "🧹 14. РЕКОМЕНДАЦИИ ПО ОЧИСТКЕ:"
echo "=================================="
echo ""
echo "Если найдены дубли или лишние файлы, выполните:"
echo ""
echo "# Очистка node_modules и пересборка:"
echo "rm -rf node_modules dist"
echo "npm ci"
echo "npm run build"
echo ""
echo "# Очистка старых логов (если нужно):"
echo "sudo truncate -s 0 /var/log/lumon-api.log"
echo "sudo truncate -s 0 /var/log/lumon-api-error.log"
echo ""
echo "# Перезапуск сервиса:"
echo "sudo systemctl restart lumon-api"
echo ""

echo "=================================="
echo "✅ ДИАГНОСТИКА ЗАВЕРШЕНА"
echo "=================================="
