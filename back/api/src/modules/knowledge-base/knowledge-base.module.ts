import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBase } from '../../entities/knowledge-base.entity';
import { AdminSession, Session, UserCompany } from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([KnowledgeBase, AdminSession, Session, UserCompany]),
    ConfigModule,
  ],
  controllers: [KnowledgeBaseController],
  providers: [KnowledgeBaseService],
  exports: [KnowledgeBaseService],
})
export class KnowledgeBaseModule {}
