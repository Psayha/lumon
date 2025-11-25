import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import appConfig from './config/app.config';
import { typeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { AdminModule } from './modules/admin/admin.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UserLimitsModule } from './modules/user-limits/user-limits.module';
import { HealthModule } from './modules/health/health.module';
import { CleanupModule } from './modules/cleanup/cleanup.module';
import { AgentsModule } from './modules/agents/agents.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';
import { CsrfProtectionMiddleware } from './common/middleware/csrf-protection.middleware';
import { HttpsEnforcementMiddleware } from './common/middleware/https-enforcement.middleware';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // SECURITY FIX: Add rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 900000, // 15 minutes
        limit: 1000, // 1000 requests per 15 minutes
      },
    ]),

    // Database
    TypeOrmModule.forRoot(typeOrmConfig),

    // SECURITY: Automated cleanup jobs
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    ChatModule,
    AdminModule,
    AnalyticsModule,
    UserLimitsModule,
    HealthModule,
    CleanupModule,
    AgentsModule,
    KnowledgeBaseModule,
  ],
  providers: [
    // SECURITY FIX: Enable rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // SECURITY: Enforce HTTPS in production (must be first)
    consumer.apply(HttpsEnforcementMiddleware).forRoutes('*');

    // SECURITY: Apply CSRF protection to all routes
    consumer.apply(CsrfProtectionMiddleware).forRoutes('*');
  }
}
