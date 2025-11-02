#!/bin/bash

# Скрипт для проверки DNS и получения SSL сертификатов
# Использование: ./check-dns-and-ssl.sh

echo "🔍 Проверка DNS записей..."
echo ""

# Проверка n8n.psayha.ru
echo "📡 Проверка n8n.psayha.ru..."
N8N_IP=$(dig +short n8n.psayha.ru)
if [ -n "$N8N_IP" ]; then
    echo "✅ n8n.psayha.ru → $N8N_IP"
    if [ "$N8N_IP" = "91.229.10.47" ]; then
        echo "   ✅ IP совпадает с сервером"
        N8N_READY=true
    else
        echo "   ⚠️  IP не совпадает! Ожидается: 91.229.10.47"
        N8N_READY=false
    fi
else
    echo "❌ DNS запись не найдена"
    N8N_READY=false
fi

echo ""

# Проверка sb.psayha.ru
echo "📡 Проверка sb.psayha.ru..."
SB_IP=$(dig +short sb.psayha.ru)
if [ -n "$SB_IP" ]; then
    echo "✅ sb.psayha.ru → $SB_IP"
    if [ "$SB_IP" = "91.229.10.47" ]; then
        echo "   ✅ IP совпадает с сервером"
        SB_READY=true
    else
        echo "   ⚠️  IP не совпадает! Ожидается: 91.229.10.47"
        SB_READY=false
    fi
else
    echo "❌ DNS запись не найдена"
    SB_READY=false
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$N8N_READY" = true ] && [ "$SB_READY" = true ]; then
    echo "✅ Все DNS записи настроены!"
    echo ""
    echo "🔒 Получение SSL сертификатов..."
    echo ""
    
    # Получение SSL для n8n
    echo "📜 Получение сертификата для n8n.psayha.ru..."
    sudo certbot --nginx -d n8n.psayha.ru --non-interactive --agree-tos --email admin@psayha.ru 2>&1 | grep -E "(Successfully|Error|Certificate)"
    
    echo ""
    
    # Получение SSL для sb
    echo "📜 Получение сертификата для sb.psayha.ru..."
    sudo certbot --nginx -d sb.psayha.ru --non-interactive --agree-tos --email admin@psayha.ru 2>&1 | grep -E "(Successfully|Error|Certificate)"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✅ Проверка завершена!"
    echo ""
    echo "🌐 Проверь доступность:"
    echo "   - https://n8n.psayha.ru"
    echo "   - https://sb.psayha.ru"
    
else
    echo "⏳ DNS записи еще не готовы. Подожди еще немного и запусти скрипт снова:"
    echo "   ./check-dns-and-ssl.sh"
fi


