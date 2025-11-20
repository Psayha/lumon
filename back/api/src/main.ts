import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { runMigrations } from './database/migration-runner';

async function bootstrap() {
  // SECURITY FIX: Run database migrations automatically before starting the app
  // This ensures all security constraints (UNIQUE, CHECK) are created
  await runMigrations();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // SECURITY FIX: Add cookie parser for httpOnly cookies
  // Required for admin authentication via secure cookies
  app.use(cookieParser());

  // SECURITY FIX: Add Helmet.js for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // SECURITY FIX: Proper CORS configuration
  // CORS origins from environment variable (comma-separated)
  // Example: CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://yourdomain.com
  const corsOriginsEnv = process.env.CORS_ORIGINS;

  const allowedOrigins = corsOriginsEnv
    ? corsOriginsEnv.split(',').map(origin => origin.trim())
    : process.env.NODE_ENV === 'production'
    ? []  // In production, CORS_ORIGINS MUST be set explicitly
    : [
        'http://localhost:5173',
        'http://localhost:3000',
      ];

  if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    console.warn(
      '⚠️  WARNING: CORS_ORIGINS not set in production! ' +
      'Set CORS_ORIGINS environment variable with allowed origins. ' +
      'See .env.example for details.'
    );
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    maxAge: 86400, // 24 hours
  });

  // SECURITY FIX: Stricter validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, // Reject unknown properties
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  // SECURITY FIX: Global exception filter
  // Prevents leaking internal paths and stack traces in production
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
╔═══════════════════════════════════════╗
║   🚀 Lumon API Server Started!       ║
╠═══════════════════════════════════════╣
║   Port: ${port}                        ║
║   Environment: ${process.env.NODE_ENV || 'development'}          ║
║   Database: ${process.env.DB_DATABASE || 'lumon'}              ║
╚═══════════════════════════════════════╝

Available endpoints:

Auth (4):
  POST   /webhook/auth-init-v2
  POST   /webhook/auth-validate-v2
  POST   /webhook/auth-logout
  POST   /webhook/auth-refresh

Chat (5):
  POST   /webhook/chat-create
  GET    /webhook/chat-list
  POST   /webhook/chat-delete
  POST   /webhook/chat-save-message
  POST   /webhook/chat-get-history

Admin (17):
  POST   /webhook/admin/login
  POST   /webhook/admin/validate
  POST   /webhook/admin/users-list
  POST   /webhook/admin/companies-list
  POST   /webhook/admin/user-delete
  POST   /webhook/admin/user-limits-list
  POST   /webhook/admin/user-limits-update
  POST   /webhook/admin/stats-platform
  POST   /webhook/admin/logs-list
  POST   /webhook/admin/ab-experiments-list
  POST   /webhook/admin/ab-experiment-create
  POST   /webhook/admin/ab-experiment-update
  POST   /webhook/admin/user-history-clear

Analytics (1):
  POST   /webhook/analytics-log-event

User Limits (2):
  POST   /webhook/user-limits
  POST   /webhook/rate-limit-check

Health (2):
  GET    /health
  GET    /health/detailed

Total: 31 endpoints migrated from n8n!

Ready to accept connections!
  `);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
