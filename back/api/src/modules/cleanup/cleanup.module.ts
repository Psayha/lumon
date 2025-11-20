import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CleanupService } from '@/common/services/cleanup.service';
import {
  Session,
  AdminSession,
  IdempotencyKey,
  RateLimit,
  AuditEvent,
  LoginAttempt,
} from '@entities';

/**
 * SECURITY: Cleanup Module
 *
 * Provides automated cleanup jobs for expired/old records
 * Prevents database bloat and performance degradation
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Session,
      AdminSession,
      IdempotencyKey,
      RateLimit,
      AuditEvent,
      LoginAttempt,
    ]),
  ],
  providers: [CleanupService],
  exports: [CleanupService],
})
export class CleanupModule {}
