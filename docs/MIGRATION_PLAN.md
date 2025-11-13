# Backend Migration Plan

Complete guide for migrating from n8n workflows to proper backend framework.

## Table of Contents
- [Why Migrate](#why-migrate)
- [When to Migrate](#when-to-migrate)
- [Technology Stack Recommendation](#technology-stack-recommendation)
- [Migration Strategy](#migration-strategy)
- [Phase-by-Phase Plan](#phase-by-phase-plan)
- [Testing Strategy](#testing-strategy)
- [Rollback Plan](#rollback-plan)

---

## Why Migrate

### Current State (n8n)
✅ **Pros:**
- Fast MVP development
- Visual workflow documentation
- Easy to modify without code deployment
- Built-in Postgres integration

❌ **Cons:**
- No type safety
- Difficult debugging
- No unit testing
- SQL injection risks
- Poor performance at scale
- Hard to code review
- No IDE support

### Target State (NestJS/FastAPI)
✅ **Pros:**
- Full type safety
- Unit & integration tests
- Better performance
- Proper error handling
- IDE support & autocomplete
- Easy code review
- Industry-standard patterns

---

## When to Migrate

### ✅ Continue with n8n if:
- < 100 active users
- < 1,000 requests/day
- Still finding product-market fit
- Team size < 3 developers
- Budget constraints

### ⚠️ Start Planning Migration if:
- 100-500 active users
- 1,000-10,000 requests/day
- Need better error tracking
- Adding more developers
- Security audit upcoming

### 🚨 Urgent Migration if:
- 500+ active users
- 10,000+ requests/day
- Raising investment round
- B2B customers asking about architecture
- Experiencing performance issues
- Security incidents

---

## Technology Stack Recommendation

### Option 1: NestJS (TypeScript) ⭐ Recommended

**Best for:** TypeScript teams, enterprise features, rapid development

```
Backend:
- NestJS (framework)
- TypeORM or Prisma (ORM)
- PostgreSQL (existing)
- Redis (caching & sessions)
- Bull (background jobs)

Testing:
- Jest (unit tests)
- Supertest (e2e tests)

Deployment:
- Docker
- PM2 or Kubernetes
```

**Pros:**
- TypeScript native
- Excellent dependency injection
- Built-in testing support
- Massive ecosystem
- Similar to Angular (if team knows it)

**Cons:**
- Steeper learning curve
- More boilerplate than Express

### Option 2: FastAPI (Python)

**Best for:** Python teams, ML features, rapid prototyping

```
Backend:
- FastAPI (framework)
- SQLAlchemy (ORM)
- PostgreSQL
- Redis
- Celery (background jobs)

Testing:
- Pytest

Deployment:
- Docker
- Uvicorn + Gunicorn
```

**Pros:**
- Extremely fast development
- Auto-generated OpenAPI docs
- Great for ML integration
- Type hints support

**Cons:**
- Python deployment more complex
- Slightly slower than Node.js

### Option 3: Express.js (TypeScript)

**Best for:** Small teams, microservices, maximum flexibility

```
Backend:
- Express.js
- TypeORM/Prisma
- PostgreSQL
- Redis
- Bull

Testing:
- Jest
- Supertest
```

**Pros:**
- Simple & flexible
- Huge ecosystem
- Easy to hire for

**Cons:**
- More manual setup
- Less opinionated structure

---

## Migration Strategy

### Recommended: Strangler Fig Pattern

**Concept:** Gradually replace n8n endpoints with proper backend, one at a time.

```
┌─────────────────────────────────────┐
│           Nginx Proxy               │
│  Routes traffic based on endpoint   │
└──────────┬──────────────────────────┘
           │
           ├─► /webhook/auth-* ──────► NestJS (new)
           ├─► /webhook/admin-* ─────► NestJS (new)
           ├─► /webhook/chat-* ──────► n8n (old)
           └─► /webhook/* ───────────► n8n (fallback)
```

### Benefits:
- Zero downtime migration
- Easy rollback
- Test in production gradually
- Learn as you go

---

## Phase-by-Phase Plan

### Phase 0: Preparation (Week 1-2)

**Goal:** Set up new backend infrastructure

1. **Initialize NestJS Project**
```bash
npm i -g @nestjs/cli
nest new lumon-backend
cd lumon-backend
npm install @nestjs/typeorm typeorm pg redis @nestjs/bull bull
npm install --save-dev @types/node
```

2. **Project Structure**
```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/
│   │   │   ├── auth-init.dto.ts
│   │   │   └── auth-validate.dto.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   └── tests/
│   │       └── auth.service.spec.ts
│   ├── admin/
│   ├── chat/
│   └── analytics/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── config/
│   ├── database.config.ts
│   └── redis.config.ts
├── entities/
│   ├── user.entity.ts
│   ├── session.entity.ts
│   ├── chat.entity.ts
│   └── message.entity.ts
└── main.ts
```

3. **Database Connection**
```typescript
// src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false, // NEVER true in production
  logging: process.env.NODE_ENV === 'development',
};
```

4. **Copy Types from API_CONTRACTS.md**
```bash
mkdir src/types
cp docs/API_CONTRACTS.md src/types/api-contracts.ts
# Convert markdown to actual .ts file
```

---

### Phase 1: Auth Module (Week 3-4)

**Goal:** Migrate authentication endpoints

**Priority:** HIGH - Used by all other endpoints

#### 1.1 Create Entities

```typescript
// src/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  telegram_id: string;

  @Column()
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ nullable: true })
  username: string;

  @CreateDateColumn()
  created_at: Date;
}

// src/entities/session.entity.ts
@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  session_token: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid', { nullable: true })
  company_id: string;

  @Column({ type: 'enum', enum: ['owner', 'manager', 'viewer'] })
  role: string;

  @Column()
  expires_at: Date;

  @Column()
  last_activity_at: Date;

  @Column({ default: true })
  is_active: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

#### 1.2 Create DTOs

```typescript
// src/modules/auth/dto/auth-init.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class AuthInitDto {
  @IsString()
  @IsNotEmpty()
  initData: string;
}

// src/modules/auth/dto/auth-validate-response.dto.ts
export class AuthValidateResponseDto {
  user: {
    id: string;
    telegram_id: string;
    first_name: string;
    last_name: string;
    username: string;
    company_name: string;
    permissions: string[];
  };
  role: string;
  companyId: string;
  session: {
    expires_at: Date;
    last_activity_at: Date;
  };
}
```

#### 1.3 Implement Service

```typescript
// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../../entities/session.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async validateSession(token: string): Promise<AuthValidateResponseDto> {
    // Find session with user data (same SQL as n8n workflow)
    const session = await this.sessionRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.user', 'u')
      .leftJoin('companies', 'c', 's.company_id = c.id')
      .select([
        's.id',
        's.session_token',
        's.user_id',
        's.company_id',
        's.role',
        's.expires_at',
        's.last_activity_at',
        'u.telegram_id',
        'u.first_name',
        'u.last_name',
        'u.username',
        'c.name as company_name',
      ])
      .where('s.session_token = :token', { token })
      .andWhere('s.is_active = true')
      .getOne();

    if (!session) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Check expiration (same logic as n8n workflow)
    const now = new Date();
    if (now > session.expires_at) {
      throw new UnauthorizedException('Session has expired');
    }

    // Check activity window (same 24h grace as n8n)
    const hoursSinceActivity =
      (now.getTime() - session.last_activity_at.getTime()) / (1000 * 60 * 60);
    if (hoursSinceActivity > 24) {
      throw new UnauthorizedException('Session expired due to inactivity');
    }

    // Update activity (same logic as n8n workflow)
    await this.sessionRepository.update(
      { session_token: token },
      {
        last_activity_at: now,
        expires_at:
          session.expires_at.getTime() - now.getTime() < 2 * 24 * 60 * 60 * 1000
            ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            : session.expires_at,
      },
    );

    // Build response (same structure as n8n workflow)
    const permissions = this.getPermissionsForRole(session.role);

    return {
      user: {
        id: session.user_id,
        telegram_id: session.user.telegram_id,
        first_name: session.user.first_name,
        last_name: session.user.last_name,
        username: session.user.username,
        company_name: session.company_name,
        permissions,
      },
      role: session.role,
      companyId: session.company_id,
      session: {
        expires_at: session.expires_at,
        last_activity_at: session.last_activity_at,
      },
    };
  }

  private getPermissionsForRole(role: string): string[] {
    const permissions = {
      owner: ['read', 'write', 'delete', 'manage_users', 'manage_company'],
      manager: ['read', 'write', 'delete'],
      viewer: ['read'],
    };
    return permissions[role] || [];
  }
}
```

#### 1.4 Create Controller

```typescript
// src/modules/auth/auth.controller.ts
import { Controller, Post, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('validate')
  async validate(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    return {
      success: true,
      data: await this.authService.validateSession(token),
    };
  }
}
```

#### 1.5 Write Tests

```typescript
// src/modules/auth/tests/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Session } from '../../../entities/session.entity';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let sessionRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Session),
          useValue: {
            createQueryBuilder: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    sessionRepository = module.get(getRepositoryToken(Session));
  });

  describe('validateSession', () => {
    it('should throw UnauthorizedException for invalid token', async () => {
      sessionRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      await expect(service.validateSession('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return user context for valid token', async () => {
      const mockSession = {
        id: 'session-id',
        session_token: 'valid-token',
        user_id: 'user-id',
        company_id: 'company-id',
        role: 'owner',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        last_activity_at: new Date(),
        user: {
          telegram_id: '123',
          first_name: 'John',
          last_name: 'Doe',
          username: 'johndoe',
        },
        company_name: 'Test Company',
      };

      sessionRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockSession),
      });

      sessionRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.validateSession('valid-token');

      expect(result.user.first_name).toBe('John');
      expect(result.role).toBe('owner');
      expect(result.user.permissions).toContain('manage_users');
    });
  });
});
```

#### 1.6 Update Nginx Config

```nginx
# /etc/nginx/sites-available/lumon

location /api/auth/ {
    # Route to new backend
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /webhook/auth-validate-v2 {
    # Temporary redirect to new backend
    rewrite ^/webhook/auth-validate-v2$ /api/auth/validate break;
    proxy_pass http://localhost:3001;
    # ... same headers as above
}

location /webhook/ {
    # Fallback to n8n for non-migrated endpoints
    proxy_pass http://localhost:5678;
    # ... existing config
}
```

#### 1.7 Deploy & Test

```bash
# Build
npm run build

# Run tests
npm test

# Start backend
npm run start:prod

# Reload nginx
sudo nginx -t && sudo nginx -s reload

# Test endpoint
curl -X POST https://n8n.psayha.ru/api/auth/validate \
  -H "Authorization: Bearer your-token-here"
```

---

### Phase 2: Admin Module (Week 5-6)

**Goal:** Migrate admin endpoints

Follow same pattern as auth:
1. Create DTOs
2. Implement service with exact same SQL queries from workflows
3. Create controller
4. Write tests
5. Update nginx routing
6. Deploy & test

**Endpoints to migrate:**
- admin.login
- admin.validate
- admin.user-delete
- admin.user-history-clear
- admin.user-limits-update
- admin.users-list
- admin.companies-list
- admin.stats-platform

---

### Phase 3: Chat Module (Week 7-8)

**Endpoints:**
- chat.create.v2
- chat.list
- chat.delete
- save-message
- get-chat-history

---

### Phase 4: Background Jobs (Week 9)

**Goal:** Replace n8n cron workflows with Bull queues

```typescript
// src/modules/jobs/cleanup.processor.ts
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('cleanup')
export class CleanupProcessor {
  @Process('expired-sessions')
  async handleExpiredSessions(job: Job) {
    // Same SQL as cron.cleanup workflow
    await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .from(Session)
      .where('expires_at < NOW()')
      .execute();
  }
}
```

---

### Phase 5: Monitoring & Observability (Week 10)

1. **Logging**
```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  async validateSession(token: string) {
    this.logger.log(`Validating session: ${token.substring(0, 8)}...`);
    // ...
  }
}
```

2. **Health Checks**
```typescript
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

3. **Metrics** (Prometheus)
```bash
npm install @willsoto/nestjs-prometheus prom-client
```

---

## Testing Strategy

### Unit Tests
- Every service method
- 80%+ code coverage
- Mock database calls

### Integration Tests
- Test with real database (docker-compose)
- Test complete request flow
- Verify database state changes

### E2E Tests
```typescript
// test/auth.e2e-spec.ts
describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/auth/validate (POST) - valid token', () => {
    return request(app.getHttpServer())
      .post('/api/auth/validate')
      .set('Authorization', 'Bearer valid-token')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.user).toBeDefined();
      });
  });
});
```

### Load Testing
```bash
npm install -g artillery

# artillery.yml
config:
  target: 'https://n8n.psayha.ru'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'Auth validate'
    flow:
      - post:
          url: '/api/auth/validate'
          headers:
            Authorization: 'Bearer {{ token }}'

# Run
artillery run artillery.yml
```

---

## Rollback Plan

### Quick Rollback (< 5 minutes)

If new backend has critical bug:

```bash
# 1. Update nginx to route back to n8n
sudo nano /etc/nginx/sites-available/lumon

# Comment out new backend routes:
# location /api/auth/ {
#     proxy_pass http://localhost:3001;
# }

# Uncomment n8n fallback for all:
location / {
    proxy_pass http://localhost:5678;
}

# 2. Reload nginx
sudo nginx -t && sudo nginx -s reload

# 3. Stop new backend
pm2 stop lumon-backend
```

### Gradual Rollback

Route specific users to old backend:

```nginx
# Use cookie/header to route subset of traffic
map $http_x_beta_user $backend {
    default http://localhost:5678;  # n8n
    "true"  http://localhost:3001;  # new backend
}

location /api/auth/ {
    proxy_pass $backend;
}
```

---

## Timeline Summary

| Phase | Duration | Description | Risk |
|-------|----------|-------------|------|
| 0 | 1-2 weeks | Setup infrastructure | Low |
| 1 | 2 weeks | Auth module | Medium |
| 2 | 2 weeks | Admin module | Low |
| 3 | 2 weeks | Chat module | Low |
| 4 | 1 week | Background jobs | Medium |
| 5 | 1 week | Monitoring | Low |
| **Total** | **10 weeks** | | |

---

## Success Metrics

Track these metrics before/after migration:

- **Performance**: Response time (p50, p95, p99)
- **Reliability**: Error rate, uptime
- **Scalability**: Requests per second capacity
- **Developer velocity**: Time to add new feature
- **Code quality**: Test coverage, code review time

---

## Next Steps

1. Read `WORKFLOWS_MAP.md` to understand all endpoints
2. Review `API_CONTRACTS.md` for type definitions
3. Set up Phase 0 infrastructure
4. Start with auth.validate migration (highest usage)
5. Deploy to staging environment first
6. Monitor metrics closely
7. Gradually roll out to production

---

## Questions?

Before starting migration, ensure you can answer:

- [ ] Do we have 10 weeks of runway?
- [ ] Can we dedicate 1-2 developers full-time?
- [ ] Do we have staging environment?
- [ ] Is monitoring infrastructure ready?
- [ ] Have we documented all n8n workflows?
- [ ] Do we have test database for local development?
- [ ] Is team comfortable with chosen tech stack?

If any answer is "no", address that before starting migration.
