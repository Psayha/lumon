# 🎨 Админ-панель - Полное руководство по развертыванию

> **Дата обновления:** 18 ноября 2025
> **Проблема:** Стили админки не применяются на production

---

## 🔍 Диагностика проблемы на сервере

Выполните эти команды **на production сервере** (cv5403621.novalocal):

### Шаг 1: Проверить что файлы существуют

```bash
# Проверить структуру директории
ls -la /var/www/lumon2/dist-admin/

# Должно быть:
# - index.html (примерно 1580 байт)
# - assets/ (директория с CSS и JS файлами)
```

### Шаг 2: Проверить содержимое index.html

```bash
cat /var/www/lumon2/dist-admin/index.html
```

**Правильное содержимое должно включать:**
```html
<script type="module" crossorigin src="/assets/index-fb3fa12f.js"></script>
<link rel="stylesheet" href="/assets/index-d2558d05.css">
```

**НЕПРАВИЛЬНО** (если видите):
```html
<script type="module" src="/main.tsx"></script>  <!-- ЭТО ОШИБКА! -->
```

### Шаг 3: Проверить что CSS файл существует

```bash
ls -la /var/www/lumon2/dist-admin/assets/index-d2558d05.css
wc -c /var/www/lumon2/dist-admin/assets/index-d2558d05.css

# Должен быть: 7834 байта
```

### Шаг 4: Проверить загрузку с nginx

```bash
curl -I https://admin.psayha.ru/assets/index-d2558d05.css

# Должно быть:
# HTTP/1.1 200 OK
# Content-Type: text/css
# Content-Length: 7834
```

### Шаг 5: Проверить nginx конфигурацию

```bash
cat /etc/nginx/sites-enabled/admin-panel

# Должно быть:
# server {
#     server_name admin.psayha.ru;
#     root /var/www/lumon2/dist-admin;
#     ...
# }
```

---

## ✅ Решение: Правильное развертывание

### Вариант A: Полная пересборка и деплой

```bash
# 1. Перейти в проект
cd /home/user/lumon

# 2. Убедиться что на правильной ветке
git status
# Должно быть: On branch claude/audit-build-process-019ziFnLhaYzsNk3yrSkrVSn

# 3. Получить последние изменения
git pull origin claude/audit-build-process-019ziFnLhaYzsNk3yrSkrVSn

# 4. Пересобрать админку
cd /home/user/lumon
npm run build:admin

# 5. Проверить что сборка успешна
ls -la dist-admin/
ls -la dist-admin/assets/

# 6. Удалить старую версию на веб-сервере
sudo rm -rf /var/www/lumon2/dist-admin

# 7. Скопировать новую сборку
sudo cp -r dist-admin /var/www/lumon2/

# 8. Установить правильные права
sudo chown -R www-data:www-data /var/www/lumon2/dist-admin
sudo chmod -R 755 /var/www/lumon2/dist-admin

# 9. Перезагрузить nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Вариант B: Быстрое копирование (если сборка уже есть)

```bash
# Если в /home/user/lumon/dist-admin уже есть правильная сборка
cd /home/user/lumon

# Проверить что сборка актуальная
cat dist-admin/index.html | grep "index-fb3fa12f.js"
# Должна быть ссылка на assets/index-fb3fa12f.js

# Скопировать на веб-сервер
sudo rm -rf /var/www/lumon2/dist-admin
sudo cp -r dist-admin /var/www/lumon2/
sudo chown -R www-data:www-data /var/www/lumon2/dist-admin
sudo chmod -R 755 /var/www/lumon2/dist-admin
sudo systemctl reload nginx
```

---

## 🐛 Возможные проблемы и решения

### Проблема 1: npm run build:admin не работает

**Причина:** Админка находится в отдельной директории `adminpage/`

**Решение:**

```bash
cd /home/user/lumon/adminpage

# Установить зависимости (если нужно)
npm install

# Собрать
npm run build

# Проверить что создан dist-admin в корне проекта
ls -la ../dist-admin/
```

**Если package.json отсутствует:**

```bash
# Восстановить из git истории
cd /home/user/lumon
git checkout HEAD -- adminpage/package.json
git checkout HEAD -- adminpage/vite.config.ts

# Установить зависимости
cd adminpage
npm install

# Собрать
npm run build
```

### Проблема 2: CSS файл существует, но стили не применяются

**Возможная причина:** JavaScript ошибка в браузере

**Диагностика:**

1. Откройте https://admin.psayha.ru в браузере
2. Нажмите F12 (Developer Tools)
3. Перейдите во вкладку **Console**
4. Посмотрите на ошибки (красные сообщения)

**Частые ошибки:**

```
Uncaught ReferenceError: process is not defined
→ Проблема с переменными окружения в build

CORS error
→ Проблема с nginx конфигурацией

Failed to load module script
→ Проблема с путями к файлам
```

### Проблема 3: Nginx показывает 404 для assets

**Причина:** Неправильный root path в nginx конфигурации

**Решение:**

```bash
sudo nano /etc/nginx/sites-enabled/admin-panel

