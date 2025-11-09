# Настройка алертов для cron задач

## Переменные окружения

Добавьте в `.env` или в crontab:

```bash
# Email алерты
export ALERT_EMAIL="admin@example.com"

# Telegram алерты
export ALERT_TELEGRAM_BOT_TOKEN="your_bot_token"
export ALERT_TELEGRAM_CHAT_ID="your_chat_id"
```

## Настройка Telegram бота

1. Создайте бота через @BotFather в Telegram
2. Получите токен бота
3. Получите chat_id (отправьте сообщение боту, затем откройте `https://api.telegram.org/bot<TOKEN>/getUpdates`)

## Использование

Алерты автоматически отправляются при:
- Ошибках создания бэкапов
- Проблемах со здоровьем системы (unhealthy/down статус)

