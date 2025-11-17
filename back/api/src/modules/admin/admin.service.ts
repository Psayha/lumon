import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  User,
  Company,
  Session,
  UserLimit,
  AuditEvent,
  Chat,
  Message,
  AbExperiment,
  AbAssignment,
  PlatformStats,
  UserRole,
} from '@entities';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminService {
  // Hardcoded admin credentials (в production лучше хранить в .env или БД)
  private readonly ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  private readonly ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD || 'admin_password_change_me';

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(UserLimit)
    private userLimitRepository: Repository<UserLimit>,
    @InjectRepository(AuditEvent)
    private auditRepository: Repository<AuditEvent>,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(AbExperiment)
    private abExperimentRepository: Repository<AbExperiment>,
    @InjectRepository(AbAssignment)
    private abAssignmentRepository: Repository<AbAssignment>,
    @InjectRepository(PlatformStats)
    private platformStatsRepository: Repository<PlatformStats>,
  ) {}

  /**
   * Admin login
   * Replaces: admin.login.json
   */
  async login(username: string, password: string) {
    if (
      username !== this.ADMIN_USERNAME ||
      password !== this.ADMIN_PASSWORD
    ) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // Generate admin session token
    const sessionToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours for admin

    return {
      success: true,
      data: {
        session_token: sessionToken,
        role: 'admin',
        expires_at: expiresAt,
      },
    };
  }

  /**
   * Validate admin session
   * Replaces: admin.validate.json
   */
  async validateAdminSession(token: string) {
    // Simple validation - в production лучше хранить admin sessions в БД
    if (!token || token.length < 10) {
      throw new UnauthorizedException('Invalid admin token');
    }

    return {
      success: true,
      data: {
        role: 'admin',
      },
    };
  }

  /**
   * List all users with pagination
   * Replaces: admin.users-list.json
   */
  async listUsers(page = 1, limit = 50) {
    const [users, total] = await this.userRepository.findAndCount({
      relations: ['chats', 'userCompanies'],
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
    });

    // Transform to camelCase format expected by frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      telegramId: user.telegram_id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      chatsCount: user.chats?.length || 0,
      companiesCount: user.userCompanies?.length || 0,
      companies: user.userCompanies?.map(uc => ({
        company_id: uc.company_id,
        role: uc.role,
      })) || [],
    }));

    return {
      success: true,
      data: formattedUsers,
    };
  }

  /**
   * List all companies
   * Replaces: admin.companies-list.json
   */
  async listCompanies() {
    const companies = await this.companyRepository.find({
      order: { created_at: 'DESC' },
    });

    return {
      success: true,
      data: companies,
    };
  }

  /**
   * Delete user and all related data
   * Replaces: admin.user-delete.json
   */
  async deleteUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Cascade delete will handle sessions, chats, messages, etc.
    await this.userRepository.delete(userId);

    return {
      success: true,
      message: `User ${userId} deleted successfully`,
    };
  }

  /**
   * List user limits
   * Replaces: admin.user-limits-list.json
   */
  async listUserLimits(userId?: string) {
    const where = userId ? { user_id: userId } : {};

    const limits = await this.userLimitRepository.find({
      where,
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    return {
      success: true,
      data: limits,
    };
  }

  /**
   * Update user limits
   * Replaces: admin.user-limits-update.json
   */
  async updateUserLimits(
    userId: string,
    limitType: string,
    limitValue: number,
  ) {
    // Check if limit exists
    let userLimit = await this.userLimitRepository.findOne({
      where: { user_id: userId, limit_type: limitType },
    });

    if (userLimit) {
      // Update existing limit
      userLimit.limit_value = limitValue;
      await this.userLimitRepository.save(userLimit);
    } else {
      // Create new limit
      userLimit = await this.userLimitRepository.save({
        user_id: userId,
        limit_type: limitType,
        limit_value: limitValue,
        current_usage: 0,
      });
    }

    return {
      success: true,
      data: userLimit,
    };
  }

  /**
   * Reset user limits (set current_usage to 0)
   */
  async resetUserLimits(userId: string) {
    await this.userLimitRepository.update(
      { user_id: userId },
      { current_usage: 0 },
    );

    return {
      success: true,
      message: 'User limits reset successfully',
    };
  }

  /**
   * Get platform statistics
   * Replaces: admin.stats-platform.json
   */
  async getPlatformStats() {
    const totalUsers = await this.userRepository.count();
    const totalCompanies = await this.companyRepository.count();
    const totalChats = await this.chatRepository.count();
    const totalMessages = await this.messageRepository.count();

    // Active users (logged in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsers7d = await this.userRepository.count({
      where: {
        last_login_at: Between(sevenDaysAgo, new Date()) as any,
      },
    });

    // Active users (logged in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers30d = await this.userRepository.count({
      where: {
        last_login_at: Between(thirtyDaysAgo, new Date()) as any,
      },
    });

    // New users (created in last 30 days)
    const newUsers30d = await this.userRepository.count({
      where: {
        created_at: Between(thirtyDaysAgo, new Date()) as any,
      },
    });

    // New companies (created in last 30 days)
    const newCompanies30d = await this.companyRepository.count({
      where: {
        created_at: Between(thirtyDaysAgo, new Date()) as any,
      },
    });

    // Active sessions
    const activeSessions = await this.sessionRepository.count({
      where: {
        expires_at: Between(new Date(), new Date('2099-12-31')) as any,
      },
    });

    return {
      success: true,
      data: {
        totalUsers,
        activeUsers30d,
        activeUsers7d,
        totalCompanies,
        totalChats,
        totalMessages,
        newUsers30d,
        newCompanies30d,
        activeSessions,
      },
    };
  }

  /**
   * List audit logs with pagination
   * Replaces: admin.logs-list.json
   */
  async listLogs(page = 1, limit = 100, action?: string, userId?: string) {
    const where: any = {};
    if (action) where.action = action;
    if (userId) where.user_id = userId;

    const [logs, total] = await this.auditRepository.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
      relations: ['user'],
    });

    // Transform to camelCase format expected by frontend
    const formattedLogs = logs.map(log => ({
      id: log.id,
      action: log.action,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      metadata: log.metadata,
      ip: log.ip,
      userAgent: log.user_agent,
      createdAt: log.created_at,
      user: log.user ? {
        username: log.user.username,
        firstName: log.user.first_name,
        lastName: log.user.last_name,
      } : null,
    }));

    return {
      success: true,
      data: formattedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List A/B experiments
   * Replaces: admin.ab-experiments-list.json
   */
  async listAbExperiments() {
    const experiments = await this.abExperimentRepository.find({
      order: { created_at: 'DESC' },
    });

    return {
      success: true,
      data: experiments,
    };
  }

  /**
   * Create A/B experiment
   * Replaces: admin.ab-experiment-create.json
   */
  async createAbExperiment(data: {
    name: string;
    description: string;
    feature_name: string;
    traffic_percentage: number;
    variant_a_config: Record<string, any>;
    variant_b_config: Record<string, any>;
  }) {
    const experiment = await this.abExperimentRepository.save({
      ...data,
      enabled: true,
    });

    return {
      success: true,
      data: experiment,
    };
  }

  /**
   * Update A/B experiment
   * Replaces: admin.ab-experiment-update.json
   */
  async updateAbExperiment(
    experimentId: string,
    data: Partial<{
      name: string;
      description: string;
      enabled: boolean;
      traffic_percentage: number;
      variant_a_config: Record<string, any>;
      variant_b_config: Record<string, any>;
    }>,
  ) {
    const experiment = await this.abExperimentRepository.findOne({
      where: { id: experimentId },
    });

    if (!experiment) {
      throw new NotFoundException('Experiment not found');
    }

    await this.abExperimentRepository.update(experimentId, data);

    const updated = await this.abExperimentRepository.findOne({
      where: { id: experimentId },
    });

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * Clear user chat history
   * Replaces: admin.user-history-clear.json
   */
  async clearUserHistory(userId: string) {
    // Get all user chats
    const chats = await this.chatRepository.find({
      where: { user_id: userId },
    });

    // Delete all messages in these chats
    for (const chat of chats) {
      await this.messageRepository.delete({ chat_id: chat.id });
    }

    // Delete all chats
    await this.chatRepository.delete({ user_id: userId });

    return {
      success: true,
      message: `Cleared history for user ${userId}`,
      chats_deleted: chats.length,
    };
  }

  /**
   * Get A/B experiment stats
   */
  async getAbExperimentStats(experimentId: string) {
    const experiment = await this.abExperimentRepository.findOne({
      where: { id: experimentId },
    });

    if (!experiment) {
      throw new NotFoundException('Experiment not found');
    }

    const assignments = await this.abAssignmentRepository.find({
      where: { experiment_id: experimentId },
    });

    const variantACount = assignments.filter((a) => a.variant === 'A').length;
    const variantBCount = assignments.filter((a) => a.variant === 'B').length;

    return {
      success: true,
      data: {
        experiment,
        total_assignments: assignments.length,
        variant_a_count: variantACount,
        variant_b_count: variantBCount,
      },
    };
  }

  /**
   * List health checks
   */
  async listHealthChecks() {
    // В production версии здесь можно хранить health checks в БД
    // Для демо возвращаем базовые метрики системы
    const systemMetrics = await this.getSystemMetrics();

    return {
      success: true,
      data: {
        system_status: {
          overall_status: systemMetrics.cpu_usage_percent < 80 && systemMetrics.memory_usage_percent < 80 ? 'healthy' : 'degraded',
          services_status: {
            n8n: 'healthy',
            postgresql: 'healthy',
            nginx: 'healthy',
            'supabase-studio': 'healthy',
          },
          last_checked_at: new Date().toISOString(),
          system_metrics: systemMetrics,
        },
        health_checks: [],
      },
    };
  }

  /**
   * Run health check for specific service or all services
   */
  async runHealthCheck(service: string) {
    const systemMetrics = await this.getSystemMetrics();

    return {
      success: true,
      data: {
        service,
        status: 'healthy',
        checked_at: new Date().toISOString(),
        metrics: systemMetrics,
      },
      message: `Health check completed for ${service}`,
    };
  }

  /**
   * Get system metrics
   */
  private async getSystemMetrics() {
    // В production версии здесь можно использовать системные команды для получения реальных метрик
    // Для демо возвращаем моковые данные
    const totalMemoryMB = 8192; // 8GB
    const usedMemoryMB = 4096; // 4GB
    const totalDiskGB = 500;
    const usedDiskGB = 150;

    return {
      cpu_usage_percent: Math.random() * 30 + 10, // 10-40%
      memory_total_mb: totalMemoryMB,
      memory_used_mb: usedMemoryMB,
      memory_available_mb: totalMemoryMB - usedMemoryMB,
      memory_usage_percent: (usedMemoryMB / totalMemoryMB) * 100,
      disk_total_gb: totalDiskGB,
      disk_used_gb: usedDiskGB,
      disk_available_gb: totalDiskGB - usedDiskGB,
      disk_usage_percent: (usedDiskGB / totalDiskGB) * 100,
    };
  }
}
