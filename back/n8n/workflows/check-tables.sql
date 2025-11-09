-- Скрипт проверки существующих таблиц AB experiments
-- Этот скрипт только проверяет, не изменяет ничего

-- Проверка существования таблиц
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ab_experiments') 
        THEN 'Таблица ab_experiments существует'
        ELSE 'Таблица ab_experiments НЕ существует'
    END as ab_experiments_status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ab_assignments') 
        THEN 'Таблица ab_assignments существует'
        ELSE 'Таблица ab_assignments НЕ существует'
    END as ab_assignments_status;

-- Показать структуру существующих таблиц (если они есть)
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('ab_experiments', 'ab_assignments')
ORDER BY table_name, ordinal_position;

-- Показать индексы
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('ab_experiments', 'ab_assignments')
ORDER BY tablename, indexname;

