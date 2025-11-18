import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UserLimitsService } from './user-limits.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '@/common/decorators/current-user.decorator';

@Controller('webhook')
@UseGuards(AuthGuard)
export class UserLimitsController {
  constructor(private readonly userLimitsService: UserLimitsService) {}

  /**
   * POST /webhook/user-limits
   */
  @Post('user-limits')
  async getUserLimits(@CurrentUser() user: CurrentUserData) {
    return this.userLimitsService.getUserLimits(user.id);
  }

  /**
   * POST /webhook/rate-limit-check
   * Replaces: rate-limit.check.json workflow
   */
  @Post('rate-limit-check')
  async checkRateLimit(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { endpoint: string; max_requests?: number; window_minutes?: number },
  ) {
    const result = await this.userLimitsService.checkRateLimit(
      user.id,
      body.endpoint,
      body.max_requests,
      body.window_minutes,
    );

    return {
      success: true,
      allowed: result,
    };
  }
}
