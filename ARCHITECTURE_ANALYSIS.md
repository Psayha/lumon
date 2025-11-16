# ДЕТАЛЬНЫЙ АНАЛИЗ АРХИТЕКТУРЫ LUMON PLATFORM

Документ создан: 16 ноября 2025

## СОДЕРЖАНИЕ

1. **ИСПОЛЬЗОВАНИЕ N8N КАК БЭКЕНДА** - Как и почему n8n используется
2. **СТРУКТУРА ПРОЕКТА** - Полный обзор всех компонентов
3. **КРИТИЧЕСКИЕ БИЗНЕС-ПРОЦЕССЫ** - Какие процессы идут через n8n
4. **АЛЬТЕРНАТИВНЫЕ КОМПОНЕНТЫ** - Анализ текущей инфраструктуры
5. **РЕКОМЕНДАЦИИ** - Когда и как мигрировать

---

## 1. ИСПОЛЬЗОВАНИЕ N8N КАК БЭКЕНДА

### TL;DR
**n8n используется как PRIMARY BACKEND (не интеграционная платформа):**
- 41 workflows = 31 API endpoints
- 15,362 строк кода (JSON)
- Все бизнес-логика в n8n
- Прямая связь Frontend → n8n webhooks

### Архитектура

```
Frontend (React/TypeScript)
    ↓ HTTP POST/GET на webhooks
N8N (Workflow Automation)
    ├─ 6 Auth workflows
    ├─ 4 Chat workflows
    ├─ 17 Admin workflows
    ├─ 6 Backup/Health workflows
    ├─ 3 Cron workflows
    └─ 5 Helper workflows
    ↓ SQL queries
PostgreSQL (Supabase, 21 таблиц)
```

### Количество и типы

| Категория | Workflows | Lines | Endpoints |
|-----------|-----------|-------|-----------|
| Auth | 6 | ~2,500 | 6 |
| Chat | 4 | ~1,600 | 5 |
| Admin | 17 | ~7,000 | 17 |
| Backup/Health | 6 | ~2,500 | 6 |
| Cron/Utils | 5 | ~1,762 | 1 |
| **TOTAL** | **41** | **15,362** | **31** |

### Сложность одного workflow (пример: auth.init.v3)

```
auth.init.v3.json:
├── Node 1: Webhook Trigger
├── Node 2: Parse & Validate Telegram Hash
├── Node 3-4: Query/Create User (PostgreSQL)
├── Node 5: IF - Check User Exists
├── Node 6-7: Create Session (PostgreSQL)
├── Node 8-9: Build Response (JS Function)
├── Node 10: IF - Check Errors
├── Node 11-12: Return Response (respondToWebhook)
└── Connections: 11 между 13 nodes
```

**Компоненты workflow:**
- Webhook triggers (receive HTTP)
- PostgreSQL nodes (read/write)
- Function nodes (JavaScript logic)
- IF conditions (branching)
- Error handlers (try/catch)
- respondToWebhook (HTTP response)

---

## 2. СТРУКТУРА ПРОЕКТА

### Root Directory Layout

```
lumon/
├── src/                              # Frontend
│   ├── config/api.ts                 # API_CONFIG (11 endpoints)
│   ├── hooks/
│   │   ├── useApi.ts                 # API requests
│   │   ├── useTelegram.ts            # Telegram integration
│   │   ├── useUserRole.ts            # RBAC
│   │   └── useViewerGenerationLimit.ts
│   ├── components/
│   │   ├── ui/                       # 8 chat components
│   │   └── modals/                   # 7 modal windows
│   └── front/                        # 8 pages
│
├── adminpage/                        # Admin Panel SPA
│   ├── config/api.ts                 # ADMIN_API_CONFIG (20 endpoints)
│   ├── tabs/
│   │   ├── CompaniesTab.tsx
│   │   ├── UsersTab.tsx
│   │   ├── BackupsTab.tsx
│   │   ├── HealthChecksTab.tsx
│   │   ├── LogsTab.tsx
│   │   ├── AnalyticsTab.tsx
│   │   └── ABTestingTab.tsx
│   └── AdminPage.tsx
│
├── back/                             # Backend Infrastructure
│   ├── docker-compose.yml            # Services: PostgreSQL, n8n, Supabase
│   ├── n8n/
│   │   └── workflows/                # 41 *.json files
│   ├── supabase/
│   │   └── migrations/               # 7 SQL migrations
│   └── scripts/                      # Automation scripts
│
└── docs/                             # Documentation (16 files)
    ├── WORKFLOWS_MAP.md              # All endpoints spec
    ├── AUTH_SYSTEM.md                # Auth architecture
    ├── MIGRATION_PLAN.md             # Migration guide
    ├── API_CONTRACTS.md              # TypeScript types
    └── [12 другие]
```

