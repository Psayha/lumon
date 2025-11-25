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
  LegalDoc,
} from '@entities';
import { LockoutService } from '@/common/services/lockout.service';
import { CsrfTokenService } from '@/common/services/csrf-token.service';
import { CleanupModule } from '../cleanup/cleanup.module';

@Module({
  imports: [
    CleanupModule,
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
      LegalDoc,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard, LockoutService, CsrfTokenService],
  exports: [AdminService, AdminGuard, TypeOrmModule],
})
export class AdminModule {}
