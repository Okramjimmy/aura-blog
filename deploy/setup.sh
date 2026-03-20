#!/usr/bin/env bash
# =============================================================================
# Aura Blog — Ubuntu (AWS Lightsail) setup script
# Tested on: Ubuntu 22.04 LTS / 24.04 LTS
# =============================================================================
# Run once as the ubuntu user:
#   chmod +x setup.sh && ./setup.sh
#
# What this script does:
#   1. System update + install Node.js 20 LTS, Git, Nginx
#   2. Install and configure PostgreSQL 16
#   3. Clone the repo and install npm dependencies
#   4. Prompt you to fill in .env (secrets, DB password, admin credentials)
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
DB_USER="aura_user"
NODE_VERSION="20"
PG_VERSION="16"
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
# 4. POSTGRESQL 16  (via official PGDG apt repo)
# =============================================================================
if ! dpkg -l | grep -q "postgresql-${PG_VERSION}"; then
  info "Adding PostgreSQL ${PG_VERSION} apt repository..."
  sudo install -d /usr/share/postgresql-common/pgdg
  sudo curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
    -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc
  echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] \
https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
    | sudo tee /etc/apt/sources.list.d/pgdg.list > /dev/null
  sudo apt-get update -q
  info "Installing PostgreSQL ${PG_VERSION}..."
  sudo apt-get install -y "postgresql-${PG_VERSION}"
else
  success "PostgreSQL ${PG_VERSION} already installed."
fi

sudo systemctl enable postgresql --now
sleep 2

# =============================================================================
# 5. CONFIGURE POSTGRESQL — password auth + create DB/user
# =============================================================================
PG_HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"

if [[ ! -f "$PG_HBA" ]]; then
  # Fallback: find pg_hba.conf dynamically
  PG_HBA=$(sudo -u postgres psql -t -c "SHOW hba_file;" 2>/dev/null | tr -d ' ')
fi

info "Configuring pg_hba.conf → scram-sha-256 for local connections..."
# Replace peer/ident auth with scram-sha-256 for local connections
sudo sed -i \
  -e 's/^\(local\s\+all\s\+all\s\+\)peer/\1scram-sha-256/' \
  -e 's/^\(host\s\+all\s\+all\s\+127\.0\.0\.1\/32\s\+\)ident/\1scram-sha-256/' \
  -e 's/^\(host\s\+all\s\+all\s\+::1\/128\s\+\)ident/\1scram-sha-256/' \
  "$PG_HBA"

sudo systemctl reload postgresql

# Prompt for DB password
echo ""
echo -e "${YELLOW}Enter a strong password for the PostgreSQL app user '${DB_USER}':${NC}"
read -rs DB_PASSWORD
echo ""
[[ -z "$DB_PASSWORD" ]] && die "DB password cannot be empty."

info "Creating PostgreSQL user '${DB_USER}' and database '${DB_NAME}'..."
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
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
SQL

success "PostgreSQL user and database ready."

# =============================================================================
# 6. CLONE / UPDATE REPO
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
# 7. ENVIRONMENT FILE
# =============================================================================
ENV_FILE="${APP_DIR}/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  info "Creating .env from .env.example..."
  cp "${APP_DIR}/.env.example" "$ENV_FILE"

  # Generate a strong 64-byte hex SECRET_KEY
  GENERATED_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

  echo ""
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}  Configure secrets${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  echo -e "Admin login email for /admin:"
  read -r ADMIN_EMAIL

  echo -e "Admin password (make it strong):"
  read -rs ADMIN_PASSWORD
  echo ""

  echo -e "GitHub personal access token (read:user + repo scope, leave blank to skip heatmap):"
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

# Source .env so Vite build can pick up GEMINI_API_KEY etc.
set -a; source "$ENV_FILE"; set +a

# =============================================================================
# 8. NPM INSTALL & VITE BUILD
# =============================================================================
cd "$APP_DIR"

info "Installing npm dependencies..."
npm install --include=dev

info "Building frontend (Vite)..."
NODE_ENV=production npm run build

mkdir -p "${APP_DIR}/logs"
success "Build complete."

# =============================================================================
# 9. PM2 — START & CONFIGURE BOOT STARTUP
# =============================================================================
info "Starting app with PM2..."
pm2 start "${APP_DIR}/ecosystem.config.cjs" --env production

info "Saving PM2 process list..."
pm2 save

info "Configuring PM2 to start on reboot..."
STARTUP_CMD=$(pm2 startup systemd -u "${APP_USER}" --hp "/home/${APP_USER}" | grep "sudo env")
if [[ -n "$STARTUP_CMD" ]]; then
  eval "$STARTUP_CMD"
  success "PM2 startup configured."
else
  warn "Run the pm2 startup command printed above manually to enable auto-start on reboot."
fi

# =============================================================================
# 10. NGINX REVERSE PROXY
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

    # Gzip compression
    gzip            on;
    gzip_vary       on;
    gzip_proxied    any;
    gzip_comp_level 6;
    gzip_types      text/plain text/css application/json application/javascript
                    text/xml application/xml application/xml+rss text/javascript
                    image/svg+xml;

    # Max upload size (for future media uploads)
    client_max_body_size 20M;

    # Proxy to Node/Express on port 3000
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

# Enable site and remove default
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
echo -e "  PM2 status     : ${BLUE}pm2 status${NC}"
echo -e "  App logs       : ${BLUE}pm2 logs aura-blog${NC}"
echo -e "  Nginx logs     : ${BLUE}sudo tail -f /var/log/nginx/error.log${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Open port 80 in your Lightsail firewall:"
echo -e "     Lightsail console → Networking → IPv4 Firewall → Add rule → HTTP"
echo -e ""
echo -e "  2. For HTTPS (free SSL via Let's Encrypt):"
echo -e "     ${BLUE}sudo apt-get install -y certbot python3-certbot-nginx${NC}"
echo -e "     ${BLUE}sudo certbot --nginx -d yourdomain.com${NC}"
echo -e "     Certbot auto-renews — no manual renewal needed."
echo -e ""
echo -e "  3. Future deploys:"
echo -e "     ${BLUE}~/aura-blog/deploy/update.sh${NC}"
echo ""
