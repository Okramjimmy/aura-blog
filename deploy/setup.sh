#!/usr/bin/env bash
# =============================================================================
# Aura Blog — Amazon Linux 2023 / AWS Lightsail setup script
# =============================================================================
# Run once as ec2-user (default Lightsail user):
#   chmod +x setup.sh && ./setup.sh
#
# What this script does:
#   1. System update + install Node.js 20 LTS, Git, Nginx
#   2. Install and configure PostgreSQL 15
#   3. Clone the repo and install npm dependencies
#   4. Prompt you to fill in .env (secrets, DB password, admin credentials)
#   5. Build the frontend (Vite)
#   6. Start the app with PM2 and configure it to survive reboots
#   7. Configure Nginx as a reverse proxy on port 80
# =============================================================================

set -euo pipefail

# ── Configurable variables ────────────────────────────────────────────────────
REPO_URL="https://github.com/Okramjimmy/aura-blog.git"
APP_DIR="/home/ec2-user/aura-blog"
APP_USER="ec2-user"
DB_NAME="blog"
DB_USER="aura_user"
NODE_VERSION="20"
# ─────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
die()     { echo -e "${RED}[ERR]${NC}  $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] && die "Do not run as root. Run as ec2-user: ./setup.sh"

# =============================================================================
# 1. SYSTEM UPDATE & CORE PACKAGES
# =============================================================================
info "Updating system packages..."
sudo dnf update -y -q

info "Installing Git, Nginx, curl, tar..."
sudo dnf install -y git nginx curl tar

# =============================================================================
# 2. NODE.JS 20 LTS  (via NodeSource)
# =============================================================================
if ! command -v node &>/dev/null || [[ "$(node -v)" != v${NODE_VERSION}* ]]; then
  info "Installing Node.js ${NODE_VERSION} LTS..."
  curl -fsSL "https://rpm.nodesource.com/setup_${NODE_VERSION}.x" | sudo bash -
  sudo dnf install -y nodejs
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
# 4. POSTGRESQL 15
# =============================================================================
info "Installing PostgreSQL 15..."
sudo dnf install -y postgresql15-server postgresql15

# Initialize data directory (safe to run multiple times — skips if already done)
if [[ ! -f /var/lib/pgsql/data/PG_VERSION ]]; then
  info "Initializing PostgreSQL data directory..."
  sudo postgresql-setup --initdb
fi

# Enable pg_hba.conf to allow password auth for local connections
PG_HBA="/var/lib/pgsql/data/pg_hba.conf"
info "Configuring pg_hba.conf for password authentication..."
sudo sed -i 's/^host\s\+all\s\+all\s\+127\.0\.0\.1\/32\s\+ident/host    all             all             127.0.0.1\/32            scram-sha-256/' "$PG_HBA"
sudo sed -i 's/^host\s\+all\s\+all\s\+::1\/128\s\+ident/host    all             all             ::1\/128                 scram-sha-256/' "$PG_HBA"
sudo sed -i 's/^local\s\+all\s\+all\s\+peer/local   all             all                                     scram-sha-256/' "$PG_HBA"

sudo systemctl enable postgresql --now
sleep 2  # let postgres start

# Create DB user and database
info "Creating PostgreSQL user '${DB_USER}' and database '${DB_NAME}'..."
echo ""
echo -e "${YELLOW}Enter a strong password for the PostgreSQL app user '${DB_USER}':${NC}"
read -rs DB_PASSWORD
echo ""
[[ -z "$DB_PASSWORD" ]] && die "DB password cannot be empty."

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')
\gexec

GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

success "PostgreSQL user and database ready."

# =============================================================================
# 5. CLONE / UPDATE REPO
# =============================================================================
if [[ -d "$APP_DIR/.git" ]]; then
  info "Repo already exists at ${APP_DIR} — pulling latest..."
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
  info "Creating .env file from .env.example..."
  cp "${APP_DIR}/.env.example" "$ENV_FILE"

  # Generate a strong 64-byte hex SECRET_KEY
  GENERATED_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

  # Get remaining secrets interactively
  echo ""
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}  Configure your .env secrets${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  echo -e "Admin login email for /admin panel:"
  read -r ADMIN_EMAIL

  echo -e "Admin password (use something strong!):"
  read -rs ADMIN_PASSWORD
  echo ""

  echo -e "GitHub personal access token (leave blank to skip heatmap):"
  read -rs GITHUB_TOKEN
  echo ""

  echo -e "Your domain or public IP (e.g. https://yourdomain.com or http://1.2.3.4):"
  read -r APP_URL

  # Write .env
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
  success ".env written and locked to owner-read-only (chmod 600)."
else
  warn ".env already exists — skipping interactive setup. Edit ${ENV_FILE} manually if needed."
fi

# =============================================================================
# 7. NPM INSTALL & BUILD
# =============================================================================
cd "$APP_DIR"

info "Installing npm dependencies..."
npm install --include=dev   # dev deps needed for tsx + vite build

info "Building frontend (Vite)..."
NODE_ENV=production npm run build

mkdir -p "${APP_DIR}/logs"
success "Build complete."

# =============================================================================
# 8. PM2 — START & CONFIGURE STARTUP
# =============================================================================
info "Starting app with PM2..."
pm2 start "${APP_DIR}/ecosystem.config.cjs" --env production

info "Saving PM2 process list..."
pm2 save

info "Configuring PM2 to start on reboot..."
# Capture the startup command and run it
STARTUP_CMD=$(pm2 startup systemd -u "${APP_USER}" --hp "/home/${APP_USER}" | tail -1)
if [[ "$STARTUP_CMD" == sudo* ]]; then
  eval "$STARTUP_CMD"
else
  warn "Could not auto-run PM2 startup command. Run manually:"
  echo "  $STARTUP_CMD"
fi

# =============================================================================
# 9. NGINX REVERSE PROXY
# =============================================================================
DOMAIN=$(grep -E '^APP_URL=' "$ENV_FILE" | sed 's|APP_URL=https\?://||;s|/.*||')
[[ -z "$DOMAIN" ]] && DOMAIN="_"   # catch-all if no domain set

info "Writing Nginx config for domain/IP: ${DOMAIN}..."

sudo tee /etc/nginx/conf.d/aura-blog.conf > /dev/null <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};

    # Security headers
    add_header X-Frame-Options        "SAMEORIGIN"  always;
    add_header X-Content-Type-Options "nosniff"     always;
    add_header Referrer-Policy        "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml application/xml+rss text/javascript;

    # Proxy to Node/Express
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
    }
}
NGINX

sudo nginx -t && sudo systemctl enable nginx --now && sudo systemctl reload nginx
success "Nginx configured and reloaded."

# =============================================================================
# DONE
# =============================================================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Setup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  App directory : ${BLUE}${APP_DIR}${NC}"
echo -e "  PM2 status    : run ${BLUE}pm2 status${NC}"
echo -e "  App logs      : run ${BLUE}pm2 logs aura-blog${NC}"
echo -e "  Site URL      : ${BLUE}http://${DOMAIN}${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Open port 80 (and 443 if using HTTPS) in your Lightsail firewall"
echo -e "     Lightsail console → Networking → Add rule → HTTP + HTTPS"
echo -e "  2. For HTTPS, run: ${BLUE}sudo dnf install -y certbot python3-certbot-nginx${NC}"
echo -e "     then: ${BLUE}sudo certbot --nginx -d yourdomain.com${NC}"
echo -e "  3. To deploy updates, run: ${BLUE}${APP_DIR}/deploy/update.sh${NC}"
echo ""
