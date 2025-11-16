# 🚀 Production Deployment Guide

## Quick Start (5 минут)

```bash
cd /home/user/lumon/back/api

# 1. Настроить .env для production
nano .env
# Укажите:
# - DB_HOST, DB_PASSWORD (ваш Supabase)
# - OPENAI_API_KEY
# - NODE_ENV=production

# 2. Полный деплой (build + install + start)
sudo ./deploy.sh full-deploy

# 3. Проверить что API работает
curl http://localhost:3000/webhook/auth-init-v2
# Должен вернуть ошибку валидации (это нормально!)
```

API запущен на `http://localhost:3000` ✅

---

## Настройка Nginx

### Шаг 1: Установить Nginx (если не установлен)

```bash
sudo apt update
sudo apt install nginx -y
```

### Шаг 2: Скопировать конфигурацию

```bash
# Копируем готовый конфиг
sudo cp /home/user/lumon/back/api/nginx-lumon-api.conf \
    /etc/nginx/sites-available/lumon-api

# Создаем симлинк
sudo ln -s /etc/nginx/sites-available/lumon-api \
    /etc/nginx/sites-enabled/

# Проверяем конфигурацию
sudo nginx -t

# Перезагружаем nginx
sudo systemctl reload nginx
```

### Шаг 3: Обновить DNS (если нужен n8n-backup)

Если хотите сохранить старый n8n доступным:

```bash
# Добавьте в DNS:
# n8n-backup.psayha.ru A <ваш_IP>
```

### Шаг 4: SSL (опционально, но рекомендуется)

```bash
# Установить certbot
sudo apt install certbot python3-certbot-nginx -y

# Получить SSL сертификат
sudo certbot --nginx -d n8n.psayha.ru

# Для backup поддомена (если настроили DNS)
sudo certbot --nginx -d n8n-backup.psayha.ru
```

---

## Обновление Frontend

Измените `VITE_API_URL` чтобы указывал на новый бэкенд:

```bash
cd /home/user/lumon

# В .env.production или .env
echo "VITE_API_URL=https://n8n.psayha.ru" > .env.production

# Пересобрать фронтенд
npm run build
```

---

## Управление сервисом

```bash
# Запустить
sudo systemctl start lumon-api

# Остановить
sudo systemctl stop lumon-api

# Перезапустить
sudo systemctl restart lumon-api

# Статус
sudo systemctl status lumon-api

# Логи (live)
sudo journalctl -u lumon-api -f

# Логи (последние 100 строк)
sudo journalctl -u lumon-api -n 100
```

---

## Использование deploy.sh

```bash
cd /home/user/lumon/back/api

# Полный деплой
sudo ./deploy.sh full-deploy

# Только build
sudo ./deploy.sh build

# Только restart
sudo ./deploy.sh restart

# Показать статус
sudo ./deploy.sh status

# Показать логи
sudo ./deploy.sh logs

# Тест API
sudo ./deploy.sh test
```

---

## Проверка работоспособности

### 1. Проверить что API работает локально

```bash
curl http://localhost:3000/webhook/auth-init-v2
# Должен вернуть 400 с ошибкой валидации
```

### 2. Проверить через Nginx (после настройки)

```bash
curl http://n8n.psayha.ru/webhook/auth-init-v2
# Должен вернуть 400 с ошибкой валидации
```

### 3. Проверить через фронтенд

- Зайдите на ваш сайт
- Попробуйте залогиниться через Telegram
- Создайте чат
- Отправьте сообщение

---

## Мониторинг

### Логи в реальном времени

```bash
# Логи приложения
sudo journalctl -u lumon-api -f

# Логи nginx
sudo tail -f /var/log/nginx/lumon-api-access.log
sudo tail -f /var/log/nginx/lumon-api-error.log
```

### Проверка здоровья

```bash
# Healthcheck endpoint (если добавите)
curl http://localhost:3000/health

# Статус systemd
systemctl status lumon-api

# Использование памяти/CPU
ps aux | grep "node.*main.js"
```

---

## Откат на n8n (если что-то пошло не так)

### Вариант 1: Временно переключить nginx обратно

```bash
# В /etc/nginx/sites-available/lumon-api
# Измените proxy_pass обратно на 5678:
# proxy_pass http://127.0.0.1:5678;

sudo nginx -t
sudo systemctl reload nginx
```

### Вариант 2: Использовать n8n-backup поддомен

Если настроили `n8n-backup.psayha.ru`, просто обновите `VITE_API_URL`:

```bash
echo "VITE_API_URL=https://n8n-backup.psayha.ru" > .env.production
npm run build
```

---

## Troubleshooting

### API не запускается

```bash
# Проверить логи
sudo journalctl -u lumon-api -n 100 --no-pager

# Проверить что порт 3000 свободен
sudo lsof -i :3000

# Проверить .env файл
cat /home/user/lumon/back/api/.env
```

### Nginx выдает 502 Bad Gateway

```bash
# Проверить что API работает
curl http://localhost:3000/webhook/auth-init-v2

# Проверить nginx error log
sudo tail -100 /var/log/nginx/lumon-api-error.log

# Проверить nginx конфиг
sudo nginx -t
```

### База данных не подключается

```bash
# Проверить credentials в .env
grep DB_ /home/user/lumon/back/api/.env

# Проверить что Supabase доступен
# (или локальный PostgreSQL если используете docker-compose)
```

---

## Production Checklist

- [ ] `.env` настроен с production credentials
- [ ] `NODE_ENV=production` в .env
- [ ] Nginx установлен и настроен
- [ ] SSL сертификат установлен (certbot)
- [ ] Systemd service установлен и включен
- [ ] API запущен и отвечает на localhost:3000
- [ ] Nginx проксирует n8n.psayha.ru → localhost:3000
- [ ] Frontend обновлен с новым VITE_API_URL
- [ ] Протестирован полный flow (login → chat → messages)
- [ ] Настроен мониторинг логов

---

## Performance Tips

### 1. PM2 вместо systemd (опционально)

PM2 предоставляет больше возможностей:

```bash
# Установить PM2
npm install -g pm2

# Запустить через PM2
cd /home/user/lumon/back/api
pm2 start ecosystem.config.js

# Автозапуск при перезагрузке
pm2 startup
pm2 save

# Мониторинг
pm2 monit
pm2 logs
```

### 2. Настроить логrotate

```bash
sudo nano /etc/logrotate.d/lumon-api
```

Добавить:
```
/var/log/lumon-api*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        systemctl reload lumon-api > /dev/null 2>&1 || true
    endscript
}
```

---

## Готово!

После выполнения всех шагов:
- ✅ NestJS API работает на `n8n.psayha.ru`
- ✅ Старый n8n доступен на `n8n-backup.psayha.ru` (опционально)
- ✅ Frontend использует новый бэкенд
- ✅ Всё мониторится и логируется

**Следующие шаги:**
- Протестировать полный flow пользователя
- Мониторить логи первые 24 часа
- Если всё стабильно - можно останавливать старый n8n

Вопросы? Проверьте:
1. `sudo ./deploy.sh status` - статус сервиса
2. `sudo ./deploy.sh logs` - логи в реальном времени
3. `curl http://localhost:3000/webhook/auth-init-v2` - тест API
