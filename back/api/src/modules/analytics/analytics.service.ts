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
      action: `analytics.${dto.event_name}`,
      resource_type: dto.category || 'analytics',
      metadata: dto.properties || {},
      ip,
      user_agent: userAgent,
    });

    return {
      success: true,
      data: {
        event_id: event.id,
        event_name: dto.event_name,
        timestamp: event.created_at,
      },
    };
  }

  /**
   * Get analytics for user
   */
  async getUserAnalytics(userId: string, limit = 100) {
    const events = await this.auditRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
    });

    return {
      success: true,
      data: events,
    };
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(userId?: string) {
    const where = userId ? { user_id: userId } : {};

    const events = await this.auditRepository.find({
      where,
      order: { created_at: 'DESC' },
      take: 1000,
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
