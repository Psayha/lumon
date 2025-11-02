#!/bin/bash

# Скрипт для проверки доступности n8n на сервере
# Использование: ./check-n8n-access.sh

echo "🔍 Проверка доступности n8n..."

# Проверка локального доступа
echo ""
echo "1️⃣ Локальный доступ (localhost:5678):"
curl -I http://localhost:5678/healthz 2>&1 | head -5

# Проверка через IP
echo ""
echo "2️⃣ Доступ через IP (91.229.10.47:5678):"
curl -I http://91.229.10.47:5678/healthz 2>&1 | head -5

# Проверка через домен HTTP
echo ""
echo "3️⃣ Доступ через домен HTTP (http://n8n.psayha.ru):"
curl -I http://n8n.psayha.ru/healthz 2>&1 | head -5

# Проверка через домен HTTPS
echo ""
echo "4️⃣ Доступ через домен HTTPS (https://n8n.psayha.ru):"
curl -I https://n8n.psayha.ru/healthz 2>&1 | head -5

# Проверка nginx конфига
echo ""
echo "5️⃣ Проверка nginx конфига для n8n:"
if [ -f /etc/nginx/sites-enabled/lumon-n8n ] || [ -f /etc/nginx/sites-available/lumon-n8n ]; then
  echo "✅ Конфиг nginx найден"
  sudo nginx -t 2>&1 | tail -3
else
  echo "❌ Конфиг nginx НЕ найден"
fi

# Проверка Docker контейнера
echo ""
echo "6️⃣ Статус Docker контейнера n8n:"
docker ps | grep n8n || echo "❌ Контейнер n8n не запущен"

echo ""
echo "✅ Проверка завершена"

