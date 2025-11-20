import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@entities';
import { AdminGuard } from '@/modules/admin/admin.guard';

@Controller()
export class HealthController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * GET /health
   * Simple health check
   */
  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      service: 'lumon-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * GET /health/detailed
   * Detailed health check including database
   * SECURITY FIX: Protected by AdminGuard - prevents information disclosure
   */
  @Get('health/detailed')
  @UseGuards(AdminGuard) // SECURITY: Only admins can see detailed metrics
  async detailedHealthCheck() {
    let dbStatus = 'unknown';
    let dbLatency = 0;

    try {
      const start = Date.now();
      await this.userRepository.query('SELECT 1');
      dbLatency = Date.now() - start;
      dbStatus = 'healthy';
    } catch (error) {
      dbStatus = 'unhealthy';
    }

    return {
      status: dbStatus === 'healthy' ? 'ok' : 'degraded',
      service: 'lumon-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: {
          status: dbStatus,
          latency_ms: dbLatency,
        },
        memory: {
          used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      },
    };
  }

  /**
   * GET /
   * Root endpoint
   */
  @Get()
  async root() {
    return {
      service: 'Lumon API',
      version: '1.0.0',
      status: 'running',
      documentation: '/health for health check',
    };
  }
}