### Frontend Structure

```
React 18.2.0 + TypeScript 5.0.2
├── Pages (8):
│   ├── MenuPage              - Main menu
│   ├── VoiceAssistantPage    - Chat + voice recognition
│   ├── CRMPage, AnalyticsPage, KnowledgeBase, Pricing
│   └── TelegramOnlyPage      - Error page
├── Components (14):
│   ├── Core: Button, Input, Card, Modal, Alert
│   ├── Chat UI (8): AnimatedAIChat, MessageList, InputArea, etc.
│   └── Modals (7): Agreement, Company, Consultation, etc.
├── Hooks (8):
│   ├── useApi              - API requests
│   ├── useTheme            - Theme management
│   ├── useTelegram         - Telegram SDK
│   └── useUserRole, useViewerGenerationLimit
└── Config:
    └── api.ts              - API endpoints configuration
```

### Backend Infrastructure (Docker Compose)

```
Services:
├── PostgreSQL (Supabase Database)
│   └── 21 tables (users, sessions, chats, messages, etc.)
├── Supabase Studio
│   └── Web UI for database management
├── n8n
│   ├── 41 workflows
│   ├── PostgreSQL backend
│   └── Port: 127.0.0.1:5678 (Nginx proxy)
└── Nginx Reverse Proxy
    ├── psayha.ru → frontend
    ├── n8n.psayha.ru → n8n
    ├── sb.psayha.ru → Supabase
    └── admin.psayha.ru → admin panel
```

### Database Schema (21 Tables)

**Core Tables:**
- `users` - Telegram users
- `companies` - Company records
- `user_companies` - User-company relationship + roles
- `sessions` - Active sessions (token, expires_at, activity)
- `chats` - Chat sessions
- `messages` - Chat messages

**Security:**
- `audit_events` - Action log
- `idempotency_keys` - Prevent duplicate requests
- `rate_limits` - Per user/endpoint limits

**Admin:**
- `admin_users` - Admin accounts
- `admin_sessions` - Admin sessions
- `legal_documents`, `ai_documents` - Document storage

**Monitoring:**
- `backups` - Backup metadata
- `health_checks` - System health history
- `system_status` - Overall status

**Analytics:**
- `ab_experiments` - A/B tests
- `ab_assignments` - User-variant assignment
- `ab_events` - Conversion tracking
- `user_limits` - Per-user rate limits
- `platform_stats` - Daily aggregations

---

## 3. КРИТИЧЕСКИЕ БИЗНЕС-ПРОЦЕССЫ

### Процесс 1: ИНИЦИАЛИЗАЦИЯ ПОЛЬЗОВАТЕЛЯ

```
User opens Telegram Mini App
  ↓
Telegram SDK sends initData (signature + user data + hash)
  ↓
Frontend: POST /webhook/auth-init-v2 {initData}
  ↓
N8N auth.init.v3:
  1. Extract signature & hash
  2. HMAC-SHA256 validation (security)
  3. Check if user.telegram_id exists
     ├─ YES: Load user
     └─ NO: Create new user
  4. Create session record (token, expires_at = +7 days)
  5. Return session_token
  ↓
Frontend: localStorage.setItem('session_token', token)
  ↓
AuthGuard: Validates token on every request
```

### Процесс 2: ЧАТ И СООБЩЕНИЯ

```
User writes message
  ↓
POST /webhook/chat-create:
  1. auth.validate (check token)
  2. rate-limit.check (30 req/min)
  3. INSERT INTO chats
  4. Return chat_id
  ↓
POST /webhook/chat-save-message:
  1. auth.validate
  2. Check idempotency_key (prevent duplicates)
  3. INSERT INTO messages
  4. Return message_id
  ↓
Frontend: Updates UI, shows message in chat
```

### Процесс 3: УПРАВЛЕНИЕ ЛИМИТАМИ (VIEWER ROLE)

```
User clicks "Later" in CompanyModal
  ↓
POST /webhook/auth-set-viewer-role:
  1. Update user_companies.role = 'viewer'
  2. Update sessions.role = 'viewer'
  ↓
Frontend useViewerGenerationLimit:
  1. Check user.role === 'viewer'
  2. Limit: max 3 generations/day
  3. Show ViewerRestrictionsModal when exceeded
  ↓
PageGuard: Block access to CRM/Analytics for viewer
```

