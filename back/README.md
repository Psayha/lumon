# 🔧 Lumon Backend

> **Status:** ✅ Migrated to NestJS
> **Active Directory:** [`./api`](./api)

## 🏗️ Structure

The backend architecture has migrated from n8n to a dedicated NestJS application.

- **[`api/`](./api)** - **Active Backend**. NestJS application (TypeORM, PostgreSQL, Telegram Bot).
- **`n8n/`** - _Legacy_. Old workflow automation files (kept for reference/backup).
- **`scripts/`** - Utility scripts.

## 🚀 Getting Started

Please refer to the **[API Documentation](./api/README.md)** for setup, development, and deployment instructions.

```bash
cd api
npm install
npm run start:dev
```
