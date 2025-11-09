#!/bin/bash

# Скрипт для выполнения миграции базы данных AB experiments
# Использование: ./run-migration.sh [путь_к_проекту]

set -e

# Определяем путь к проекту
if [ -n "$1" ]; then
    PROJECT_PATH="$1"
else
    # Пытаемся найти проект в домашней директории
    if [ -d "$HOME/lumon2" ]; then
        PROJECT_PATH="$HOME/lumon2"
    elif [ -d "/root/lumon2" ]; then
        PROJECT_PATH="/root/lumon2"
    elif [ -d "/var/www/lumon2" ]; then
        PROJECT_PATH="/var/www/lumon2"
    else
        echo "Проект не найден. Укажите путь вручную:"
        echo "  ./run-migration.sh /path/to/lumon2"
        exit 1
    fi
fi

echo "Используется путь: $PROJECT_PATH"
cd "$PROJECT_PATH" || exit 1

# Обновляем код из git
echo "Обновление кода из git..."
git pull || echo "Предупреждение: не удалось обновить из git"

# Проверяем наличие SQL файла
SQL_FILE="back/n8n/workflows/create-ab-tables.sql"
if [ ! -f "$SQL_FILE" ]; then
    echo "Ошибка: файл $SQL_FILE не найден"
    exit 1
fi

echo "SQL файл найден: $SQL_FILE"

# Параметры подключения к БД (замените на свои)
# Для Supabase используйте формат: postgresql://postgres:PASSWORD@HOST:5432/postgres
DB_CONNECTION="${DB_CONNECTION:-postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres}"

# Если DB_CONNECTION не установлен, используем переменные окружения
if [ "$DB_CONNECTION" = "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres" ]; then
    if [ -n "$PGHOST" ] && [ -n "$PGDATABASE" ]; then
        echo "Используются переменные окружения для подключения к БД"
        psql -h "$PGHOST" -p "${PGPORT:-5432}" -U "${PGUSER:-postgres}" -d "$PGDATABASE" -f "$SQL_FILE"
    else
        echo "Ошибка: не указаны параметры подключения к БД"
        echo "Установите переменную DB_CONNECTION или переменные окружения:"
        echo "  export PGHOST=your_host"
        echo "  export PGDATABASE=your_database"
        echo "  export PGUSER=your_user"
        echo "  export PGPASSWORD=your_password"
        exit 1
    fi
else
    echo "Выполнение SQL скрипта..."
    psql "$DB_CONNECTION" -f "$SQL_FILE"
fi

echo "Миграция выполнена успешно!"