# Убедиться что root правильный:
server {
    server_name admin.psayha.ru;
    root /var/www/lumon2/dist-admin;  # ← Проверить этот путь!
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Сохранить (Ctrl+X, Y, Enter)
sudo nginx -t
sudo systemctl reload nginx
```

### Проблема 4: Стили применяются частично

**Причина:** Кеш браузера или CDN

**Решение:**

1. **Hard refresh** в браузере: `Ctrl + Shift + R` (Windows/Linux) или `Cmd + Shift + R` (Mac)
2. **Очистить кеш браузера:**
   - Chrome: F12 → Network → Disable cache (checkbox)
   - Firefox: F12 → Network → Disable HTTP Cache
3. **Очистить кеш nginx** (если используется):
   ```bash
   sudo rm -rf /var/cache/nginx/*
   sudo systemctl reload nginx
   ```

---

## 📊 Проверка результата

После развертывания выполните:

### 1. Проверка файлов на сервере

```bash
# Структура
tree -L 2 /var/www/lumon2/dist-admin/

# Должно быть:
# /var/www/lumon2/dist-admin/
# ├── index.html
# └── assets/
#     ├── animations-d83e2c3f.js
#     ├── icons-3185a26c.js
#     ├── index-d2558d05.css
#     ├── index-fb3fa12f.js
#     └── react-vendor-b993c031.js
```

### 2. Проверка загрузки в браузере

```bash
# Проверить HTML
curl https://admin.psayha.ru/ | grep "index-fb3fa12f.js"

# Проверить CSS
curl -I https://admin.psayha.ru/assets/index-d2558d05.css

# Проверить JS
curl -I https://admin.psayha.ru/assets/index-fb3fa12f.js
```

### 3. Проверка в браузере

1. Откройте https://admin.psayha.ru
2. Нажмите F12
3. Вкладка **Network**
4. Обновите страницу (F5)
5. Убедитесь что все файлы загружаются с **200 OK**:
   - `index.html` - 200 OK
   - `index-d2558d05.css` - 200 OK
   - `index-fb3fa12f.js` - 200 OK
   - `react-vendor-b993c031.js` - 200 OK

---

## 🔄 Автоматический деплой (опционально)

Создайте скрипт для автоматизации:

```bash
sudo nano /usr/local/bin/deploy-admin.sh
```

**Содержимое скрипта:**

```bash
#!/bin/bash
set -e

echo "🚀 Развертывание админ-панели..."

# 1. Перейти в проект
cd /home/user/lumon

# 2. Получить последние изменения
echo "📥 Получение изменений из git..."
git pull origin claude/audit-build-process-019ziFnLhaYzsNk3yrSkrVSn

# 3. Собрать админку
echo "🏗️ Сборка админки..."
cd adminpage
npm install --production
npm run build

# 4. Развернуть
echo "📦 Развертывание на веб-сервер..."
cd ..
sudo rm -rf /var/www/lumon2/dist-admin
sudo cp -r dist-admin /var/www/lumon2/
sudo chown -R www-data:www-data /var/www/lumon2/dist-admin
sudo chmod -R 755 /var/www/lumon2/dist-admin

# 5. Перезагрузить nginx
echo "🔄 Перезагрузка nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo "✅ Админ-панель успешно развернута!"
echo "🌐 Проверьте: https://admin.psayha.ru"
```

**Сделать исполняемым:**

```bash
sudo chmod +x /usr/local/bin/deploy-admin.sh
```

**Использование:**

```bash
sudo deploy-admin.sh
```

---

## 📝 Checklist перед деплоем

- [ ] Git ветка правильная (`claude/audit-build-process-019ziFnLhaYzsNk3yrSkrVSn`)
- [ ] Локальная сборка `dist-admin/` существует
- [ ] В `dist-admin/index.html` есть ссылки на `/assets/index-*.js`
- [ ] CSS файл `index-d2558d05.css` имеет размер 7834 байта
- [ ] Nginx конфигурация указывает на `/var/www/lumon2/dist-admin`
- [ ] Права доступа на файлах правильные (755 для директорий, 644 для файлов)
- [ ] После деплоя выполнен hard refresh в браузере

---

## 🆘 Если ничего не помогло

Отправьте вывод этих команд:

```bash
# 1. Структура файлов
ls -laR /var/www/lumon2/dist-admin/

# 2. Содержимое index.html
cat /var/www/lumon2/dist-admin/index.html

# 3. Nginx конфигурация
cat /etc/nginx/sites-enabled/admin-panel

# 4. Проверка загрузки
curl -I https://admin.psayha.ru/
curl -I https://admin.psayha.ru/assets/index-d2558d05.css
curl -I https://admin.psayha.ru/assets/index-fb3fa12f.js

# 5. Nginx логи
sudo tail -100 /var/log/nginx/error.log
sudo tail -100 /var/log/nginx/access.log | grep "admin.psayha.ru"
```

---

**Версия:** 1.0
**Автор:** Claude AI
**Дата:** 18 ноября 2025
