# ⚡ Быстрое исправление 405 ошибки

## Проблема
```json
{
  "success": false,
  "status": 405,
  "statusText": "Not Allowed"
}
```

## Решение за 1 минуту

### На сервере выполни:

```bash
# 1. Перейди в проект
cd /root/lumon2/back

# 2. Обнови git (если есть новые изменения)
cd ..
git pull

# 3. Обнови nginx конфигурацию
cd back
sudo bash update-nginx-frontend.sh

# 4. Готово! Проверь:
curl -X POST https://psayha.ru/webhook/create-user \
  -H "Content-Type: application/json" \
  -d '{"telegram_id":123456789,"username":"test"}'
```

## Что исправлено

Добавлен блок проксирования в nginx:
```nginx
location /webhook/ {
    proxy_pass https://n8n.psayha.ru/webhook/;
    ...
}
```

Теперь запросы к `/webhook/*` правильно проксируются на n8n сервер.

---

**Документация:**
- Подробности: [`FIX_405_ERROR.md`](./FIX_405_ERROR.md)
- Полная настройка: [`CONNECT_FRONTEND.md`](./CONNECT_FRONTEND.md)

