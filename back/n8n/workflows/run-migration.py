#!/usr/bin/env python3
"""
Скрипт для выполнения SQL миграции AB experiments таблиц
Использование: python3 run-migration.py
"""

import sys
import os

# Попытка импортировать psycopg2
try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("Установите psycopg2: pip install psycopg2-binary")
    sys.exit(1)

def get_db_connection():
    """Получить подключение к БД из переменных окружения или запросить"""
    host = os.getenv('DB_HOST', input('Хост БД: '))
    port = os.getenv('DB_PORT', input('Порт БД (5432): ') or '5432')
    database = os.getenv('DB_NAME', input('Имя БД: '))
    user = os.getenv('DB_USER', input('Пользователь: '))
    password = os.getenv('DB_PASSWORD', input('Пароль: '))
    
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password
        )
        return conn
    except Exception as e:
        print(f"Ошибка подключения: {e}")
        sys.exit(1)

def execute_sql_file(conn, filepath):
    """Выполнить SQL файл"""
    if not os.path.exists(filepath):
        print(f"Файл не найден: {filepath}")
        sys.exit(1)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    try:
        cur = conn.cursor()
        cur.execute(sql_content)
        conn.commit()
        cur.close()
        print("Миграция выполнена успешно!")
    except Exception as e:
        conn.rollback()
        print(f"Ошибка выполнения SQL: {e}")
        sys.exit(1)

if __name__ == '__main__':
    # Определяем путь к SQL файлу
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sql_file = os.path.join(script_dir, 'create-ab-tables-safe.sql')
    
    print("Подключение к базе данных...")
    conn = get_db_connection()
    
    print(f"Выполнение SQL из {sql_file}...")
    execute_sql_file(conn, sql_file)
    
    conn.close()
    print("Готово!")

