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
} from '@entities';

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
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService, AdminGuard, TypeOrmModule],
})
export class AdminModule {}
