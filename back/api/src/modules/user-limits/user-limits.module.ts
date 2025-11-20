import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLimitsController } from './user-limits.controller';
import { UserLimitsService } from './user-limits.service';
import { UserLimit, RateLimit, Session, UserCompany } from '@entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserLimit,
      RateLimit,
      Session,
      UserCompany, // Needed for AuthGuard to fetch role
    ]),
  ],
  controllers: [UserLimitsController],
  providers: [UserLimitsService],
  exports: [UserLimitsService],
})
export class UserLimitsModule {}
