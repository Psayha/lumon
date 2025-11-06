# 🔧 Nginx Maintenance Guide

## ⚠️ КРИТИЧЕСКИ ВАЖНО

### Правильные конфиги (НЕ УДАЛЯТЬ!)

В `/etc/nginx/sites-enabled/` должны быть ТОЛЬКО эти симлинки:

```bash
lrwxrwxrwx 1 root root 41 lumon-frontend -> /etc/nginx/sites-available/lumon-frontend
lrwxrwxrwx 1 root root 40 n8n.psayha.ru -> /etc/nginx/sites-available/n8n.psayha.ru
lrwxrwxrwx 1 root root 39 sb.psayha.ru -> /etc/nginx/sites-available/sb.psayha.ru
lrwxrwxrwx 1 root root 38 admin-panel -> /etc/nginx/sites-available/admin-panel
```

### ❌ НЕПРАВИЛЬНЫЕ конфиги (УДАЛЯТЬ!)

Если видишь эти файлы в `sites-enabled/`, удаляй их:
- `n8n-simple` (статическая страница вместо проксирования)
- `sb-simple` (статическая страница вместо проксирования)
- Любые дубли с цифрами (`n8n-0001`, `n8n-0002`, etc.)

## 🚨 Быстрая диагностика проблем

### Если домены не работают

```bash
# 1. Проверка активных конфигов
ls -la /etc/nginx/sites-enabled/

# 2. Проверка корректности конфигов
sudo nginx -t

# 3. Проверка локальных сервисов
curl -I http://127.0.0.1:5678  # n8n должен отвечать
curl -I http://127.0.0.1:3001  # Supabase Studio должен отвечать

# 4. Проверка последних ошибок
tail -30 /var/log/nginx/error.log

# 5. Проверка SSL сертификатов
sudo ls -la /etc/letsencrypt/live/
```

## 🔄 Стандартная процедура восстановления

### 1. Удалить неправильные симлинки

```bash
cd /etc/nginx/sites-enabled/

# Удаляем все существующие симлинки (безопасно)
sudo rm n8n-simple sb-simple n8n.psayha.ru-* sb.psayha.ru-* 2>/dev/null

# Удаляем дубли с цифрами
sudo rm *-0001 *-0002 *-0003 2>/dev/null
```

### 2. Создать правильные симлинки

```bash
# Активируем правильные конфиги
sudo ln -sf /etc/nginx/sites-available/lumon-frontend /etc/nginx/sites-enabled/lumon-frontend
sudo ln -sf /etc/nginx/sites-available/n8n.psayha.ru /etc/nginx/sites-enabled/n8n.psayha.ru
sudo ln -sf /etc/nginx/sites-available/sb.psayha.ru /etc/nginx/sites-enabled/sb.psayha.ru
sudo ln -sf /etc/nginx/sites-available/admin-panel /etc/nginx/sites-enabled/admin-panel
```

### 3. Проверить и применить

```bash
# Проверка конфигурации
sudo nginx -t

# Перезагрузка nginx
sudo systemctl reload nginx

# Проверка доменов
curl -I https://psayha.ru
curl -I https://n8n.psayha.ru
curl -I https://sb.psayha.ru
curl -I https://admin.psayha.ru
```

## 🔒 Проблемы с SSL

### Если домен выдает SSL ошибку

```bash
# Проверка существующих сертификатов
sudo ls -la /etc/letsencrypt/live/

# Получение/обновление SSL для конкретного домена
sudo certbot --nginx -d DOMAIN.psayha.ru --non-interactive --agree-tos --redirect --email admin@psayha.ru

# Примеры:
sudo certbot --nginx -d n8n.psayha.ru --non-interactive --agree-tos --redirect --email admin@psayha.ru
sudo certbot --nginx -d sb.psayha.ru --non-interactive --agree-tos --redirect --email admin@psayha.ru
sudo certbot --nginx -d admin.psayha.ru --non-interactive --agree-tos --redirect --email admin@psayha.ru
sudo certbot --nginx -d psayha.ru -d www.psayha.ru --non-interactive --agree-tos --redirect --email admin@psayha.ru
```

### Проверка срока действия сертификатов

