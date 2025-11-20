import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminSession } from '@entities';

/**
 * Admin Guard - validates admin session tokens
 * Uses admin_sessions table instead of regular sessions table
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(AdminSession)
    private adminSessionRepository: Repository<AdminSession>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing admin token');
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // SECURITY FIX: Validate token in admin_sessions table
    const session = await this.adminSessionRepository.findOne({
      where: {
        session_token: token,
        is_active: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid admin token');
    }

    // Check if session expired
    if (session.expires_at < new Date()) {
      throw new UnauthorizedException('Admin session expired');
    }

    // Update last activity (fire and forget)
    this.adminSessionRepository.update(session.id, {
      last_activity_at: new Date(),
    }).catch(err => {
      console.error('Failed to update admin session activity:', err);
    });

    // Attach admin session to request for use in controllers
    request.adminSession = session;

    return true;
  }
}
