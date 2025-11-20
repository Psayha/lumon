import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AuditEvent, Session, UserCompany } from '@entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuditEvent,
      Session,
      UserCompany, // Needed for AuthGuard to fetch role
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
