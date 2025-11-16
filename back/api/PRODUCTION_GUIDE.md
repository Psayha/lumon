# 🚀 Production Deployment - Пошаговая Инструкция

## Быстрый старт (автоматический)

```bash
cd /home/user/lumon/back/api
sudo ./DEPLOY_PRODUCTION.sh
```

Скрипт автоматически выполнит все шаги и проведет вас через процесс.

---

## Ручной деплой (если нужен больший контроль)

### STEP 1: Подготовка информации

Соберите следующую информацию:

**Supabase Database:**
- `DB_HOST` - найти в Supabase Dashboard → Settings → Database → Host
- `DB_PASSWORD` - пароль от вашей Supabase БД

**OpenAI:**
- `OPENAI_API_KEY` - получить на https://platform.openai.com/api-keys

**Telegram:**
- `TELEGRAM_BOT_TOKEN` - получить у @BotFather

**Admin (на ваш выбор):**
- `ADMIN_USERNAME` - например: admin
- `ADMIN_PASSWORD` - минимум 12 символов

---

### STEP 2: Настройка .env

```bash
cd /home/user/lumon/back/api

# Копируем шаблон
cp .env.production.example .env

# Редактируем
nano .env
```

Заполните все поля:
```env
PORT=3000
NODE_ENV=production

# Database (Supabase)
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=ваш-пароль-от-supabase
DB_DATABASE=postgres
DB_SSL=true

# OpenAI
OPENAI_API_KEY=sk-proj-ваш-ключ

# Session
SESSION_EXPIRY_DAYS=7

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHI...

# Admin (на ваш выбор)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ваш-безопасный-пароль
```

Сохраните: `Ctrl+X`, затем `Y`, затем `Enter`

---

### STEP 3: Install & Build

```bash
cd /home/user/lumon/back/api

# Установить зависимости (1-2 минуты)
npm ci --production

# Собрать приложение
npm run build

# Проверить что dist/ создан
ls -la dist/
```

Ожидаемый результат: папка `dist/` с скомпилированным кодом

---

### STEP 4: Установка Systemd Service

```bash
cd /home/user/lumon/back/api

# Копируем service файл
sudo cp lumon-api.service /etc/systemd/system/

# Перезагружаем systemd
sudo systemctl daemon-reload

# Включаем автозапуск
sudo systemctl enable lumon-api

# Запускаем сервис
sudo systemctl start lumon-api

# Проверяем статус
sudo systemctl status lumon-api
```

**Ожидаемый вывод:**
```
● lumon-api.service - Lumon NestJS API Server
   Loaded: loaded
   Active: active (running)
```

Если статус не `active (running)`, проверьте логи:
```bash
sudo journalctl -u lumon-api -n 50
```

---

### STEP 5: Тест API Локально

```bash
# Health check
curl http://localhost:3000/health

# Должен вернуть:
# {"status":"ok","service":"lumon-api","timestamp":"...","uptime":...}

# Тест auth endpoint
curl -X POST http://localhost:3000/webhook/auth-init-v2 \
  -H "Content-Type: application/json" \
  -d '{"initData":"test"}'

# Должен вернуть ошибку валидации (это нормально - endpoint работает!)
```

---

### STEP 6: Установка Nginx

```bash
# Установить nginx (если еще не установлен)
sudo apt update
sudo apt install -y nginx

# Копируем конфиг
cd /home/user/lumon/back/api
sudo cp nginx-lumon-api.conf /etc/nginx/sites-available/lumon-api

# Создаем symlink
sudo ln -s /etc/nginx/sites-available/lumon-api /etc/nginx/sites-enabled/

# Проверяем конфигурацию
sudo nginx -t

# Должно быть:
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Перезагружаем nginx
sudo systemctl reload nginx
```

---

### STEP 7: Настройка SSL (certbot)

```bash
# Установить certbot
sudo apt install -y certbot python3-certbot-nginx

# Получить SSL сертификат
sudo certbot --nginx -d n8n.psayha.ru

# Следуйте инструкциям certbot
# Email: ваш email
# Terms: agree
# Redirect HTTP to HTTPS: yes (рекомендуется)
```

**Важно:** DNS для `n8n.psayha.ru` должен быть настроен ПЕРЕД запуском certbot!

---

### STEP 8: Проверка через Nginx

```bash
# Health check через nginx
curl https://n8n.psayha.ru/health

# Должен вернуть:
# {"status":"ok","service":"lumon-api",...}

# Если не работает, проверьте:
# 1. DNS: dig n8n.psayha.ru
# 2. Nginx: sudo nginx -t
# 3. Firewall: sudo ufw status
# 4. Логи nginx: sudo tail -100 /var/log/nginx/error.log
```

---

### STEP 9: Обновление Frontend

```bash
cd /home/user/lumon

# Обновить API URL для production
echo "VITE_API_URL=https://n8n.psayha.ru" > .env.production

# Пересобрать frontend
npm run build

# Если используете serve или nginx для frontend - перезапустите
```

---

### STEP 10: Финальное тестирование

#### 1. Браузер - Health Check
Откройте: `https://n8n.psayha.ru/health`

Должны увидеть JSON:
```json
{
  "status": "ok",
  "service": "lumon-api",
  "timestamp": "...",
  "uptime": 123.45
}
```

