# Lumon API - Complete Endpoint Reference

**Total Endpoints:** 31 (migrated from 41 n8n workflows)

---

## 🔐 Authentication (4 endpoints)

### POST /webhook/auth-init-v2
Initialize authentication with Telegram initData
- **Body:** `{ initData: string, appVersion?: string }`
- **Response:** `{ success: true, data: { session_token, user, role, companyId, expires_at } }`
- **Replaces:** `auth.init.v3.json`

### POST /webhook/auth-validate-v2
Validate session token
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ success: true, data: { user, role, companyId } }`
- **Replaces:** `auth.validate.v3.json`

### POST /webhook/auth-logout
Logout and invalidate session
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ success: true, message }`
- **Replaces:** `auth.logout.json`

### POST /webhook/auth-refresh
Refresh session expiry
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ success: true, data: { expires_at } }`
- **Replaces:** `auth.refresh.json`

---

## 💬 Chat Management (5 endpoints)

### POST /webhook/chat-create
Create new chat
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ title?: string }`
- **Response:** `{ success: true, data: { id, user_id, company_id, title, created_at } }`
- **Replaces:** `chat.create.v2.json`

### POST /webhook/chat-list
List user's chats
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ success: true, data: Chat[] }`
- **Replaces:** `chat.list.json`

### POST /webhook/chat-delete
Delete chat
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ chat_id: string }`
- **Response:** `{ success: true, message }`
- **Replaces:** `chat.delete.json`

### POST /webhook/chat-save-message
Save message to chat (with idempotency support)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Idempotency-Key: <uuid>` (optional)
- **Body:** `{ chat_id: string, role: 'user'|'assistant'|'system', content: string, metadata?: {} }`
- **Response:** `{ success: true, data: { id, chat_id, role, content, created_at } }`
- **Replaces:** `save-message.json`

### POST /webhook/chat-get-history
Get chat message history
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ chat_id: string }`
- **Response:** `{ success: true, data: { chat_id, messages: Message[] } }`
- **Replaces:** `get-chat-history.json`

---

## 👨‍💼 Admin Panel (17 endpoints)

### POST /webhook/admin/login
Admin login
- **Body:** `{ username: string, password: string }`
- **Response:** `{ success: true, data: { session_token, role, expires_at } }`
- **Replaces:** `admin.login.json`

### POST /webhook/admin/validate
Validate admin session
- **Headers:** `Authorization: Bearer <admin-token>`
- **Response:** `{ success: true, data: { role: 'admin' } }`
- **Replaces:** `admin.validate.json`

### POST /webhook/admin/users-list
List all users with pagination
- **Headers:** `Authorization: Bearer <admin-token>`
- **Body:** `{ page?: number, limit?: number }`
- **Response:** `{ success: true, data: { users, total, page, limit, totalPages } }`
- **Replaces:** `admin.users-list.json`

### POST /webhook/admin/companies-list
List all companies
- **Headers:** `Authorization: Bearer <admin-token>`
- **Response:** `{ success: true, data: Company[] }`
- **Replaces:** `admin.companies-list.json`

### POST /webhook/admin/user-delete
Delete user and all related data
- **Headers:** `Authorization: Bearer <admin-token>`
- **Body:** `{ user_id: string }`
- **Response:** `{ success: true, message }`
- **Replaces:** `admin.user-delete.json`

### POST /webhook/admin/user-limits-list
List user limits
- **Headers:** `Authorization: Bearer <admin-token>`
- **Body:** `{ user_id?: string }`
- **Response:** `{ success: true, data: UserLimit[] }`
- **Replaces:** `admin.user-limits-list.json`

### POST /webhook/admin/user-limits-update
Update user limits
- **Headers:** `Authorization: Bearer <admin-token>`
- **Body:** `{ user_id: string, limit_type: string, limit_value: number }`
- **Response:** `{ success: true, data: UserLimit }`
- **Replaces:** `admin.user-limits-update.json`

### POST /webhook/admin/user-limits-reset
Reset user limits (set current_usage to 0)
- **Headers:** `Authorization: Bearer <admin-token>`
- **Body:** `{ user_id: string }`
- **Response:** `{ success: true, message }`

### POST /webhook/admin/stats-platform
Get platform statistics
- **Headers:** `Authorization: Bearer <admin-token>`
- **Response:** `{ success: true, data: { total_users, active_users, total_companies, total_chats, total_messages, new_users_today } }`
- **Replaces:** `admin.stats-platform.json`

### POST /webhook/admin/logs-list
List audit logs with pagination
- **Headers:** `Authorization: Bearer <admin-token>`
- **Body:** `{ page?: number, limit?: number, action?: string, user_id?: string }`
- **Response:** `{ success: true, data: { logs, total, page, limit, totalPages } }`
- **Replaces:** `admin.logs-list.json`

