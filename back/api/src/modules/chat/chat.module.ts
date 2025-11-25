import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AgentsModule } from '../agents/agents.module';
import {
  Chat,
  Message,
  AuditEvent,
  IdempotencyKey,
  Session,
  UserCompany,
} from '@entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Chat,
      Message,
      AuditEvent,
      IdempotencyKey,
      Session, // Needed for AuthGuard
      UserCompany, // Needed for AuthGuard to fetch role
    ]),
    AgentsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
