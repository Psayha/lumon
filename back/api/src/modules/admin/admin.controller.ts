import {
  Controller,
  Post,
  Get,
  Body,
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

    if (!token || token.length < 10) {
      throw new UnauthorizedException('Invalid admin token');
    }

    return true;
  }
}

@Controller('webhook/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============ Auth Endpoints ============

  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto.username, dto.password);
  }

  @Post('validate')
  async validate(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing admin token');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    return this.adminService.validateAdminSession(token);
  }

  // ============ User Management ============

  @Get('users-list')
  @UseGuards(AdminGuard)
  async listUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.listUsers(page, limit);
  }

  @Post('user-delete')
  @UseGuards(AdminGuard)
  async deleteUser(@Body() body: { user_id: string }) {
    return this.adminService.deleteUser(body.user_id);
  }

  @Post('user-history-clear')
  @UseGuards(AdminGuard)
  async clearUserHistory(@Body() body: { user_id: string }) {
    return this.adminService.clearUserHistory(body.user_id);
  }

  // ============ Company Management ============

  @Get('companies-list')
  @UseGuards(AdminGuard)
  async listCompanies() {
    return this.adminService.listCompanies();
  }

  // ============ User Limits ============

  @Get('user-limits-list')
  @UseGuards(AdminGuard)
  async listUserLimits(@Query('user_id') userId?: string) {
    return this.adminService.listUserLimits(userId);
  }

  @Post('user-limits-update')
  @UseGuards(AdminGuard)
  async updateUserLimits(@Body() dto: UpdateUserLimitsDto) {
    return this.adminService.updateUserLimits(
      dto.user_id,
      dto.limit_type,
      dto.limit_value,
    );
  }

  @Post('user-limits-reset')
  @UseGuards(AdminGuard)
  async resetUserLimits(@Body() body: { user_id: string }) {
    return this.adminService.resetUserLimits(body.user_id);
  }

  // ============ Platform Stats ============

  @Get('stats-platform')
  @UseGuards(AdminGuard)
  async getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  // ============ Logs ============

  @Get('logs-list')
  @UseGuards(AdminGuard)
  async listLogs(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('action') action?: string,
    @Query('user_id') userId?: string,
  ) {
    // Convert offset to page number
    const page = offset && limit ? Math.floor(offset / limit) + 1 : undefined;

    return this.adminService.listLogs(page, limit, action, userId);
  }

  // ============ A/B Testing ============

  @Get('ab-experiments-list')
  @UseGuards(AdminGuard)
  async listAbExperiments() {
    return this.adminService.listAbExperiments();
  }

  @Post('ab-experiment-create')
  @UseGuards(AdminGuard)
  async createAbExperiment(@Body() body: any) {
    return this.adminService.createAbExperiment(body);
  }

  @Post('ab-experiment-update')
  @UseGuards(AdminGuard)
  async updateAbExperiment(@Body() body: any) {
    return this.adminService.updateAbExperiment(body.experiment_id, body);
  }

  @Post('ab-experiment-stats')
  @UseGuards(AdminGuard)
  async getAbExperimentStats(@Body() body: { experiment_id: string }) {
    return this.adminService.getAbExperimentStats(body.experiment_id);
  }

  // ============ Document Management (Stubs - Not Yet Migrated) ============

  @Get('legal-docs-list')
  @UseGuards(AdminGuard)
  async listLegalDocs() {
    return {
      success: true,
      data: [],
      message: 'Legal docs management not yet migrated from n8n',
    };
  }

  @Get('ai-docs-list')
  @UseGuards(AdminGuard)
  async listAiDocs() {
    return {
      success: true,
      data: [],
      message: 'AI docs management not yet migrated from n8n',
    };
  }

  // ============ System Management (Stubs - Not Yet Migrated) ============

  @Get('backup-list')
  @UseGuards(AdminGuard)
  async listBackups() {
    return {
      success: true,
      data: [],
      message: 'Backup management not yet migrated from n8n',
    };
  }

  @Get('health-check-list')
  @UseGuards(AdminGuard)
  async listHealthChecks() {
    return {
      success: true,
      data: [],
      message: 'Health check monitoring not yet migrated from n8n',
    };
  }
}
