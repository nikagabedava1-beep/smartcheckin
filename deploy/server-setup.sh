#!/bin/bash

# SmartCheckin.ge Server Setup Script
# Run this on your DigitalOcean droplet

set -e

echo "=========================================="
echo "  SmartCheckin.ge Server Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - CHANGE THESE VALUES
DOMAIN="smartcheckin.ge"
DB_NAME="smartcheckin"
DB_USER="smartcheckin"
DB_PASSWORD="ChangeThisPassword123!"  # CHANGE THIS!
APP_DIR="/var/www/smartcheckin"
NODE_ENV="production"

echo -e "${YELLOW}Starting server setup...${NC}"

# Update system
echo -e "${GREEN}[1/10] Updating system...${NC}"
apt update && apt upgrade -y

# Install Node.js 20
echo -e "${GREEN}[2/10] Installing Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install PM2
echo -e "${GREEN}[3/10] Installing PM2...${NC}"
npm install -g pm2

# Install Nginx
echo -e "${GREEN}[4/10] Installing Nginx...${NC}"
apt install -y nginx
systemctl enable nginx

# Install PostgreSQL
echo -e "${GREEN}[5/10] Installing PostgreSQL...${NC}"
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# Install Certbot
echo -e "${GREEN}[6/10] Installing Certbot...${NC}"
apt install -y certbot python3-certbot-nginx

# Install Git and other tools
echo -e "${GREEN}[7/10] Installing Git and tools...${NC}"
apt install -y git unzip curl

# Setup PostgreSQL database
echo -e "${GREEN}[8/10] Setting up database...${NC}"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Create app directory
echo -e "${GREEN}[9/10] Creating app directory...${NC}"
mkdir -p $APP_DIR
chown -R $USER:$USER $APP_DIR

# Configure Nginx
echo -e "${GREEN}[10/10] Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/smartcheckin << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Upload size limit (for passport photos)
    client_max_body_size 20M;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/smartcheckin /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx

# Configure firewall
echo -e "${GREEN}Configuring firewall...${NC}"
ufw allow 'Nginx Full'
ufw allow OpenSSH
echo "y" | ufw enable

echo ""
echo -e "${GREEN}=========================================="
echo "  Server Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Database credentials:"
echo "  Host: localhost"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""
echo "App directory: $APP_DIR"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo "1. Point your domain ($DOMAIN) DNS to this server's IP address"
echo "2. Upload your project files to $APP_DIR"
echo "3. Run: cd $APP_DIR && npm install && npx prisma migrate deploy && npm run build"
echo "4. Run: pm2 start npm --name smartcheckin -- start"
echo "5. Run: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo -e "${GREEN}Your server IP: $(curl -s ifconfig.me)${NC}"
