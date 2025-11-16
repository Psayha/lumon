import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Ip,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthInitDto } from './dto/auth-init.dto';

@Controller('webhook') // Keep /webhook prefix for backward compatibility
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
