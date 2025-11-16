import {
  Controller,
  Post,
  Body,
  UseGuards,
  Ip,
  Headers,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { LogEventDto } from './dto/log-event.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '@/common/decorators/current-user.decorator';

@Controller('webhook')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * POST /webhook/analytics-log-event
   * Replaces: analytics.json workflow
   */
  @Post('analytics-log-event')
  async logEvent(
    @Body() dto: LogEventDto,
    @CurrentUser() user: CurrentUserData,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.analyticsService.logEvent(dto, user, ip, userAgent || 'unknown');
  }
}
