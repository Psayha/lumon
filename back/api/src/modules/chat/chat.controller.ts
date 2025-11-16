import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Headers,
  Ip,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SaveMessageDto } from './dto/save-message.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '@/common/decorators/current-user.decorator';

@Controller('webhook')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * POST /webhook/chat-create
   * Replaces: chat.create.v2.json workflow
   */
  @Post('chat-create')
  async createChat(
    @Body() dto: CreateChatDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.chatService.createChat(dto, user);
  }

  /**
   * GET /webhook/chat-list
   * Replaces: chat.list.json workflow
   */
  @Get('chat-list')
  async listChats(@CurrentUser() user: CurrentUserData) {
    return this.chatService.listChats(user);
  }

  /**
   * POST /webhook/chat-delete
   * Replaces: chat.delete.json workflow
   */
  @Post('chat-delete')
  async deleteChat(
    @Body('chat_id') chatId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.chatService.deleteChat(chatId, user);
  }

  /**
   * POST /webhook/chat-save-message
   * Replaces: save-message.json workflow
   */
  @Post('chat-save-message')
  async saveMessage(
    @Body() dto: SaveMessageDto,
    @CurrentUser() user: CurrentUserData,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.chatService.saveMessage(
      dto,
      user,
      idempotencyKey || null,
      ip,
      userAgent || 'unknown',
    );
  }

  /**
   * POST /webhook/chat-get-history
   * Replaces: get-chat-history.json workflow
   */
  @Post('chat-get-history')
  async getChatHistory(
    @Body('chat_id') chatId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.chatService.getChatHistory(chatId, user);
  }
}
