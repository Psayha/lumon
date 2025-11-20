# 🚀 Server Deployment Guide - Lumon Platform

> **Дата обновления:** 20 ноября 2025
> **Версия:** 2.1.0 (Docker Compose + NestJS Backend)
> **Статус:** ✅ Production Ready

---

## 📋 Содержание

1. [Требования к серверу](#требования-к-серверу)
2. [Подготовка сервера](#подготовка-сервера)
3. [Клонирование проекта](#клонирование-проекта)
4. [Настройка Docker Compose](#настройка-docker-compose)
5. [Запуск Docker контейнеров](#запуск-docker-контейнеров)
6. [Настройка Backend API](#настройка-backend-api)
7. [Настройка Nginx](#настройка-nginx)
8. [SSL сертификаты](#ssl-сертификаты)
9. [Deploy Frontend](#deploy-frontend)
10. [Проверка работоспособности](#проверка-работоспособности)
11. [Мониторинг и обслуживание](#мониторинг-и-обслуживание)

---

## 🖥️ Требования к серверу

### Минимальные требования:
- **OS**: Ubuntu 20.04+ / Debian 11+
- **RAM**: 4 GB (рекомендуется 8 GB)
- **CPU**: 2 cores (рекомендуется 4 cores)
- **Disk**: 40 GB SSD
- **Network**: Публичный IP адрес

### Необходимое ПО:
- Docker 24.0+
- Docker Compose 2.0+
- Node.js 20+ (для backend API вне Docker)
- Nginx 1.18+
- Git

---

## 🔧 Подготовка сервера

### 1. Обновление системы

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Установка Docker

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

# Перелогиниться для применения изменений
exit
# Войти снова по SSH
```

### 3. Установка Docker Compose

```bash
# Docker Compose обычно идет вместе с Docker
docker compose version
# Если нет, установить отдельно:
# sudo apt install docker-compose-plugin
```

### 4. Установка Node.js 20

```bash
# Установка nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Установка Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Проверка
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 5. Установка Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 6. Установка certbot (для SSL)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

## 📥 Клонирование проекта

```bash
# Переход в домашнюю директорию
cd ~

# Клонирование репозитория
git clone https://github.com/Psayha/lumon.git
cd lumon

# Переход на main ветку (production)
git checkout main
git pull origin main
```

---

## 🐳 Настройка Docker Compose

### 1. Создание .env файла для Docker

```bash
cd ~/lumon/back

# Копирование примера
cp .env.example .env

# Редактирование .env
nano .env
```

### 2. Заполнение обязательных переменных

**ВАЖНО:** Все эти переменные ОБЯЗАТЕЛЬНЫ для запуска Docker контейнеров!

```env
# ========================================
# MAIN APPLICATION DATABASE (PostgreSQL)
# ========================================
POSTGRES_PASSWORD=your_secure_postgres_password_min_32_chars
POSTGRES_DB=lumon
POSTGRES_USER=postgres

# ========================================
# N8N WORKFLOW AUTOMATION
# ========================================
N8N_USER=admin
N8N_PASSWORD=your_secure_n8n_password_min_32_chars

# N8N Database (отдельная БД для изоляции)
N8N_DB_PASSWORD=different_password_for_n8n_database
N8N_DB_DATABASE=n8n
N8N_DB_USER=n8n

# N8N Host Configuration
N8N_HOST=n8n.your-domain.com
N8N_PROTOCOL=https
N8N_SECURE_COOKIE=true

# N8N Security
N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)

# N8N CORS and Webhooks
N8N_CORS_ORIGIN=https://your-domain.com
WEBHOOK_URL=https://n8n.your-domain.com/
N8N_EDITOR_BASE_URL=https://n8n.your-domain.com
```

### 3. Генерация безопасных паролей

```bash
# Генерация POSTGRES_PASSWORD
openssl rand -base64 32

# Генерация N8N_PASSWORD
openssl rand -base64 32

# Генерация N8N_DB_PASSWORD
openssl rand -base64 32

# Генерация N8N_ENCRYPTION_KEY
openssl rand -hex 32
```

**Скопируйте эти значения в .env файл!**

---

## 🚀 Запуск Docker контейнеров

### 1. Запуск контейнеров

```bash
cd ~/lumon/back

# Запуск в фоновом режиме
docker compose up -d

# Проверка статуса
docker compose ps
```

**Ожидаемый вывод:**
```
NAME                    IMAGE                      STATUS
lumon-supabase-db       postgres:15-alpine         Up (healthy)
lumon-supabase-studio   supabase/studio:latest     Up
lumon-n8n-db            postgres:15-alpine         Up (healthy)
lumon-n8n               n8nio/n8n:latest           Up
```

### 2. Проверка логов

```bash
# Логи всех контейнеров
docker compose logs

# Логи конкретного контейнера
docker compose logs supabase-db
docker compose logs n8n

# Следить за логами в реальном времени
docker compose logs -f
```

### 3. Проверка доступности PostgreSQL

```bash
# Подключение к PostgreSQL
docker exec -it lumon-supabase-db psql -U postgres -d lumon

# Внутри psql:
\dt  # Список таблиц
\q   # Выход
```

---

## 🔧 Настройка Backend API

### 1. Установка зависимостей

```bash
cd ~/lumon/back/api

# Установка production зависимостей
npm ci --production

# Или если нужны dev зависимости для сборки:
npm ci
```

### 2. Создание .env для API

```bash
cd ~/lumon/back/api

# Копирование примера (если еще нет)
cp .env.example .env

# Редактирование
nano .env
```

### 3. Заполнение переменных API

```env
PORT=3000
NODE_ENV=production

# Database (подключение к локальному Docker PostgreSQL)
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=<тот же что в Docker POSTGRES_PASSWORD>
DB_DATABASE=lumon
DB_SSL=false

# OpenAI
OPENAI_API_KEY=sk-proj-your-openai-key

# Telegram Bot
TELEGRAM_BOT_TOKEN=123456789:ABC-your-telegram-bot-token

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password-min-16-chars

# Session
SESSION_EXPIRY_DAYS=7

# CORS Origins (разделить запятыми)
CORS_ORIGINS=https://psayha.ru,https://admin.psayha.ru

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

### 4. Сборка Backend

```bash
cd ~/lumon/back/api

# Сборка TypeScript → JavaScript
npm run build

# Проверка что dist/ создан
ls -la dist/
```

### 5. Создание systemd сервиса

```bash
# Создание сервис файла
sudo nano /etc/systemd/system/lumon-api.service
```

**Содержимое файла:**
```ini
[Unit]
Description=Lumon NestJS API Server
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=/home/user/lumon/back/api
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
RestartSec=10s
StandardOutput=append:/var/log/lumon-api.log
StandardError=append:/var/log/lumon-api-error.log

[Install]
WantedBy=multi-user.target
```

### 6. Запуск API сервиса

```bash
# Перезагрузка systemd
sudo systemctl daemon-reload

# Включение автозапуска
sudo systemctl enable lumon-api

# Запуск сервиса
sudo systemctl start lumon-api

# Проверка статуса
sudo systemctl status lumon-api

# Проверка логов
sudo journalctl -u lumon-api -f
```

### 7. Проверка работы API

```bash
# Health check
curl http://localhost:3000/health

# Ожидаемый ответ:
# {"status":"ok","service":"lumon-api","timestamp":"..."}
```

---

## 🌐 Настройка Nginx

### 1. Создание конфигурации для Frontend

```bash
sudo nano /etc/nginx/sites-available/lumon-frontend
```

**Содержимое:**
```nginx
server {
    listen 80;
    server_name psayha.ru;

    root /var/www/lumon2;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy (webhooks)
    location /webhook/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### 2. Создание конфигурации для Admin Panel

```bash
sudo nano /etc/nginx/sites-available/lumon-admin
```

**Содержимое:**
```nginx
server {
    listen 80;
    server_name admin.psayha.ru;

    root /var/www/lumon2/dist-admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3. Создание конфигурации для Supabase Studio

```bash
sudo nano /etc/nginx/sites-available/lumon-studio
```

**Содержимое:**
```nginx
server {
    listen 80;
    server_name sb.psayha.ru;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Включение конфигураций

```bash
# Создание символических ссылок
sudo ln -s /etc/nginx/sites-available/lumon-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/lumon-admin /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/lumon-studio /etc/nginx/sites-enabled/

# Проверка конфигурации
sudo nginx -t

# Перезагрузка Nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL сертификаты

### 1. Установка SSL для всех доменов

**ВАЖНО:** DNS записи должны быть настроены до этого шага!

```bash
# Frontend
sudo certbot --nginx -d psayha.ru

# Admin Panel
sudo certbot --nginx -d admin.psayha.ru

# Supabase Studio
sudo certbot --nginx -d sb.psayha.ru
```

Следуйте инструкциям certbot:
- Введите email для уведомлений
- Согласитесь с Terms of Service (Y)
- Выберите redirect HTTP → HTTPS (2)

### 2. Автоматическое обновление сертификатов

```bash
# Проверка автообновления (dry-run)
sudo certbot renew --dry-run

# Certbot автоматически создает cron job для обновления
# Проверить:
sudo systemctl status certbot.timer
```

---

## 🎨 Deploy Frontend

### 1. Создание директории для frontend

```bash
sudo mkdir -p /var/www/lumon2
sudo chown -R $USER:$USER /var/www/lumon2
```

### 2. Сборка Frontend

```bash
cd ~/lumon

# Установка зависимостей
npm ci

# Создание .env.production
echo "VITE_API_URL=https://psayha.ru" > .env.production

# Сборка frontend
npm run build

# Копирование на веб-сервер
sudo cp -r dist/* /var/www/lumon2/
```

### 3. Сборка Admin Panel

```bash
cd ~/lumon/adminpage

# Установка зависимостей
npm ci

# Создание .env.production
echo "VITE_API_URL=https://psayha.ru" > .env.production

# Сборка admin panel
npm run build

# Копирование на веб-сервер
sudo mkdir -p /var/www/lumon2/dist-admin
sudo cp -r dist/* /var/www/lumon2/dist-admin/
```

### 4. Проверка файлов

```bash
ls -la /var/www/lumon2/
ls -la /var/www/lumon2/dist-admin/
```

---

## ✅ Проверка работоспособности

### 1. Проверка всех сервисов

```bash
# Docker контейнеры
docker compose ps

# Backend API
sudo systemctl status lumon-api

# Nginx
sudo systemctl status nginx

# PostgreSQL (внутри Docker)
docker exec lumon-supabase-db pg_isready -U postgres
```

### 2. Проверка доступности через браузер

Откройте в браузере:

- **Frontend**: https://psayha.ru
- **Admin Panel**: https://admin.psayha.ru
- **Supabase Studio**: https://sb.psayha.ru
- **Health Check**: https://psayha.ru/health

### 3. Проверка API endpoints

```bash
# Health check
curl https://psayha.ru/health

# Auth init (потребует валидный Telegram initData)
curl -X POST https://psayha.ru/webhook/auth-init-v2 \
  -H "Content-Type: application/json" \
  -d '{"initData":"test"}'

# Должен вернуть ошибку валидации (это нормально - значит API работает)
```

---

## 📊 Мониторинг и обслуживание

### Просмотр логов

```bash
# Backend API
sudo journalctl -u lumon-api -f

# Docker containers
docker compose logs -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Управление сервисами

```bash
# Backend API
sudo systemctl restart lumon-api
sudo systemctl stop lumon-api
sudo systemctl start lumon-api

# Docker контейнеры
docker compose restart
docker compose stop
docker compose start

# Nginx
sudo systemctl reload nginx
sudo systemctl restart nginx
```

### Обновление проекта

```bash
cd ~/lumon

# Pull последних изменений
git pull origin main

# Пересборка backend
cd back/api
npm ci
npm run build
sudo systemctl restart lumon-api

# Пересборка frontend
cd ~/lumon
npm ci
npm run build
sudo cp -r dist/* /var/www/lumon2/

# Пересборка admin panel
cd adminpage
npm ci
npm run build
sudo cp -r dist/* /var/www/lumon2/dist-admin/

# Перезапуск Docker (если были изменения в docker-compose.yml)
cd ~/lumon/back
docker compose down
docker compose up -d
```

### Резервное копирование

```bash
# PostgreSQL backup (внутри Docker)
docker exec lumon-supabase-db pg_dump -U postgres lumon > backup_$(date +%Y%m%d).sql

# Восстановление из бэкапа
cat backup_20251120.sql | docker exec -i lumon-supabase-db psql -U postgres -d lumon

# Бэкап .env файлов (ВАЖНО!)
cp ~/lumon/back/.env ~/lumon/back/.env.backup
cp ~/lumon/back/api/.env ~/lumon/back/api/.env.backup
```

---

## 🔧 Troubleshooting

### Проблема: API возвращает 502 Bad Gateway

**Проверка:**
```bash
# Статус API
sudo systemctl status lumon-api

# Логи API
sudo journalctl -u lumon-api -n 50
```

**Решение:**
```bash
# Перезапуск API
sudo systemctl restart lumon-api

# Проверка что API слушает на порту 3000
sudo netstat -tlnp | grep 3000
```

### Проблема: Docker контейнеры не запускаются

**Проверка:**
```bash
# Логи контейнеров
docker compose logs

# Проверка .env файла
cat ~/lumon/back/.env
```

**Решение:**
- Убедитесь что все required переменные заполнены в `.env`
- Проверьте что порты не заняты: `sudo netstat -tlnp | grep 5432`
- Удалите старые volume и пересоздайте: `docker compose down -v && docker compose up -d`

### Проблема: Frontend не отображается

**Проверка:**
```bash
# Проверка файлов
ls -la /var/www/lumon2/

# Проверка Nginx конфигурации
sudo nginx -t

# Логи Nginx
sudo tail -50 /var/log/nginx/error.log
```

**Решение:**
```bash
# Пересборка и копирование frontend
cd ~/lumon
npm run build
sudo cp -r dist/* /var/www/lumon2/

# Перезапуск Nginx
sudo systemctl reload nginx
```

---

## 📞 Поддержка

**Нашли проблему?**
- Проверьте [Troubleshooting](#troubleshooting)
- Посмотрите логи (см. [Мониторинг](#мониторинг-и-обслуживание))
- Создайте Issue: https://github.com/Psayha/lumon/issues

---

**Версия документа:** 2.0.0
**Последнее обновление:** 20 ноября 2025
**Статус:** ✅ Актуально для production deployment
