#!/bin/bash

# Apply all fixes directly on production server
# Применяет все исправления напрямую на production сервере

set -e

echo "🔧 ПРИМЕНЕНИЕ ИСПРАВЛЕНИЙ НА СЕРВЕРЕ"
echo "====================================="
echo ""

cd /home/user/lumon/back/api

# 1. Исправление chat.controller.ts - изменим POST на GET
echo "1️⃣  Исправление chat.controller.ts (POST → GET)..."
sed -i 's/@Post('\''chat-list'\''/@Get('\''chat-list'\''/g' src/modules/chat/chat.controller.ts

# Проверка
if grep -q "@Get('chat-list')" src/modules/chat/chat.controller.ts; then
    echo "✅ chat-list изменен на GET"
else
    echo "❌ Ошибка при изменении chat-list"
    exit 1
fi
echo ""

# 2. Исправление log-event.dto.ts
echo "2️⃣  Исправление log-event.dto.ts..."
cat > src/modules/analytics/dto/log-event.dto.ts << 'EOF'
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class LogEventDto {
  @IsString()
  @IsNotEmpty()
  action: string;

  @IsString()
  @IsOptional()
  resource?: string;

  @IsString()
  @IsOptional()
  resource_id?: string;

  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;
}
EOF

echo "✅ log-event.dto.ts обновлен"
echo ""

# 3. Исправление analytics.service.ts
echo "3️⃣  Исправление analytics.service.ts..."

# Создаем временный файл с исправленным сервисом
cat > src/modules/analytics/analytics.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEvent } from '@entities';
import { LogEventDto } from './dto/log-event.dto';
import { CurrentUserData } from '@/common/decorators/current-user.decorator';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AuditEvent)
    private auditRepository: Repository<AuditEvent>,
  ) {}

  /**
   * Log analytics event
   * Replaces: analytics.json workflow
   */
  async logEvent(
    dto: LogEventDto,
    user: CurrentUserData,
    ip: string,
    userAgent: string,
  ) {
    const event = await this.auditRepository.save({
      user_id: user.id,
      action: dto.action,
      resource_type: dto.resource || 'analytics',
      resource_id: dto.resource_id || null,
      metadata: dto.meta || {},
      ip,
      user_agent: userAgent,
    });

    return {
      success: true,
      data: {
        event_id: event.id,
        action: dto.action,
        timestamp: event.created_at,
      },
    };
  }

  /**
   * Get analytics for user
   */
  async getUserAnalytics(userId: string, limit = 100) {
    const events = await this.auditRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
    });

    return {
      success: true,
      data: events,
    };
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(userId?: string) {
    const where = userId ? { user_id: userId } : {};

    const events = await this.auditRepository.find({
      where,
      order: { created_at: 'DESC' },
      take: 1000,
    });

    // Group by action
    const summary: Record<string, number> = {};
    events.forEach((event) => {
      if (!summary[event.action]) {
        summary[event.action] = 0;
      }
      summary[event.action]++;
    });

    return {
      success: true,
      data: {
        total_events: events.length,
        summary,
      },
    };
  }
}
EOF

echo "✅ analytics.service.ts обновлен"
echo ""

# 4. Добавление enumName к entities (если еще не добавлено)
echo "4️⃣  Проверка enumName в entities..."

# Message entity
if ! grep -q "enumName: 'message_role'" src/entities/message.entity.ts; then
    echo "⚠️  Добавление enumName в message.entity.ts..."
    sed -i '/enum: MessageRole,$/a\    enumName: '\''message_role'\'',' src/entities/message.entity.ts
    echo "✅ message.entity.ts обновлен"
else
    echo "✅ message.entity.ts уже содержит enumName"
fi

# Session entity
if ! grep -q "enumName: 'user_role'" src/entities/session.entity.ts; then
    echo "⚠️  Добавление enumName в session.entity.ts..."
    sed -i '/enum: UserRole,$/a\    enumName: '\''user_role'\'',' src/entities/session.entity.ts
    echo "✅ session.entity.ts обновлен"
else
    echo "✅ session.entity.ts уже содержит enumName"
fi

# AB entities
if ! grep -q "enumName: 'ab_variant'" src/entities/ab-assignment.entity.ts; then
    echo "⚠️  Добавление enumName в ab-assignment.entity.ts..."
    sed -i '/enum: AbVariant,$/a\    enumName: '\''ab_variant'\'',' src/entities/ab-assignment.entity.ts
    echo "✅ ab-assignment.entity.ts обновлен"
else
    echo "✅ ab-assignment.entity.ts уже содержит enumName"
fi

if ! grep -q "enumName: 'ab_variant'" src/entities/ab-event.entity.ts; then
    echo "⚠️  Добавление enumName в ab-event.entity.ts..."
    sed -i '/enum: AbVariant,$/a\    enumName: '\''ab_variant'\'',' src/entities/ab-event.entity.ts
    echo "✅ ab-event.entity.ts обновлен"
else
    echo "✅ ab-event.entity.ts уже содержит enumName"
fi

echo ""

# 5. Обновление main.ts (описание endpoints)
echo "5️⃣  Обновление main.ts..."
sed -i 's/POST   \/webhook\/chat-list/GET    \/webhook\/chat-list/g' src/main.ts
echo "✅ main.ts обновлен"
echo ""

# 6. Сборка
echo "6️⃣  Сборка проекта..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Сборка успешна"
else
    echo "❌ Ошибка сборки"
    exit 1
fi
echo ""

# 7. Перезапуск сервиса
echo "7️⃣  Перезапуск сервиса..."
sudo systemctl restart lumon-api
sleep 3

if sudo systemctl is-active --quiet lumon-api; then
    echo "✅ Сервис успешно перезапущен"
else
    echo "❌ Ошибка при перезапуске сервиса"
    sudo systemctl status lumon-api --no-pager
    exit 1
fi
echo ""

# 8. Проверка статуса
echo "8️⃣  Проверка статуса..."
sudo systemctl status lumon-api --no-pager -l
echo ""

# 9. Проверка логов
echo "9️⃣  Последние строки логов:"
echo "--- STDOUT ---"
tail -20 /var/log/lumon-api.log
echo ""
echo "--- STDERR ---"
tail -20 /var/log/lumon-api-error.log
echo ""

echo "====================================="
echo "✅ ВСЕ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ!"
echo "====================================="
echo ""
echo "Проверьте фронтенд - ошибки должны исчезнуть:"
echo "  - 404 на /webhook/chat-list ✅"
echo "  - 400 на /webhook/analytics-log-event ✅"
echo "  - 500 на /webhook/chat-save-message ✅"
echo ""
