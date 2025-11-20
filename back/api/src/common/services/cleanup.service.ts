import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  Session,
  AdminSession,
  IdempotencyKey,
  RateLimit,
  AuditEvent,
  LoginAttempt,
} from '@entities';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * SECURITY: Cleanup Service
 *
 * Периодически удаляет устаревшие записи для предотвращения:
 * - Переполнения БД (DoS)
 * - Утечки памяти
 * - Деградации производительности
 *
 * Запускается автоматически через cron jobs
 */
@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(AdminSession)
    private adminSessionRepository: Repository<AdminSession>,
    @InjectRepository(IdempotencyKey)
    private idempotencyKeyRepository: Repository<IdempotencyKey>,
    @InjectRepository(RateLimit)
    private rateLimitRepository: Repository<RateLimit>,
    @InjectRepository(AuditEvent)
    private auditEventRepository: Repository<AuditEvent>,
    @InjectRepository(LoginAttempt)
    private loginAttemptRepository: Repository<LoginAttempt>,
  ) {}

  /**
   * Cleanup expired user sessions
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const now = new Date();

      // Delete expired user sessions
      const deletedSessions = await this.sessionRepository.delete({
        expires_at: LessThan(now),
      });

      // Delete expired admin sessions
      const deletedAdminSessions = await this.adminSessionRepository.delete({
        expires_at: LessThan(now),
      });

      this.logger.log(
        `Cleaned up ${deletedSessions.affected || 0} expired user sessions, ` +
          `${deletedAdminSessions.affected || 0} admin sessions`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions:', error);
    }
  }

  /**
   * Cleanup expired idempotency keys
   * Runs every 6 hours
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async cleanupExpiredIdempotencyKeys(): Promise<void> {
    try {
      const now = new Date();

      const deleted = await this.idempotencyKeyRepository.delete({
        expires_at: LessThan(now),
      });

      this.logger.log(
        `Cleaned up ${deleted.affected || 0} expired idempotency keys`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup idempotency keys:', error);
    }
  }

  /**
   * Cleanup old rate limit records
   * Runs every 12 hours
   */
  @Cron(CronExpression.EVERY_12_HOURS)
  async cleanupOldRateLimits(): Promise<void> {
    try {
      const cutoffTime = new Date();
      // Keep only last 7 days of rate limit data
      cutoffTime.setDate(cutoffTime.getDate() - 7);

      const deleted = await this.rateLimitRepository.delete({
        created_at: LessThan(cutoffTime),
      });

      this.logger.log(
        `Cleaned up ${deleted.affected || 0} old rate limit records`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup rate limits:', error);
    }
  }

  /**
   * Cleanup old login attempts
   * Runs every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldLoginAttempts(): Promise<void> {
    try {
      const cutoffTime = new Date();
      // Keep only last 30 days of login attempts for analysis
      cutoffTime.setDate(cutoffTime.getDate() - 30);

      const deleted = await this.loginAttemptRepository.delete({
        attempt_time: LessThan(cutoffTime),
        is_locked: false, // Don't delete active lockouts
      });

      this.logger.log(
        `Cleaned up ${deleted.affected || 0} old login attempts`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup login attempts:', error);
    }
  }

  /**
   * Cleanup old audit events
   * Runs once per week
   * CONFIGURABLE: adjust retention period via environment variable
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOldAuditEvents(): Promise<void> {
    try {
      // Default: keep 90 days of audit logs
      const retentionDays = parseInt(
        process.env.AUDIT_LOG_RETENTION_DAYS || '90',
        10,
      );

      const cutoffTime = new Date();
      cutoffTime.setDate(cutoffTime.getDate() - retentionDays);

      const deleted = await this.auditEventRepository.delete({
        timestamp: LessThan(cutoffTime),
      });

      this.logger.log(
        `Cleaned up ${deleted.affected || 0} old audit events ` +
          `(retention: ${retentionDays} days)`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup audit events:', error);
    }
  }

  /**
   * Cleanup inactive user sessions (not expired but unused for 7+ days)
   * Runs once per day
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async cleanupInactiveSessions(): Promise<void> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setDate(cutoffTime.getDate() - 7);

      // Delete sessions where last_activity is older than 7 days
      const deleted = await this.sessionRepository
        .createQueryBuilder()
        .delete()
        .where('last_activity_at < :cutoffTime', { cutoffTime })
        .andWhere('is_active = true')
        .execute();

      this.logger.log(
        `Cleaned up ${deleted.affected || 0} inactive user sessions`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup inactive sessions:', error);
    }
  }

  /**
   * Get cleanup statistics
   * Useful for monitoring and alerting
   */
  async getCleanupStats(): Promise<{
    expiredSessions: number;
    expiredAdminSessions: number;
    expiredIdempotencyKeys: number;
    oldRateLimits: number;
    oldLoginAttempts: number;
    oldAuditEvents: number;
  }> {
    const now = new Date();
    const cutoffTime = new Date();
    cutoffTime.setDate(cutoffTime.getDate() - 7);

    const [
      expiredSessions,
      expiredAdminSessions,
      expiredIdempotencyKeys,
      oldRateLimits,
      oldLoginAttempts,
      oldAuditEvents,
    ] = await Promise.all([
      this.sessionRepository.count({
        where: { expires_at: LessThan(now) },
      }),
      this.adminSessionRepository.count({
        where: { expires_at: LessThan(now) },
      }),
      this.idempotencyKeyRepository.count({
        where: { expires_at: LessThan(now) },
      }),
      this.rateLimitRepository.count({
        where: { created_at: LessThan(cutoffTime) },
      }),
      this.loginAttemptRepository.count({
        where: {
          attempt_time: LessThan(cutoffTime),
          is_locked: false,
        },
      }),
      this.auditEventRepository.count({
        where: { timestamp: LessThan(cutoffTime) },
      }),
    ]);

    return {
      expiredSessions,
      expiredAdminSessions,
      expiredIdempotencyKeys,
      oldRateLimits,
      oldLoginAttempts,
      oldAuditEvents,
    };
  }

  /**
   * Manual cleanup trigger (for admin panel)
   */
  async runAllCleanupJobs(): Promise<{
    success: boolean;
    message: string;
    stats: any;
  }> {
    try {
      await Promise.all([
        this.cleanupExpiredSessions(),
        this.cleanupExpiredIdempotencyKeys(),
        this.cleanupOldRateLimits(),
        this.cleanupOldLoginAttempts(),
        this.cleanupOldAuditEvents(),
        this.cleanupInactiveSessions(),
      ]);

      const stats = await this.getCleanupStats();

      return {
        success: true,
        message: 'All cleanup jobs completed successfully',
        stats,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Cleanup failed: ${error.message}`,
        stats: null,
      };
    }
  }
}
