# ⚡ Quick Start - Deploy на n8n.psayha.ru

## За 5 минут 🚀

### 1. Настроить .env

```bash
cd /home/user/lumon/back/api

# Скопировать example
cp .env.production.example .env

# Отредактировать
nano .env
```

**Заполнить:**
- `DB_HOST`, `DB_PASSWORD` - из Supabase Dashboard
- `OPENAI_API_KEY` - из OpenAI Platform
- `TELEGRAM_BOT_TOKEN` - из @BotFather

### 2. Задеплоить

```bash
# Полный автоматический деплой
sudo ./deploy.sh full-deploy
```

Готово! API работает на `http://localhost:3000` ✅

### 3. Настроить Nginx

```bash
# Установить nginx (если нет)
sudo apt install nginx -y

# Скопировать конфиг
sudo cp nginx-lumon-api.conf /etc/nginx/sites-available/lumon-api
sudo ln -s /etc/nginx/sites-available/lumon-api /etc/nginx/sites-enabled/

# Проверить и перезагрузить
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL (опционально)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d n8n.psayha.ru
```

### 5. Обновить Frontend

```bash
cd /home/user/lumon

# Обновить API URL
echo "VITE_API_URL=https://n8n.psayha.ru" > .env.production

# Пересобрать
npm run build
```

---

## Проверка

```bash
# Проверить API
curl http://localhost:3000/webhook/auth-init-v2

# Проверить через nginx
curl https://n8n.psayha.ru/webhook/auth-init-v2

# Логи
sudo ./deploy.sh logs
```

---

## Управление

```bash
sudo ./deploy.sh status    # Статус
sudo ./deploy.sh restart   # Перезапуск
sudo ./deploy.sh logs      # Логи
sudo ./deploy.sh stop      # Остановить
```

---

## Откат на n8n

Если нужно вернуться на старый n8n:

```bash
# В nginx конфиге изменить
# proxy_pass http://127.0.0.1:3000;
# на
# proxy_pass http://127.0.0.1:5678;

sudo nano /etc/nginx/sites-available/lumon-api
sudo systemctl reload nginx
```

---

**Полная документация:** См. `DEPLOYMENT.md`

**Помощь:** Проверьте `sudo ./deploy.sh logs` для диагностики
