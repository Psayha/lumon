import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Session, UserCompany, AuditEvent, UserRole } from '@entities';
import { v4 as uuidv4 } from 'uuid';
import { AuthInitDto } from './dto/auth-init.dto';
import { createHmac } from 'crypto';
import { safeJsonParse } from '@/common/utils/safe-json-parse';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(UserCompany)
    private userCompanyRepository: Repository<UserCompany>,
    @InjectRepository(AuditEvent)
    private auditRepository: Repository<AuditEvent>,
  ) {}

  /**
   * Initialize auth with Telegram initData
   * Replaces: auth.init.v3.json workflow
   */
  async authInit(dto: AuthInitDto, ip: string, userAgent: string) {
    try {
      // Parse initData from Telegram
      const userData = this.parseTelegramInitData(dto.initData);

      // Upsert user (INSERT ... ON CONFLICT UPDATE)
      const user = await this.upsertUser({
        telegram_id: userData.telegram_id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        username: userData.username,
        language_code: userData.language_code,
        app_version: dto.appVersion || '1.0.0',
      });

      // Legal Docs Check
      if (!user.legal_accepted_at) {
        // Return specific error code so frontend can show legal docs modal
        throw new ForbiddenException('Legal documents not accepted');
      }

      // Get user role and company
      const roleData = await this.getUserRoleAndCompany(user.id);

      // Generate session token
      const sessionToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // NOTE: session_token column is UUID type, so we store UUID directly
      // UUID v4 provides 122 bits of entropy which is cryptographically secure
      // No need to hash since:
      // 1. UUID is already unpredictable
      // 2. If DB is compromised, attacker can use sessions directly anyway
      // 3. Column type is UUID, not VARCHAR

      // Create session (role is now determined from user_companies table)
      const session = await this.sessionRepository.save({
        session_token: sessionToken, // Store UUID directly (matches column type)
        user_id: user.id,
        company_id: roleData.company_id || undefined,
        expires_at: expiresAt,
        is_active: true,
      }) as Session;

      // Log audit event (fire and forget)
      this.logAuditEvent({
        user_id: user.id,
        action: 'auth.login',
        resource_type: 'session',
        resource_id: session.id,
        metadata: {
          telegram_id: userData.telegram_id,
          username: userData.username,
          role: roleData.role,
        },
        ip,
        user_agent: userAgent,
      }).catch((err) => console.error('Failed to log audit event:', err));

      return {
        success: true,
        data: {
          session_token: sessionToken,
          user: {
            id: user.id,
          },
          role: roleData.role,
          companyId: roleData.company_id,
          expires_at: expiresAt,
        },
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  /**
   * Validate session token
   * Replaces: auth.validate.v3.json workflow
   */
  async validateSession(token: string) {
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

    // Check if session expired
    if (session.expires_at < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    // Fetch role from user_companies table
    const roleData = await this.getUserRoleAndCompany(session.user_id);

    // Update last activity
    await this.sessionRepository.update(session.id, {
      last_activity_at: new Date(),
    });

    return {
      success: true,
      data: {
        user: {
          id: session.user_id,
          company_id: session.company_id,
        },
        role: roleData.role,
        companyId: session.company_id,
      },
    };
  }

  /**
   * Logout - invalidate session
   */
  async logout(token: string) {
    await this.sessionRepository.update(
      { session_token: token },
      { is_active: false },
    );

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  /**
   * Refresh session
   */
  async refresh(token: string) {
    const session = await this.validateSession(token);

    // Extend session expiry
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await this.sessionRepository.update(
      { session_token: token },
      { expires_at: newExpiresAt },
    );

    return {
      success: true,
      data: {
        ...session.data,
        expires_at: newExpiresAt,
      },
    };
  }

  // Helper methods
  private parseTelegramInitData(initData: string) {
    if (!initData || initData.trim().length === 0) {
      throw new Error('initData is empty or missing');
    }

    const params: Record<string, string> = {};
    initData.split('&').forEach((pair) => {
      if (pair.includes('=')) {
        const [key, value] = pair.split('=');
        if (key && value) {
          params[key] = value;
        }
      }
    });

    // SECURITY FIX: Verify Telegram hash to prevent authentication bypass
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      const hash = params.hash;
      if (!hash) {
        throw new UnauthorizedException('Missing hash in initData');
      }

      // Create data-check-string from all params except hash
      // IMPORTANT: Telegram sends URL-encoded params, but for HMAC verification
      // we need to use decoded values
      const dataCheckArr: string[] = [];
      Object.keys(params)
        .filter(key => key !== 'hash')
        .sort()
        .forEach(key => {
          // Decode the value before adding to data-check-string
          const decodedValue = decodeURIComponent(params[key]);
          dataCheckArr.push(`${key}=${decodedValue}`);
        });
      const dataCheckString = dataCheckArr.join('\n');

      // Calculate secret key from bot token
      const secretKey = createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

      // Calculate hash
      const calculatedHash = createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      // Verify hash
      if (calculatedHash !== hash) {
        throw new UnauthorizedException('Invalid Telegram hash - data may be tampered');
      }

      // Check auth_date to prevent replay attacks (max 1 hour old)
      const authDate = parseInt(params.auth_date || '0', 10);
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime - authDate > 3600) {
        throw new UnauthorizedException('initData is too old (max 1 hour)');
      }
    }

    if (!params.user) {
      throw new Error('user parameter is missing in initData');
    }

    const userStr = decodeURIComponent(params.user);
    if (!userStr || userStr.trim().length === 0) {
      throw new Error('user parameter is empty after decoding');
    }

    let user: any;
    try {
      // SECURITY FIX: Use safe JSON parse to prevent prototype pollution
      // Regular JSON.parse can pollute Object.prototype with __proto__
      user = safeJsonParse(userStr);
    } catch (parseError) {
      throw new Error(`Failed to parse user JSON: ${(parseError as Error).message}`);
    }

    if (!user || !user.id) {
      throw new Error('user object is missing required id field');
    }

    return {
      telegram_id: user.id.toString(),
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      language_code: user.language_code || 'ru',
      auth_date: params.auth_date || '',
    };
  }

  private async upsertUser(data: {
    telegram_id: string;
    first_name: string;
    last_name: string;
    username: string;
    language_code: string;
    app_version: string;
  }) {
    // SECURITY FIX: Validate telegram_id is a valid number
    const telegramId = Number(data.telegram_id);
    if (isNaN(telegramId) || !isFinite(telegramId)) {
      throw new BadRequestException('Invalid telegram_id: must be a valid number');
    }

    // Check if user exists
    let user = await this.userRepository.findOne({
      where: { telegram_id: telegramId },
    });

    if (user) {
      // Update existing user
      await this.userRepository.update(user.id, {
        first_name: data.first_name,
        last_name: data.last_name,
        username: data.username,
        language_code: data.language_code,
        app_version: data.app_version,
        last_login_at: new Date(),
      });
    } else {
      // Create new user
      user = await this.userRepository.save({
        telegram_id: telegramId,
        first_name: data.first_name,
        last_name: data.last_name,
        username: data.username,
        language_code: data.language_code,
        app_version: data.app_version,
        last_login_at: new Date(),
      }) as User;
    }

    return user;
  }

  private async getUserRoleAndCompany(userId: string) {
    const userCompany = await this.userCompanyRepository.findOne({
      where: {
        user_id: userId,
        is_active: true,
      },
      relations: ['company'],
      order: { created_at: 'ASC' },
    });

    return {
      role: userCompany?.role || UserRole.VIEWER,
      company_id: userCompany?.company_id || null,
      company_name: userCompany?.company?.name || null,
    };
  }

  async acceptLegalDocs(userId: string, version: string = '1.0') {
    await this.userRepository.update(userId, {
      legal_accepted_at: new Date(),
      legal_version: version,
    });

    // Log audit event
    this.logAuditEvent({
      user_id: userId,
      action: 'user.legal_docs.accept',
      resource_type: 'user',
      resource_id: userId,
      metadata: {
        version,
      },
      ip: 'unknown', // We don't have IP here easily without context, but it's fine
      user_agent: 'unknown',
    }).catch((err) => console.error('Failed to log audit event:', err));

    return {
      success: true,
      message: 'Legal documents accepted successfully',
    };
  }

  async acceptLegalDocsWithInitData(initData: string, version: string = '1.0') {
    try {
      const userData = this.parseTelegramInitData(initData);
      
      // Find user by telegram_id
      const user = await this.userRepository.findOne({
        where: { telegram_id: Number(userData.telegram_id) },
      });

      if (!user) {
        // If user doesn't exist, we can't accept docs for them. 
        // They should call authInit first which creates the user (but fails login).
        // Actually authInit creates user BEFORE checking legal docs.
        // So user should exist.
        throw new UnauthorizedException('User not found. Please try to login first.');
      }

      return this.acceptLegalDocs(user.id, version);
    } catch (error) {
      throw new UnauthorizedException((error as Error).message);
    }
  }

  private async logAuditEvent(data: {
    user_id: string;
    action: string;
    resource_type: string;
    resource_id: string;
    metadata: Record<string, any>;
    ip: string;
    user_agent: string;
  }) {
    await this.auditRepository.save(data);
  }
}
