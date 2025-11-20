import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import {
  User,
  Company,
  Session,
  AdminSession,
  UserLimit,
  AuditEvent,
  Chat,
  Message,
  AbExperiment,
  AbAssignment,
  PlatformStats,
  Backup,
  UserCompany,
  LoginAttempt,
} from '@entities';
import { LockoutService } from '@/common/services/lockout.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Company,
      Session,
      AdminSession,
      UserLimit,
      AuditEvent,
      Chat,
      Message,
      AbExperiment,
      AbAssignment,
      PlatformStats,
      Backup,
      UserCompany,
      LoginAttempt,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard, LockoutService],
  exports: [AdminService, AdminGuard, TypeOrmModule],
})
export class AdminModule {}
