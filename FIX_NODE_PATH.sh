#!/bin/bash
# Fix node path in systemd service file

set -e

echo "🔧 Fixing node path in lumon-api.service..."

# Update service file
sudo cp /home/user/lumon/back/api/lumon-api.service /etc/systemd/system/lumon-api.service

# Reload systemd
echo "♻️  Reloading systemd daemon..."
sudo systemctl daemon-reload

# Restart service
echo "🚀 Restarting lumon-api service..."
sudo systemctl restart lumon-api

# Wait for startup
sleep 3

# Check status
echo "✅ Checking service status..."
sudo systemctl status lumon-api --no-pager -l

echo ""
echo "📝 View logs with:"
echo "  sudo tail -f /var/log/lumon-api.log"
echo "  sudo tail -f /var/log/lumon-api-error.log"
