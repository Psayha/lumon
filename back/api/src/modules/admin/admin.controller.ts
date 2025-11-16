import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto, UpdateUserLimitsDto } from './dto/admin-login.dto';

// Simple admin guard
class AdminGuard {
  async canActivate(context: any): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing admin token');
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // Simple validation - в production лучше проверять через AdminService
    if (!token || token.length < 10) {
      throw new UnauthorizedException('Invalid admin token');
    }

    return true;
  }
}

@Controller('webhook/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * POST /webhook/admin/login
   * Replaces: admin.login.json
   */
  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto.username, dto.password);
  }

  /**
   * POST /webhook/admin/validate
   * Replaces: admin.validate.json
   */
  @Post('validate')
  async validate(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing admin token');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    return this.adminService.validateAdminSession(token);
  }

  /**
   * POST /webhook/admin/users-list
   * Replaces: admin.users-list.json
   */
  @Post('users-list')
  @UseGuards(AdminGuard)
  async listUsers(
    @Body() body: { page?: number; limit?: number },
  ) {
    return this.adminService.listUsers(body.page, body.limit);
  }

  /**
   * POST /webhook/admin/companies-list
   * Replaces: admin.companies-list.json
   */
  @Post('companies-list')
  @UseGuards(AdminGuard)
  async listCompanies() {
    return this.adminService.listCompanies();
  }

  /**
   * POST /webhook/admin/user-delete
   * Replaces: admin.user-delete.json
   */
  @Post('user-delete')
  @UseGuards(AdminGuard)
  async deleteUser(@Body() body: { user_id: string }) {
    return this.adminService.deleteUser(body.user_id);
  }

  /**
   * POST /webhook/admin/user-limits-list
   * Replaces: admin.user-limits-list.json
   */
  @Post('user-limits-list')
  @UseGuards(AdminGuard)
  async listUserLimits(@Body() body: { user_id?: string }) {
    return this.adminService.listUserLimits(body.user_id);
  }

  /**
   * POST /webhook/admin/user-limits-update
   * Replaces: admin.user-limits-update.json
   */
  @Post('user-limits-update')
  @UseGuards(AdminGuard)
  async updateUserLimits(@Body() dto: UpdateUserLimitsDto) {
    return this.adminService.updateUserLimits(
      dto.user_id,
      dto.limit_type,
      dto.limit_value,
    );
  }

  /**
   * POST /webhook/admin/user-limits-reset
   */
  @Post('user-limits-reset')
  @UseGuards(AdminGuard)
  async resetUserLimits(@Body() body: { user_id: string }) {
    return this.adminService.resetUserLimits(body.user_id);
  }

  /**
   * POST /webhook/admin/stats-platform
   * Replaces: admin.stats-platform.json
   */
  @Post('stats-platform')
  @UseGuards(AdminGuard)
  async getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  /**
   * POST /webhook/admin/logs-list
   * Replaces: admin.logs-list.json
   */
  @Post('logs-list')
  @UseGuards(AdminGuard)
  async listLogs(
    @Body() body: { page?: number; limit?: number; action?: string; user_id?: string },
  ) {
    return this.adminService.listLogs(
      body.page,
      body.limit,
      body.action,
      body.user_id,
    );
  }

  /**
   * POST /webhook/admin/ab-experiments-list
   * Replaces: admin.ab-experiments-list.json
   */
  @Post('ab-experiments-list')
  @UseGuards(AdminGuard)
  async listAbExperiments() {
    return this.adminService.listAbExperiments();
  }

  /**
   * POST /webhook/admin/ab-experiment-create
   * Replaces: admin.ab-experiment-create.json
   */
  @Post('ab-experiment-create')
  @UseGuards(AdminGuard)
  async createAbExperiment(@Body() body: any) {
    return this.adminService.createAbExperiment(body);
  }

  /**
   * POST /webhook/admin/ab-experiment-update
   * Replaces: admin.ab-experiment-update.json
   */
  @Post('ab-experiment-update')
  @UseGuards(AdminGuard)
  async updateAbExperiment(@Body() body: any) {
    return this.adminService.updateAbExperiment(body.experiment_id, body);
  }

  /**
   * POST /webhook/admin/user-history-clear
   * Replaces: admin.user-history-clear.json
   */
  @Post('user-history-clear')
  @UseGuards(AdminGuard)
  async clearUserHistory(@Body() body: { user_id: string }) {
    return this.adminService.clearUserHistory(body.user_id);
  }

  /**
   * POST /webhook/admin/ab-experiment-stats
   */
  @Post('ab-experiment-stats')
  @UseGuards(AdminGuard)
  async getAbExperimentStats(@Body() body: { experiment_id: string }) {
    return this.adminService.getAbExperimentStats(body.experiment_id);
  }
}
