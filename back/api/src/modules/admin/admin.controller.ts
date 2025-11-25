import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Headers,
  UnauthorizedException,
  BadRequestException,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { AdminLoginDto, UpdateUserLimitsDto } from './dto/admin-login.dto';
import {
  CreateAbExperimentDto,
  UpdateAbExperimentDto,
  GetAbExperimentStatsDto,
} from './dto/ab-experiment.dto';
import {
  DeleteUserDto,
  BanUserDto,
  ClearUserHistoryDto,
  ResetUserLimitsDto,
} from './dto/user-operations.dto';
import {
  RestoreBackupDto,
  DeleteBackupDto,
  RunHealthCheckDto,
} from './dto/backup-operations.dto';
import {
  CreateLegalDocDto,
  UpdateLegalDocDto,
  DeleteLegalDocDto,
} from './dto/legal-doc.dto';
import {
  BindUserToCompanyDto,
  UnbindUserFromCompanyDto,
} from './dto/user-company.dto';
import { CsrfTokenService } from '@/common/services/csrf-token.service';
import { CleanupService } from '@/common/services/cleanup.service';

@Controller('webhook/admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly csrfTokenService: CsrfTokenService,
    private readonly cleanupService: CleanupService,
  ) {}

  // ============ Auth Endpoints ============

  /**
   * Admin login endpoint
   * SECURITY FIX: Uses httpOnly cookies instead of localStorage
   * SECURITY FIX: Strict rate limiting + account lockout to prevent brute force
   */
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 requests per hour (3600 seconds)
  async login(
    @Body() dto: AdminLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Extract IP address (handling proxies)
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'unknown';

    // Extract user agent
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await this.adminService.login(
      dto.username,
      dto.password,
      ipAddress,
      userAgent,
    );

    // SECURITY FIX: Set admin token in httpOnly cookie (XSS-proof)
    // Token is NOT accessible via JavaScript, only sent automatically with requests
    res.cookie('admin_token', result.data.token, {
      httpOnly: true, // CRITICAL: Prevents XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/', // Available for all routes
    });

    // Return success without exposing token in response body
    return {
      success: true,
      data: {
        role: 'admin',
        expires_at: result.data.expires_at,
        message: 'Login successful. Token stored securely in httpOnly cookie.',
      },
    };
  }

  /**
   * Validate admin session
   * SECURITY FIX: Reads token from httpOnly cookie instead of Authorization header
   */
  @Post('validate')
  async validate(@Req() req: Request) {
    // SECURITY FIX: Read token from httpOnly cookie
    const token = req.cookies?.admin_token;

    if (!token) {
      throw new UnauthorizedException('Missing admin session. Please login.');
    }

    return this.adminService.validateAdminSession(token);
  }

  /**
   * Admin logout
   * SECURITY FIX: Clears httpOnly cookie
   */
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.admin_token;

    // Clear the httpOnly cookie
    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    // If token exists, invalidate session in database
    if (token) {
      try {
        await this.adminService.logout(token);
      } catch (error) {
        // Session might already be invalid, that's ok
      }
    }

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  /**
   * GET /webhook/admin/csrf-token
   * Generate CSRF token for authenticated admin
   * SECURITY: Used for protecting critical admin operations
   */
  @Get('csrf-token')
  @UseGuards(AdminGuard)
  async getCsrfToken(@Headers('authorization') authHeader: string) {
    const token = authHeader.replace('Bearer ', '').trim();

    // Generate CSRF token using admin session token as identifier
    const csrfToken = this.csrfTokenService.generateToken(token);

    return {
      success: true,
      data: {
        csrf_token: csrfToken,
        expires_in_minutes: 60,
      },
    };
  }

  // ============ User Management ============

  @Get('users-list')
  @UseGuards(AdminGuard)
  async listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // SECURITY FIX: Validate parsed numbers are positive
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;

    if (pageNum !== undefined && (isNaN(pageNum) || pageNum < 1)) {
      throw new BadRequestException('Invalid page: must be a positive number');
    }
    if (limitNum !== undefined && (isNaN(limitNum) || limitNum < 1)) {
      throw new BadRequestException('Invalid limit: must be a positive number');
    }

    return this.adminService.listUsers(pageNum, limitNum);
  }

  @Post('user-delete')
  @UseGuards(AdminGuard)
  async deleteUser(@Body() dto: DeleteUserDto) {
    return this.adminService.deleteUser(dto.user_id);
  }

  @Post('user-ban')
  @UseGuards(AdminGuard)
  async banUser(@Body() dto: BanUserDto) {
    return this.adminService.banUser(dto.user_id, dto.company_id);
  }

  @Post('user-history-clear')
  @UseGuards(AdminGuard)
  async clearUserHistory(@Body() dto: ClearUserHistoryDto) {
    return this.adminService.clearUserHistory(dto.user_id);
  }

  // ============ Company Management ============

  @Get('companies-list')
  @UseGuards(AdminGuard)
  async listCompanies(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.listCompanies(page, limit);
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
  async resetUserLimits(@Body() dto: ResetUserLimitsDto) {
    return this.adminService.resetUserLimits(dto.user_id);
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
    // SECURITY FIX: Validate parsed numbers are non-negative
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const offsetNum = offset ? parseInt(offset, 10) : undefined;

    if (limitNum !== undefined && (isNaN(limitNum) || limitNum < 1)) {
      throw new BadRequestException('Invalid limit: must be a positive number');
    }
    if (offsetNum !== undefined && (isNaN(offsetNum) || offsetNum < 0)) {
      throw new BadRequestException('Invalid offset: must be a non-negative number');
    }

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
  async createAbExperiment(@Body() dto: CreateAbExperimentDto) {
    return this.adminService.createAbExperiment(dto);
  }

  @Post('ab-experiment-update')
  @UseGuards(AdminGuard)
  async updateAbExperiment(@Body() dto: UpdateAbExperimentDto) {
    return this.adminService.updateAbExperiment(dto.experiment_id, dto);
  }

  @Post('ab-experiment-stats')
  @UseGuards(AdminGuard)
  async getAbExperimentStats(@Body() dto: GetAbExperimentStatsDto) {
    return this.adminService.getAbExperimentStats(dto.experiment_id);
  }

  // ============ Document Management ============

  @Get('legal-docs-list')
  @UseGuards(AdminGuard)
  async listLegalDocs() {
    return this.adminService.listLegalDocs();
  }

  @Post('legal-docs-create')
  @UseGuards(AdminGuard)
  async createLegalDoc(@Body() dto: CreateLegalDocDto) {
    return this.adminService.createLegalDoc(dto);
  }

  @Post('legal-docs-update')
  @UseGuards(AdminGuard)
  async updateLegalDoc(@Body() dto: UpdateLegalDocDto) {
    return this.adminService.updateLegalDoc(dto.id, dto);
  }

  @Post('legal-docs-delete')
  @UseGuards(AdminGuard)
  async deleteLegalDoc(@Body() dto: DeleteLegalDocDto) {
    return this.adminService.deleteLegalDoc(dto.id);
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

  // ============ User-Company Binding ============

  @Post('user-bind-company')
  @UseGuards(AdminGuard)
  async bindUserToCompany(@Body() dto: BindUserToCompanyDto) {
    return this.adminService.bindUserToCompany(
      dto.user_id,
      dto.company_id,
      dto.role as any,
    );
  }

  @Post('user-unbind-company')
  @UseGuards(AdminGuard)
  async unbindUserFromCompany(@Body() dto: UnbindUserFromCompanyDto) {
    return this.adminService.unbindUserFromCompany(
      dto.user_id,
      dto.company_id,
    );
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
  async restoreBackup(@Body() dto: RestoreBackupDto) {
    return this.adminService.restoreBackup(dto.backup_id, dto.file_path);
  }

  @Post('backup-delete')
  @UseGuards(AdminGuard)
  async deleteBackup(@Body() dto: DeleteBackupDto) {
    return this.adminService.deleteBackup(dto.backup_id);
  }

  @Get('health-check-list')
  @UseGuards(AdminGuard)
  async listHealthChecks() {
    return this.adminService.listHealthChecks();
  }

  @Post('health-check')
  @UseGuards(AdminGuard)
  async runHealthCheck(@Body() dto: RunHealthCheckDto) {
    return this.adminService.runHealthCheck(dto.service || 'all');
  }

  // ============ System Maintenance ============

  /**
   * Run database cleanup jobs
   * SECURITY: Removes expired sessions, idempotency keys, old audit logs, etc.
   */
  @Post('cleanup-run')
  @UseGuards(AdminGuard)
  async runCleanupJobs() {
    return this.cleanupService.runAllCleanupJobs();
  }

  /**
   * Get cleanup statistics
   * Shows how many records are pending cleanup
   */
  @Get('cleanup-stats')
  @UseGuards(AdminGuard)
  async getCleanupStats() {
    const stats = await this.cleanupService.getCleanupStats();
    return {
      success: true,
      data: stats,
    };
  }
}
