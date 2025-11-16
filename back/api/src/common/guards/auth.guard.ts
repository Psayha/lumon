import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '@entities';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '').trim();

    const session = await this.sessionRepository.findOne({
      where: {
        session_token: token,
        is_active: true,
      },
      relations: ['user'],
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (session.expires_at < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    // Attach user and session to request object
    request.user = {
      id: session.user_id,
      company_id: session.company_id,
      role: session.role,
      session,
    };

    // Update last activity (async, don't wait)
    this.sessionRepository
      .update(session.id, {
        last_activity_at: new Date(),
      })
      .catch((err) => console.error('Failed to update session activity:', err));

    return true;
  }
}
