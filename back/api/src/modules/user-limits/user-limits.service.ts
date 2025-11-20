import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLimit, RateLimit } from '@entities';
import { getRateLimitConfig } from '@/config/rate-limits.config';

@Injectable()
export class UserLimitsService {
  constructor(
    @InjectRepository(UserLimit)
    private userLimitRepository: Repository<UserLimit>,
    @InjectRepository(RateLimit)
    private rateLimitRepository: Repository<RateLimit>,
  ) {}

  /**
   * Check user limit
   */
  async checkLimit(userId: string, limitType: string): Promise<boolean> {
    const limit = await this.userLimitRepository.findOne({
      where: { user_id: userId, limit_type: limitType },
    });

    if (!limit) {
      // No limit set = unlimited
      return true;
    }

    // Check if limit exceeded
    if (limit.current_usage >= limit.limit_value) {
      return false;
    }

    return true;
  }

  /**
   * Increment user limit usage
   * SECURITY FIX: Use atomic increment to prevent race conditions
   */
  async incrementLimit(userId: string, limitType: string) {
    let limit = await this.userLimitRepository.findOne({
      where: { user_id: userId, limit_type: limitType },
    });

    if (!limit) {
      // Create default limit if not exists
      limit = await this.userLimitRepository.save({
        user_id: userId,
        limit_type: limitType,
        limit_value: 1000, // Default limit
        current_usage: 1,
      });
    } else {
      // SECURITY FIX: Use atomic increment instead of read-modify-write
      // This prevents race condition where two concurrent requests
      // could read the same value and write incorrect increments
      await this.userLimitRepository.increment(
        { id: limit.id },
        'current_usage',
        1,
      );

      // Re-fetch to get updated value
      limit = await this.userLimitRepository.findOne({
        where: { id: limit.id },
      }) as UserLimit;
    }

    return limit;
  }

  /**
   * Get user limits
   */
  async getUserLimits(userId: string) {
    const limits = await this.userLimitRepository.find({
      where: { user_id: userId },
    });

    return {
      success: true,
      data: limits,
    };
  }

  /**
   * Check rate limit
   * Replaces: rate-limit.check.json workflow
   * SECURITY FIX: Use server-defined limits instead of client input
   */
  async checkRateLimit(userId: string, endpoint: string): Promise<boolean> {
    // SECURITY: Get limits from server config, NOT from user input!
    const config = getRateLimitConfig(endpoint);
    const { maxRequests, windowMinutes } = config;

    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

    // Get or create rate limit record
    const rateLimit = await this.rateLimitRepository.findOne({
      where: {
        user_id: userId,
        endpoint,
      },
      order: { window_start: 'DESC' },
    });

    if (!rateLimit || rateLimit.window_start < windowStart) {
      // Create new window
      await this.rateLimitRepository.save({
        user_id: userId,
        endpoint,
        request_count: 1,
        window_start: now,
      });
      return true;
    }

    // Check if limit exceeded
    if (rateLimit.request_count >= maxRequests) {
      throw new ForbiddenException('Rate limit exceeded');
    }

    // SECURITY FIX: Use atomic increment instead of read-modify-write
    // This prevents race condition where multiple concurrent requests
    // could bypass rate limits
    await this.rateLimitRepository.increment(
      { id: rateLimit.id },
      'request_count',
      1,
    );

    return true;
  }
}
