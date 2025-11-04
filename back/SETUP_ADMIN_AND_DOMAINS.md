# Настройка поддоменов и админ-панели на сервере

## Шаг 1: Получить файлы из репозитория

```bash
# Перейти в директорию проекта (или клонировать, если ещё нет)
cd /var/www/lumon
git pull origin main

# Или если репозитория нет:
# git clone https://github.com/Psayha/lumon.git /var/www/lumon
```

## Шаг 2: Скопировать временные HTML страницы

```bash
# Создать директорию
sudo mkdir -p /var/www/lumon/back/nginx-simple-pages

# Скопировать HTML файлы
sudo cp /var/www/lumon/back/nginx-simple-pages/*.html /var/www/lumon/back/nginx-simple-pages/

# Проверить
ls -la /var/www/lumon/back/nginx-simple-pages/
```

## Шаг 3: Настроить nginx конфиги

```bash
# Скопировать конфиги
sudo cp /var/www/lumon/back/nginx-simple-n8n.conf /etc/nginx/sites-available/n8n-simple.conf
sudo cp /var/www/lumon/back/nginx-simple-sb.conf /etc/nginx/sites-available/sb-simple.conf
sudo cp /var/www/lumon/back/nginx-admin.conf /etc/nginx/sites-available/admin.conf

# Создать симлинки
sudo ln -sf /etc/nginx/sites-available/n8n-simple.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/sb-simple.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/admin.conf /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Перезагрузить nginx
sudo systemctl reload nginx
```

## Шаг 4: Настроить админ-панель

### Вариант 1: Если Node.js установлен

```bash
cd /var/www/lumon

# Установить зависимости (если ещё не установлены)
npm install

# Собрать админ-панель
cd adminpage
npm install
npm run build

# Скопировать собранные файлы
sudo cp -r dist-admin/* /var/www/lumon/adminpage/
```

### Вариант 2: Если Node.js не установлен (собрать локально и задеплоить)

**На локальной машине:**
```bash
cd adminpage
npm install
npm run build
# Результат в dist-admin/
```

**На сервере:**
```bash
# Скопировать через scp или rsync
# scp -r dist-admin/* root@your-server:/var/www/lumon/adminpage/
```

**Или через GitHub Actions:**
- Автоматический деплой при push в main (если настроен)

## Шаг 5: Получить SSL сертификаты

```bash
# Получить сертификаты для всех поддоменов
sudo certbot --nginx -d n8n.psayha.ru -d sb.psayha.ru -d admin.psayha.ru

# Или по одному:
sudo certbot --nginx -d n8n.psayha.ru
sudo certbot --nginx -d sb.psayha.ru
sudo certbot --nginx -d admin.psayha.ru
```

## Шаг 6: Проверить работу

```bash
# Проверить доступность
curl -I http://n8n.psayha.ru
curl -I http://sb.psayha.ru
curl -I http://admin.psayha.ru

# После SSL:
curl -I https://n8n.psayha.ru
curl -I https://sb.psayha.ru
curl -I https://admin.psayha.ru
```

## Структура директорий на сервере

```
/var/www/lumon/
├── back/
│   └── nginx-simple-pages/
│       ├── n8n.html
│       └── sb.html
├── adminpage/
│   ├── index.html
│   └── assets/ (из dist-admin/)
└── dist/ (основное приложение)
```

## Troubleshooting

### Если nginx не видит файлы:
```bash
# Проверить права
sudo chown -R www-data:www-data /var/www/lumon
sudo chmod -R 755 /var/www/lumon
```

### Если админ-панель не работает:
```bash
# Проверить логи nginx
sudo tail -f /var/log/nginx/error.log

# Проверить доступность файлов
ls -la /var/www/lumon/adminpage/
```

### Если нужно обновить конфиги после изменений:
```bash
cd /var/www/lumon
git pull origin main
sudo cp back/nginx-*.conf /etc/nginx/sites-available/
sudo nginx -t
sudo systemctl reload nginx
```

