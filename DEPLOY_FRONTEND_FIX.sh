#!/bin/bash
# Deploy frontend with chat history fix

set -e

echo "🚀 Deploying frontend with chat history fix..."

cd /home/user/lumon

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin claude/fix-errors-01X7QFSXjHroC3zbk6y4rT7S

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Deploy to production directory
echo "📤 Deploying to /var/www/lumon2..."
sudo cp -r dist/* /var/www/lumon2/

# Reload nginx to clear cache
echo "♻️  Reloading nginx..."
sudo nginx -t && sudo nginx -s reload

echo ""
echo "✅ Frontend deployed successfully!"
echo ""
echo "🧪 Test the fix:"
echo "1. Open https://psayha.ru/voice-assistant"
echo "2. Send a message"
echo "3. Reload the page"
echo "4. Chat history should appear!"
