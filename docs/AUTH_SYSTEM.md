# 🔐 Система авторизации Lumon Platform

**Дата обновления:** 6 ноября 2025  
**Статус:** ✅ Полностью реализована и работает

---

## 🎯 Текущее состояние системы

### ✅ Авторизация
- Создание сессий через Telegram initData
- Валидация токенов с возвратом user context
- Продление сессий (refresh + автопродление каждые 4 минуты)
- Выход из системы (logout)
- Автоматический re-auth при 401/403
- Установка роли viewer через dedicated endpoint
- Смена активной компании (switch-company)

### ✅ Chat API
- Создание чатов с привязкой к user_id и company_id (через session_token)
- Сохранение сообщений
- Получение истории чатов
- Список чатов пользователя
- Все endpoints защищены auth.validate

### ✅ Frontend
- AuthGuard компонент - автоматическая инициализация сессии
- PageGuard компонент - блокировка страниц для viewer
- Страница тестирования API (ApiTestPage.tsx)
- Отображение user context (role, permissions, company)
- Сохранение session_token в localStorage
- Модальные окна онбординга (AgreementModal, CompanyModal)
- ViewerRestrictionsModal - объяснение ограничений для viewer
- VoiceAssistantPage использует auth context
- Лимит генераций для viewer (3 в сутки) через useViewerGenerationLimit

### ✅ RBAC ограничения
- Блокировка внутренних страниц для роли viewer
- Лимит генераций: 3 генерации в сутки для viewer в ассистенте
- Автоудаление чатов viewer старше 3 дней (cron.cleanup)

### ✅ Админ-панель
- Реальная аутентификация через `/webhook/admin-login`
- Workflow `admin.login.json` для проверки учетных данных
- Таблицы `admin_users` и `admin_sessions` для хранения админов

---

## 🔧 Архитектура

```
Frontend → API (с Bearer token)
           ↓
           n8n workflows → auth.validate → PostgreSQL
                          ↓
                          Parse Auth Response
                          ↓
                          IF Auth Success
                          ↓
                          Бизнес-логика
```

### Унифицированный паттерн для бизнес-workflows

Каждый бизнес-workflow следует этой структуре:
1. Webhook Node (триггер) - принимает запрос с заголовком Authorization
2. Execute Workflow: auth.validate - проверяет токен, возвращает context
3. IF Node - проверка наличия ошибки (если error → Response 401/403)
4. Бизнес-логика - доступ к context.userId, context.companyId
5. Response Node - единый формат { success, data, traceId }

---

## 📡 API Endpoints

### Auth Endpoints
- `POST /webhook/auth-init-v2` - инициализация сессии (Telegram initData)
- `POST /webhook/auth-validate-v2` - валидация токена + user context
- `POST /webhook/auth-refresh` - продление сессии (новый токен)
- `POST /webhook/auth-logout` - завершение сессии
- `POST /webhook/auth-set-viewer-role` - установка роли viewer
- `POST /webhook/auth-switch-company` - смена активной компании

### Chat Endpoints
- `POST /webhook/chat-create` - создание чата (с auth + rate limit)
- `GET /webhook/chat-list` - список чатов пользователя
- `POST /webhook/chat-save-message` - сохранение сообщения (с auth + rate limit + идемпотентность)
- `POST /webhook/chat-get-history` - история чата (с auth)

### Admin Endpoints
- `POST /webhook/admin-login` - аутентификация администратора
- `POST /webhook/admin-validate` - валидация admin токена
- `GET /webhook/admin-companies-list` - список компаний
- `GET /webhook/admin-legal-docs-list` - список юридических документов
- `POST /webhook/admin-legal-docs-update` - обновление юридического документа
- `GET /webhook/admin-ai-docs-list` - список AI документов
- `POST /webhook/admin-ai-docs-delete` - удаление AI документа
- `GET /webhook/admin-logs-list` - просмотр логов системы
- `GET /webhook/admin-users-list` - список пользователей
- `GET /webhook/admin-stats-platform` - статистика платформы
- `GET /webhook/admin-user-limits-list` - список лимитов пользователей
- `POST /webhook/admin-user-limits-update` - обновление лимита пользователя
- `GET /webhook/admin-ab-experiments-list` - список A/B экспериментов
- `POST /webhook/admin-ab-experiment-create` - создание A/B эксперимента
- `POST /webhook/admin-ab-experiment-update` - обновление A/B эксперимента

### Формат запросов
```http
Authorization: Bearer <session_token>
Content-Type: application/json
```

### Формат ответов
```json
{
  "success": true,
  "data": { /* payload */ },
  "traceId": "uuid"
}
```

### Формат ошибок
```json
{
  "error": "unauthorized",
  "status": 401,
  "message": "Invalid or expired token",
  "traceId": "uuid"
}
```

---

## 📊 Статистика

- **База данных**: 21 таблица (users, companies, user_companies, sessions, chats, messages, audit_events, admin_users, admin_sessions, backups, health_checks, system_status, idempotency_keys, rate_limits, legal_documents, ai_documents, user_limits, ab_experiments, ab_assignments, ab_events, platform_stats)
- **Auth workflows**: 6 (init, validate, refresh, logout, set-viewer-role, switch-company)
- **Chat workflows**: 4 (create, list, save-message, get-history)
- **Admin workflows**: 2 (login, validate)
- **Admin API workflows**: 13 (companies-list, legal-docs-list, legal-docs-update, ai-docs-list, ai-docs-delete, logs-list, users-list, stats-platform, user-limits-list, user-limits-update, ab-experiments-list, ab-experiment-create, ab-experiment-update)
- **Backup workflows**: 4 (create, list, restore, delete)
- **Health-check workflows**: 2 (check, check-list)
- **Cron workflows**: 3 (cleanup - каждый час, export-workflows - еженедельно, aggregate-stats - каждый час)
- **Всего активных workflows**: 36

---

## 🔐 Роли и права (RBAC)

| Роль | Права | Назначение |
|------|-------|------------|
| `owner` | read, write, delete, manage_users, manage_company | Создатель компании, полный доступ |
| `manager` | read, write, delete | Приглашённый пользователь, полный доступ |
| `viewer` | read | Только просмотр (кнопка "Позже") |

---

## 🌐 Инфраструктура

- Поддомены настроены: `https://n8n.psayha.ru`, `https://sb.psayha.ru`, `https://admin.psayha.ru`
- SSL-сертификаты выданы и подключены (Let's Encrypt) для всех доменов
- Nginx проксирует домены на соответствующие сервисы
- Прямой доступ по IP закрыт (Docker-порты привязаны к `127.0.0.1`)
- CORS настроен для admin.psayha.ru в n8n

---

### ✅ Расширенная аналитика (Завершено: 6 ноября 2025)
- Просмотр логов системы через таб "Логи" в админке
- Управление пользователями через таб "Пользователи"
- Статистика использования платформы через таб "Аналитика"
- Управление лимитами пользователей
- A/B тестирование функций через таб "A/B Тесты"
- Автоматическая агрегация статистики (cron.aggregate-stats)

---

**Последнее обновление:** 6 ноября 2025

