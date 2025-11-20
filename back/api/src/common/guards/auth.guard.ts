import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session, UserCompany, UserRole } from '@entities';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(UserCompany)
    private userCompanyRepository: Repository<UserCompany>,
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

    // SECURITY FIX: Fetch role from user_companies table instead of session
    // This ensures proper multi-tenancy and allows users to have different
    // roles in different companies
    let role: string = UserRole.VIEWER; // Default to viewer

    if (session.company_id) {
      const userCompany = await this.userCompanyRepository.findOne({
        where: {
          user_id: session.user_id,
          company_id: session.company_id,
          is_active: true,
        },
      });

      if (userCompany) {
        role = userCompany.role;
      } else {
        // User is not a member of this company (security violation)
        throw new UnauthorizedException(
          'User is not a member of the specified company',
        );
      }
    }

    // Attach user and session to request object
    request.user = {
      id: session.user_id,
      company_id: session.company_id,
      role,
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
