# 🚀 Деплой на Сервер - Пошаговая Инструкция

## ШАГ 1: Клонировать проект на сервер

```bash
# Перейти в домашнюю директорию
cd ~

# Создать директорию для проектов если нужно
mkdir -p /home/user
cd /home/user

# Склонировать проект из GitHub
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git lumon

# Перейти в проект
cd lumon

# Переключиться на правильную ветку
git checkout claude/n8n-backend-discussion-01EyCeQ9q98KrPg4HanTuzyr

# Проверить что все файлы на месте
ls -la back/api/
```

**ВАЖНО:** Замените `YOUR_USERNAME/YOUR_REPO_NAME` на реальный URL вашего репозитория!

---

## ШАГ 2: Настроить .env файл

```bash
# Перейти в директорию API
cd /home/user/lumon/back/api

# Создать .env из шаблона
cp .env.production.example .env

# Отредактировать .env
nano .env
```

**Заполните следующие поля:**

```env
PORT=3000
NODE_ENV=production

# Supabase Database
DB_HOST=db.xxxxxxxxx.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=ваш-пароль-от-supabase
DB_DATABASE=postgres
DB_SSL=true

# OpenAI
OPENAI_API_KEY=sk-proj-ваш-ключ

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABC...

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ваш-безопасный-пароль-минимум-12-символов
```

Сохраните: `Ctrl+X`, затем `Y`, затем `Enter`

---

## ШАГ 3: Установить зависимости и собрать

```bash
cd /home/user/lumon/back/api

# Установить зависимости (1-2 минуты)
npm ci --production

# Собрать проект
npm run build

# Проверить что dist создан
ls -la dist/
```

---

## ШАГ 4: Установить systemd сервис

```bash
cd /home/user/lumon/back/api

# Скопировать service файл
sudo cp lumon-api.service /etc/systemd/system/

# Перезагрузить systemd
sudo systemctl daemon-reload

# Включить автозапуск
sudo systemctl enable lumon-api

# Запустить сервис
sudo systemctl start lumon-api

# Проверить статус
sudo systemctl status lumon-api
```

**Должно быть:**
```
● lumon-api.service - Lumon NestJS API Server
   Active: active (running)
```

Если ошибки, смотрите логи:
```bash
sudo journalctl -u lumon-api -n 100
```

---

## ШАГ 5: Проверить что API работает

```bash
# Health check
curl http://localhost:3000/health

# Должен вернуть:
# {"status":"ok","service":"lumon-api",...}
```

Если не работает:
```bash
# Посмотреть логи
sudo journalctl -u lumon-api -f
```

---

## ШАГ 6: Настроить Nginx

```bash
cd /home/user/lumon/back/api

# Установить nginx если нужно
sudo apt update
sudo apt install -y nginx

# Скопировать конфиг
sudo cp nginx-lumon-api.conf /etc/nginx/sites-available/lumon-api

# Создать symlink
sudo ln -s /etc/nginx/sites-available/lumon-api /etc/nginx/sites-enabled/

# Проверить конфиг
sudo nginx -t

# Перезагрузить nginx
sudo systemctl reload nginx
```

---

## ШАГ 7: Установить SSL

```bash
# Установить certbot
sudo apt install -y certbot python3-certbot-nginx

# Получить SSL сертификат
sudo certbot --nginx -d n8n.psayha.ru

# Следуйте инструкциям:
# - Введите email
# - Согласитесь с Terms
# - Выберите redirect HTTP -> HTTPS (yes)
```

**ВАЖНО:** DNS для n8n.psayha.ru должен быть настроен на IP этого сервера!

---

## ШАГ 8: Проверить через браузер

Откройте в браузере:
```
https://n8n.psayha.ru/health
```

Должны увидеть:
```json
{
  "status": "ok",
  "service": "lumon-api",
  "timestamp": "...",
  "uptime": 123.45
}
```

---

## ШАГ 9: Обновить Frontend

```bash
cd /home/user/lumon

# Создать .env.production
echo "VITE_API_URL=https://n8n.psayha.ru" > .env.production

# Пересобрать frontend
npm run build
```

---

## ✅ ГОТОВО!

Теперь проверьте через frontend:
1. Откройте ваш сайт
2. Залогиньтесь через Telegram
3. Создайте чат
4. Отправьте сообщение

Все должно работать! 🎉

---

## 🔧 Полезные команды

### Управление сервисом
```bash
sudo systemctl status lumon-api   # статус
sudo systemctl restart lumon-api  # перезапуск
sudo systemctl stop lumon-api     # остановить
sudo systemctl start lumon-api    # запустить
```

### Логи
```bash
sudo journalctl -u lumon-api -f           # live логи
sudo journalctl -u lumon-api -n 100       # последние 100 строк
```

### Если что-то сломалось
```bash
# 1. Проверить API локально
curl http://localhost:3000/health

# 2. Проверить логи
sudo journalctl -u lumon-api -n 50

# 3. Проверить .env
cat /home/user/lumon/back/api/.env

# 4. Проверить nginx
sudo nginx -t
sudo tail -100 /var/log/nginx/error.log

# 5. Перезапустить все
sudo systemctl restart lumon-api
sudo systemctl reload nginx
```

---

## 📞 Если нужна помощь

1. Проверьте логи: `sudo journalctl -u lumon-api -f`
2. Проверьте health: `curl http://localhost:3000/health`
3. Проверьте .env: все поля заполнены?
4. Проверьте DNS: `dig n8n.psayha.ru`

Готово к production! 🚀
