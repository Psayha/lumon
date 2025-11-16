import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Enable CORS for frontend and admin panel
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://lumon.psayha.ru',
      'https://psayha.ru',
      'https://admin.psayha.ru', // Admin panel
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

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