```bash
for domain in n8n.psayha.ru sb.psayha.ru admin.psayha.ru psayha.ru; do
    if [ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]; then
        EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$domain/fullchain.pem | cut -d= -f2)
        DAYS_LEFT=$(( ($(date -d "$EXPIRY" +%s) - $(date +%s)) / 86400 ))
        echo "$domain: expires in $DAYS_LEFT days ($EXPIRY)"
    else
        echo "$domain: NO CERTIFICATE"
    fi
done
```

## 📋 Правильная структура конфигов

### /etc/nginx/sites-available/

Должны существовать эти файлы:

```
lumon-frontend      # Основной фронтенд (psayha.ru)
n8n.psayha.ru       # n8n с проксированием на 127.0.0.1:5678
sb.psayha.ru        # Supabase Studio с проксированием на 127.0.0.1:3001
admin-panel         # Админ-панель (статика /var/www/lumon2/dist-admin)
```

### Пример правильного конфига n8n.psayha.ru

```nginx
server {
    server_name n8n.psayha.ru;
    
    location / {
        proxy_pass http://127.0.0.1:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/n8n.psayha.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n.psayha.ru/privkey.pem;
}

server {
    listen 80;
    server_name n8n.psayha.ru;
    return 301 https://$server_name$request_uri;
}
```

## 🛠️ Полезные команды

### Проверка статуса всех сервисов

```bash
echo "=== Docker containers ==="
docker ps

echo ""
echo "=== Nginx status ==="
systemctl status nginx --no-pager | head -10

echo ""
echo "=== Active nginx configs ==="
ls -la /etc/nginx/sites-enabled/

echo ""
echo "=== SSL certificates ==="
sudo ls -la /etc/letsencrypt/live/
```

### Перезапуск всех сервисов

```bash
# Перезапуск Docker контейнеров
cd /var/www/back
docker-compose restart

# Перезапуск nginx
sudo systemctl restart nginx

# Проверка
curl -I https://n8n.psayha.ru
curl -I https://sb.psayha.ru
curl -I https://admin.psayha.ru
curl -I https://psayha.ru
```

## 🎯 Чеклист после любых изменений

- [ ] Проверить `nginx -t` (конфигурация валидна)
- [ ] Проверить `/etc/nginx/sites-enabled/` (только правильные симлинки)
- [ ] Проверить локальные сервисы (5678, 3001)
- [ ] Проверить все домены через curl
- [ ] Проверить SSL сертификаты
- [ ] Проверить логи `/var/log/nginx/error.log`

## 🚨 Экстренное восстановление

Если ВСЁ сломалось, выполни:

```bash
# 1. Очистка
sudo rm /etc/nginx/sites-enabled/*

# 2. Восстановление правильных симлинков
sudo ln -sf /etc/nginx/sites-available/lumon-frontend /etc/nginx/sites-enabled/lumon-frontend
sudo ln -sf /etc/nginx/sites-available/n8n.psayha.ru /etc/nginx/sites-enabled/n8n.psayha.ru
sudo ln -sf /etc/nginx/sites-available/sb.psayha.ru /etc/nginx/sites-enabled/sb.psayha.ru
sudo ln -sf /etc/nginx/sites-available/admin-panel /etc/nginx/sites-enabled/admin-panel

# 3. Получение SSL для всех доменов
sudo certbot --nginx -d psayha.ru -d www.psayha.ru --non-interactive --agree-tos --redirect --email admin@psayha.ru
sudo certbot --nginx -d n8n.psayha.ru --non-interactive --agree-tos --redirect --email admin@psayha.ru
sudo certbot --nginx -d sb.psayha.ru --non-interactive --agree-tos --redirect --email admin@psayha.ru
sudo certbot --nginx -d admin.psayha.ru --non-interactive --agree-tos --redirect --email admin@psayha.ru

# 4. Перезапуск
sudo nginx -t && sudo systemctl restart nginx

# 5. Проверка
bash /var/www/back/quick-check.sh
```

## 📝 Логирование изменений

При любых изменениях nginx создавай запись:

```bash
echo "$(date): Changed nginx config - REASON" >> /var/log/nginx-changes.log
```

Пример:
```bash
echo "$(date): Restored correct proxy configs for n8n and sb" >> /var/log/nginx-changes.log
```

---

**ВАЖНО**: Если используешь скрипты типа `emergency-fix-nginx.sh` или `fix-all-nginx.sh`, всегда проверяй результат перед закрытием SSH сессии!

