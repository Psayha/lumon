import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, Session, UserCompany, AuditEvent } from '@entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, Session, UserCompany, AuditEvent])],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
