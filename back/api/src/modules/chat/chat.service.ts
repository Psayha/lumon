import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Chat,
  Message,
  MessageRole,
  AuditEvent,
  IdempotencyKey,
} from '@entities';
import { CreateChatDto } from './dto/create-chat.dto';
import { SaveMessageDto } from './dto/save-message.dto';
import { CurrentUserData } from '@/common/decorators/current-user.decorator';
import { v4 as uuidv4 } from 'uuid';
import { filterXSS } from 'xss';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(AuditEvent)
    private auditRepository: Repository<AuditEvent>,
    @InjectRepository(IdempotencyKey)
    private idempotencyRepository: Repository<IdempotencyKey>,
  ) {}

  /**
   * Create new chat
   * Replaces: chat.create.v2.json workflow
   */
  async createChat(dto: CreateChatDto, user: CurrentUserData) {
    const chat = await this.chatRepository.save({
      user_id: user.id,
      company_id: user.company_id || undefined,
      title: dto.title || 'New Chat',
    }) as Chat;

    return {
      success: true,
      data: {
        id: chat.id,
        user_id: chat.user_id,
        company_id: chat.company_id,
        title: chat.title,
        created_at: chat.created_at,
        updated_at: chat.updated_at,
      },
      traceId: uuidv4(),
    };
  }

  /**
   * List user's chats
   * Replaces: chat.list.json workflow
   *
   * SECURITY FIX: Proper multi-tenancy isolation based on role
   * - Viewer: Only own chats
   * - Manager: Only own chats (NOT other managers' chats)
   * - Owner: All company chats
   */
  async listChats(user: CurrentUserData) {
    let where: any;

    if (user.role === 'owner' && user.company_id) {
      // Owner sees ALL company chats
      where = { company_id: user.company_id };
    } else if (user.role === 'manager' && user.company_id) {
      // Manager sees ONLY their own chats (with company context)
      where = {
        user_id: user.id,
        company_id: user.company_id,
      };
    } else {
      // Viewer (or no company) sees ONLY their own chats
      where = { user_id: user.id };
    }

    const chats = await this.chatRepository.find({
      where,
      order: { created_at: 'DESC' },
    });

    return {
      success: true,
      data: chats,
    };
  }

  /**
   * Delete chat
   * Replaces: chat.delete.json workflow
   *
   * SECURITY FIX: Proper access control
   * - Users can only delete their own chats
   * - Owners can delete any company chat
   */
  async deleteChat(chatId: string, user: CurrentUserData) {
    // Check access
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Check ownership based on role
    let hasAccess = false;

    if (chat.user_id === user.id) {
      // User owns the chat - always allowed
      hasAccess = true;
    } else if (
      user.role === 'owner' &&
      user.company_id &&
      chat.company_id === user.company_id
    ) {
      // Owner can delete any company chat
      hasAccess = true;
    }

    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    await this.chatRepository.delete(chatId);

    return {
      success: true,
      message: 'Chat deleted successfully',
    };
  }

  /**
   * Save message with idempotency support
   * Replaces: save-message.json workflow (the most complex one!)
   */
  async saveMessage(
    dto: SaveMessageDto,
    user: CurrentUserData,
    idempotencyKey: string | null,
    ip: string,
    userAgent: string,
  ) {
    // Check for idempotency key (deduplication)
    if (idempotencyKey) {
      const cachedResponse = await this.idempotencyRepository.findOne({
        where: {
          key: idempotencyKey,
        },
      });

      if (cachedResponse && cachedResponse.expires_at > new Date()) {
        // Return cached response
        return cachedResponse.response;
      }
    }

    // Check chat access
    const chat = await this.chatRepository.findOne({
      where: { id: dto.chat_id },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // SECURITY FIX: Verify access based on role
    // - Users can only add messages to their own chats
    // - Owners can add messages to any company chat
    let hasAccess = false;

    if (chat.user_id === user.id) {
      // User owns the chat - always allowed
      hasAccess = true;
    } else if (
      user.role === 'owner' &&
      user.company_id &&
      chat.company_id === user.company_id
    ) {
      // Owner can access any company chat
      hasAccess = true;
    }

    if (!hasAccess) {
      throw new ForbiddenException('Chat not found or access denied');
    }

    // SECURITY FIX: Sanitize content to prevent XSS
    const sanitizedContent = filterXSS(dto.content.trim(), {
      whiteList: {}, // Remove all HTML tags
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style'],
    });

    // Insert message
    const message = await this.messageRepository.save({
      chat_id: dto.chat_id,
      role: dto.role,
      content: sanitizedContent,
      metadata: dto.metadata || {},
    });

    // Update chat title with first user message
    if (dto.role === MessageRole.USER && (chat.title === 'New Chat' || chat.title === 'Новый чат' || !chat.title || chat.title === '')) {
      // Check if this is the first user message
      const userMessageCount = await this.messageRepository.count({
        where: { chat_id: dto.chat_id, role: MessageRole.USER },
      });

      if (userMessageCount === 1) {
        // This is the first user message, update chat title
        const titleText = sanitizedContent.substring(0, 100); // First 100 chars
        await this.chatRepository.update(
          { id: dto.chat_id },
          { title: titleText },
        );
      }
    }

    // Log audit event (fire and forget)
    this.auditRepository
      .save({
        user_id: user.id,
        action: 'message.sent',
        resource_type: 'message',
        resource_id: message.id,
        metadata: {
          chat_id: dto.chat_id,
          role: dto.role,
          message_length: dto.content.length,
        },
        ip,
        user_agent: userAgent,
      })
      .catch((err) => console.error('Failed to log audit event:', err));

    // Build response
    const response = {
      success: true,
      data: {
        id: message.id,
        chat_id: message.chat_id,
        role: message.role,
        content: message.content,
        metadata: message.metadata,
        created_at: message.created_at,
      },
      traceId: uuidv4(),
    };

    // Save idempotency key (fire and forget)
    if (idempotencyKey) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

      this.idempotencyRepository
        .save({
          key: idempotencyKey,
          user_id: user.id,
          response,
          expires_at: expiresAt,
        })
        .catch((err) =>
          console.error('Failed to save idempotency key:', err),
        );
    }

    return response;
  }

  /**
   * Get chat history
   * Replaces: get-chat-history.json workflow
   *
   * SECURITY FIX: Proper access control
   * - Users can only view their own chat history
   * - Owners can view any company chat history
   */
  async getChatHistory(chatId: string, user: CurrentUserData) {
    // Check access
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Check ownership based on role
    let hasAccess = false;

    if (chat.user_id === user.id) {
      // User owns the chat - always allowed
      hasAccess = true;
    } else if (
      user.role === 'owner' &&
      user.company_id &&
      chat.company_id === user.company_id
    ) {
      // Owner can view any company chat
      hasAccess = true;
    }

    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    // Get messages
    const messages = await this.messageRepository.find({
      where: { chat_id: chatId },
      order: { created_at: 'ASC' },
    });

    return {
      success: true,
      data: {
        chat_id: chatId,
        messages,
      },
    };
  }
}
