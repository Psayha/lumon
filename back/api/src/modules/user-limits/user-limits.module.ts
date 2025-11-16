import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLimitsController } from './user-limits.controller';
import { UserLimitsService } from './user-limits.service';
import { UserLimit, RateLimit, Session } from '@entities';

@Module({
  imports: [TypeOrmModule.forFeature([UserLimit, RateLimit, Session])],
  controllers: [UserLimitsController],
  providers: [UserLimitsService],
  exports: [UserLimitsService],
})
export class UserLimitsModule {}
