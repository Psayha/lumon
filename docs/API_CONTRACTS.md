# API Contracts (TypeScript)

TypeScript type definitions for all API endpoints. Use these types when migrating to proper backend to ensure API compatibility.

## Table of Contents
- [Common Types](#common-types)
- [Authentication](#authentication)
- [Admin](#admin)
- [Chat](#chat)
- [Analytics](#analytics)
- [Backups](#backups)

---

## Common Types

```typescript
// Base response types
interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  traceId?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  status: number;
  message: string;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// User types
interface User {
  id: string; // UUID
  telegram_id: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
}

// Session types
interface Session {
  expires_at: string; // ISO-8601 timestamp
  last_activity_at: string; // ISO-8601 timestamp
}

// Role & Permissions
type UserRole = 'owner' | 'manager' | 'viewer';

type Permission =
  | 'read'
  | 'write'
  | 'delete'
  | 'manage_users'
  | 'manage_company';

interface RolePermissions {
  owner: Permission[];
  manager: Permission[];
  viewer: Permission[];
}

// Pagination
interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

---

## Authentication

### POST /webhook/auth-init-v2

```typescript
interface AuthInitRequest {
  initData: string; // Telegram WebApp initData string
}

interface AuthInitResponse {
  success: true;
  session_token: string; // UUID v4
  user: User;
}

type AuthInit = (req: AuthInitRequest) => Promise<ApiResponse<AuthInitResponse>>;
```

### POST /webhook/auth-validate-v2

```typescript
// Headers
interface AuthHeaders {
  Authorization: `Bearer ${string}`;
}

interface UserContext {
  user: User & {
    company_name: string | null;
    permissions: Permission[];
  };
  role: UserRole;
  companyId: string | null;
  session: Session;
}

type AuthValidate = (headers: AuthHeaders) => Promise<ApiResponse<UserContext>>;
```

### POST /webhook/auth-logout

```typescript
interface LogoutRequest {
  // Token from Authorization header
}

interface LogoutResponse {
  success: true;
  message: string;
}

type AuthLogout = (headers: AuthHeaders) => Promise<ApiResponse<LogoutResponse>>;
```

### POST /webhook/auth-refresh

```typescript
interface RefreshResponse {
  success: true;
  session_token: string; // New token
  expires_at: string;
}

type AuthRefresh = (headers: AuthHeaders) => Promise<ApiResponse<RefreshResponse>>;
```

### POST /webhook/auth-switch-company

```typescript
interface SwitchCompanyRequest {
  company_id: string; // UUID
}

interface SwitchCompanyResponse {
  success: true;
  company: {
    id: string;
    name: string;
    role: UserRole;
  };
}

type AuthSwitchCompany = (
  req: SwitchCompanyRequest,
  headers: AuthHeaders
) => Promise<ApiResponse<SwitchCompanyResponse>>;
```

### POST /webhook/auth-set-viewer-role

```typescript
interface SetViewerRoleResponse {
  success: true;
  role: 'viewer';
  permissions: Permission[];
}

type AuthSetViewerRole = (
  headers: AuthHeaders
) => Promise<ApiResponse<SetViewerRoleResponse>>;
```

---

## Admin

### Admin Auth Headers

```typescript
interface AdminHeaders {
  Authorization: `Bearer ${string}`; // Admin token
}
```

### POST /webhook/admin-login

```typescript
interface AdminLoginRequest {
  username: string;
  password: string;
}

interface AdminLoginResponse {
  success: true;
  token: string; // UUID
  admin: {
    id: string;
    username: string;
  };
  expires_at: string;
}

type AdminLogin = (req: AdminLoginRequest) => Promise<ApiResponse<AdminLoginResponse>>;
```

### POST /webhook/admin-validate

```typescript
interface AdminValidateRequest {
  token: string; // UUID
}

interface AdminValidateResponse {
  success: true;
  data: {
    admin_user_id: string;
    username: string;
    expires_at: string;
  };
  traceId: string;
}

type AdminValidate = (
  req: AdminValidateRequest
) => Promise<ApiResponse<AdminValidateResponse>>;
```

### POST /webhook/admin-users-list

```typescript
interface AdminUsersListRequest extends PaginationParams {
  search?: string;
  company_id?: string;
  role?: UserRole;
}

interface UserListItem extends User {
  created_at: string;
  last_activity: string | null;
  company_name: string | null;
  role: UserRole | null;
  is_active: boolean;
}

type AdminUsersList = (
  req: AdminUsersListRequest,
  headers: AdminHeaders
) => Promise<ApiResponse<PaginatedResponse<UserListItem>>>;
```

### POST /webhook/admin/user-delete

```typescript
interface AdminUserDeleteRequest {
  user_id: string; // UUID
}

interface AdminUserDeleteResponse {
  success: true;
  message: 'User deleted completely';
  user_id: string;
}

type AdminUserDelete = (
  req: AdminUserDeleteRequest,
  headers: AdminHeaders
) => Promise<ApiResponse<AdminUserDeleteResponse>>;
```

### POST /webhook/admin/user-history-clear

```typescript
interface AdminUserHistoryClearRequest {
  user_id: string; // UUID
}

interface AdminUserHistoryClearResponse {
  success: true;
  message: 'User history cleared';
  user_id: string;
}

type AdminUserHistoryClear = (
  req: AdminUserHistoryClearRequest,
  headers: AdminHeaders
) => Promise<ApiResponse<AdminUserHistoryClearResponse>>;
```

### POST /webhook/admin-user-limits-update

```typescript
type LimitType = 'daily_requests' | 'monthly_requests' | 'concurrent_chats';

interface AdminUserLimitsUpdateRequest {
  user_id: string; // UUID
  limit_type: LimitType;
  limit_value: number;
  reset_at?: string | null; // ISO-8601 timestamp
}

interface UserLimit {
  id: string;
  userId: string;
  limitType: LimitType;
  limitValue: number;
  resetAt: string | null;
}

type AdminUserLimitsUpdate = (
  req: AdminUserLimitsUpdateRequest,
  headers: AdminHeaders
) => Promise<ApiResponse<UserLimit>>;
```

### POST /webhook/admin-user-limits-list

```typescript
interface AdminUserLimitsListRequest {
  user_id?: string; // Optional filter
}

type AdminUserLimitsList = (
  req: AdminUserLimitsListRequest,
  headers: AdminHeaders
) => Promise<ApiResponse<UserLimit[]>>;
```

### POST /webhook/admin-companies-list

```typescript
interface Company {
  id: string;
  name: string;
  created_at: string;
  owner_id: string;
  members_count: number;
  is_active: boolean;
}

type AdminCompaniesList = (
  headers: AdminHeaders
) => Promise<ApiResponse<Company[]>>;
```

### POST /webhook/admin-logs-list

```typescript
interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
}

interface AdminLogsListRequest extends PaginationParams {
  level?: LogEntry['level'];
  from?: string; // ISO-8601
  to?: string; // ISO-8601
}

type AdminLogsList = (
  req: AdminLogsListRequest,
  headers: AdminHeaders
) => Promise<ApiResponse<PaginatedResponse<LogEntry>>>;
```

### POST /webhook/admin-stats-platform

```typescript
interface PlatformStats {
  users: {
    total: number;
    active_today: number;
    active_week: number;
    active_month: number;
  };
  chats: {
    total: number;
    created_today: number;
  };
  messages: {
    total: number;
    sent_today: number;
  };
  companies: {
    total: number;
  };
}

type AdminStatsPlatform = (
  headers: AdminHeaders
) => Promise<ApiResponse<PlatformStats>>;
```

### A/B Testing Admin Endpoints

```typescript
interface ABExperiment {
  id: string;
  name: string;
  description: string;
  variant_a: string;
  variant_b: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

interface ABExperimentCreateRequest {
  name: string;
  description: string;
  variant_a: string;
  variant_b: string;
  start_date: string;
  end_date?: string;
}

interface ABExperimentUpdateRequest {
  id: string;
  name?: string;
  description?: string;
  is_active?: boolean;
  end_date?: string | null;
}

type AdminABExperimentsList = (
  headers: AdminHeaders
) => Promise<ApiResponse<ABExperiment[]>>;

type AdminABExperimentCreate = (
  req: ABExperimentCreateRequest,
  headers: AdminHeaders
) => Promise<ApiResponse<ABExperiment>>;

type AdminABExperimentUpdate = (
  req: ABExperimentUpdateRequest,
  headers: AdminHeaders
) => Promise<ApiResponse<ABExperiment>>;
```

### Legal & AI Docs Admin Endpoints

```typescript
interface Document {
  id: string;
  title: string;
  content: string;
  type: 'legal' | 'ai_doc';
  version: number;
  created_at: string;
  updated_at: string;
}

interface DocumentUpdateRequest {
  id: string;
  title?: string;
  content?: string;
}

type AdminAIDocsList = (
  headers: AdminHeaders
) => Promise<ApiResponse<Document[]>>;

type AdminAIDocsDelete = (
  req: { id: string },
  headers: AdminHeaders
) => Promise<ApiResponse<{ success: true; id: string }>>;

type AdminLegalDocsList = (
  headers: AdminHeaders
) => Promise<ApiResponse<Document[]>>;

type AdminLegalDocsUpdate = (
  req: DocumentUpdateRequest,
  headers: AdminHeaders
) => Promise<ApiResponse<Document>>;
```

---

## Chat

```typescript
interface Chat {
  id: string; // UUID
  user_id: string;
  company_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}
```

### POST /webhook/chat-create

```typescript
interface ChatCreateRequest {
  title?: string;
  company_id?: string;
}

interface ChatCreateResponse {
  success: true;
  chat: Chat;
}

type ChatCreate = (
  req: ChatCreateRequest,
  headers: AuthHeaders
) => Promise<ApiResponse<ChatCreateResponse>>;
```

### POST /webhook/chat-list

```typescript
interface ChatListRequest extends PaginationParams {
  company_id?: string;
}

type ChatList = (
  req: ChatListRequest,
  headers: AuthHeaders
) => Promise<ApiResponse<PaginatedResponse<Chat>>>;
```

### POST /webhook/chat-delete

```typescript
interface ChatDeleteRequest {
  chat_id: string;
}

interface ChatDeleteResponse {
  success: true;
  message: string;
  chat_id: string;
}

type ChatDelete = (
  req: ChatDeleteRequest,
  headers: AuthHeaders
) => Promise<ApiResponse<ChatDeleteResponse>>;
```

### POST /webhook/save-message

```typescript
interface SaveMessageRequest {
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SaveMessageResponse {
  success: true;
  message: Message;
}

type SaveMessage = (
  req: SaveMessageRequest,
  headers: AuthHeaders
) => Promise<ApiResponse<SaveMessageResponse>>;
```

### POST /webhook/get-chat-history

```typescript
interface GetChatHistoryRequest {
  chat_id: string;
  limit?: number;
  before_id?: string; // For pagination
}

interface GetChatHistoryResponse {
  success: true;
  messages: Message[];
  has_more: boolean;
}

type GetChatHistory = (
  req: GetChatHistoryRequest,
  headers: AuthHeaders
) => Promise<ApiResponse<GetChatHistoryResponse>>;
```

---

## Analytics

```typescript
interface AnalyticsEvent {
  event_name: string;
  user_id?: string;
  session_id?: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
}

interface AnalyticsTrackRequest {
  events: AnalyticsEvent[];
}

interface AnalyticsTrackResponse {
  success: true;
  tracked: number;
}

type AnalyticsTrack = (
  req: AnalyticsTrackRequest,
  headers: AuthHeaders
) => Promise<ApiResponse<AnalyticsTrackResponse>>;
```

---

## Backups

```typescript
interface Backup {
  id: string;
  filename: string;
  size: number; // bytes
  created_at: string;
  tables: string[];
}

interface BackupCreateRequest {
  tables?: string[]; // Specific tables or all
  description?: string;
}

type BackupCreate = (
  req: BackupCreateRequest,
  headers: AdminHeaders
) => Promise<ApiResponse<Backup>>;

type BackupList = (
  headers: AdminHeaders
) => Promise<ApiResponse<Backup[]>>;

interface BackupRestoreRequest {
  backup_id: string;
  tables?: string[]; // Specific tables or all
}

interface BackupRestoreResponse {
  success: true;
  restored_tables: string[];
  message: string;
}

type BackupRestore = (
  req: BackupRestoreRequest,
  headers: AdminHeaders
) => Promise<ApiResponse<BackupRestoreResponse>>;

type BackupDelete = (
  req: { backup_id: string },
  headers: AdminHeaders
) => Promise<ApiResponse<{ success: true; message: string }>>;
```

---

## Health & Rate Limiting

```typescript
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version?: string;
}

type HealthCheck = () => Promise<HealthCheckResponse>;

interface HealthCheckDetailedResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  components: {
    database: 'up' | 'down';
    redis?: 'up' | 'down';
    n8n: 'up' | 'down';
  };
  uptime: number; // seconds
}

type HealthCheckDetailed = (
  headers: AdminHeaders
) => Promise<ApiResponse<HealthCheckDetailedResponse>>;
```

### Rate Limiting

```typescript
interface RateLimitCheckRequest {
  user_id: string;
  limit_type: LimitType;
}

interface RateLimitCheckResponse {
  allowed: boolean;
  current_usage: number;
  limit: number;
  reset_at: string;
  retry_after?: number; // seconds until can retry
}

type RateLimitCheck = (
  req: RateLimitCheckRequest,
  headers: AuthHeaders
) => Promise<ApiResponse<RateLimitCheckResponse>>;
```

---

## Usage Examples

### Frontend Usage

```typescript
// lib/api/auth.ts
import type { AuthInit, AuthValidate, UserContext } from '@/types/api-contracts';

export const authApi = {
  async init(initData: string): Promise<UserContext> {
    const response = await fetch('/webhook/auth-init-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData })
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    return result.data;
  },

  async validate(token: string): Promise<UserContext> {
    const response = await fetch('/webhook/auth-validate-v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    return result.data;
  }
};
```

### Backend Implementation (Future)

```typescript
// src/modules/auth/auth.controller.ts
import { Controller, Post, Headers, Body } from '@nestjs/common';
import type { AuthValidate, UserContext } from '@/types/api-contracts';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('validate')
  async validate(
    @Headers('authorization') auth: string
  ): Promise<ApiResponse<UserContext>> {
    const token = auth?.replace('Bearer ', '');
    if (!token) {
      return {
        success: false,
        error: 'unauthorized',
        status: 401,
        message: 'Missing token'
      };
    }

    try {
      const userContext = await this.authService.validateSession(token);
      return {
        success: true,
        data: userContext
      };
    } catch (error) {
      return {
        success: false,
        error: 'unauthorized',
        status: 401,
        message: error.message
      };
    }
  }
}
```

---

## Notes for Migration

1. **Type Safety**: Use these types in both frontend and backend
2. **Validation**: Add runtime validation with `zod` or `class-validator`
3. **OpenAPI**: Generate OpenAPI spec from these types
4. **Testing**: Write tests that verify these contracts
5. **Breaking Changes**: Document any deviations from these contracts

See `MIGRATION_PLAN.md` for step-by-step migration guide.
