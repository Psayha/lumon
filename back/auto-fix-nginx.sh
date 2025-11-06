#!/bin/bash

# Автоматическое исправление nginx конфигураций
# Добавь в crontab: */5 * * * * /var/www/back/auto-fix-nginx.sh >> /var/log/nginx-autofix.log 2>&1

LOGFILE="/var/log/nginx-autofix.log"
CHANGED=0

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOGFILE"
}

log "🔍 Проверка nginx конфигураций..."

# Проверяем наличие неправильных конфигов
if [ -L "/etc/nginx/sites-enabled/n8n-simple" ] || [ -L "/etc/nginx/sites-enabled/sb-simple" ]; then
    log "⚠️ Обнаружены неправильные конфиги! Исправляем..."
    
    # Удаляем неправильные
    sudo rm -f /etc/nginx/sites-enabled/n8n-simple
    sudo rm -f /etc/nginx/sites-enabled/sb-simple
    
    # Активируем правильные
    sudo ln -sf /etc/nginx/sites-available/n8n.psayha.ru /etc/nginx/sites-enabled/n8n.psayha.ru
    sudo ln -sf /etc/nginx/sites-available/sb.psayha.ru /etc/nginx/sites-enabled/sb.psayha.ru
    
    # Проверка и перезагрузка
    if sudo nginx -t 2>&1 | grep -q "test is successful"; then
        sudo systemctl reload nginx
        log "✅ Nginx конфиги исправлены и перезагружены"
        CHANGED=1
    else
        log "❌ Ошибка в конфигурации nginx после исправления"
    fi
fi

# Проверяем наличие правильных симлинков
MISSING=0
if [ ! -L "/etc/nginx/sites-enabled/n8n.psayha.ru" ]; then
    log "⚠️ Отсутствует симлинк n8n.psayha.ru, создаём..."
    sudo ln -sf /etc/nginx/sites-available/n8n.psayha.ru /etc/nginx/sites-enabled/n8n.psayha.ru
    MISSING=1
fi

if [ ! -L "/etc/nginx/sites-enabled/sb.psayha.ru" ]; then
    log "⚠️ Отсутствует симлинк sb.psayha.ru, создаём..."
    sudo ln -sf /etc/nginx/sites-available/sb.psayha.ru /etc/nginx/sites-enabled/sb.psayha.ru
    MISSING=1
fi

if [ ! -L "/etc/nginx/sites-enabled/admin-panel" ]; then
    log "⚠️ Отсутствует симлинк admin-panel, создаём..."
    sudo ln -sf /etc/nginx/sites-available/admin-panel /etc/nginx/sites-enabled/admin-panel
    MISSING=1
fi

if [ ! -L "/etc/nginx/sites-enabled/lumon-frontend" ]; then
    log "⚠️ Отсутствует симлинк lumon-frontend, создаём..."
    sudo ln -sf /etc/nginx/sites-available/lumon-frontend /etc/nginx/sites-enabled/lumon-frontend
    MISSING=1
fi

if [ $MISSING -eq 1 ]; then
    if sudo nginx -t 2>&1 | grep -q "test is successful"; then
        sudo systemctl reload nginx
        log "✅ Недостающие симлинки восстановлены"
        CHANGED=1
    else
        log "❌ Ошибка в конфигурации nginx"
    fi
fi

# Проверяем статус nginx
if ! systemctl is-active --quiet nginx; then
    log "❌ Nginx не запущен! Пытаемся запустить..."
    sudo systemctl start nginx
    if systemctl is-active --quiet nginx; then
        log "✅ Nginx успешно запущен"
        CHANGED=1
    else
        log "❌ Не удалось запустить nginx"
    fi
fi

if [ $CHANGED -eq 0 ]; then
    log "✅ Всё в порядке, изменения не требуются"
fi

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

