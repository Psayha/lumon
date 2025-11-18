# 🔧 Исправление 500 ошибок API

## Проблема

При работе с чатами фронтенд получает **500 Internal Server Error** от API:

```
POST https://n8n.psayha.ru/webhook/chat-get-history → 500
POST https://n8n.psayha.ru/webhook/chat-save-message → 500
```

**Причина:** На production сервере (https://n8n.psayha.ru) все еще работает **старый n8n**, вместо нового **NestJS API**.

---

## ✅ Решение: Развернуть NestJS API на Production

### Шаг 1: Подключиться к серверу

```bash
ssh user@your-server-ip
# или
ssh user@n8n.psayha.ru
```

---

### Шаг 2: Остановить старый n8n (если запущен)

```bash
# Проверить запущен ли n8n
sudo systemctl status n8n

# Остановить n8n
sudo systemctl stop n8n

# Отключить автозапуск n8n
sudo systemctl disable n8n
```

---

### Шаг 3: Клонировать/обновить проект

**Если проект еще не клонирован:**

```bash
cd ~
git clone https://github.com/Psayha/lumon.git
cd lumon
git checkout claude/audit-build-process-019ziFnLhaYzsNk3yrSkrVSn
```

**Если проект уже есть:**

```bash
cd ~/lumon
git fetch origin
git checkout claude/audit-build-process-019ziFnLhaYzsNk3yrSkrVSn
git pull origin claude/audit-build-process-019ziFnLhaYzsNk3yrSkrVSn
```

---

### Шаг 4: Настроить переменные окружения

```bash
cd ~/lumon/back/api

# Создать .env файл
nano .env
```

**Скопируйте и отредактируйте:**

```env
# Server
PORT=3000
NODE_ENV=production

# Database (Supabase)
DB_HOST=db.xxxxxxxxx.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=ваш-пароль-от-supabase
DB_DATABASE=postgres
DB_SSL=true

# OpenAI
OPENAI_API_KEY=sk-proj-ваш-ключ

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABC...

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ваш-безопасный-пароль-минимум-12-символов
```

Сохраните: `Ctrl+X` → `Y` → `Enter`

---

### Шаг 5: Установить зависимости и собрать

```bash
cd ~/lumon/back/api

# Установить зависимости
npm ci --production

# Собрать проект
npm run build

# Проверить что dist создан
ls -la dist/
```

---

### Шаг 6: Создать systemd сервис

**Создать файл сервиса:**

```bash
sudo nano /etc/systemd/system/lumon-api.service
```

**Содержимое файла:**

```ini
[Unit]
Description=Lumon NestJS API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/lumon/back/api
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10

# Logging
StandardOutput=append:/var/log/lumon-api.log
StandardError=append:/var/log/lumon-api-error.log

[Install]
WantedBy=multi-user.target
```

Сохраните: `Ctrl+X` → `Y` → `Enter`

---

### Шаг 7: Запустить NestJS API

```bash
# Перезагрузить systemd
sudo systemctl daemon-reload

# Включить автозапуск
sudo systemctl enable lumon-api

# Запустить сервис
sudo systemctl start lumon-api

# Проверить статус
sudo systemctl status lumon-api
```

**Вы должны увидеть:**

```
● lumon-api.service - Lumon NestJS API Server
   Active: active (running)
```

---

### Шаг 8: Проверить логи

```bash
# Просмотр логов
sudo journalctl -u lumon-api -f

# Или через файлы логов
tail -f /var/log/lumon-api.log
```

**Вы должны увидеть:**

```
╔═══════════════════════════════════════╗
║   🚀 Lumon API Server Started!       ║
╠═══════════════════════════════════════╣
║   Port: 3000                          ║
║   Environment: production             ║
║   Database: postgres                  ║
╚═══════════════════════════════════════╝

Total: 31 endpoints migrated from n8n!
Ready to accept connections!
```

---

### Шаг 9: Обновить Nginx (если нужно)

**Проверить текущую конфигурацию:**

```bash
sudo nano /etc/nginx/sites-available/default
# или
sudo nano /etc/nginx/sites-available/n8n.psayha.ru
```

**Убедитесь что есть proxy на порт 3000:**

```nginx
server {
    listen 443 ssl;
    server_name n8n.psayha.ru;

    # SSL сертификаты
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Перезагрузить Nginx:**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

### Шаг 10: Проверить работу API

```bash
# Тест health endpoint
curl https://n8n.psayha.ru/health

# Должен вернуть:
# {"status":"ok","timestamp":"...","uptime":...}
```

---

## 📦 Деплой собранных фронтендов

### Frontend (основной)

```bash
cd ~/lumon

# Собрать (если еще не собран)
npm run build

# Скопировать на веб-сервер (например Nginx)
sudo cp -r dist/* /var/www/lumon.psayha.ru/html/
```

### Admin Panel

```bash
cd ~/lumon/adminpage

# Собрать
npm run build

# Скопировать на веб-сервер
sudo cp -r ../dist-admin/* /var/www/admin.psayha.ru/html/
```

---

## ✅ Проверка результата

После всех шагов:

1. **API работает:** https://n8n.psayha.ru/health возвращает `{"status":"ok"}`
2. **Чаты работают:** Нет 500 ошибок при создании сообщений
3. **Админка со стилями:** Все иконки и стили загружаются корректно

---

## 🐛 Диагностика проблем

### Проблема: API не запускается

```bash
# Проверить логи
sudo journalctl -u lumon-api -n 50

# Проверить .env файл
cat ~/lumon/back/api/.env

# Проверить подключение к БД
cd ~/lumon/back/api
npm run typeorm -- query "SELECT 1"
```

### Проблема: 500 ошибки продолжаются

```bash
# Проверить что NestJS запущен
sudo systemctl status lumon-api

# Проверить что n8n остановлен
sudo systemctl status n8n

# Проверить nginx конфигурацию
sudo nginx -t

# Проверить порт 3000
sudo netstat -tlnp | grep 3000
# или
sudo lsof -i :3000
```

### Проблема: База данных не подключается

```bash
# Проверить переменные окружения
cat ~/lumon/back/api/.env | grep DB_

# Проверить что Supabase доступен
ping db.xxxxxxxxx.supabase.co

# Проверить логи подключения
tail -f /var/log/lumon-api-error.log
```

---

## 📝 Автоматический деплой (GitHub Actions)

Создайте файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ claude/audit-build-process-019ziFnLhaYzsNk3yrSkrVSn ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ~/lumon
            git pull origin claude/audit-build-process-019ziFnLhaYzsNk3yrSkrVSn
            cd back/api
            npm ci --production
            npm run build
            sudo systemctl restart lumon-api
```

---

## 🎯 Итог

После выполнения всех шагов:

- ✅ **NestJS API работает** на https://n8n.psayha.ru
- ✅ **31 endpoint** мигрированы с n8n
- ✅ **Чаты сохраняются** без ошибок
- ✅ **История чатов загружается**
- ✅ **Админка со стилями**
- ✅ **Автозапуск** при перезагрузке сервера

---

**Версия:** 1.0
**Последнее обновление:** 18 ноября 2025
