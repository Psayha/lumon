import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Ip,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { CsrfTokenService } from '@/common/services/csrf-token.service';
import { AuthInitDto } from './dto/auth-init.dto';

@Controller('webhook') // Keep /webhook prefix for backward compatibility
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly csrfTokenService: CsrfTokenService,
  ) {}

  /**
   * POST /webhook/auth-init-v2
   * Replaces: auth.init.v3.json workflow
   */
  @Post('auth-init-v2')
  async authInit(
    @Body() dto: AuthInitDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.authInit(dto, ip, userAgent || 'unknown');
  }

  /**
   * POST /webhook/auth-validate-v2
   * Replaces: auth.validate.v3.json workflow
   */
  @Post('auth-validate-v2')
  async authValidate(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    return this.authService.validateSession(token);
  }

  /**
   * POST /webhook/auth-logout
   * Replaces: auth.logout.json workflow
   */
  @Post('auth-logout')
  async logout(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    return this.authService.logout(token);
  }

  /**
   * POST /webhook/auth-refresh
   * Replaces: auth.refresh.json workflow
   */
  @Post('auth-refresh')
  async refresh(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    return this.authService.refresh(token);
  }

  /**
   * GET /webhook/csrf-token
   * Generate CSRF token for authenticated user
   * SECURITY: Used for protecting critical operations
   */
  @Get('csrf-token')
  async getCsrfToken(
    @Headers('authorization') authHeader: string,
    @Req() req: Request,
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // Validate session and get session ID
    const validation = await this.authService.validateSession(token);
    if (!validation.success) {
      throw new UnauthorizedException('Invalid session');
    }

    // Generate CSRF token using session token as identifier
    const csrfToken = this.csrfTokenService.generateToken(token);

    return {
      success: true,
      data: {
        csrf_token: csrfToken,
        expires_in_minutes: 60,
      },
    };
  }
  /**
   * POST /webhook/auth-accept-legal
   * Accept legal documents
   */
  @Post('auth-accept-legal')
  async acceptLegalDocs(@Body() body: { initData: string; version?: string }) {
    if (!body.initData) {
      throw new UnauthorizedException('Missing initData');
    }

    // We need to parse initData to get the user ID
    // Since authInit is private/complex, we'll reuse authInit logic but just for parsing
    // Actually, we can't easily reuse private methods.
    // Let's rely on authInit to do the heavy lifting.
    // Wait, if we call authInit, it will fail with ForbiddenException if docs not accepted.
    // We need a way to identify the user WITHOUT logging them in fully OR allow a special "pre-auth" state.
    
    // Better approach: 
    // 1. Parse initData (we need to expose parseTelegramInitData or duplicate logic? Exposing is better).
    // 2. Update user.
    
    // Let's make parseTelegramInitData public in AuthService or move to helper.
    // For now, to minimize refactoring risk, I'll add a specific method in AuthService that handles parsing + updating.
    
    return this.authService.acceptLegalDocsWithInitData(body.initData, body.version);
  }
}