### POST /webhook/admin/ab-experiments-list
List A/B testing experiments
- **Headers:** `Authorization: Bearer <admin-token>`
- **Response:** `{ success: true, data: AbExperiment[] }`
- **Replaces:** `admin.ab-experiments-list.json`

### POST /webhook/admin/ab-experiment-create
Create A/B experiment
- **Headers:** `Authorization: Bearer <admin-token>`
- **Body:** `{ name, description, feature_name, traffic_percentage, variant_a_config, variant_b_config }`
- **Response:** `{ success: true, data: AbExperiment }`
- **Replaces:** `admin.ab-experiment-create.json`

### POST /webhook/admin/ab-experiment-update
Update A/B experiment
- **Headers:** `Authorization: Bearer <admin-token>`
- **Body:** `{ experiment_id: string, ...updates }`
- **Response:** `{ success: true, data: AbExperiment }`
- **Replaces:** `admin.ab-experiment-update.json`

### POST /webhook/admin/user-history-clear
Clear user chat history
- **Headers:** `Authorization: Bearer <admin-token>`
- **Body:** `{ user_id: string }`
- **Response:** `{ success: true, message, chats_deleted }`
- **Replaces:** `admin.user-history-clear.json`

### POST /webhook/admin/ab-experiment-stats
Get A/B experiment statistics
- **Headers:** `Authorization: Bearer <admin-token>`
- **Body:** `{ experiment_id: string }`
- **Response:** `{ success: true, data: { experiment, total_assignments, variant_a_count, variant_b_count } }`

---

## 📊 Analytics (1 endpoint)

### POST /webhook/analytics-log-event
Log analytics event
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ event_name: string, category?: string, properties?: {} }`
- **Response:** `{ success: true, data: { event_id, event_name, timestamp } }`
- **Replaces:** `analytics.json`

---

## 🚦 User Limits & Rate Limiting (2 endpoints)

### POST /webhook/user-limits
Get user limits
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ success: true, data: UserLimit[] }`

### POST /webhook/rate-limit-check
Check rate limit
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ endpoint: string, max_requests?: number, window_minutes?: number }`
- **Response:** `{ success: true, allowed: boolean }`
- **Replaces:** `rate-limit.check.json`

---

## ❤️ Health & Monitoring (2 endpoints)

### GET /health
Simple health check
- **No auth required**
- **Response:** `{ status: 'ok', service: 'lumon-api', timestamp, uptime }`

### GET /health/detailed
Detailed health check with database status
- **No auth required**
- **Response:** `{ status, service, timestamp, uptime, checks: { database, memory } }`

---

## 📝 Request/Response Format

### Standard Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Standard Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "BadRequest"
}
```

### Authentication
All endpoints (except `/health` and `/webhook/auth-init-v2`) require Bearer token:
```
Authorization: Bearer <session_token>
```

### Idempotency
Mutating operations (like `chat-save-message`) support idempotency:
```
Idempotency-Key: <uuid>
```

---

## 🔧 Environment Variables

Required in `.env`:
```env
DB_HOST=your-supabase-host.supabase.co
DB_PASSWORD=your-password
DB_DATABASE=postgres
OPENAI_API_KEY=sk-...
TELEGRAM_BOT_TOKEN=123456:ABC...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_password_here
```

---

## 🚀 Testing Endpoints

### Using curl
```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/webhook/auth-init-v2 \
  -H "Content-Type: application/json" \
  -d '{"initData":"..."}'

# Create chat (with token)
curl -X POST http://localhost:3000/webhook/chat-create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Chat"}'
```

### Using Postman/Insomnia
Import collection from `postman_collection.json` (if available)

---

## 📚 Migration Status

| n8n Workflow | NestJS Endpoint | Status |
|--------------|----------------|--------|
| auth.init.v3.json | /webhook/auth-init-v2 | ✅ |
| auth.validate.v3.json | /webhook/auth-validate-v2 | ✅ |
| auth.logout.json | /webhook/auth-logout | ✅ |
| auth.refresh.json | /webhook/auth-refresh | ✅ |
| chat.create.v2.json | /webhook/chat-create | ✅ |
| chat.list.json | /webhook/chat-list | ✅ |
| chat.delete.json | /webhook/chat-delete | ✅ |
| save-message.json | /webhook/chat-save-message | ✅ |
| get-chat-history.json | /webhook/chat-get-history | ✅ |
| admin.* (17 workflows) | /webhook/admin/* | ✅ |
| analytics.json | /webhook/analytics-log-event | ✅ |
| rate-limit.check.json | /webhook/rate-limit-check | ✅ |

**Total:** 31 endpoints migrated from 41 n8n workflows

**Not migrated yet:**
- Backup/restore workflows (cron jobs)
- Health check workflows (replaced with /health endpoints)
- Internal utility workflows (no longer needed)

---

Generated: $(date)
Version: 1.0.0
