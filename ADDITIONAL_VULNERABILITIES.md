# 🔴 ДОПОЛНИТЕЛЬНЫЕ КРИТИЧЕСКИЕ УЯЗВИМОСТИ

**Дата**: 2025-11-19
**Статус**: 🚨 **НАЙДЕНО ЕЩЕ 25 КРИТИЧЕСКИХ ПРОБЛЕМ**

---

## ⚠️ КРИТИЧЕСКИЕ ОШИБКИ В ПРЕДЫДУЩЕМ ИСПРАВЛЕНИИ

### ❌ 1. **СЛОМАННАЯ АДМИН АУТЕНТИФИКАЦИЯ** (CRITICAL - CVSS 10.0)
**Файлы**: `admin.service.ts:79-86`, `admin.controller.ts:56`
**Проблема**: Я пытался использовать `user_id = null` для админ сессий, но в `session.entity.ts:32` поле `user_id` НЕ nullable!

```typescript
// session.entity.ts:32
@Column({ type: 'uuid' })  // ❌ НЕ NULLABLE!
user_id!: string;

// admin.service.ts:79
await this.sessionRepository.save({
  user_id: null,  // ❌ КРИТИЧЕСКАЯ ОШИБКА! PostgreSQL вернет constraint violation!
```

**Последствия**: Админ логин ПОЛНОСТЬЮ СЛОМАН! При попытке логина будет ошибка БД.

---

### ❌ 2. **ADMINGUARD НЕ ЗАРЕГИСТРИРОВАН КАК PROVIDER** (CRITICAL - CVSS 9.5)
**Файл**: `admin.controller.ts:22`
**Проблема**: AdminGuard определен как класс внутри controller файла и требует dependency injection (`@InjectRepository`), но НЕ добавлен в providers модуля!

```typescript
// admin.controller.ts:22
@Injectable()
class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(Session)  // ❌ DI НЕ СРАБОТАЕТ!
    private sessionRepository: Repository<Session>,
  ) {}
```

**Последствия**: AdminGuard вызовет runtime error при попытке доступа к админ эндпоинтам. Все админ роуты СЛОМАНЫ!

---

## 🔴 НОВЫЕ КРИТИЧЕСКИЕ УЯЗВИМОСТИ

### 3. **TIMING ATTACK на Password Comparison** (CRITICAL - CVSS 8.1)
**Файл**: `admin.service.ts:68`
**Тип**: CWE-208 (Observable Timing Discrepancy)

```typescript
// УЯЗВИМЫЙ КОД:
if (password !== this.ADMIN_PASSWORD) {
  // ❌ Простое сравнение, уязвимо к timing attacks!
}
```

**Проблема**: Простое сравнение строк `!==` прерывается на первом несовпадающем символе. Атакующий может измерить время ответа и подобрать пароль посимвольно.

**Эксплуатация**:
```javascript
// Атакующий измеряет время для каждого символа:
// "a" - 1.2ms
// "b" - 1.2ms
// "c" - 1.3ms <- больше! Первый символ = 'c'
// "ca" - 1.3ms
// "cb" - 1.4ms <- больше! Второй символ = 'b'
// И так далее...
```

**Решение**: Использовать `crypto.timingSafeEqual()` или bcrypt.

---

### 4. **INFORMATION DISCLOSURE через /health/detailed** (HIGH - CVSS 7.5)
**Файл**: `health.controller.ts:31`
**Тип**: CWE-200 (Information Exposure)

```typescript
// УЯЗВИМЫЙ КОД:
@Get('health/detailed')  // ❌ БЕЗ @UseGuards!
async detailedHealthCheck() {
  return {
    uptime: process.uptime(),  // Раскрывает время работы сервера
    memory: {
      used_mb: ...,  // Раскрывает использование памяти
      total_mb: ...,
    },
    database: {
      latency_ms: ...,  // Раскрывает производительность БД
    },
  };
}
```

**Последствия**: Атакующий может:
- Определить время перезапуска (для timing атак)
- Понять нагрузку на сервер (для DDoS)
- Получить информацию о БД

---

### 5. **NO RATE LIMITING на /webhook/admin/login** (CRITICAL - CVSS 9.0)
**Файл**: `admin.controller.ts:75`
**Тип**: CWE-307 (Improper Restriction of Excessive Authentication Attempts)

```typescript
@Post('login')  // ❌ НЕТ СПЕЦИАЛЬНОГО RATE LIMITING!
async login(@Body() dto: AdminLoginDto) {
```

**Проблема**: Хотя есть глобальный ThrottlerGuard (10 req/sec), это СЛИШКОМ МНОГО для login endpoint. Можно делать:
- 600 попыток в минуту
- 36,000 попыток в час
- 864,000 попыток в сутки

**Эксплуатация**: Brute force admin пароля возможен!

---

