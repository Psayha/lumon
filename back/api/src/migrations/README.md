# Database Migrations

This directory contains TypeORM migrations for schema changes.

## Running Migrations

### Run all pending migrations
```bash
npm run migration:run
```

### Revert last migration
```bash
npm run migration:revert
```

## Migration List

### 1763620075000-CreateAdminSessionsTable.ts
**Purpose**: Create dedicated `admin_sessions` table for admin authentication

**Changes**:
- Creates `admin_sessions` table with proper schema
- Adds indexes on `session_token` and `expires_at`
- Fixes admin login blocker (previously tried to save admin sessions in `sessions` table with null user_id)

**Status**: ✅ Required - Admin login will not work without this migration

---

### 1763620076000-RemoveRoleFromSessions.ts
**Purpose**: Remove `role` column from `sessions` table

**Changes**:
- Drops `role` column from `sessions` table
- Role is now dynamically determined from `user_companies` table

**Rationale**:
- Enables proper multi-tenancy (users can have different roles in different companies)
- Prevents role inconsistency
- Single source of truth for roles (user_companies table)

**Status**: ✅ Required - Role-based access control depends on this migration

---

## Important Notes

1. **Run migrations in production**: These migrations are required for the application to work correctly
2. **Backup before migrating**: Always backup your database before running migrations
3. **Order matters**: Migrations must be run in the order of their timestamps
4. **No rollback in production**: Never revert migrations in production without a good reason

## Manual Migration (if npm scripts don't work)

If the npm scripts fail, you can run migrations manually using TypeORM CLI:

```bash
# Install TypeORM CLI globally if not installed
npm install -g typeorm

# Run migrations
typeorm migration:run -d src/config/typeorm.config.ts

# Revert migration
typeorm migration:revert -d src/config/typeorm.config.ts
```
