#!/bin/bash

# 🔄 Скрипт для обновления nginx конфигурации фронтенда
# Исправляет проблему 405 Not Allowed для /webhook/* endpoints

echo "🔄 Обновление nginx конфигурации для фронтенда..."

# Проверка что запущено от root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Скрипт должен быть запущен от root (используй sudo)"
  exit 1
fi

# Проверка что файл конфигурации существует
if [ ! -f "nginx-frontend.conf" ]; then
  echo "❌ Файл nginx-frontend.conf не найден"
  echo "Убедись что находишься в директории back/"
  exit 1
fi

# Бэкап старой конфигурации
if [ -f "/etc/nginx/sites-available/lumon-frontend" ]; then
  echo "📦 Создание бэкапа старой конфигурации..."
  cp /etc/nginx/sites-available/lumon-frontend /etc/nginx/sites-available/lumon-frontend.backup.$(date +%Y%m%d_%H%M%S)
fi

# Копирование новой конфигурации
echo "📋 Копирование новой конфигурации..."
cp nginx-frontend.conf /etc/nginx/sites-available/lumon-frontend

# Проверка конфигурации
echo "🔍 Проверка конфигурации nginx..."
if nginx -t; then
  echo "✅ Конфигурация корректна"
  
  # Перезагрузка nginx
  echo "🔄 Перезагрузка nginx..."
  systemctl reload nginx
  
  echo "✅ Nginx успешно обновлен!"
  echo ""
  echo "🧪 Тест endpoints:"
  echo "curl -X POST https://psayha.ru/webhook/create-user -H 'Content-Type: application/json' -d '{\"telegram_id\":123456789}'"
else
  echo "❌ Ошибка в конфигурации nginx!"
  echo "Восстанавливаем из бэкапа..."
  
  # Восстановление из последнего бэкапа
  LATEST_BACKUP=$(ls -t /etc/nginx/sites-available/lumon-frontend.backup.* 2>/dev/null | head -1)
  if [ -n "$LATEST_BACKUP" ]; then
    cp "$LATEST_BACKUP" /etc/nginx/sites-available/lumon-frontend
    echo "✅ Бэкап восстановлен"
  fi
  
  exit 1
fi

