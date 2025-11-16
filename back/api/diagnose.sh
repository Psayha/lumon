#!/bin/bash
# Diagnostic script for NestJS API deployment issues

echo "================================"
echo "🔍 Lumon API Diagnostics"
echo "================================"
echo ""

# 1. Check if API is running
echo "1️⃣ Checking if NestJS API is running..."
if systemctl is-active --quiet lumon-api 2>/dev/null; then
    echo "   ✅ Service is active"
    systemctl status lumon-api --no-pager | head -10
else
    echo "   ❌ Service is NOT running"
    echo ""
    echo "   Last 20 lines of service logs:"
    journalctl -u lumon-api -n 20 --no-pager 2>/dev/null || echo "   (systemd logs not available)"
fi
echo ""

# 2. Check if port 3000 is listening
echo "2️⃣ Checking if port 3000 is listening..."
if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
    echo "   ✅ Port 3000 is listening"
    netstat -tlnp | grep ":3000 "
elif ss -tlnp 2>/dev/null | grep -q ":3000 "; then
    echo "   ✅ Port 3000 is listening"
    ss -tlnp | grep ":3000 "
else
    echo "   ❌ Port 3000 is NOT listening"
fi
echo ""

# 3. Check nginx configuration
echo "3️⃣ Checking nginx configuration..."
if [ -f /etc/nginx/sites-available/nginx-lumon-api.conf ]; then
    echo "   ✅ Nginx config exists"
    if [ -L /etc/nginx/sites-enabled/nginx-lumon-api.conf ]; then
        echo "   ✅ Nginx config is enabled (symlinked)"
    else
        echo "   ❌ Nginx config is NOT enabled (no symlink)"
    fi
else
    echo "   ❌ Nginx config does NOT exist"
fi

if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid"
else
    echo "   ❌ Nginx configuration has errors:"
    sudo nginx -t 2>&1
fi
echo ""

# 4. Test local API endpoint
echo "4️⃣ Testing API on localhost:3000..."
if curl -f http://localhost:3000/health 2>/dev/null; then
    echo "   ✅ API responds on /health"
else
    echo "   ❌ API does NOT respond on /health"
fi
echo ""

# 5. Check API files
echo "5️⃣ Checking API files..."
API_DIR="/home/user/lumon/back/api"
if [ -d "$API_DIR" ]; then
    echo "   ✅ API directory exists: $API_DIR"

    if [ -d "$API_DIR/dist" ]; then
        echo "   ✅ Build directory exists (dist/)"
        if [ -f "$API_DIR/dist/main.js" ]; then
            echo "   ✅ Main build file exists (dist/main.js)"
        else
            echo "   ❌ Main build file missing (dist/main.js)"
        fi
    else
        echo "   ❌ Build directory missing (dist/)"
    fi

    if [ -f "$API_DIR/.env" ]; then
        echo "   ✅ Environment file exists (.env)"
    else
        echo "   ⚠️  Environment file missing (.env)"
    fi

    if [ -d "$API_DIR/node_modules" ]; then
        echo "   ✅ Dependencies installed (node_modules/)"
    else
        echo "   ❌ Dependencies missing (node_modules/)"
    fi
else
    echo "   ❌ API directory does NOT exist: $API_DIR"
fi
echo ""

# 6. Recommendations
echo "================================"
echo "🔧 Quick Fixes:"
echo "================================"

if ! systemctl is-active --quiet lumon-api 2>/dev/null; then
    echo ""
    echo "API Service is not running. Try:"
    echo "  cd /home/user/lumon/back/api"
    echo "  npm ci"
    echo "  npm run build"
    echo "  sudo systemctl restart lumon-api"
    echo "  sudo systemctl status lumon-api"
fi

if ! curl -f http://localhost:3000/health 2>/dev/null; then
    echo ""
    echo "API not responding. Check logs:"
    echo "  journalctl -u lumon-api -f"
    echo "  cat /var/log/lumon-api-error.log"
fi

if [ ! -L /etc/nginx/sites-enabled/nginx-lumon-api.conf ]; then
    echo ""
    echo "Nginx not configured. Run:"
    echo "  sudo cp /home/user/lumon/back/api/nginx-lumon-api.conf /etc/nginx/sites-available/"
    echo "  sudo ln -sf /etc/nginx/sites-available/nginx-lumon-api.conf /etc/nginx/sites-enabled/"
    echo "  sudo nginx -t"
    echo "  sudo systemctl reload nginx"
fi

echo ""
echo "================================"
echo "Done!"
echo "================================"
