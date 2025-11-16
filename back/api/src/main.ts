import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://lumon.psayha.ru',
      'https://psayha.ru',
    ],
    credentials: true,
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
  POST   /webhook/auth-init-v2
  POST   /webhook/auth-validate-v2
  POST   /webhook/auth-logout
  POST   /webhook/auth-refresh
  POST   /webhook/chat-create
  POST   /webhook/chat-list
  POST   /webhook/chat-delete
  POST   /webhook/chat-save-message
  POST   /webhook/chat-get-history

Ready to accept connections!
  `);
}

bootstrap();