### 6. **NO ACCOUNT LOCKOUT после Failed Attempts** (HIGH - CVSS 7.8)
**Файл**: `admin.service.ts:65`
**Тип**: CWE-307

**Проблема**: Нет механизма блокировки аккаунта после N неудачных попыток. Можно бесконечно пытаться подобрать пароль.

---

### 7. **SESSION TOKENS в Plain Text** (HIGH - CVSS 7.5)
**Файл**: `auth.service.ts:54`, `admin.service.ts:79`
**Тип**: CWE-312 (Cleartext Storage of Sensitive Information)

```typescript
await this.sessionRepository.save({
  session_token: sessionToken,  // ❌ UUID в открытом виде!
```

**Проблема**: Session tokens хранятся в БД в открытом виде. При компрометации БД (SQL injection, backup leak) все сессии скомпрометированы немедленно.

**Решение**: Хешировать токены перед сохранением (SHA-256).

---

### 8. **NO CLEANUP старых Sessions** (MEDIUM - CVSS 6.5)
**Проблема**: Expired sessions никогда не удаляются из БД. База будет расти бесконечно.

**Последствия**:
- Degraded database performance
- Disk space exhaustion
- Slow session queries

---

### 9. **NO CLEANUP старых Idempotency Keys** (MEDIUM - CVSS 6.5)
**Файл**: `chat.service.ts:190-203`
**Проблема**: Idempotency keys с TTL 24 часа никогда не удаляются. Таблица будет расти бесконечно.

---

### 10. **UNSAFE JSON.parse без Validation** (HIGH - CVSS 7.2)
**Файл**: `auth.service.ts:242`
**Тип**: CWE-502 (Deserialization of Untrusted Data)

```typescript
const userStr = decodeURIComponent(params.user);
user = JSON.parse(userStr);  // ❌ НЕТ ПРОВЕРКИ НА __proto__!
```

**Проблема**: JSON может содержать `__proto__`, `constructor`, `prototype` для prototype pollution.

**Эксплуатация**:
```javascript
const malicious = {
  "__proto__": {
    "isAdmin": true
  }
};
// После JSON.parse - Object.prototype загрязнен!
```

---

### 11. **NO VALIDATION на A/B Testing Endpoints** (HIGH - CVSS 7.5)
**Файл**: `admin.controller.ts:183, 189`
**Тип**: CWE-20 (Improper Input Validation)

```typescript
@Post('ab-experiment-create')
async createAbExperiment(@Body() body: any) {  // ❌ any без валидации!
  return this.adminService.createAbExperiment(body);
}
```

**Проблема**: Полностью недоверенные данные передаются напрямую в service. Можно передать что угодно.

---

### 12. **BACKUP FILE_PATH от Пользователя** (HIGH - CVSS 7.8)
**Файл**: `admin.controller.ts:237`

```typescript
@Post('backup-restore')
async restoreBackup(@Body() body: { backup_id: string; file_path: string }) {
  // ❌ file_path приходит ОТ ПОЛЬЗОВАТЕЛЯ!
  return this.adminService.restoreBackup(body.backup_id, body.file_path);
}
```

**Проблема**: Даже с моей валидацией пути, админ может указать ЛЮБОЙ файл в /var/backups/. Нужно использовать только backup_id, а путь получать из БД.

---

### 13. **DEPRECATED CRYPTO Package** (LOW - CVSS 4.0)
**Файл**: `package.json:33`

```json
"crypto": "^1.0.1",  // ❌ DEPRECATED!
```

**Проблема**: Пакет `crypto` deprecated. Нужно использовать встроенный Node.js `crypto` module.

---

### 14. **NPM VULNERABILITIES не исправлены** (HIGH - CVSS 7.5)
**Количество**: 8 уязвимостей (4 low, 2 moderate, 2 high)

```bash
glob: Command injection via -c/--cmd (CVSS 7.5)
@nestjs/cli: Multiple transitive vulnerabilities
```

**Решение**: `npm audit fix`

---

### 15. **NO CSRF TOKENS** (HIGH - CVSS 7.1)
**Тип**: CWE-352 (Cross-Site Request Forgery)

**Проблема**: CSRF защита ВСЁ ЕЩЁ не реализована. Атакующий сайт может:
- Удалять пользователей
- Создавать бэкапы
- Изменять лимиты
- Очищать историю

**Эксплуатация**:
```html
<!-- На сайте атакующего: -->
<img src="https://n8n.psayha.ru/webhook/admin/user-delete"
     style="display:none" />
<script>
  fetch('https://n8n.psayha.ru/webhook/admin/user-delete', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({user_id: 'victim-id'})
  });
</script>
```

---

### 16. **NO INPUT LENGTH LIMITS** (MEDIUM - CVSS 6.0)
**Файлы**: Multiple DTOs

