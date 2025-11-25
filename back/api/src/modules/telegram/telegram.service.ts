import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly apiUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set in environment variables');
    }
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Send a message to a Telegram user
   * @param userId - Telegram user ID
   * @param message - Message text to send
   */
  async sendMessage(userId: number, message: string): Promise<boolean> {
    if (!this.botToken) {
      this.logger.error('Cannot send message: TELEGRAM_BOT_TOKEN not configured');
      return false;
    }

    try {
      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: userId,
        text: message,
        parse_mode: 'HTML',
      });

      if (response.data.ok) {
        this.logger.log(`Message sent successfully to user ${userId}`);
        return true;
      } else {
        this.logger.error(`Failed to send message: ${JSON.stringify(response.data)}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Error sending message to user ${userId}:`, error);
      return false;
    }
  }
}
