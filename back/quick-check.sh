#!/bin/bash

# Быстрая проверка всех сервисов
# Выполни: bash quick-check.sh

echo "🔍 Быстрая проверка сервисов..."
echo ""

# Локальные сервисы
echo "📋 Локальные сервисы:"
if curl -s http://localhost:5678 > /dev/null 2>&1; then
    echo "  ✅ n8n (5678) работает"
else
    echo "  ❌ n8n (5678) не отвечает"
fi

if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "  ✅ Supabase Studio (3001) работает"
else
    echo "  ❌ Supabase Studio (3001) не отвечает"
fi

# Домены
echo ""
echo "📋 Внешние домены:"
for domain in n8n.psayha.ru sb.psayha.ru admin.psayha.ru; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$domain 2>/dev/null || echo "000")
    if [ "$CODE" = "200" ] || [ "$CODE" = "301" ] || [ "$CODE" = "302" ]; then
        echo "  ✅ $domain: $CODE"
    else
        echo "  ❌ $domain: $CODE"
    fi
done

# Nginx
echo ""
echo "📋 Nginx:"
if systemctl is-active --quiet nginx 2>/dev/null; then
    echo "  ✅ Nginx запущен"
else
    echo "  ❌ Nginx не запущен"
fi

# Docker
echo ""
echo "📋 Docker контейнеры:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "n8n|supabase"

echo ""
echo "✅ Проверка завершена"

