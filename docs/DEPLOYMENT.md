# Deployment Guide

Complete guide for deploying Infinite Tic-Tac-Toe to production environments.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [OAuth Configuration](#oauth-configuration)
- [Monitoring & Logging](#monitoring--logging)
- [Security Checklist](#security-checklist)
- [Scaling Considerations](#scaling-considerations)
- [Troubleshooting](#troubleshooting)

---

## Overview

### Architecture Components

```
┌─────────────────┐
│   Web Frontend  │ (Next.js on Vercel)
│  Port 3000      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend API   │ (Express on any Node.js host)
│  Port 3001      │
└────────┬────────┘
         │
         ├──────────┐
         ▼          ▼
┌──────────┐  ┌──────────┐
│PostgreSQL│  │  Redis   │
└──────────┘  └──────────┘
```

### Deployment Order

1. **Infrastructure** - PostgreSQL, Redis
2. **Backend API** - Express server with WebSocket
3. **Frontend** - Next.js application
4. **OAuth Apps** - Configure Google & Discord

---

## Prerequisites

### Required Services

- **Node.js** 18+ hosting (Backend)
- **PostgreSQL** 14+ database
- **Redis** 6+ instance
- **Domain name** with SSL certificate
- **OAuth Apps** (Google & Discord)

### Recommended Providers

**Backend Hosting:**
- Railway.app (recommended - simple PostgreSQL + Redis)
- Render.com
- Fly.io
- DigitalOcean App Platform
- AWS ECS / EC2

**Frontend Hosting:**
- Vercel (recommended - optimized for Next.js)
- Netlify
- Cloudflare Pages

**Database:**
- Railway PostgreSQL (included)
- Supabase
- Neon
- AWS RDS
- DigitalOcean Managed Databases

**Redis:**
- Railway Redis (included)
- Upstash
- Redis Cloud
- AWS ElastiCache

---

## Environment Configuration

### Backend Environment Variables

Create `apps/backend/.env.production`:

```env
# Server
NODE_ENV=production
PORT=3001
WS_URL=wss://api.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/infinite_ttt?sslmode=require

# Redis
REDIS_URL=redis://default:password@host:6379

# OAuth - Google
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret

# OAuth - Discord
DISCORD_CLIENT_ID=your_production_discord_client_id
DISCORD_CLIENT_SECRET=your_production_discord_client_secret

# CORS (comma-separated origins)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional: Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

### Frontend Environment Variables

Create `apps/web/.env.production`:

```env
# API Connection
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate_a_random_32_character_secret_here

# OAuth - Google (same as backend)
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret

# OAuth - Discord (same as backend)
DISCORD_CLIENT_ID=your_production_discord_client_id
DISCORD_CLIENT_SECRET=your_production_discord_client_secret

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Generating Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Database Setup

### 1. Create PostgreSQL Database

**Using Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init
railway add postgresql
```

**Manual Setup:**
```sql
CREATE DATABASE infinite_ttt;
CREATE USER infinite_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE infinite_ttt TO infinite_user;
```

### 2. Run Migrations

From your local machine:

```bash
cd apps/backend

# Set production DATABASE_URL
export DATABASE_URL="postgresql://user:pass@prod-host:5432/infinite_ttt?sslmode=require"

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate:deploy

# Verify
pnpm prisma:migrate:status
```

### 3. Seed Initial Data (Optional)

```bash
# Create admin user or seed initial content
pnpm prisma db seed
```

### 4. Configure Connection Pooling

**Prisma Connection Pool:**

```env
# Recommended production settings
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
```

**External Pooler (PgBouncer):**

If using services like Supabase that offer connection pooling:

```env
DATABASE_URL="postgresql://user:pass@pooler-host:6543/db?pgbouncer=true"
```

---

## Backend Deployment

### Option 1: Railway (Recommended)

**Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
railway login
```

**Step 2: Initialize Project**
```bash
cd apps/backend
railway init
```

**Step 3: Add Services**
```bash
railway add postgresql
railway add redis
```

**Step 4: Configure Environment**
```bash
# Railway auto-sets DATABASE_URL and REDIS_URL
railway variables set PORT=3001
railway variables set WS_URL=wss://your-app.railway.app
railway variables set GOOGLE_CLIENT_ID=...
railway variables set GOOGLE_CLIENT_SECRET=...
railway variables set DISCORD_CLIENT_ID=...
railway variables set DISCORD_CLIENT_SECRET=...
railway variables set CORS_ORIGINS=https://yourdomain.com
```

**Step 5: Deploy**
```bash
railway up
```

**Step 6: Run Migrations**
```bash
railway run pnpm prisma:migrate:deploy
```

**Step 7: Get Public URL**
```bash
railway domain
# Creates: your-app.railway.app
```

---

### Option 2: Docker Deployment

**Dockerfile** (create at `apps/backend/Dockerfile`):

```dockerfile
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/game-engine/package.json ./packages/game-engine/
COPY packages/shared/package.json ./packages/shared/
COPY packages/identity/package.json ./packages/identity/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/backend ./apps/backend
COPY packages ./packages

# Generate Prisma client
WORKDIR /app/apps/backend
RUN pnpm prisma:generate

# Build
RUN pnpm build

# Production stage
FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app

# Copy built files
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/node_modules ./node_modules
COPY --from=builder /app/apps/backend/package.json ./
COPY --from=builder /app/apps/backend/prisma ./prisma

EXPOSE 3001

CMD ["pnpm", "start"]
```

**docker-compose.yml** (production):

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ../..
      dockerfile: apps/backend/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - PORT=3001
      - WS_URL=${WS_URL}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - DISCORD_CLIENT_ID=${DISCORD_CLIENT_ID}
      - DISCORD_CLIENT_SECRET=${DISCORD_CLIENT_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=infinite_ttt
      - POSTGRES_USER=infinite_user
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

**Deploy:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

### Option 3: Manual VPS Deployment

**On Ubuntu 22.04:**

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install Redis
sudo apt-get install redis-server

# Clone repository
git clone https://github.com/yourusername/infinite-ttt.git
cd infinite-ttt

# Install dependencies
pnpm install --frozen-lockfile

# Build backend
cd apps/backend
pnpm build

# Run migrations
pnpm prisma:migrate:deploy

# Install PM2 for process management
sudo npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name infinite-ttt-api
pm2 save
pm2 startup
```

**Nginx Reverse Proxy:**

```nginx
# /etc/nginx/sites-available/infinite-ttt
server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    # WebSocket support
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable and restart Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/infinite-ttt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**SSL Certificate (Let's Encrypt):**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Configure Project**

`vercel.json` is already configured:
```json
{
  "buildCommand": "cd ../.. && pnpm install && pnpm --filter infinite-tictactoe-web build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile"
}
```

**Step 3: Set Environment Variables**

Via Vercel Dashboard or CLI:
```bash
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_WS_URL production
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add DISCORD_CLIENT_ID production
vercel env add DISCORD_CLIENT_SECRET production
```

**Step 4: Deploy**
```bash
cd apps/web
vercel --prod
```

**Step 5: Configure Custom Domain**

In Vercel Dashboard:
1. Go to Project Settings → Domains
2. Add `yourdomain.com` and `www.yourdomain.com`
3. Configure DNS as instructed

---

### Option 2: Netlify

**netlify.toml:**
```toml
[build]
  command = "cd ../.. && pnpm install && pnpm --filter infinite-tictactoe-web build"
  publish = "apps/web/.next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Deploy:**
```bash
netlify deploy --prod
```

---

### Option 3: Self-hosted with Docker

**Dockerfile** (`apps/web/Dockerfile`):

```dockerfile
FROM node:18-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/game-engine/package.json ./packages/game-engine/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

COPY apps/web ./apps/web
COPY packages ./packages

WORKDIR /app/apps/web
RUN pnpm build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]
```

---

## OAuth Configuration

### Google OAuth Setup

**Step 1: Google Cloud Console**
1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Enable "Google+ API"

**Step 2: Create OAuth Credentials**
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Application type: "Web application"
4. Authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`

**Step 3: Copy Credentials**
- Client ID → `GOOGLE_CLIENT_ID`
- Client Secret → `GOOGLE_CLIENT_SECRET`

---

### Discord OAuth Setup

**Step 1: Discord Developer Portal**
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name it "Infinite Tic-Tac-Toe"

**Step 2: Configure OAuth2**
1. Go to OAuth2 settings
2. Add Redirects:
   - Development: `http://localhost:3000/api/auth/callback/discord`
   - Production: `https://yourdomain.com/api/auth/callback/discord`

**Step 3: Copy Credentials**
- Application ID → `DISCORD_CLIENT_ID`
- Client Secret → `DISCORD_CLIENT_SECRET`

**Important:** Update redirect URIs after domain changes!

---

## Monitoring & Logging

### Application Monitoring

**Sentry (Recommended)**

```bash
npm install @sentry/node @sentry/nextjs
```

**Backend** (`apps/backend/src/index.ts`):
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

**Frontend** (`apps/web/sentry.client.config.js`):
```javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

---

### Logging

**Backend Logging:**

```bash
# Install Winston
pnpm add winston
```

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

---

### Health Checks

**Backend Health Endpoint:**

Already implemented at `GET /health`

**Uptime Monitoring:**
- UptimeRobot (free tier)
- Pingdom
- Better Uptime

**Configure Check:**
- URL: `https://api.yourdomain.com/health`
- Interval: 5 minutes
- Alert on: 3 consecutive failures

---

### Database Monitoring

**PostgreSQL:**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size('infinite_ttt'));

-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

**Redis:**
```bash
redis-cli INFO stats
redis-cli INFO memory
```

---

## Security Checklist

### Pre-launch Security

- [ ] **Environment Variables:** No secrets in code
- [ ] **HTTPS:** SSL certificates configured
- [ ] **CORS:** Strict origin whitelist
- [ ] **Rate Limiting:** Implement before launch
- [ ] **OAuth Secrets:** Rotated and secure
- [ ] **Database:** SSL mode required
- [ ] **Headers:** Security headers configured
- [ ] **Dependencies:** No known vulnerabilities (`pnpm audit`)
- [ ] **Logs:** No sensitive data logged
- [ ] **Error Messages:** Generic in production

### Security Headers

**Add to backend:**

```typescript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

**For Nginx:**

```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## Scaling Considerations

### Current Limitations

- **Single-instance Backend:** In-memory match state
- **WebSocket:** No sticky sessions configured
- **Database:** Single PostgreSQL instance

### Horizontal Scaling Strategy

**Phase 1: Redis-backed State**
```typescript
// Move match state from memory to Redis
const matchState = await redis.get(`match:${matchId}`);
```

**Phase 2: Load Balancer**
```
     ┌──────────┐
     │  Nginx   │
     │Load Bal. │
     └────┬─────┘
          │
     ┌────┴────┐
     │         │
┌────▼───┐ ┌──▼─────┐
│Backend │ │Backend │
│   #1   │ │   #2   │
└────────┘ └────────┘
```

**Phase 3: Database Read Replicas**
```
┌─────────┐     ┌──────────┐
│ Primary │────→│ Replica  │
│  (RW)   │     │   (RO)   │
└─────────┘     └──────────┘
```

### Vertical Scaling

**Database:**
- Start: 1 CPU, 1GB RAM
- Growth: 2 CPU, 4GB RAM
- High traffic: 4 CPU, 8GB RAM

**Backend:**
- Start: 512MB RAM
- Growth: 1GB RAM
- High traffic: 2GB RAM per instance

---

## Troubleshooting

### Common Issues

**Issue: Database connection fails**
```
Error: Connection refused
```

**Solution:**
- Verify `DATABASE_URL` is correct
- Check database is running
- Ensure SSL mode matches (`?sslmode=require`)
- Check firewall rules

---

**Issue: WebSocket connection drops**
```
WebSocket closed unexpectedly
```

**Solution:**
- Check reverse proxy WebSocket support
- Verify `WS_URL` matches actual endpoint
- Increase proxy timeout
- Check for firewall blocking WebSocket

---

**Issue: OAuth redirect mismatch**
```
Error: redirect_uri_mismatch
```

**Solution:**
- Update OAuth app redirect URIs
- Ensure exact URL match (trailing slash matters)
- Check `NEXTAUTH_URL` matches domain

---

**Issue: Build fails on Vercel**
```
Error: Cannot find module '@infinite-ttt/game-engine'
```

**Solution:**
- Ensure workspace dependencies are properly linked
- Check `vercel.json` buildCommand includes workspace install
- Verify pnpm-workspace.yaml is committed

---

**Issue: High memory usage**

**Solution:**
- Check for memory leaks with Node.js profiler
- Reduce database connection pool size
- Implement Redis eviction policy
- Monitor with `pm2 monit`

---

**Issue: Slow API responses**

**Solution:**
- Add database indexes
- Enable query result caching
- Optimize N+1 queries
- Use connection pooling

---

## Rollback Procedure

**If deployment fails:**

1. **Revert Frontend** (Vercel):
   ```bash
   vercel rollback
   ```

2. **Revert Backend** (Railway):
   ```bash
   railway rollback
   ```

3. **Revert Database Migrations:**
   ```bash
   # NOT RECOMMENDED - prefer forward migrations
   pnpm prisma migrate resolve --rolled-back <migration-name>
   ```

---

## Post-Deployment Checklist

- [ ] Health check endpoint responds
- [ ] OAuth login works (Google & Discord)
- [ ] Local game mode functional
- [ ] Online matchmaking connects
- [ ] Ranked matches update ratings
- [ ] Leaderboard displays correctly
- [ ] WebSocket real-time updates work
- [ ] Match replay functions
- [ ] Profile pages load
- [ ] Mobile responsive
- [ ] SSL certificate valid
- [ ] Monitoring alerts configured
- [ ] Backup strategy in place

---

## Backup Strategy

### Database Backups

**Automated (Railway):**
- Automatic daily backups
- 7-day retention

**Manual:**
```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240101.sql
```

### Redis Persistence

**Configure RDB:**
```
save 900 1
save 300 10
save 60 10000
```

---

## Related Documentation

- [Main README](../README.md)
- [Backend README](../apps/backend/README.md)
- [Web App README](../apps/web/README.md)
- [API Documentation](./API.md)
- [Architecture](./ARCHITECTURE.md)

---

**Last Updated:** 2024-01-01  
**Deployment Version:** 1.0.0