### Процесс 4: АДМИН-ПАНЕЛЬ

```
Admin: username/password login
  ↓
POST /webhook/admin-login:
  1. Query admin_users table
  2. Compare password_hash (bcrypt)
  3. Create admin_sessions
  4. Return admin_token
  ↓
Admin panel loads (7 tabs)
  ├─ CompaniesTab: List all companies
  ├─ UsersTab: Manage users + limits
  ├─ BackupsTab: Create/restore backups
  ├─ HealthChecksTab: Monitor metrics (graphs)
  ├─ LogsTab: View system logs
  ├─ AnalyticsTab: Platform statistics
  └─ ABTestingTab: Manage experiments
  ↓
All operations call n8n admin.* workflows
```

### Процесс 5: МОНИТОРИНГ И HEALTH CHECKS

```
Cron: every 10 minutes
  ↓
POST /webhook/health-check:
  1. Check Docker containers
  2. Collect metrics: CPU, RAM, Disk
  3. Ping PostgreSQL
  4. INSERT INTO health_checks
  ↓
Admin: View graphs of metric history
  ↓
Alert: If status WARNING/CRITICAL → email/Telegram
```

### Процесс 6: АВТОМАТИЧЕСКИЕ БЭКАПЫ

```
Cron: daily at 2:00 AM
  ↓
POST /webhook/backup-create:
  1. Execute pg_dump
  2. Save to /var/backups/lumon/
  3. Record metadata in backups table
  4. Send notification to admin
  ↓
Cron: daily at 3:00 AM
  ↓
Cleanup: Delete backups > 30 days old
  ↓
Admin: Can view/restore/delete in BackupsTab
```

### Процесс 7: A/B ТЕСТИРОВАНИЕ

```
Admin: Create experiment in ABTestingTab
  ↓
POST /webhook/admin-ab-experiment-create:
  1. Create ab_experiments record
  2. Set traffic_percentage
  ↓
User performs action
  ↓
Frontend: Check ab_assignments
  1. If no assignment → create with random variant (A/B)
  2. Log event in ab_events
  ↓
Admin: Analyze results
  1. Conversion by variant
  2. Statistical significance
  3. Recommendation
```

---

## 4. АЛЬТЕРНАТИВНЫЕ БЭКЕНД-КОМПОНЕНТЫ

### КРИТИЧЕСКИЙ ВЫВОД: НЕТУ АЛЬТЕРНАТИВ

**n8n - монолит по дизайну:**
- ✅ Все endpoints → n8n workflows
- ❌ Нет микросервисов
- ❌ Нет отдельного REST API
- ❌ Нет GraphQL
- ❌ Нет Message Queue (Redis)
- ❌ Нет отдельного job processor

### Текущая инфраструктура

```
Primary:
├─ n8n (41 workflows)        - All business logic
├─ PostgreSQL (21 tables)    - Data storage
├─ Supabase Studio          - Database UI

Supporting:
├─ Nginx Reverse Proxy      - Domain routing
├─ Docker Compose           - Orchestration
├─ GitHub Actions           - CI/CD
├─ Shell Scripts            - Cron automation
└─ Telegram SDK             - User authentication
```

### Нет альтернативных компонентов (все в одном месте)

| Function | Component | Type |
|----------|-----------|------|
| API Gateway | n8n webhooks | Primary |
| Auth | auth.* workflows | Primary |
| Chat logic | chat.* workflows | Primary |
| Admin ops | admin.* workflows | Primary |
| Monitoring | health-check.* workflows | Primary |
| Backup | backup.* workflows | Primary |
| Background jobs | cron jobs | Script-based |

---

## 5. РЕКОМЕНДАЦИИ

### ТЕКУЩЕЕ СОСТОЯНИЕ: MVP ✅

**n8n хорош для:**
- < 100 active users
- < 1,000 requests/day
- 1-2 backend developers
- Быстрого прототипирования

**Проблемы начнут появляться при:**
- 100+ users → performance issues
- 5+ developers → code review friction
- Complex features → workflow becomes unmanageable
- Funding round → требует production-grade architecture

### МАСШТАБИРУЕМОСТЬ

```
Users      | Status        | Action
-----------|---------------|----------------------------------
< 100      | ✅ Perfect    | Continue with n8n, focus on product
100-500    | ⚠️ Warning    | Plan migration, hire backend dev
500-1000   | 🚨 Critical   | MUST migrate to NestJS/FastAPI
1000+      | 💀 Broken     | Production infrastructure required
```

