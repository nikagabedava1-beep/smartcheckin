# Deployment Guide - CheckIn Georgia

## Server Requirements

- Ubuntu 22.04 LTS
- Minimum 2GB RAM, 2 CPU cores
- 20GB storage
- Domain name configured

## Quick Setup

### 1. Server Preparation

SSH into your DigitalOcean droplet and run:

```bash
# Download and run setup script
curl -O https://raw.githubusercontent.com/your-repo/deploy/setup.sh
chmod +x setup.sh
./setup.sh
```

### 2. Deploy Application

```bash
# Clone your repository
cd /var/www
git clone https://github.com/your-repo/checkin-georgia.git
cd checkin-georgia

# Install dependencies
npm install

# Create environment file
cp .env.example .env
nano .env  # Edit with production values
```

### 3. Environment Variables

Edit `/var/www/checkin-georgia/.env`:

```env
# Database (use the connection string from setup script)
DATABASE_URL="postgresql://checkin:YOUR_PASSWORD@localhost:5432/checkin_georgia"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://yourdomain.ge"

# TTLock (add when you have credentials)
TTLOCK_CLIENT_ID=""
TTLOCK_CLIENT_SECRET=""
TTLOCK_REDIRECT_URI="https://yourdomain.ge/api/ttlock/callback"

# BOG iPay (add when you have credentials)
BOG_MERCHANT_ID=""
BOG_SECRET_KEY=""
BOG_API_URL="https://ipay.ge/opay/api"
BOG_CALLBACK_URL="https://yourdomain.ge/api/webhooks/bog"

# WhatsApp (add when you have credentials)
WHATSAPP_TOKEN=""
WHATSAPP_PHONE_ID=""

# File Upload
UPLOAD_DIR="/var/www/checkin-georgia/public/uploads"
MAX_FILE_SIZE="10485760"

# App
APP_URL="https://yourdomain.ge"
APP_NAME="CheckIn Georgia"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed demo data
npx prisma db seed
```

### 5. Build & Start

```bash
# Build application
npm run build

# Start with PM2
pm2 start deploy/ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### 6. SSL Certificate

```bash
# Install SSL certificate
certbot --nginx -d yourdomain.ge

# Auto-renewal test
certbot renew --dry-run
```

## Post-Deployment

### Demo Credentials

After seeding, you can login with:

- **Admin:** admin@checkin.ge / admin123
- **Owner:** owner@example.com / owner123

**Important:** Change these passwords immediately in production!

### Creating First Admin

```bash
cd /var/www/checkin-georgia
npx tsx scripts/create-admin.ts
```

### Monitoring

```bash
# View logs
pm2 logs checkin-georgia

# Monitor resources
pm2 monit

# Restart application
pm2 restart checkin-georgia
```

### Updates

```bash
cd /var/www/checkin-georgia
git pull
npm install
npm run build
pm2 restart checkin-georgia
```

## Troubleshooting

### Application won't start

```bash
# Check logs
pm2 logs checkin-georgia --lines 50

# Check if port is in use
lsof -i :3000
```

### Database connection issues

```bash
# Test PostgreSQL connection
psql -U checkin -h localhost -d checkin_georgia

# Check PostgreSQL status
systemctl status postgresql
```

### Nginx issues

```bash
# Test configuration
nginx -t

# View error logs
tail -f /var/log/nginx/error.log
```

### SSL issues

```bash
# Renew certificate manually
certbot renew

# Check certificate status
certbot certificates
```

## Backup

### Database Backup

```bash
# Create backup
pg_dump -U checkin checkin_georgia > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U checkin checkin_georgia < backup_20240101.sql
```

### File Backup

```bash
# Backup uploads
tar -czvf uploads_backup_$(date +%Y%m%d).tar.gz /var/www/checkin-georgia/public/uploads
```

## Security Checklist

- [ ] Changed all default passwords
- [ ] SSL certificate installed
- [ ] Firewall configured (UFW)
- [ ] Regular backups scheduled
- [ ] Environment variables secured
- [ ] File permissions set correctly
- [ ] Automatic security updates enabled

## Support

For issues and feature requests:
- Create an issue on GitHub
- Contact: your@email.com
