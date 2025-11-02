#!/bin/bash

# Скрипт для импорта n8n workflows
# Использование: ./import-workflows.sh [n8n-url] [username] [password]

N8N_URL=${1:-http://localhost:5678}
N8N_USER=${2:-admin}
N8N_PASS=${3:-lumon_dev}

echo "🔄 Импорт n8n workflows..."
echo "URL: $N8N_URL"
echo ""

# Проверка наличия curl и jq
if ! command -v curl &> /dev/null; then
    echo "❌ curl не установлен"
    exit 1
fi

# Получение токена аутентификации
echo "🔐 Авторизация..."
TOKEN=$(curl -s -X POST "$N8N_URL/rest/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$N8N_USER\",\"password\":\"$N8N_PASS\"}" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Ошибка авторизации"
    exit 1
fi

echo "✅ Авторизация успешна"
echo ""

# Импорт каждого workflow
WORKFLOWS_DIR="./n8n/workflows"

for workflow_file in "$WORKFLOWS_DIR"/*.json; do
    if [ -f "$workflow_file" ]; then
        workflow_name=$(basename "$workflow_file" .json)
        echo "📥 Импорт: $workflow_name"
        
        # Импорт workflow
        response=$(curl -s -X POST "$N8N_URL/rest/workflows" \
          -H "Content-Type: application/json" \
          -H "X-N8N-API-KEY: $TOKEN" \
          -d @"$workflow_file")
        
        if echo "$response" | grep -q "\"id\""; then
            echo "   ✅ Успешно импортирован"
        else
            echo "   ⚠️  Возможна ошибка (workflow может уже существовать)"
        fi
    fi
done

echo ""
echo "✅ Импорт завершен!"
echo ""
echo "Следующий шаг: Открой $N8N_URL и активируй workflows"

