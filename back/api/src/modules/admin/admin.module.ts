import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
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
} from '@entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
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
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
