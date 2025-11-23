# 🚀 Lumon Platform

> Современная AI-платформа с голосовым ассистентом, NestJS API и Telegram интеграцией

**📊 Статус:** Production Ready | **🏗️ Архитектура:** React + NestJS + PostgreSQL

## 📖 Документация

- **[docs/INDEX.md](./docs/INDEX.md)** - 📚 Полный индекс всей документации
- **[docs/CHAT_SYSTEM.md](./docs/CHAT_SYSTEM.md)** - 💬 Логика чат-системы (New)
- **[docs/BUILD_STATUS.md](./docs/BUILD_STATUS.md)** - 🔍 Статус сборки и CI/CD
- **[docs/AUTH_SYSTEM.md](./docs/AUTH_SYSTEM.md)** - 🔐 Система авторизации
- **[back/api/README.md](./back/api/README.md)** - 🔧 Backend API документация

---

## ⚡ Быстрый старт

### Локальная разработка

```bash
# 1. Клонировать репозиторий
git clone https://github.com/Psayha/lumon.git
cd lumon

# 2. Установить зависимости
npm install

# 3. Запустить backend
cd back/api
cp .env.example .env  # Настроить переменные окружения
npm install
npm run start:dev     # API на http://localhost:3000

# 4. Запустить frontend (в новом терминале)
cd ../..
npm run dev           # Frontend на http://localhost:5173

# 5. Запустить admin panel
cd adminpage
npm install
npm run dev           # Admin на http://localhost:5174
```

### Production Deploy

```bash
# Frontend
npm run build

# Admin Panel
cd adminpage && npm run build

# Backend
cd back/api && npm run build
npm run start:prod
```

---

## 🎯 Архитектура

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  React Frontend │────▶│   NestJS API    │────▶│   PostgreSQL     │
│  (Vite + TS)    │     │  (TypeORM + TS) │     │   (Supabase)     │
└─────────────────┘     └─────────────────┘     └──────────────────┘
         │                       │
         │              ┌────────▼────────┐
         └─────────────▶│  Telegram SDK   │
                        └─────────────────┘
```

### Tech Stack

**Frontend:**

- React 18.2.0 + TypeScript 5.0.2
- Tailwind CSS 3.3.3
- Framer Motion 12.23.24
- React Router 6.8.1
- Telegram WebApp API
- Web Speech API (голосовой ввод)

**Backend:**

- NestJS 11.x + TypeScript 5.x
- TypeORM + PostgreSQL
- Class Validator + Class Transformer
- Passport JWT Authentication
- Bull Queue (background jobs)
- Helmet.js + CORS (security headers)
- Rate Limiting + CSRF Protection

**Infrastructure:**

- Docker + Docker Compose
- Nginx (reverse proxy)
- GitHub Actions (CI/CD)
- PM2 (process manager)

---

## 📁 Структура проекта

```
lumon/
├── src/                    # Frontend React приложение
│   ├── components/         # UI компоненты (14 основных + 8 чата + 7 модалок)
│   ├── hooks/              # Custom React hooks (8 хуков)
│   ├── types/              # TypeScript types
│   └── config/             # Конфигурация
├── adminpage/              # Admin Panel (отдельное React SPA)
│   ├── tabs/               # Табы админки (7 табов)
│   └── config/             # API конфигурация
├── back/api/               # NestJS Backend API
│   ├── src/
│   │   ├── modules/        # Бизнес-модули (Auth, Chat, Admin, etc.)
│   │   ├── entities/       # TypeORM entities (14 entities)
│   │   ├── common/         # Guards, Decorators, Filters
│   │   └── config/         # Конфигурация
│   └── dist/               # Compiled JavaScript
├── docs/                   # Документация проекта
│   ├── INDEX.md            # Индекс всей документации
│   ├── AUTH_SYSTEM.md      # Система авторизации
│   ├── BUILD_STATUS.md     # Статус сборки
│   └── [другие документы]
└── .github/workflows/      # CI/CD pipelines
```

---

## 🔐 Система авторизации

- **Session-based** - UUID токены в PostgreSQL
- **RBAC** - роли: owner, manager, viewer
- **Multi-company** - пользователь в нескольких компаниях
- **Telegram OAuth** - HMAC проверка initData
- **Auto-refresh** - автопродление сессии каждые 4 минуты

📚 **Подробности:** [docs/AUTH_SYSTEM.md](./docs/AUTH_SYSTEM.md)

---

## 📊 Database Schema (14 Entities)

**Core:**

- `User`, `Company`, `UserCompany`, `Session`
- `Chat`, `Message`

**Security:**

- `AuditEvent`, `IdempotencyKey`, `RateLimit`

**Admin:**

- `AdminUser`, `AdminSession`, `LegalDocument`, `AiDocument`

**Monitoring:**

- `UserLimit`, `PlatformStats`

**Analytics:**

- `AbExperiment`, `AbAssignment`, `AbEvent`

---

## 🎨 Frontend Features

### Страницы (7)

- **MenuPage** - главная с карточками разделов
- **VoiceAssistantPage** - AI чат с голосовым вводом (ChatGPT-like logic)
- **CRMPage, AnalyticsPage, KnowledgeBasePage** - бизнес-функции
- **PricingPage** - тарифные планы
- **TelegramOnlyPage** - ошибка доступа вне Telegram

### Компоненты

- **14 основных** - Button, Input, Card, Modal, Alert, etc.
- **8 для чата** - AnimatedAIChat, MessageList, InputArea, etc.
- **7 модалок** - Agreement, Company, Onboarding, Pricing, etc.
- **Eruda** - Mobile DevTools (включено для отладки)

### Хуки (8)

- `useApi` - API запросы с автоматическим re-auth
- `useTelegram` - Telegram WebApp SDK интеграция
- `useTheme` - темная/светлая тема
- `useUserRole` - RBAC проверки
- `useViewerGenerationLimit` - лимиты для viewer роли

---

## 🔧 Backend API

### Модули (6)

**Auth Module** - аутентификация

- POST `/webhook/auth-init-v2` - инициализация через Telegram
- POST `/webhook/auth-validate-v2` - валидация токена
- POST `/webhook/auth-refresh` - продление сессии
- POST `/webhook/auth-logout` - выход

**Chat Module** - чаты и сообщения

- POST `/webhook/chat-create` - создание чата
- POST `/webhook/chat-list` - список чатов
- POST `/webhook/chat-save-message` - сохранение сообщения (с idempotency)
- POST `/webhook/chat-get-history` - история чата

**Admin Module** - админ-панель (17 endpoints)

- POST `/webhook/admin/login` - вход админа
- POST `/webhook/admin/users-list` - список пользователей
- POST `/webhook/admin/stats-platform` - статистика платформы
- [и еще 14 endpoints]

**Analytics Module** - аналитика событий

- POST `/webhook/analytics-log-event` - логирование событий

**User Limits Module** - квоты и лимиты

- POST `/webhook/user-limits` - получение лимитов
- POST `/webhook/rate-limit-check` - проверка rate limit

**Health Module** - мониторинг

- GET `/health` - простая проверка
- GET `/health/detailed` - детальная информация (DB, память)

📚 **Полная документация API:** [back/api/API_ENDPOINTS.md](./back/api/API_ENDPOINTS.md)

---

## 🚀 Production Deploy

### Домены

- **Frontend**: https://psayha.ru
- **Admin Panel**: https://admin.psayha.ru
- **API**: https://n8n.psayha.ru (работает NestJS API)
- **Supabase Studio**: https://sb.psayha.ru

### Deployment

```bash
# Автоматический deploy через GitHub Actions
git push origin main  # Triggers CI/CD

