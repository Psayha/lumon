#!/bin/bash
# Deployment script for Lumon NestJS API
# Usage: ./deploy.sh [start|stop|restart|status]

set -e

APP_NAME="lumon-api"
APP_DIR="/home/user/lumon/back/api"
NODE_BIN="/opt/node22/bin/node"
NPM_BIN="/opt/node22/bin/npm"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_success() { echo -e "${GREEN}✓${NC} $1"; }
echo_error() { echo -e "${RED}✗${NC} $1"; }
echo_info() { echo -e "${YELLOW}ℹ${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo_error "Please run as root (sudo ./deploy.sh)"
    exit 1
fi

cd "$APP_DIR"

case "${1:-start}" in
    build)
        echo_info "Building NestJS application..."
        $NPM_BIN run build
        echo_success "Build complete!"
        ;;

    install)
        echo_info "Installing dependencies..."
        $NPM_BIN ci --production
        echo_success "Dependencies installed!"
        ;;

    start)
        echo_info "Starting Lumon API via systemd..."

        # Copy systemd service file
        if [ -f "lumon-api.service" ]; then
            cp lumon-api.service /etc/systemd/system/
            systemctl daemon-reload
            echo_success "Systemd service installed"
        fi

        # Start service
        systemctl enable lumon-api
        systemctl start lumon-api

        # Wait a bit and check status
        sleep 2
        if systemctl is-active --quiet lumon-api; then
            echo_success "Lumon API started successfully!"
            echo_info "Check status: systemctl status lumon-api"
            echo_info "View logs: journalctl -u lumon-api -f"
        else
            echo_error "Failed to start Lumon API"
            echo_info "Check logs: journalctl -u lumon-api -n 50"
            exit 1
        fi
        ;;

    stop)
        echo_info "Stopping Lumon API..."
        systemctl stop lumon-api
        echo_success "Lumon API stopped"
        ;;

    restart)
        echo_info "Restarting Lumon API..."
        systemctl restart lumon-api
        sleep 2
        if systemctl is-active --quiet lumon-api; then
            echo_success "Lumon API restarted successfully!"
        else
            echo_error "Failed to restart Lumon API"
            exit 1
        fi
        ;;

    status)
        systemctl status lumon-api --no-pager
        ;;

    logs)
        journalctl -u lumon-api -f
        ;;

    test)
        echo_info "Testing API endpoints..."

        # Test if API is responding
        if curl -s http://localhost:3000/webhook/auth-init-v2 > /dev/null 2>&1; then
            echo_success "API is responding on port 3000"
        else
            echo_error "API is not responding on port 3000"
            exit 1
        fi
        ;;

    full-deploy)
        echo_info "=== Full Deployment ==="

        # 1. Install dependencies
        echo_info "[1/4] Installing dependencies..."
        $NPM_BIN ci --production

        # 2. Build
        echo_info "[2/4] Building application..."
        $NPM_BIN run build

        # 3. Install systemd service
        echo_info "[3/4] Installing systemd service..."
        cp lumon-api.service /etc/systemd/system/
        systemctl daemon-reload
        systemctl enable lumon-api

        # 4. Start/Restart service
        echo_info "[4/4] Starting service..."
        if systemctl is-active --quiet lumon-api; then
            systemctl restart lumon-api
        else
            systemctl start lumon-api
        fi

        sleep 2

        if systemctl is-active --quiet lumon-api; then
            echo_success "=== Deployment Complete! ==="
            echo_info "API is running on http://localhost:3000"
            echo_info "Check status: systemctl status lumon-api"
            echo_info "View logs: journalctl -u lumon-api -f"
        else
            echo_error "Deployment failed!"
            echo_info "Check logs: journalctl -u lumon-api -n 50"
            exit 1
        fi
        ;;

    *)
        echo "Usage: $0 {build|install|start|stop|restart|status|logs|test|full-deploy}"
        echo ""
        echo "Commands:"
        echo "  build         - Build the NestJS application"
        echo "  install       - Install npm dependencies"
        echo "  start         - Start the API service"
        echo "  stop          - Stop the API service"
        echo "  restart       - Restart the API service"
        echo "  status        - Show service status"
        echo "  logs          - View live logs"
        echo "  test          - Test if API is responding"
        echo "  full-deploy   - Complete deployment (install + build + start)"
        exit 1
        ;;
esac
