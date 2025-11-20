import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { LoginAttempt } from '@entities';

/**
 * SECURITY: Account lockout configuration to prevent brute force attacks
 */
const LOCKOUT_CONFIG = {
  MAX_ATTEMPTS: 5, // Lock after 5 failed attempts
  LOCKOUT_DURATION_MINUTES: 60, // Lock for 1 hour
  ATTEMPT_WINDOW_MINUTES: 15, // Count attempts within last 15 minutes
};

/**
 * Service to manage account lockouts and failed login attempts
 * Prevents brute force attacks by temporarily locking accounts
 */
@Injectable()
export class LockoutService {
  constructor(
    @InjectRepository(LoginAttempt)
    private loginAttemptRepository: Repository<LoginAttempt>,
  ) {}

  /**
   * Check if an identifier (username, email, IP) is currently locked
   * @returns Object with locked status and remaining time
   */
  async isLocked(
    identifier: string,
    identifierType: 'username' | 'email' | 'ip',
  ): Promise<{ locked: boolean; lockedUntil?: Date; remainingMinutes?: number }> {
    const now = new Date();

    // Find active lockout for this identifier
    const lockout = await this.loginAttemptRepository.findOne({
      where: {
        identifier,
        identifier_type: identifierType,
        is_locked: true,
      },
      order: {
        locked_until: 'DESC',
      },
    });

    if (!lockout) {
      return { locked: false };
    }

    // Check if lockout has expired
    if (lockout.locked_until && lockout.locked_until <= now) {
      // Lockout expired, remove it
      await this.loginAttemptRepository.update(lockout.id, {
        is_locked: false,
        locked_until: undefined,
      });
      return { locked: false };
    }

    // Still locked
    const remainingMs = lockout.locked_until
      ? lockout.locked_until.getTime() - now.getTime()
      : 0;
    const remainingMinutes = Math.ceil(remainingMs / 60000);

    return {
      locked: true,
      lockedUntil: lockout.locked_until,
      remainingMinutes,
    };
  }

  /**
   * Record a failed login attempt
   * Automatically locks if threshold exceeded
   */
  async recordFailedAttempt(
    identifier: string,
    identifierType: 'username' | 'email' | 'ip',
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ locked: boolean; attemptsRemaining: number }> {
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - LOCKOUT_CONFIG.ATTEMPT_WINDOW_MINUTES * 60000,
    );

    // Count recent attempts within the window
    const recentAttempts = await this.loginAttemptRepository.count({
      where: {
        identifier,
        identifier_type: identifierType,
        attempt_time: LessThan(now) as any,
      },
    });

    // Record this attempt
    const attemptCount = recentAttempts + 1;
    const shouldLock = attemptCount >= LOCKOUT_CONFIG.MAX_ATTEMPTS;

    const lockedUntil = shouldLock
      ? new Date(now.getTime() + LOCKOUT_CONFIG.LOCKOUT_DURATION_MINUTES * 60000)
      : undefined;

    await this.loginAttemptRepository.save({
      identifier,
      identifier_type: identifierType,
      ip_address: ipAddress,
      user_agent: userAgent,
      is_locked: shouldLock,
      locked_until: lockedUntil,
      attempt_count: attemptCount,
    });

    const attemptsRemaining = Math.max(
      0,
      LOCKOUT_CONFIG.MAX_ATTEMPTS - attemptCount,
    );

    return {
      locked: shouldLock,
      attemptsRemaining,
    };
  }

  /**
   * Reset failed attempts for an identifier (called on successful login)
   */
  async resetAttempts(
    identifier: string,
    identifierType: 'username' | 'email' | 'ip',
  ): Promise<void> {
    // Delete all attempts for this identifier
    await this.loginAttemptRepository.delete({
      identifier,
      identifier_type: identifierType,
    });
  }

  /**
   * Manually unlock an identifier (for admin override)
   */
  async unlock(
    identifier: string,
    identifierType: 'username' | 'email' | 'ip',
  ): Promise<void> {
    await this.loginAttemptRepository.update(
      {
        identifier,
        identifier_type: identifierType,
        is_locked: true,
      },
      {
        is_locked: false,
        locked_until: undefined,
      },
    );
  }

  /**
   * Cleanup expired lockouts and old attempts
   * Should be called periodically (e.g., via cron job)
   */
  async cleanupExpired(): Promise<void> {
    const now = new Date();
    const cutoffTime = new Date(
      now.getTime() - LOCKOUT_CONFIG.ATTEMPT_WINDOW_MINUTES * 60000 * 2,
    ); // Keep 2x window for analysis

    // Remove expired lockouts
    await this.loginAttemptRepository.delete({
      is_locked: true,
      locked_until: LessThan(now),
    });

    // Remove old attempts outside the window
    await this.loginAttemptRepository.delete({
      is_locked: false,
      attempt_time: LessThan(cutoffTime),
    });
  }

  /**
   * Get lockout statistics for monitoring
   */
  async getStats(): Promise<{
    activeLockouts: number;
    recentAttempts: number;
  }> {
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - LOCKOUT_CONFIG.ATTEMPT_WINDOW_MINUTES * 60000,
    );

    const [activeLockouts, recentAttempts] = await Promise.all([
      this.loginAttemptRepository.count({
        where: {
          is_locked: true,
          locked_until: LessThan(now) as any,
        },
      }),
      this.loginAttemptRepository.count({
        where: {
          attempt_time: LessThan(now) as any,
        },
      }),
    ]);

    return {
      activeLockouts,
      recentAttempts,
    };
  }
}
