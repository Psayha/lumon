# 🔧 Исправление ошибки N8N_SECURE_COOKIE

## Проблема
Ошибка: "Your n8n server is configured to use a secure cookie, however you are either visiting this via an insecure URL, or using Safari."

## Решение

### Вариант 1: Если SSL сертификат УЖЕ получен (HTTPS работает)

На сервере в файле `/var/www/back/.env` (или `.env.production`) установи:

```bash
N8N_HOST=n8n.psayha.ru
N8N_PROTOCOL=https
N8N_SECURE_COOKIE=true
```

Затем перезапусти контейнеры:

```bash
cd /var/www/back
docker compose down
docker compose up -d
```

### Вариант 2: Если SSL сертификат ЕЩЕ НЕ получен (работает только HTTP)

На сервере в файле `/var/www/back/.env` установи:

```bash
N8N_HOST=n8n.psayha.ru
N8N_PROTOCOL=http
N8N_SECURE_COOKIE=false
```

Затем перезапусти контейнеры:

```bash
cd /var/www/back
docker compose down
docker compose up -d
```

### Вариант 3: Временное решение (не рекомендуется для продакшена)

Если нужно временно отключить проверку secure cookie:

```bash
N8N_SECURE_COOKIE=false
```

## Проверка текущего статуса SSL

```bash
# Проверь доступность через HTTPS
curl -I https://n8n.psayha.ru

# Если возвращает 200 OK - SSL работает, используй Вариант 1
# Если ошибка SSL - используй Вариант 2
```

## После получения SSL

Когда получишь SSL сертификат через certbot:

```bash
sudo certbot --nginx -d n8n.psayha.ru
```

Автоматически обнови `.env`:

```bash
N8N_HOST=n8n.psayha.ru
N8N_PROTOCOL=https
N8N_SECURE_COOKIE=true
```

И перезапусти контейнеры:

```bash
cd /var/www/back
docker compose restart n8n
```

## Проверка конфигурации

После изменений проверь логи:

```bash
docker logs lumon-n8n --tail 50
```

Убедись, что нет ошибок и n8n запустился корректно.

