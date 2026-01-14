# SmartCheckin.ge Deployment Guide

## Prerequisites
- DigitalOcean Droplet with Ubuntu 22.04/24.04
- Domain (smartcheckin.ge) with access to DNS settings
- SSH client (Windows has it built-in)

---

## Step 1: Point Domain to Server

1. Go to your domain registrar's DNS settings
2. Add/Update these DNS records:
   - **A Record**: `@` → `YOUR_SERVER_IP`
   - **A Record**: `www` → `YOUR_SERVER_IP`
3. Wait 5-30 minutes for DNS propagation

---

## Step 2: Initial Server Setup

### Option A: Using DigitalOcean Console (Easiest)

1. Go to https://cloud.digitalocean.com
2. Click your Droplet → Click "Console" button
3. Login with root and your password
4. Run these commands:

```bash
# Download and run setup script
curl -O https://raw.githubusercontent.com/YOUR_REPO/main/deploy/server-setup.sh
chmod +x server-setup.sh
./server-setup.sh
```

### Option B: Manual SSH from Your Computer

1. Open PowerShell or Command Prompt
2. Connect to server:
```bash
ssh root@YOUR_SERVER_IP
```
3. When prompted, enter your server password
4. Copy and paste the contents of `server-setup.sh` or run each command manually

---

## Step 3: Configure Environment Variables

On the server, create the `.env` file:

```bash
cd /var/www/smartcheckin
nano .env
```

Copy the contents from `.env.production.template` and fill in your values:

- `DATABASE_URL`: Use the password you set in server-setup.sh
- `NEXTAUTH_SECRET`: Generate with: `openssl rand -base64 32`
- Other settings as needed

Save: `Ctrl+X`, then `Y`, then `Enter`

---

## Step 4: Deploy Your Code

### Option A: Using the PowerShell Script (Windows)

1. Open PowerShell in the project folder
2. Run:
```powershell
.\deploy\deploy-to-server.ps1 -ServerIP YOUR_SERVER_IP
```

### Option B: Manual Deployment

1. **On your local machine**, create a zip of the project (excluding node_modules, .next, .git)

2. **Upload using SCP**:
```bash
scp smartcheckin.zip root@YOUR_SERVER_IP:/tmp/
```

3. **On the server**:
```bash
cd /var/www/smartcheckin
unzip /tmp/smartcheckin.zip
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 start ecosystem.config.js
pm2 save
```

---

## Step 5: Enable HTTPS (SSL Certificate)

On the server, run:

```bash
sudo certbot --nginx -d smartcheckin.ge -d www.smartcheckin.ge
```

Follow the prompts. Certbot will automatically renew the certificate.

---

## Useful Commands

### Check Application Status
```bash
pm2 status
pm2 logs smartcheckin
```

### Restart Application
```bash
pm2 restart smartcheckin
```

### View Nginx Logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Database Access
```bash
sudo -u postgres psql smartcheckin
```

### Update Application
```bash
cd /var/www/smartcheckin
git pull  # if using git
npm install
npx prisma migrate deploy
npm run build
pm2 restart smartcheckin
```

---

## Troubleshooting

### Site not loading
1. Check if app is running: `pm2 status`
2. Check logs: `pm2 logs smartcheckin`
3. Check Nginx: `sudo nginx -t`

### Database connection error
1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify DATABASE_URL in .env file
3. Test connection: `sudo -u postgres psql -d smartcheckin`

### SSL Certificate Issues
1. Ensure DNS is pointing to your server
2. Run: `sudo certbot --nginx -d smartcheckin.ge`

---

## Server Specifications Recommendation

For initial deployment:
- **CPU**: 1 vCPU
- **RAM**: 2GB minimum (4GB recommended)
- **Storage**: 25GB SSD
- **Plan**: DigitalOcean Basic Droplet $12-24/month
