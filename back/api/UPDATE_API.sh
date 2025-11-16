#!/bin/bash

# Quick update script for NestJS API on production server
# Usage: ./UPDATE_API.sh

set -e

echo "🔄 Updating NestJS API..."

cd /home/user/lumon/back/api

# Pull latest changes
echo "📥 Pulling latest code..."
git pull origin claude/initial-setup-01VcBE6bp3PBmNmheyTkgMtf

# Install dependencies
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
echo "🎉 Update complete!"
echo ""
echo "Check logs with:"
echo "  tail -f /var/log/lumon-api.log"
echo "  tail -f /var/log/lumon-api-error.log"
