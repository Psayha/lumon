#!/bin/bash

# Скрипт для настройки Nginx для фронтенда
# Выполни на сервере: sudo bash setup-nginx-frontend.sh

FRONTEND_PATH="/var/www/lumon2"

echo "🔧 Настройка Nginx для фронтенда..."
echo "Frontend path: $FRONTEND_PATH"

# Проверка что папка существует
if [ ! -d "$FRONTEND_PATH" ]; then
    echo "❌ Папка $FRONTEND_PATH не найдена!"
    exit 1
fi

# Создание конфига Nginx
sudo tee /etc/nginx/sites-available/lumon-frontend > /dev/null << EOF
server {
    listen 80;
    listen [::]:80;
    server_name psayha.ru www.psayha.ru;

    root $FRONTEND_PATH;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Активируем конфиг
sudo ln -sf /etc/nginx/sites-available/lumon-frontend /etc/nginx/sites-enabled/lumon-frontend

# Проверяем конфигурацию
echo "✅ Проверка конфигурации Nginx..."
if sudo nginx -t; then
    echo "✅ Конфигурация корректна, перезагружаем Nginx..."
    sudo systemctl reload nginx
    echo "✅ Готово! Фронтенд должен быть доступен на http://psayha.ru"
else
    echo "❌ Ошибка в конфигурации Nginx!"
    exit 1
fi

