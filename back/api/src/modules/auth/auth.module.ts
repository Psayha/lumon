import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, Session, UserCompany, AuditEvent } from '@entities';
import { CsrfTokenService } from '@/common/services/csrf-token.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Session, UserCompany, AuditEvent])],
  controllers: [AuthController],
  providers: [AuthService, CsrfTokenService],
  exports: [AuthService, CsrfTokenService],
})
export class AuthModule {}