### КОГДА МИГРИРОВАТЬ

**НАЧАТЬ СЕЙЧАС, ЕСЛИ:**
- Hiring backend developers (3+ people)
- Raising funding round
- Performance issues (>200ms response time)
- Complex new features (can't fit in n8n)

**НАЧАТЬ В ТЕЧЕНИЕ 6 МЕСЯЦЕВ, ЕСЛИ:**
- 100-500 active users
- Planning to scale team

**МОЖНО ОТЛОЖИТЬ, ЕСЛИ:**
- < 50 active users
- MVP stage, focus on product
- Team size < 3

### РЕКОМЕНДУЕМАЯ МИГРАЦИЯ

**Рекомендуемый стек: NestJS ⭐**

```
Frontend (React)     ┐
Admin Panel (React)  ├─→ NestJS API (port 3000)
                     ┘
                        ├─ Controllers (Express-style)
                        ├─ Services (Business logic)
                        ├─ Guards (Auth, RBAC)
                        ├─ Pipes (Validation)
                        └─ Interceptors (Error handling)

PostgreSQL (Supabase)
Redis (Sessions, caching)
Bull (Background jobs)
```

**Почему NestJS:**
- TypeScript (как frontend)
- Dependency Injection
- Enterprise patterns
- Built-in testing (Jest)
- Large ecosystem
- Production-ready

**Альтернативы:**
- FastAPI (Python, быстрое прототипирование)
- Express.js (максимальная flexibility)
- Django (если нужен встроенный admin)

### МИГРАЦИЯ TIMELINE

```
Month 1 (Weeks 1-4):
├─ Week 1-2: Setup NestJS + TypeORM/Prisma
└─ Week 3-4: Implement auth endpoints

Month 2 (Weeks 5-8):
├─ Week 5-6: Implement chat endpoints
└─ Week 7-8: Implement admin endpoints (partial)

Month 3 (Weeks 9-12):
├─ Week 9-10: Testing + optimization
├─ Week 11: Admin endpoints (complete)
└─ Week 12: Production launch

TOTAL: 8-10 weeks
EFFORT: 1 senior OR 2 junior developers
COST: $20-40k (depends on salary level)
```

### ПАРАЛЛЕЛЬНАЯ РАБОТА

```
Phase 1 (Week 1-2):
  Frontend → n8n (current)
  + Setup NestJS (parallel)

Phase 2 (Week 3-6):
  Frontend → n8n OR NestJS (feature flag)
  Load testing both

Phase 3 (Week 7-8):
  Frontend → 100% NestJS
  Keep n8n as backup

Phase 4 (Week 9+):
  n8n → retire or keep as reference
```

### РИСК ОЦЕНКА

| Risk | Level | Mitigation |
|------|-------|-----------|
| SQL Injection | 🟠 Medium | Use parameterized queries, input validation |
| Performance bottleneck | 🟠 Medium | Add caching, move to NestJS |
| Debugging nightmare | 🟡 Low | Add comprehensive logging (ELK) |
| Code review friction | 🟡 Low | Document workflows in git |
| Vendor lock-in | 🟢 Low | n8n exports JSON, can migrate |

---

## ЗАКЛЮЧЕНИЕ

### KEY TAKEAWAYS

1. **n8n = полноценный backend** (не интеграционная платформа)
2. **41 workflows + 21 таблиц** = complete system
3. **Хорош для MVP** но требует миграции при scale
4. **Рекомендуемая миграция: NestJS** (8-10 недель)
5. **Нет альтернативных компонентов** - все в одном n8n контейнере

### РЕКОМЕНДУЕМЫЙ ПУТЬ

```
Сейчас (< 100 users):
  - Continue with n8n
  - Focus on product/market fit
  - Document workflows

3 месяца (100+ users):
  - Plan migration
  - Hire backend developer
  - Start NestJS setup

6 месяцев (500+ users):
  - Migration complete
  - Production-ready infrastructure
  - Ready to scale
```

### ВОПРОСЫ ДЛЯ КОМАНДЫ

1. Когда ожидаете 500+ активных пользователей?
2. Есть ли план по увеличению backend команды?
3. Нужна ли поддержка более чем 1000 RPS?
4. Есть ли инвестиционные планы (нужна production architecture)?

**На основе ответов на эти вопросы можно точнее спланировать миграцию.**

---

**Документ создан:** 16 ноября 2025
**Версия:** 1.0
**Статус:** Актуальный

