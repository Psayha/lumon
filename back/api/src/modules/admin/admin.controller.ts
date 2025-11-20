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
import { AdminGuard } from './admin.guard';
import { AdminLoginDto, UpdateUserLimitsDto } from './dto/admin-login.dto';

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
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) || undefined : undefined;
    const limitNum = limit ? parseInt(limit, 10) || undefined : undefined;
    return this.adminService.listUsers(pageNum, limitNum);
  }

  @Post('user-delete')
  @UseGuards(AdminGuard)
  async deleteUser(@Body() body: { user_id: string }) {
    return this.adminService.deleteUser(body.user_id);
  }

  @Post('user-ban')
  @UseGuards(AdminGuard)
  async banUser(@Body() body: { user_id: string; company_id: string }) {
    return this.adminService.banUser(body.user_id, body.company_id);
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
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('action') action?: string,
    @Query('user_id') userId?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) || undefined : undefined;
    const offsetNum = offset ? parseInt(offset, 10) || undefined : undefined;
    // Convert offset to page number
    const page = offsetNum && limitNum ? Math.floor(offsetNum / limitNum) + 1 : undefined;

    return this.adminService.listLogs(page, limitNum, action, userId);
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
    return this.adminService.listBackups();
  }

  @Post('backup-create')
  @UseGuards(AdminGuard)
  async createBackup() {
    return this.adminService.createBackup();
  }

  @Post('backup-restore')
  @UseGuards(AdminGuard)
  async restoreBackup(@Body() body: { backup_id: string; file_path: string }) {
    return this.adminService.restoreBackup(body.backup_id, body.file_path);
  }

  @Post('backup-delete')
  @UseGuards(AdminGuard)
  async deleteBackup(@Body() body: { backup_id: string }) {
    return this.adminService.deleteBackup(body.backup_id);
  }

  @Get('health-check-list')
  @UseGuards(AdminGuard)
  async listHealthChecks() {
    return this.adminService.listHealthChecks();
  }

  @Post('health-check')
  @UseGuards(AdminGuard)
  async runHealthCheck(@Body() body: { service?: string }) {
    return this.adminService.runHealthCheck(body.service || 'all');
  }
}
