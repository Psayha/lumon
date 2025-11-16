# 🚀 Миграция с n8n на NestJS API

## Обзор

**Дата миграции:** 16 ноября 2025
**Статус:** ✅ Завершено

Проект Lumon успешно мигрирован с workflow-based бэкенда (n8n) на полноценный TypeScript/NestJS API.

---

## Что изменилось

### До миграции

```
┌─────────────────┐
│   Frontend      │
│  (React/Vite)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   n8n Workflows │  ← Старый бэкенд
│   (Port 5678)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Docker)      │
└─────────────────┘
```

### После миграции

```
┌─────────────────┐
│   Frontend      │
│  (React/Vite)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  NestJS API     │  ← Новый бэкенд
│  (Port 3000)    │
│  + TypeScript   │
│  + TypeORM      │
│  + Validation   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Docker)      │
└─────────────────┘
```

---

## Технические детали

### Архитектура

**Backend:**
- **Framework:** NestJS 10.x
- **Language:** TypeScript 5.x
- **ORM:** TypeORM 0.3.x
- **Validation:** class-validator, class-transformer
- **Authentication:** Session-based + Telegram Bot API

**Database:**
- **СУБД:** PostgreSQL 15
- **Deployment:** Docker (lumon-supabase-db)
- **Host:** 127.0.0.1:5432
- **Database:** lumon

**Infrastructure:**
- **Web Server:** Nginx 1.24
- **SSL:** Let's Encrypt (Certbot)
- **Process Manager:** systemd
- **Logs:** journald + file logs

### Домены

| Домен | Сервис | Порт | Статус |
|-------|--------|------|--------|
| `n8n.psayha.ru` | NestJS API | 3000 | ✅ Active |
| `sb.psayha.ru` | Supabase Studio | 3001 | ✅ Active |
| `psayha.ru` | Frontend | 80/443 | ✅ Active |

---

## API Структура

### Модули

```
src/
├── modules/
│   ├── auth/          # Аутентификация (Telegram)
│   ├── users/         # Управление пользователями
│   ├── companies/     # Управление компаниями
│   ├── chats/         # Чаты и сообщения
│   ├── ai/            # Интеграция с OpenAI
│   ├── telegram/      # Telegram Bot
│   ├── analytics/     # Аналитика и метрики
│   └── admin/         # Админ-панель
├── entities/          # TypeORM entities
├── common/            # Общие декораторы, guards, interceptors
└── config/            # Конфигурация приложения
```

### Ключевые endpoints

```
GET    /health                    # Health check
POST   /auth/telegram/login       # Telegram OAuth
GET    /auth/me                   # Текущий пользователь
POST   /chats                     # Создать чат
GET    /chats/:id/messages        # История сообщений
POST   /chats/:id/messages        # Отправить сообщение
GET    /analytics/stats           # Статистика
```

Полная документация: [API_ENDPOINTS.md](../API_ENDPOINTS.md)

---

## Мониторинг

### Health Check

```bash
# Скрипт полной проверки
sudo bash /home/user/lumon/back/api/health-check.sh

# Или вручную:
curl https://n8n.psayha.ru/health
```

### Логи

```bash
# Логи API (realtime)
sudo journalctl -u lumon-api -f

# Логи за последний час
sudo journalctl -u lumon-api --since "1 hour ago"

# Nginx логи
tail -f /var/log/nginx/lumon-api-access.log
tail -f /var/log/nginx/lumon-api-error.log
```

---

## Troubleshooting

### API не запускается

```bash
# 1. Проверить логи
sudo journalctl -u lumon-api -n 100

# 2. Проверить .env
cat /home/user/lumon/back/api/.env

# 3. Запустить health check
sudo bash /home/user/lumon/back/api/health-check.sh
```

### 502 Bad Gateway

```bash
# 1. Проверить что API работает
curl http://localhost:3000/health

# 2. Проверить nginx конфиг
sudo nginx -t
```

---

## Откат

Если нужно вернуться к старому n8n:

```bash
# 1. Остановить новый API
sudo systemctl stop lumon-api

# 2. Запустить старый n8n
docker start lumon-n8n

# 3. Вернуть старый nginx конфиг
sudo rm /etc/nginx/sites-enabled/lumon-api
sudo systemctl reload nginx
```

---

## Команда и контакты

**Разработка:** Claude AI + Psayha
**Миграция выполнена:** 16.11.2025
**Версия API:** 1.0.0

Вопросы и issues: https://github.com/Psayha/lumon/issues
