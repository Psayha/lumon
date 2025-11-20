import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
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
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
