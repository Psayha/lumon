#!/bin/bash

# Quick update script to apply error fixes
# Usage: ./APPLY_FIX.sh

set -e

echo "🔄 Applying error fixes..."

cd /home/user/lumon

# Pull latest changes from fix branch
echo "📥 Pulling latest code from fix branch..."
git fetch origin claude/fix-errors-01X7QFSXjHroC3zbk6y4rT7S
git checkout claude/fix-errors-01X7QFSXjHroC3zbk6y4rT7S
git pull origin claude/fix-errors-01X7QFSXjHroC3zbk6y4rT7S

cd /home/user/lumon/back/api

# Install dependencies (in case any changed)
echo "📦 Installing dependencies..."
npm ci

# Build
echo "🔨 Building application..."
npm run build

# Restart service
echo "♻️  Restarting lumon-api service..."
sudo systemctl restart lumon-api

# Wait a moment
sleep 3

# Check status
echo "✅ Checking service status..."
sudo systemctl status lumon-api --no-pager -l

echo ""
echo "🎉 Fix applied successfully!"
echo ""
echo "The following issues have been fixed:"
echo "  ✅ 500 error in /webhook/chat-save-message (metadata column added)"
echo "  ✅ 400 error in /webhook/analytics-log-event (allowedKeys validation fixed)"
echo ""
echo "Check logs with:"
echo "  sudo journalctl -u lumon-api -f"
echo "  tail -f /var/log/lumon-api*.log"
