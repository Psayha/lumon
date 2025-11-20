import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { User } from '@entities';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AdminModule, // FIX: Import AdminModule for AdminGuard dependency
  ],
  controllers: [HealthController],
})
export class HealthModule {}
