-- Проверка созданных таблиц
SELECT 
    'ab_experiments' as table_name,
    COUNT(*) as row_count
FROM ab_experiments
UNION ALL
SELECT 
    'ab_assignments' as table_name,
    COUNT(*) as row_count
FROM ab_assignments;

-- Показать структуру таблиц
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('ab_experiments', 'ab_assignments')
ORDER BY table_name, ordinal_position;

