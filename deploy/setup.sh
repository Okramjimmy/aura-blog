#!/usr/bin/env bash
# =============================================================================
# Aura Blog — Ubuntu (AWS Lightsail) setup script
# Tested on: Ubuntu 22.04 LTS / 24.04 LTS
# PostgreSQL is assumed to be already installed with:
#   username: postgres   password: (prompted at runtime, stored only in .env)
# =============================================================================
# Run once as the ubuntu user:
#   chmod +x setup.sh && ./setup.sh
#
# What this script does:
#   1. System update + install Node.js 20 LTS, Git, Nginx
#   2. Configure existing PostgreSQL — create the 'blog' database if needed
#   3. Clone the repo and install npm dependencies
#   4. Prompt for secrets and write .env
#   5. Build the frontend (Vite)
#   6. Start the app with PM2 and configure it to survive reboots
#   7. Configure Nginx as a reverse proxy on port 80
# =============================================================================

set -euo pipefail

# ── Configurable ──────────────────────────────────────────────────────────────
REPO_URL="https://github.com/Okramjimmy/aura-blog.git"
APP_DIR="/home/ubuntu/aura-blog"
APP_USER="ubuntu"
DB_NAME="blog"
DB_USER="postgres"       # existing postgres superuser
NODE_VERSION="20"
# ─────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
die()     { echo -e "${RED}[ERR]${NC}   $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] && die "Do not run as root. Run as ubuntu: ./setup.sh"

# =============================================================================
# 1. SYSTEM UPDATE & CORE PACKAGES
# =============================================================================
info "Updating system packages..."
sudo apt-get update -q
sudo apt-get upgrade -y -q

info "Installing core packages (git, nginx, curl, gnupg, ca-certificates)..."
sudo apt-get install -y -q git nginx curl gnupg ca-certificates lsb-release

# =============================================================================
# 2. NODE.JS 20 LTS  (via NodeSource)
# =============================================================================
if ! command -v node &>/dev/null || [[ "$(node -v)" != v${NODE_VERSION}* ]]; then
  info "Installing Node.js ${NODE_VERSION} LTS..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
else
  success "Node.js $(node -v) already installed."
fi

node -v && npm -v

# =============================================================================
# 3. PM2
# =============================================================================
if ! command -v pm2 &>/dev/null; then
  info "Installing PM2 globally..."
  sudo npm install -g pm2
else
  success "PM2 $(pm2 --version) already installed."
fi

# =============================================================================
# 4. POSTGRESQL — verify running, ensure password auth, create database
# =============================================================================
info "Checking PostgreSQL service..."
if ! sudo systemctl is-active --quiet postgresql; then
  info "Starting PostgreSQL..."
  sudo systemctl start postgresql
fi
sudo systemctl enable postgresql
success "PostgreSQL is running."

# Prompt for the existing postgres password (never stored in script)
echo ""
echo -e "${YELLOW}Enter the existing PostgreSQL 'postgres' user password:${NC}"
read -rs DB_PASSWORD
echo ""
[[ -z "$DB_PASSWORD" ]] && die "PostgreSQL password cannot be empty."

# Detect pg_hba.conf location dynamically
PG_HBA=$(sudo -u postgres psql -t -c "SHOW hba_file;" 2>/dev/null | tr -d ' \n')
info "pg_hba.conf: ${PG_HBA}"

# Ensure local connections use scram-sha-256 (or md5) — not peer/ident
info "Configuring pg_hba.conf for password authentication..."
sudo sed -i \
  -e 's/^\(local[[:space:]]\+all[[:space:]]\+all[[:space:]]\+\)peer/\1scram-sha-256/' \
  -e 's/^\(local[[:space:]]\+all[[:space:]]\+all[[:space:]]\+\)md5/\1scram-sha-256/' \
  -e 's/^\(host[[:space:]]\+all[[:space:]]\+all[[:space:]]\+127\.0\.0\.1\/32[[:space:]]\+\)ident/\1scram-sha-256/' \
  -e 's/^\(host[[:space:]]\+all[[:space:]]\+all[[:space:]]\+::1\/128[[:space:]]\+\)ident/\1scram-sha-256/' \
  "$PG_HBA"

sudo systemctl reload postgresql
sleep 1

# Set the postgres user password (in case it wasn't set, or update it)
info "Setting postgres user password in PostgreSQL..."
sudo -u postgres psql -v ON_ERROR_STOP=1 \
  -c "ALTER USER postgres WITH PASSWORD '${DB_PASSWORD}';"

# Create the blog database if it doesn't already exist
info "Creating database '${DB_NAME}' if it doesn't exist..."
DB_EXISTS=$(PGPASSWORD="${DB_PASSWORD}" psql -U postgres -h 127.0.0.1 -t -c \
  "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}';" 2>/dev/null | tr -d ' \n')

if [[ "$DB_EXISTS" == "1" ]]; then
  success "Database '${DB_NAME}' already exists — skipping create."
else
  PGPASSWORD="${DB_PASSWORD}" psql -U postgres -h 127.0.0.1 \
    -c "CREATE DATABASE ${DB_NAME} OWNER postgres;"
  success "Database '${DB_NAME}' created."
fi

# =============================================================================
# 5. CLONE / UPDATE REPO
# =============================================================================
if [[ -d "${APP_DIR}/.git" ]]; then
  info "Repo already exists — pulling latest..."
  cd "$APP_DIR"
  git pull origin main
else
  info "Cloning repo to ${APP_DIR}..."
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# =============================================================================
# 6. ENVIRONMENT FILE
# =============================================================================
ENV_FILE="${APP_DIR}/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  info "Creating .env..."

  # Generate a cryptographically strong 64-byte hex SECRET_KEY
  GENERATED_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

  echo ""
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}  Configure app secrets${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  echo -e "Admin login email for /admin:"
  read -r ADMIN_EMAIL

  echo -e "Admin password (make it strong):"
  read -rs ADMIN_PASSWORD
  echo ""

  echo -e "GitHub personal access token (read:user + repo scope — leave blank to skip heatmap):"
  read -rs GITHUB_TOKEN
  echo ""

  echo -e "Your domain or public IP (e.g. https://yourdomain.com or http://1.2.3.4):"
  read -r APP_URL

  cat > "$ENV_FILE" <<EOF
# ── Database ───────────────────────────────────────────────────────────────
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

# ── Authentication ─────────────────────────────────────────────────────────
SECRET_KEY=${GENERATED_SECRET}
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# ── Third-party ────────────────────────────────────────────────────────────
GITHUB_TOKEN=${GITHUB_TOKEN}
GEMINI_API_KEY=

# ── App ────────────────────────────────────────────────────────────────────
PORT=3000
NODE_ENV=production
APP_URL=${APP_URL}
EOF

  chmod 600 "$ENV_FILE"
  success ".env written and locked (chmod 600)."
else
  warn ".env already exists — skipping. Edit ${ENV_FILE} manually if needed."
fi

# Source .env so Vite build picks up env vars
set -a; source "$ENV_FILE"; set +a

# =============================================================================
# 7. NPM INSTALL & VITE BUILD
# =============================================================================
cd "$APP_DIR"

info "Installing npm dependencies..."
npm install --include=dev

info "Building frontend (Vite)..."
NODE_ENV=production npm run build

mkdir -p "${APP_DIR}/logs"
success "Build complete."

# =============================================================================
# 8. PM2 — START & CONFIGURE BOOT STARTUP
# =============================================================================
info "Starting app with PM2..."

# Stop existing instance gracefully if already running
pm2 describe aura-blog &>/dev/null && pm2 delete aura-blog || true

pm2 start "${APP_DIR}/ecosystem.config.cjs" --env production

info "Saving PM2 process list..."
pm2 save

info "Configuring PM2 to start on reboot..."
STARTUP_CMD=$(pm2 startup systemd -u "${APP_USER}" --hp "/home/${APP_USER}" | grep "sudo env" || true)
if [[ -n "$STARTUP_CMD" ]]; then
  eval "$STARTUP_CMD"
  success "PM2 startup configured."
else
  warn "Run the pm2 startup command printed above manually to enable auto-start on reboot."
fi

# =============================================================================
# 9. NGINX REVERSE PROXY
# =============================================================================
DOMAIN=$(grep -E '^APP_URL=' "$ENV_FILE" | sed 's|APP_URL=https\?://||;s|/.*||;s|:.*||')
[[ -z "$DOMAIN" ]] && DOMAIN="_"

info "Writing Nginx config for: ${DOMAIN}..."

sudo tee /etc/nginx/sites-available/aura-blog > /dev/null <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};

    # Security headers
    add_header X-Frame-Options        "SAMEORIGIN"  always;
    add_header X-Content-Type-Options "nosniff"     always;
    add_header Referrer-Policy        "strict-origin-when-cross-origin" always;

    # Gzip
    gzip            on;
    gzip_vary       on;
    gzip_proxied    any;
    gzip_comp_level 6;
    gzip_types      text/plain text/css application/json application/javascript
                    text/xml application/xml application/xml+rss text/javascript
                    image/svg+xml;

    client_max_body_size 20M;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_set_header   Upgrade           \$http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/aura-blog /etc/nginx/sites-enabled/aura-blog
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl enable nginx --now
sudo systemctl reload nginx
success "Nginx configured and reloaded."

# =============================================================================
# DONE
# =============================================================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Setup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  App directory  : ${BLUE}${APP_DIR}${NC}"
echo -e "  Environment    : ${BLUE}${ENV_FILE}${NC}"
echo -e "  Site           : ${BLUE}http://${DOMAIN}${NC}"
echo ""
echo -e "  pm2 status     : ${BLUE}pm2 status${NC}"
echo -e "  App logs       : ${BLUE}pm2 logs aura-blog${NC}"
echo -e "  Nginx errors   : ${BLUE}sudo tail -f /var/log/nginx/error.log${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Open port 80 in Lightsail firewall:"
echo -e "     Lightsail console → Networking → IPv4 Firewall → Add rule → HTTP"
echo ""
echo -e "  2. HTTPS with Let's Encrypt:"
echo -e "     ${BLUE}sudo apt-get install -y certbot python3-certbot-nginx${NC}"
echo -e "     ${BLUE}sudo certbot --nginx -d yourdomain.com${NC}"
echo ""
echo -e "  3. Future deploys:"
echo -e "     ${BLUE}~/aura-blog/deploy/update.sh${NC}"
echo ""
