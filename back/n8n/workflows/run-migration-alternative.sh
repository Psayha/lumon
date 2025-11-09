#!/bin/bash

# Альтернативные способы выполнения SQL миграции
# Используйте тот метод, который доступен на вашем сервере

set -e

PROJECT_PATH="${1:-/var/www/lumon2}"
SQL_FILE="$PROJECT_PATH/back/n8n/workflows/create-ab-tables-safe.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "Ошибка: файл $SQL_FILE не найден"
    exit 1
fi

echo "Выберите способ подключения к БД:"
echo "1. Docker (если PostgreSQL в контейнере)"
echo "2. Установить psql через apt"
echo "3. Использовать Python/Node.js скрипт"
echo "4. Выполнить через n8n workflow"
read -p "Ваш выбор (1-4): " choice

case $choice in
    1)
        echo "Выполнение через Docker..."
        # Замените на имя вашего контейнера PostgreSQL
        read -p "Имя контейнера PostgreSQL (или нажмите Enter для 'postgres'): " container
        container="${container:-postgres}"
        
        docker exec -i "$container" psql -U postgres -d postgres < "$SQL_FILE"
        ;;
    2)
        echo "Установка PostgreSQL клиента..."
        apt-get update
        apt-get install -y postgresql-client
        
        read -p "Хост БД: " dbhost
        read -p "Порт БД (по умолчанию 5432): " dbport
        dbport="${dbport:-5432}"
        read -p "Имя БД: " dbname
        read -p "Пользователь: " dbuser
        read -sp "Пароль: " dbpass
        echo
        
        export PGPASSWORD="$dbpass"
        psql -h "$dbhost" -p "$dbport" -U "$dbuser" -d "$dbname" -f "$SQL_FILE"
        ;;
    3)
        echo "Создание Python скрипта для выполнения SQL..."
        python3 << EOF
import psycopg2
import sys

# Замените на ваши параметры подключения
conn_params = {
    'host': 'YOUR_HOST',
    'port': 5432,
    'database': 'postgres',
    'user': 'postgres',
    'password': 'YOUR_PASSWORD'
}

try:
    conn = psycopg2.connect(**conn_params)
    cur = conn.cursor()
    
    with open('$SQL_FILE', 'r') as f:
        sql = f.read()
        cur.execute(sql)
    
    conn.commit()
    cur.close()
    conn.close()
    print("Миграция выполнена успешно!")
except Exception as e:
    print(f"Ошибка: {e}")
    sys.exit(1)
EOF
        ;;
    4)
        echo "Создайте n8n workflow для выполнения SQL скрипта"
        echo "Или используйте Supabase Dashboard -> SQL Editor"
        ;;
    *)
        echo "Неверный выбор"
        exit 1
        ;;
esac