#### 2. Браузер - Frontend
1. Откройте ваш сайт
2. Залогиньтесь через Telegram
3. Создайте новый чат
4. Отправьте сообщение

**Если всё работает - миграция успешна!** ✅

#### 3. Мониторинг логов

Откройте терминал и следите за логами:
```bash
sudo journalctl -u lumon-api -f
```

Оставьте на 10-15 минут и проверьте что нет ошибок.

---

## 📊 Проверка Статуса

### Статус сервиса
```bash
sudo systemctl status lumon-api
```

### Логи (последние 100 строк)
```bash
sudo journalctl -u lumon-api -n 100
```

### Логи (live)
```bash
sudo journalctl -u lumon-api -f
```

### Память и CPU
```bash
ps aux | grep "node.*main.js"
```

### Проверка портов
```bash
sudo netstat -tlnp | grep :3000
# или
sudo ss -tlnp | grep :3000
```

---

## 🔄 Управление Сервисом

### Перезапуск
```bash
sudo systemctl restart lumon-api
```

### Остановка
```bash
sudo systemctl stop lumon-api
```

### Запуск
```bash
sudo systemctl start lumon-api
```

### Статус
```bash
sudo systemctl status lumon-api
```

### Отключить автозапуск
```bash
sudo systemctl disable lumon-api
```

### Включить автозапуск
```bash
sudo systemctl enable lumon-api
```

---

## 🚨 Troubleshooting

### Проблема: Сервис не запускается

**Решение:**
```bash
# Проверить логи
sudo journalctl -u lumon-api -n 50

# Проверить .env файл
cat /home/user/lumon/back/api/.env

# Проверить что порт 3000 свободен
sudo lsof -i :3000

# Попробовать запустить вручную
cd /home/user/lumon/back/api
NODE_ENV=production PORT=3000 node dist/main.js
```

### Проблема: Database connection failed

**Решение:**
```bash
# Проверить credentials
grep DB_ /home/user/lumon/back/api/.env

# Проверить что можете подключиться к Supabase
psql "postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require"

# Убедитесь что DB_SSL=true для Supabase!
```

### Проблема: 502 Bad Gateway от Nginx

**Решение:**
```bash
# Проверить что API работает
curl http://localhost:3000/health

# Проверить nginx error log
sudo tail -100 /var/log/nginx/lumon-api-error.log

# Проверить nginx конфиг
sudo nginx -t

# Перезапустить nginx
sudo systemctl restart nginx
```

### Проблема: SSL не работает

**Решение:**
```bash
# Проверить что certbot создал сертификат
sudo ls -la /etc/letsencrypt/live/n8n.psayha.ru/

# Проверить nginx SSL конфиг
sudo cat /etc/nginx/sites-available/lumon-api | grep ssl

# Перезапустить certbot
sudo certbot --nginx -d n8n.psayha.ru --force-renewal
```

---

## 🔙 Откат на n8n (если нужно)

### Вариант 1: Временно переключить nginx обратно

```bash
# Открыть nginx конфиг
sudo nano /etc/nginx/sites-available/lumon-api

# Изменить строку:
# FROM: proxy_pass http://127.0.0.1:3000;
# TO:   proxy_pass http://127.0.0.1:5678;

# Сохранить и перезагрузить
sudo nginx -t
sudo systemctl reload nginx
```

### Вариант 2: Использовать n8n-backup поддомен

```bash
# Обновить frontend
cd /home/user/lumon
echo "VITE_API_URL=https://n8n-backup.psayha.ru" > .env.production
npm run build

# n8n-backup должен быть настроен в DNS на тот же сервер
```

---

## 📈 Мониторинг Production

### Setup logrotate

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

### Автоматический мониторинг (cron)

```bash
# Открыть crontab
crontab -e

# Добавить строку для проверки каждые 5 минут
*/5 * * * * curl -s https://n8n.psayha.ru/health > /dev/null || echo "Lumon API DOWN" | mail -s "Alert: Lumon API" your-email@example.com
```

---

## ✅ Post-Deployment Checklist

После успешного деплоя проверьте:

- [ ] API отвечает на `https://n8n.psayha.ru/health`
- [ ] Frontend может залогиниться через Telegram
- [ ] Можно создать чат
- [ ] Можно отправить сообщение
- [ ] Admin panel работает (если используется)
- [ ] Логи не показывают ошибок (30 минут мониторинга)
- [ ] Systemd service включен: `systemctl is-enabled lumon-api`
- [ ] Nginx конфиг валиден: `nginx -t`
- [ ] SSL сертификат валиден: `curl -I https://n8n.psayha.ru`
- [ ] Старый n8n доступен как backup (опционально)

---

## 📞 Поддержка

Если возникли проблемы:

1. **Проверьте логи:**
   ```bash
   sudo journalctl -u lumon-api -f
   ```

2. **Проверьте health:**
   ```bash
   curl http://localhost:3000/health
   curl https://n8n.psayha.ru/health
   ```

3. **Проверьте конфиг:**
   ```bash
   cat .env
   sudo nginx -t
   ```

4. **Перезапустите сервисы:**
   ```bash
   sudo systemctl restart lumon-api
   sudo systemctl reload nginx
   ```

---

**Документация:**
- `API_ENDPOINTS.md` - список всех endpoints
- `DEPLOYMENT.md` - подробная документация
- `README.md` - основная информация

**Готово к production!** 🚀
