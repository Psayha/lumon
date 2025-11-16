# Команды для проверки и исправления сервера

## 1. ДИАГНОСТИКА СЕРВЕРА

Выполните на сервере `n8n.psayha.ru`:

```bash
cd /home/user/lumon/back/api

# Скачать скрипт диагностики
curl -o CHECK_SERVER.sh https://raw.githubusercontent.com/Psayha/lumon/main/back/api/CHECK_SERVER.sh
chmod +x CHECK_SERVER.sh

# Запустить диагностику
bash CHECK_SERVER.sh
```

Или вручную:

```bash
cd /home/user/lumon/back/api

# Проверить текущую ветку
git branch -v

# Проверить дубли node_modules
find /home/user/lumon -type d -name "node_modules"

# Проверить дубли dist
find /home/user/lumon -type d -name "dist"

# Проверить запущенные процессы
ps aux | grep node

# Проверить статус сервиса
systemctl status lumon-api

# Проверить логи
tail -50 /var/log/lumon-api.log
tail -50 /var/log/lumon-api-error.log
```

---

## 2. ПРИМЕНЕНИЕ ИСПРАВЛЕНИЙ

### Вариант A: Автоматическое применение (РЕКОМЕНДУЕТСЯ)

```bash
cd /home/user/lumon/back/api

# Скачать скрипт исправлений
curl -o APPLY_FIXES_SERVER.sh https://raw.githubusercontent.com/Psayha/lumon/main/back/api/APPLY_FIXES_SERVER.sh
chmod +x APPLY_FIXES_SERVER.sh

# Запустить применение исправлений
bash APPLY_FIXES_SERVER.sh
```

### Вариант B: Ручное применение

```bash
cd /home/user/lumon/back/api

# 1. Исправить chat.controller.ts (POST → GET)
sed -i 's/@Post('\''chat-list'\''/@Get('\''chat-list'\''/g' src/modules/chat/chat.controller.ts

# Проверить
grep -A 3 "chat-list" src/modules/chat/chat.controller.ts

# 2. Исправить log-event.dto.ts
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

# Проверить
cat src/modules/analytics/dto/log-event.dto.ts

# 3. Исправить analytics.service.ts
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

  async getAnalyticsSummary(userId?: string) {
    const where = userId ? { user_id: userId } : {};

    const events = await this.auditRepository.find({
      where,
      order: { created_at: 'DESC' },
      take: 1000,
    });

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

# 4. Добавить enumName в entities (если еще нет)

# message.entity.ts
if ! grep -q "enumName: 'message_role'" src/entities/message.entity.ts; then
  sed -i '/enum: MessageRole,$/a\    enumName: '\''message_role'\'',' src/entities/message.entity.ts
fi

# session.entity.ts
if ! grep -q "enumName: 'user_role'" src/entities/session.entity.ts; then
  sed -i '/enum: UserRole,$/a\    enumName: '\''user_role'\'',' src/entities/session.entity.ts
fi

# ab-assignment.entity.ts
if ! grep -q "enumName: 'ab_variant'" src/entities/ab-assignment.entity.ts; then
  sed -i '/enum: AbVariant,$/a\    enumName: '\''ab_variant'\'',' src/entities/ab-assignment.entity.ts
fi

# ab-event.entity.ts
if ! grep -q "enumName: 'ab_variant'" src/entities/ab-event.entity.ts; then
  sed -i '/enum: AbVariant,$/a\    enumName: '\''ab_variant'\'',' src/entities/ab-event.entity.ts
fi

# 5. Обновить main.ts
sed -i 's/POST   \/webhook\/chat-list/GET    \/webhook\/chat-list/g' src/main.ts

# 6. Собрать проект
npm run build

# 7. Перезапустить сервис
sudo systemctl restart lumon-api

# 8. Проверить статус
sudo systemctl status lumon-api

# 9. Проверить логи
tail -50 /var/log/lumon-api.log
```

---

## 3. ОЧИСТКА СЕРВЕРА (если нужно)

```bash
cd /home/user/lumon/back/api

# Удалить старые node_modules и dist
rm -rf node_modules dist

# Чистая установка
npm ci

# Сборка
npm run build

# Перезапуск
sudo systemctl restart lumon-api
```

---

## 4. ПРОВЕРКА РЕЗУЛЬТАТА

После применения исправлений проверьте фронтенд:

✅ **404 на /webhook/chat-list** → должен исчезнуть (теперь GET)
✅ **400 на /webhook/analytics-log-event** → должен исчезнуть (новый DTO)
✅ **500 на /webhook/chat-save-message** → должен исчезнуть (enumName добавлен)

Если ошибки остались, проверьте логи:

```bash
tail -100 /var/log/lumon-api-error.log
```

---

## 5. МОНИТОРИНГ

```bash
# Следить за логами в реальном времени
tail -f /var/log/lumon-api.log

# Проверить работу API
curl http://localhost:3000/health

# Проверить детальный статус
curl http://localhost:3000/health/detailed
```

---

## КРАТКАЯ ПОСЛЕДОВАТЕЛЬНОСТЬ

```bash
# На сервере n8n.psayha.ru выполните:

cd /home/user/lumon/back/api
bash APPLY_FIXES_SERVER.sh

# Или если скрипта нет:

sed -i 's/@Post('\''chat-list'\''/@Get('\''chat-list'\''/g' src/modules/chat/chat.controller.ts
npm run build
sudo systemctl restart lumon-api
sudo systemctl status lumon-api
```
