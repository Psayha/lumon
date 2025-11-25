import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { TelegramService } from '../telegram/telegram.service';
import { SendContactMessageDto } from './dto/send-contact-message.dto';
import { createHmac } from 'crypto';

@Controller('webhook/contact')
export class ContactController {
  private readonly logger = new Logger(ContactController.name);
  private readonly TARGET_USER_ID = 887567962; // Hardcoded target user ID

  constructor(private readonly telegramService: TelegramService) {}

  @Post('send-message')
  async sendMessage(@Body() dto: SendContactMessageDto) {
    // Validate Telegram initData
    const isValid = this.validateTelegramInitData(dto.initData);
    if (!isValid) {
      throw new BadRequestException('Invalid Telegram initData');
    }

    // Extract user info from initData
    const userData = this.parseTelegramInitData(dto.initData);

    // Format message with user info
    const formattedMessage = `
<b>📩 Новое сообщение от пользователя</b>

<b>От:</b> ${userData.first_name || 'Неизвестно'} ${userData.last_name || ''}
<b>Username:</b> @${userData.username || 'нет username'}
<b>Telegram ID:</b> ${userData.telegram_id}

<b>Сообщение:</b>
${dto.message}
    `.trim();

    // Send message to target user
    const sent = await this.telegramService.sendMessage(
      this.TARGET_USER_ID,
      formattedMessage,
    );

    if (!sent) {
      throw new BadRequestException('Failed to send message');
    }

    this.logger.log(
      `Contact message sent from user ${userData.telegram_id} to ${this.TARGET_USER_ID}`,
    );

    return {
      success: true,
      message: 'Message sent successfully',
    };
  }

  private validateTelegramInitData(initData: string): boolean {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set, skipping validation');
      return true; // Allow in development
    }

    try {
      const params: Record<string, string> = {};
      initData.split('&').forEach((pair) => {
        if (pair.includes('=')) {
          const [key, value] = pair.split('=');
          if (key && value) {
            params[key] = value;
          }
        }
      });

      const hash = params.hash;
      if (!hash) {
        return false;
      }

      // Create data-check-string
      const dataCheckArr: string[] = [];
      Object.keys(params)
        .filter((key) => key !== 'hash')
        .sort()
        .forEach((key) => {
          const decodedValue = decodeURIComponent(params[key]);
          dataCheckArr.push(`${key}=${decodedValue}`);
        });
      const dataCheckString = dataCheckArr.join('\n');

      // Calculate secret key
      const secretKey = createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

      // Calculate hash
      const calculatedHash = createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      return calculatedHash === hash;
    } catch (error) {
      this.logger.error('Error validating initData:', error);
      return false;
    }
  }

  private parseTelegramInitData(initData: string): {
    telegram_id: string;
    first_name: string;
    last_name: string;
    username: string;
  } {
    const params: Record<string, string> = {};
    initData.split('&').forEach((pair) => {
      if (pair.includes('=')) {
        const [key, value] = pair.split('=');
        if (key && value) {
          params[key] = value;
        }
      }
    });

    const userStr = decodeURIComponent(params.user || '{}');
    const user = JSON.parse(userStr);

    return {
      telegram_id: user.id?.toString() || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
    };
  }
}