# Или вручную на сервере
cd /home/user/lumon/back/api
./deploy.sh full-deploy
```

### CI/CD Pipeline

1. **Build** - фронтенд, админ панель, backend
2. **Test** - lint, type-check, unit tests
3. **Deploy** - rsync на сервер
4. **Smoke Tests** - проверка доступности всех доменов
5. **SSL Verification** - проверка сертификатов

---

## 📊 Статистика сборки

**Frontend:**

- Время сборки: ~2s ✅
- CSS: ~67 kB (gzip: ~11 kB)
- JavaScript: ~313 kB (gzip: ~101 kB)

**Admin Panel:**

- Время сборки: ~8.4s ✅
- Аналогичный размер

**Backend:**

- Время сборки: ~8s ✅
- Memory: ~150MB
- Latency: ~20ms

---

## 🧪 Тестирование

```bash
# Frontend
npm run lint
npm run build

# Admin Panel
cd adminpage
npm run lint
npm run build

# Backend
cd back/api
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run lint
npm run build
```

---

## 🔐 Безопасность

**Статус:** ✅ **26/26 критических уязвимостей исправлено** (ноябрь 2025)

### Реализованные меры безопасности:

- ✅ **Global Rate Limiting** - защита от brute-force атак
- ✅ **CSRF Protection** - защита от межсайтовой подделки запросов
- ✅ **Helmet.js** - защитные HTTP заголовки
- ✅ **Database Isolation** - отдельные БД для n8n и основного приложения
- ✅ **Path Traversal Protection** - валидация файловых путей
- ✅ **XSS Protection** - sanitization пользовательского контента
- ✅ **Environment Variables** - обязательные переменные окружения
- ✅ **Localhost-only Ports** - PostgreSQL, n8n, Studio доступны только локально

📚 **Подробности:** [SECURITY.md](./SECURITY.md)

---

## 🎯 Следующие шаги

- ✅ **Build Process Audit** - полный аудит сборки завершен
- ✅ **CI/CD** - автоматический деплой настроен
- ✅ **TypeScript Strict Mode** - 0 ошибок
- ✅ **ESLint** - 0 критических ошибок
- ✅ **Security Audit** - 26/26 уязвимостей исправлено

📚 **Roadmap:** [docs/ROADMAP_FUTURE.md](./docs/ROADMAP_FUTURE.md)

---

## 🙏 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Private project - All rights reserved

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/Psayha/lumon/issues)
- **Documentation:** [docs/INDEX.md](./docs/INDEX.md)
- **API Reference:** [back/api/README.md](./back/api/README.md)

---

**Версия:** 2.1.0 (NestJS Backend + Security Hardening)
**Последнее обновление:** 20 ноября 2025
**Статус:** ✅ Production Ready + Security Hardened
