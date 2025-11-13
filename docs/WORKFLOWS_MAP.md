# N8N Workflows Map

Complete map of all API endpoints implemented as n8n workflows. This document serves as a specification for future backend migration.

## Table of Contents
- [Authentication](#authentication)
- [Admin Panel](#admin-panel)
- [Chat & Messages](#chat--messages)
- [Analytics](#analytics)
- [Backups](#backups)
- [Health & Monitoring](#health--monitoring)
- [Cron Jobs](#cron-jobs)
- [Rate Limiting](#rate-limiting)

---

## Authentication

### auth.init.v3
**Endpoint:** `POST /webhook/auth-init-v2`
**Purpose:** Initialize user session via Telegram auth
**Flow:**
1. Webhook Trigger - receives Telegram init data
2. Parse & Validate Init Data - validates Telegram hash
3. Check/Create User - gets or creates user in DB
4. Create Session - generates session token
5. Build Response - returns user data + session token

**Request:**
```json
{
  "initData": "query_id=...&user={...}&hash=..."
}
```

**Response:**
```json
{
  "success": true,
  "session_token": "uuid-v4",
  "user": {
    "id": "uuid",
    "telegram_id": "string",
    "first_name": "string",
    "last_name": "string",
    "username": "string"
  }
}
```

### auth.validate.v3
**Endpoint:** `POST /webhook/auth-validate-v2`
**Purpose:** Validate session token and return user context
**Authentication:** Bearer token in Authorization header
**Flow:**
1. Webhook Trigger
2. Extract Token - from header or body
3. Get Session - query active session with user data
4. IF Session Found
5. Check Session Validity - expiration & activity check
6. Update Last Activity - extends session if needed
7. Build User Context - returns user + permissions
8. Respond to Webhook

**Request Headers:**
```
Authorization: Bearer <session_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "telegram_id": "string",
      "first_name": "string",
      "last_name": "string",
      "username": "string",
      "company_name": "string",
      "permissions": ["read", "write", "delete"]
    },
    "role": "owner | manager | viewer",
    "companyId": "uuid",
    "session": {
      "expires_at": "timestamp",
      "last_activity_at": "timestamp"
    }
  }
}
```

### auth.logout
**Endpoint:** `POST /webhook/auth-logout`
**Purpose:** Invalidate session
**Authentication:** Bearer token

### auth.refresh
**Endpoint:** `POST /webhook/auth-refresh`
**Purpose:** Refresh session token before expiration
**Authentication:** Bearer token

### auth.switch-company
**Endpoint:** `POST /webhook/auth-switch-company`
**Purpose:** Switch user's active company context
**Authentication:** Bearer token

### auth.set-viewer-role
**Endpoint:** `POST /webhook/auth-set-viewer-role`
**Purpose:** Set user role to viewer (demo mode)
**Authentication:** Bearer token

---

## Admin Panel

### admin.login
**Endpoint:** `POST /webhook/admin-login`
**Purpose:** Admin authentication
**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "token": "uuid",
  "admin": {
    "id": "uuid",
    "username": "string"
  },
  "expires_at": "timestamp"
}
```

### admin.validate
**Endpoint:** `POST /webhook/admin-validate`
**Purpose:** Validate admin token
**Request:**
```json
{
  "token": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "admin_user_id": "uuid",
    "username": "string",
    "expires_at": "timestamp"
  }
}
```

### admin.users-list
**Endpoint:** `POST /webhook/admin-users-list`
**Purpose:** Get paginated list of all users
**Authentication:** Admin Bearer token

### admin.user-delete
**Endpoint:** `POST /webhook/admin/user-delete`
**Purpose:** Completely delete user and all related data
**Authentication:** Admin Bearer token
**Request:**
```json
{
  "user_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted completely",
  "user_id": "uuid"
}
```

**Deletes:**
- All messages in user's chats
- All chats
- User limits
- User-company associations
- User record

### admin.user-history-clear
**Endpoint:** `POST /webhook/admin/user-history-clear`
**Purpose:** Clear user's chat history
**Authentication:** Admin Bearer token
**Request:**
```json
{
  "user_id": "uuid"
}
```

### admin.user-limits-update
**Endpoint:** `POST /webhook/admin-user-limits-update`
**Purpose:** Update user's rate limits
**Authentication:** Admin Bearer token
**Request:**
```json
{
  "user_id": "uuid",
  "limit_type": "daily_requests | monthly_requests",
  "limit_value": 1000,
  "reset_at": "timestamp | null"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "limitType": "string",
    "limitValue": 1000,
    "resetAt": "timestamp | null"
  },
  "traceId": "uuid"
}
```

### admin.user-limits-list
**Endpoint:** `POST /webhook/admin-user-limits-list`
**Purpose:** Get list of user limits
**Authentication:** Admin Bearer token

### admin.companies-list
**Endpoint:** `POST /webhook/admin-companies-list`
**Purpose:** Get list of all companies
**Authentication:** Admin Bearer token

### admin.logs-list
**Endpoint:** `POST /webhook/admin-logs-list`
**Purpose:** Get system logs
**Authentication:** Admin Bearer token

### admin.stats-platform
**Endpoint:** `POST /webhook/admin-stats-platform`
**Purpose:** Get platform statistics
**Authentication:** Admin Bearer token

### admin.ab-experiments-list
**Endpoint:** `POST /webhook/admin-ab-experiments-list`
**Purpose:** List all A/B experiments
**Authentication:** Admin Bearer token

### admin.ab-experiment-create
**Endpoint:** `POST /webhook/admin-ab-experiment-create`
**Purpose:** Create new A/B test experiment
**Authentication:** Admin Bearer token

### admin.ab-experiment-update
**Endpoint:** `POST /webhook/admin-ab-experiment-update`
**Purpose:** Update existing A/B experiment
**Authentication:** Admin Bearer token

### admin.ai-docs-list
**Endpoint:** `POST /webhook/admin-ai-docs-list`
**Purpose:** List AI documentation entries
**Authentication:** Admin Bearer token

### admin.ai-docs-delete
**Endpoint:** `POST /webhook/admin-ai-docs-delete`
**Purpose:** Delete AI documentation entry
**Authentication:** Admin Bearer token

### admin.legal-docs-list
**Endpoint:** `POST /webhook/admin-legal-docs-list`
**Purpose:** List legal documents
**Authentication:** Admin Bearer token

### admin.legal-docs-update
**Endpoint:** `POST /webhook/admin-legal-docs-update`
**Purpose:** Update legal document
**Authentication:** Admin Bearer token

---

## Chat & Messages

### chat.create.v2
**Endpoint:** `POST /webhook/chat-create`
**Purpose:** Create new chat
**Authentication:** Bearer token

### chat.list
**Endpoint:** `POST /webhook/chat-list`
**Purpose:** Get user's chat list
**Authentication:** Bearer token

### chat.delete
**Endpoint:** `POST /webhook/chat-delete`
**Purpose:** Delete specific chat
**Authentication:** Bearer token

### save-message
**Endpoint:** `POST /webhook/save-message`
**Purpose:** Save message to chat
**Authentication:** Bearer token

### get-chat-history
**Endpoint:** `POST /webhook/get-chat-history`
**Purpose:** Retrieve chat message history
**Authentication:** Bearer token

---

## Analytics

### analytics
**Endpoint:** `POST /webhook/analytics`
**Purpose:** Track analytics events
**Authentication:** Bearer token

---

## Backups

### backup.create
**Endpoint:** `POST /webhook/backup-create`
**Purpose:** Create database backup
**Authentication:** Admin Bearer token

### backup.list
**Endpoint:** `POST /webhook/backup-list`
**Purpose:** List all backups
**Authentication:** Admin Bearer token

### backup.restore
**Endpoint:** `POST /webhook/backup-restore`
**Purpose:** Restore from backup
**Authentication:** Admin Bearer token

### backup.delete
**Endpoint:** `POST /webhook/backup-delete`
**Purpose:** Delete backup file
**Authentication:** Admin Bearer token

---

## Health & Monitoring

### health-check
**Endpoint:** `GET /webhook/health`
**Purpose:** Basic health check endpoint
**Authentication:** None

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "ISO-8601"
}
```

### health-check-list
**Endpoint:** `POST /webhook/health-check-list`
**Purpose:** Detailed health check with component status
**Authentication:** Admin Bearer token

---

## Cron Jobs

### cron.cleanup
**Purpose:** Clean up expired sessions and old data
**Schedule:** Daily

### cron.aggregate-stats
**Purpose:** Aggregate analytics statistics
**Schedule:** Hourly

### cron.export-workflows
**Purpose:** Export n8n workflows to git repository
**Schedule:** Daily

---

## Rate Limiting

### rate-limit.check
**Endpoint:** `POST /webhook/rate-limit-check`
**Purpose:** Check if user is within rate limits
**Authentication:** Bearer token

**Request:**
```json
{
  "user_id": "uuid",
  "limit_type": "daily_requests"
}
```

**Response:**
```json
{
  "allowed": true,
  "current_usage": 50,
  "limit": 1000,
  "reset_at": "timestamp"
}
```

---

## Common Patterns

### Authentication Flow
1. Extract token from `Authorization: Bearer <token>` header
2. Validate session in database
3. Check expiration and activity
4. Return user context or 401

### Error Responses
All endpoints return consistent error format:
```json
{
  "success": false,
  "error": "error_code",
  "status": 400,
  "message": "Human readable error message"
}
```

### Success Responses
All endpoints return:
```json
{
  "success": true,
  "data": { ... },
  "traceId": "uuid" // optional
}
```

---

## Migration Notes

When migrating to proper backend:

1. **Database queries** are embedded in workflow nodes - extract to repository pattern
2. **Validation logic** is in Function nodes - convert to DTOs/validators
3. **Business logic** is spread across nodes - consolidate into service layer
4. **Error handling** uses IF nodes - convert to try/catch with proper exception classes
5. **Authentication** is repeated in each workflow - extract to middleware/guards

See `MIGRATION_PLAN.md` for detailed migration strategy.
