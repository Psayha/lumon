# 🚀 Деплой на Сервер - ДЛЯ SSH

## Что делать (по порядку):

### 1️⃣ Подключитесь к серверу по SSH

```bash
ssh user@your-server-ip
```

### 2️⃣ Склонируйте проект на сервер

```bash
# Создать директорию
sudo mkdir -p /home/user
cd /home/user

# Склонировать из GitHub
sudo git clone https://github.com/Psayha/lumon.git

# Перейти в проект
cd lumon

# Переключиться на рабочую ветку
sudo git checkout claude/n8n-backend-discussion-01EyCeQ9q98KrPg4HanTuzyr

# Проверить что файлы есть
ls -la back/api/
```

### 3️⃣ Настроить .env файл

```bash
cd /home/user/lumon/back/api

# Создать .env
sudo cp .env.production.example .env

# Отредактировать
sudo nano .env
```

**Заполните эти поля в .env:**

```env
# Database (Supabase)
DB_HOST=db.xxxxxxxxx.supabase.co
DB_PASSWORD=ваш-пароль

# OpenAI
OPENAI_API_KEY=sk-proj-ваш-ключ

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC...

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ваш-пароль-минимум-12-символов
```

Сохранить: `Ctrl+X` → `Y` → `Enter`

### 4️⃣ Запустить деплой

```bash
cd /home/user/lumon/back/api

# Запустить deployment скрипт
sudo bash SIMPLE_DEPLOY.sh
```

Скрипт автоматически:
- ✅ Установит зависимости
- ✅ Соберет проект
- ✅ Установит systemd service
- ✅ Запустит API
- ✅ Настроит nginx

### 5️⃣ Установить SSL

```bash
# Установить certbot
sudo apt install -y certbot python3-certbot-nginx

# Получить SSL сертификат
sudo certbot --nginx -d n8n.psayha.ru
```

### 6️⃣ Проверить что работает

Откройте в браузере:
```
https://n8n.psayha.ru/health
```

Должно показать:
```json
{"status":"ok","service":"lumon-api",...}
```

---

## ✅ Готово!

Теперь:
1. Обновите frontend (замените `VITE_API_URL` на `https://n8n.psayha.ru`)
2. Протестируйте через ваш сайт
3. Старый n8n можно оставить как backup

---

## 🔧 Полезные команды на сервере

```bash
# Статус сервиса
sudo systemctl status lumon-api

# Логи (live)
sudo journalctl -u lumon-api -f

# Перезапустить
sudo systemctl restart lumon-api

# Проверить API
curl http://localhost:3000/health
```

---

## ❗ Если что-то не работает

**1. API не запустился:**
```bash
sudo journalctl -u lumon-api -n 50
```

**2. Не подключается к базе:**
- Проверьте .env: `cat /home/user/lumon/back/api/.env`
- Проверьте что DB_HOST и DB_PASSWORD правильные

**3. 502 Bad Gateway:**
```bash
# Проверить что API работает
curl http://localhost:3000/health

# Проверить nginx
sudo nginx -t
sudo tail -100 /var/log/nginx/error.log
```

**4. DNS не работает:**
- Убедитесь что n8n.psayha.ru указывает на IP вашего сервера
- Проверьте: `dig n8n.psayha.ru`

---

## 📞 Нужна помощь?

Запустите диагностику:

```bash
# 1. Проверить service
sudo systemctl status lumon-api

# 2. Проверить логи
sudo journalctl -u lumon-api -n 100

# 3. Проверить API
curl http://localhost:3000/health

# 4. Проверить nginx
sudo nginx -t

# 5. Проверить порт
sudo netstat -tlnp | grep :3000
```

Скопируйте вывод этих команд чтобы понять проблему.

---

**Удачи! 🚀**
