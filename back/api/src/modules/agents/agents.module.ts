import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { AgentsPublicController } from './agents.public.controller';
import { Agent, AdminSession, Session, UserCompany } from '@entities';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Agent, AdminSession, Session, UserCompany]),
    ConfigModule,
  ],
  controllers: [AgentsController, AgentsPublicController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
