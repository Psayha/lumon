import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Headers,
  UnauthorizedException,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { AdminLoginDto, UpdateUserLimitsDto } from './dto/admin-login.dto';
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