```typescript
// create-chat.dto.ts
export class CreateChatDto {
  title?: string;  // ❌ НЕТ @MaxLength!
}

// admin-login.dto.ts
export class AdminLoginDto {
  username!: string;  // ❌ НЕТ @MaxLength!
  password!: string;  // ❌ НЕТ @MaxLength!
}
```

**Проблема**: DoS атаки через огромные строки (например, 10MB username).

---

### 17. **NO SESSION FINGERPRINTING** (MEDIUM - CVSS 6.5)
**Тип**: Session Hijacking vulnerability

**Проблема**: Session токены не привязаны к:
- IP адресу
- User-Agent
- TLS fingerprint

**Последствия**: Украденный токен можно использовать с любого устройства/IP.

---

### 18. **METADATA может содержать Циклические Ссылки** (LOW - CVSS 4.5)
**Файл**: `save-message.dto.ts:36`

```typescript
metadata?: MessageMetadata;
```

**Проблема**: При попытке JSON.stringify циклической структуры - crash.

---

### 19. **NO SECURITY LOGGING** (MEDIUM - CVSS 5.5)
**Проблема**: Нет логирования критических событий:
- Failed login attempts
- Password changes
- Session creation/destruction
- Admin actions

**Последствия**: Невозможно обнаружить breach или провести forensics.

---

### 20. **VERBOSE ERROR MESSAGES в Production** (MEDIUM - CVSS 5.0)
**Файлы**: Все сервисы

```typescript
throw new Error(`Failed to restore backup: ${(error as Error).message}`);
```

**Проблема**: Детальные ошибки в production раскрывают:
- Структуру БД
- Пути файлов
- Версии библиотек

---

### 21. **NO 2FA для Admin** (HIGH - CVSS 7.0)
**Проблема**: Админ панель защищена только паролем. Нет:
- TOTP
- SMS
- Email verification
- Hardware keys

---

### 22. **MISSING Security Headers** (MEDIUM - CVSS 5.5)
Хотя добавлен Helmet, не хватает:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy`

---

### 23. **NO HTTPS Enforcement** (HIGH - CVSS 7.5)
**Проблема**: Нет редиректа HTTP → HTTPS в коде. Credentials могут утечь по незащищенному каналу.

---

### 24. **OPEN REDIRECTS возможны** (MEDIUM - CVSS 6.0)
**Проблема**: Нужно проверить все redirect'ы на валидацию URL.

---

### 25. **MISSING .well-known/security.txt** (LOW - CVSS 3.0)
**Тип**: RFC 9116 compliance

**Проблема**: Нет файла для responsible disclosure. Исследователи безопасности не знают, куда сообщать об уязвимостях.

---

## 📊 ИТОГОВАЯ СТАТИСТИКА

### Всего найдено уязвимостей:
| Аудит | Critical | High | Medium | Low | Total |
|-------|----------|------|--------|-----|-------|
| Первый | 7 | 8 | 7 | 2 | **24** |
| Второй | 2 | 10 | 9 | 4 | **25** |
| **ИТОГО** | **9** | **18** | **16** | **6** | **49** |

---

## 🚨 САМЫЕ КРИТИЧНЫЕ (требуют НЕМЕДЛЕННОГО исправления)

1. ❌ **СЛОМАННАЯ АДМИН АУТЕНТИФИКАЦИЯ** - админ логин не работает!
2. ❌ **AdminGuard не зарегистрирован** - все админ роуты сломаны!
3. 🔥 **Timing Attack на admin password**
4. 🔥 **No rate limiting на login**
5. 🔥 **Information disclosure через /health/detailed**
6. 🔥 **CSRF не защищен**
7. 🔥 **Session tokens в plain text**
8. 🔥 **Unsafe JSON.parse**

---

## 💡 ПРИОРИТЕТ ИСПРАВЛЕНИЯ

### Критический (немедленно):
1. Исправить user_id nullable в Sessions OR изменить логику админ сессий
2. Вынести AdminGuard в отдельный файл и зарегистрировать
3. Добавить constant-time password comparison
4. Добавить строгий rate limiting на /login (max 5 attempts/hour)
5. Защитить /health/detailed аутентификацией
6. Хешировать session tokens
7. Добавить CSRF protection

### Высокий (в течение недели):
8. Добавить account lockout
9. Исправить JSON.parse (проверка на __proto__)
10. Добавить валидацию A/B endpoints
11. Убрать file_path из backup-restore API
12. Исправить npm vulnerabilities
13. Добавить 2FA для админа

### Средний (в течение месяца):
14. Добавить cleanup jobs для sessions/idempotency
15. Добавить input length limits
16. Добавить session fingerprinting
17. Добавить security logging
18. Улучшить error handling
19. Добавить HTTPS enforcement

---

**Заключение**: Предыдущее исправление решило многие проблемы, но внесло 2 критические ошибки и пропустило 23 другие уязвимости. Требуется второй раунд исправлений.
