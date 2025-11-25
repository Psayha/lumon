import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [TelegramModule],
  controllers: [ContactController],
})
export class ContactModule {}
