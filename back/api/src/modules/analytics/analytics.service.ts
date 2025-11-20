import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEvent } from '@entities';
import { LogEventDto } from './dto/log-event.dto';
import { CurrentUserData } from '@/common/decorators/current-user.decorator';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AuditEvent)
    private auditRepository: Repository<AuditEvent>,
  ) {}

  /**
   * Log analytics event
   * Replaces: analytics.json workflow
   */
  async logEvent(
    dto: LogEventDto,
    user: CurrentUserData,
    ip: string,
    userAgent: string,
  ) {
    const event = await this.auditRepository.save({
      user_id: user.id,
      action: dto.action,
      resource_type: dto.resource || 'analytics',
      resource_id: dto.resource_id || undefined,
      metadata: dto.meta || {},
      ip,
      user_agent: userAgent,
    }) as AuditEvent;

    return {
      success: true,
      data: {
        event_id: event.id,
        action: dto.action,
        timestamp: event.created_at,
      },
    };
  }

  /**
   * Get analytics for user
   */
  async getUserAnalytics(userId: string, limit = 100) {
    // SECURITY FIX: Validate limit parameter to prevent DoS
    const validatedLimit = Math.max(1, Math.min(limit || 100, 200));

    const events = await this.auditRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: validatedLimit,
    });

    return {
      success: true,
      data: events,
    };
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(userId?: string, limit = 500) {
    const where = userId ? { user_id: userId } : {};

    // SECURITY FIX: Validate limit parameter instead of hardcoded 1000
    const validatedLimit = Math.max(1, Math.min(limit || 500, 1000));

    const events = await this.auditRepository.find({
      where,
      order: { created_at: 'DESC' },
      take: validatedLimit,
    });

    // Group by action
    const summary: Record<string, number> = {};
    events.forEach((event) => {
      if (!summary[event.action]) {
        summary[event.action] = 0;
      }
      summary[event.action]++;
    });

    return {
      success: true,
      data: {
        total_events: events.length,
        summary,
      },
    };
  }
}
