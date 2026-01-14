#!/bin/bash

# CheckIn Georgia - Server Setup Script
# Run on a fresh Ubuntu 22.04 DigitalOcean Droplet

set -e

echo "=========================================="
echo "CheckIn Georgia - Server Setup"
echo "=========================================="

# Variables (update these)
DOMAIN="yourdomain.ge"
APP_DIR="/var/www/checkin-georgia"
DB_NAME="checkin_georgia"
DB_USER="checkin"
DB_PASS="change_this_secure_password"

# Update system
echo "Updating system..."
apt update && apt upgrade -y

# Install required packages
echo "Installing packages..."
apt install -y curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx

# Install Node.js 20 LTS
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2
echo "Installing PM2..."
npm install -g pm2

# Setup PostgreSQL
echo "Setting up PostgreSQL..."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Create app directory
echo "Creating app directory..."
mkdir -p $APP_DIR
mkdir -p $APP_DIR/public/uploads

# Clone or copy your app (you'll need to do this manually or via git)
echo "=========================================="
echo "Next steps:"
echo "1. Copy your application files to $APP_DIR"
echo "2. Create .env file with production values"
echo "3. Run: cd $APP_DIR && npm install && npm run build"
echo "4. Run: npx prisma db push"
echo "5. Run: npx prisma db seed"
echo "6. Run: pm2 start deploy/ecosystem.config.js"
echo "7. Run: pm2 save && pm2 startup"
echo "=========================================="

# Setup Nginx
echo "Setting up Nginx..."
rm -f /etc/nginx/sites-enabled/default

cat > /etc/nginx/sites-available/checkin-georgia << 'NGINX'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /var/www/checkin-georgia/public/uploads;
        expires 7d;
    }

    client_max_body_size 20M;
}
NGINX

sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/checkin-georgia
ln -sf /etc/nginx/sites-available/checkin-georgia /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# SSL Certificate
echo "=========================================="
echo "To setup SSL, run:"
echo "certbot --nginx -d $DOMAIN"
echo "=========================================="

# Firewall
echo "Setting up firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "Database connection string:"
echo "postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
echo ""
echo "Don't forget to:"
echo "1. Update DOMAIN variable in this script"
echo "2. Change the database password"
echo "3. Setup SSL with certbot"
echo "=========================================="
