#!/usr/bin/env bash
# =============================================================================
# Aura Blog — deploy latest code from GitHub
# =============================================================================
# Run from anywhere:  ~/aura-blog/deploy/update.sh
# =============================================================================

set -euo pipefail

APP_DIR="/home/ec2-user/aura-blog"
BLUE='\033[0;34m'; GREEN='\033[0;32m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }

cd "$APP_DIR"

info "Pulling latest code..."
git pull origin main

info "Installing dependencies..."
npm install --include=dev

info "Building frontend..."
NODE_ENV=production npm run build

info "Reloading PM2..."
pm2 reload aura-blog --update-env

pm2 save
success "Deployment complete — $(date '+%Y-%m-%d %H:%M:%S')"
pm2 status
