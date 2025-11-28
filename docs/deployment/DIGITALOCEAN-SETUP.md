# DigitalOcean App Platform Setup Guide

Complete guide to deploy the AI Learning Platform on DigitalOcean App Platform with automated CI/CD.

## Overview

**What you'll get:**
- ✅ Backend API (Node.js)
- ✅ Frontend (React)
- ✅ PostgreSQL Database
- ✅ Redis Cache
- ✅ Automatic deployments from GitHub
- ✅ SSL certificates
- ✅ Custom domain support

**Estimated cost:** $12-24/month
- App: $5-12/month (Basic or Professional)
- Database: $7/month (Basic)
- Redis: $7/month (Basic)

## Prerequisites

- DigitalOcean account ([Sign up](https://cloud.digitalocean.com/registrations/new))
- GitHub repository with the code
- Credit card for DigitalOcean (required even for free tier)

## Step-by-Step Setup

### Step 1: Install DigitalOcean CLI (doctl)

**On Windows:**
```powershell
# Using Chocolatey
choco install doctl

# Or download from: https://github.com/digitalocean/doctl/releases
```

**On macOS:**
```bash
brew install doctl
```

**On Linux:**
```bash
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.98.1/doctl-1.98.1-linux-amd64.tar.gz
tar xf doctl-1.98.1-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin
```

**Verify installation:**
```bash
doctl version
```

### Step 2: Authenticate with DigitalOcean

1. **Create API Token:**
   - Go to: https://cloud.digitalocean.com/account/api/tokens
   - Click "Generate New Token"
   - Name: `GitHub Actions CI/CD`
   - Scopes: ✅ Read ✅ Write
   - Expiration: No expiry (or custom)
   - Click "Generate Token"
   - **Copy the token** (you won't see it again!)

2. **Authenticate doctl:**
   ```bash
   doctl auth init
   # Paste your token when prompted
   ```

3. **Verify authentication:**
   ```bash
   doctl account get
   ```

### Step 3: Create DigitalOcean Resources

#### A. Create PostgreSQL Database

```bash
# Create database cluster
doctl databases create ai-learning-db \
  --engine pg \
  --version 16 \
  --region nyc1 \
  --size db-s-1vcpu-1gb \
  --num-nodes 1

# Wait for it to be ready (takes 5-10 minutes)
doctl databases list

# Get database ID
DB_ID=$(doctl databases list --format ID --no-header | head -1)

# Create database
doctl databases db create $DB_ID ai_learning

# Get connection details
doctl databases connection $DB_ID
```

**Save the connection string** - you'll need it later.

#### B. Create Redis Cluster

```bash
# Create Redis cluster
doctl databases create ai-learning-redis \
  --engine redis \
  --version 7 \
  --region nyc1 \
  --size db-s-1vcpu-1gb \
  --num-nodes 1

# Get Redis ID
REDIS_ID=$(doctl databases list --format ID,Name --no-header | grep redis | awk '{print $1}')

# Get connection details
doctl databases connection $REDIS_ID
```

**Save the Redis connection string** - you'll need it later.

#### C. Create Container Registry (Optional but recommended)

```bash
# Create registry
doctl registry create ai-learning

# Get registry name
doctl registry get

# Login to registry
doctl registry login
```

### Step 4: Create App Spec Configuration

Create the app specification file that defines your application:

```bash
# The file is already created at: .do/app.yaml
# Review and customize if needed
```

The app spec defines:
- Backend service (Node.js API)
- Frontend service (Static React app)
- Database and Redis connections
- Environment variables
- Build and run commands

### Step 5: Create App on DigitalOcean

**Option A: Using doctl (Recommended)**

```bash
# Create app from spec
doctl apps create --spec .do/app.yaml

# Get app ID
APP_ID=$(doctl apps list --format ID --no-header | head -1)
echo "Your App ID: $APP_ID"

# Save this ID - you'll need it for GitHub Actions
```

**Option B: Using Web UI**

1. Go to: https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Choose "GitHub" as source
4. Select your repository
5. Select branch: `main`
6. Auto-deploy: ✅ Enabled
7. Click "Next"
8. Configure resources (or skip to use spec file)
9. Click "Next" → "Create Resources"

### Step 6: Configure GitHub Secrets

Add these secrets to your GitHub repository:

**Go to:** `Repository → Settings → Secrets and variables → Actions`

**Add these secrets:**

1. **DIGITALOCEAN_TOKEN**
   ```
   Value: <your-api-token-from-step-2>
   ```

2. **REGISTRY_NAME**
   ```
   Value: ai-learning
   ```
   (Or your registry name from `doctl registry get`)

3. **APP_ID**
   ```bash
   # Get your app ID
   doctl apps list

   # Add to GitHub Secrets
   Value: <your-app-id>
   ```

**Add repository variables:**

Go to: `Repository → Settings → Secrets and variables → Actions → Variables`

4. **DEPLOY_PLATFORM**
   ```
   Value: digitalocean
   ```

### Step 7: Configure Environment Variables on DigitalOcean

Set environment variables for your app:

**Using doctl:**

```bash
# Get your app ID
APP_ID=$(doctl apps list --format ID --no-header | head -1)

# Update app with environment variables
# (This is complex via CLI, easier via UI)
```

**Using Web UI (Recommended):**

1. Go to: https://cloud.digitalocean.com/apps
2. Click your app
3. Go to "Settings" tab
4. Click "App-Level Environment Variables"

**Add these variables:**

**Backend Service:**
```bash
NODE_ENV=production
PORT=8080
API_VERSION=v1

# Database (use connection string from Step 3A)
DATABASE_URL=${ai-learning-db.DATABASE_URL}

# Redis (use connection string from Step 3B)
REDIS_URL=${ai-learning-redis.DATABASE_URL}

# JWT Secrets (generate new random strings)
JWT_SECRET=<paste-output-of: openssl rand -hex 32>
JWT_REFRESH_SECRET=<paste-output-of: openssl rand -hex 32>
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS (use your frontend URL)
ALLOWED_ORIGINS=${APP_URL}

# Logging
LOG_LEVEL=info
```

**Frontend Service:**
```bash
# API URL (will be auto-filled with backend URL)
VITE_API_BASE_URL=${backend.PUBLIC_URL}/api/v1
```

**💡 Tip:** DigitalOcean can auto-inject database URLs using `${component-name.DATABASE_URL}`

### Step 8: Test Manual Deployment

Before setting up automated deployments, test a manual deployment:

```bash
# Trigger deployment
doctl apps create-deployment $APP_ID

# Watch deployment progress
doctl apps list-deployments $APP_ID

# Get app URL
doctl apps get $APP_ID --format DefaultIngress --no-header
```

Visit the URL to verify your app is running!

### Step 9: Setup GitHub Actions for Auto-Deploy

The deployment workflow is already configured! Here's what happens:

**On push to `main` branch:**
1. Builds Docker images
2. Pushes to DigitalOcean Container Registry
3. Triggers app deployment
4. Comments status on related issues

**Verify the workflow:**
```bash
# Check the workflow file
cat .github/workflows/deploy.yml
```

### Step 10: Test the Complete Pipeline

Create a test deployment:

```bash
# 1. Create feature branch
git checkout -b test/do-deployment

# 2. Make a small change
echo "# DigitalOcean Deployment" >> README.md

# 3. Commit and push
git add .
git commit -m "test: verify DigitalOcean deployment"
git push origin test/do-deployment

# 4. Create PR on GitHub
# - CI workflow runs
# - Tests execute
# - Preview deploys (if configured)

# 5. Merge to main
# - Deployment workflow triggers
# - App deploys to DigitalOcean
# - You're live!
```

## Configuration Files

### App Spec (`.do/app.yaml`)

Already created! Review it here: `.do/app.yaml`

Key sections:
- **services**: Backend API and Frontend
- **databases**: PostgreSQL and Redis connections
- **envs**: Environment variables
- **health_check**: Health monitoring
- **http_port**: Port configuration

### Dockerfile Optimization

For faster builds on DigitalOcean, ensure Dockerfiles use multi-stage builds and layer caching.

## Monitoring & Management

### View Logs

**Using CLI:**
```bash
# Get app ID
APP_ID=$(doctl apps list --format ID --no-header | head -1)

# View logs
doctl apps logs $APP_ID --type run

# Follow logs in real-time
doctl apps logs $APP_ID --type run --follow
```

**Using Web UI:**
```
https://cloud.digitalocean.com/apps → Your App → Runtime Logs
```

### Monitor Performance

**Web UI:**
1. Go to: https://cloud.digitalocean.com/apps
2. Click your app
3. View "Insights" tab
4. Check:
   - Response times
   - Error rates
   - Resource usage
   - Request volume

### Database Management

**Using CLI:**
```bash
# List databases
doctl databases list

# Get database details
doctl databases get $DB_ID

# View connection info
doctl databases connection $DB_ID

# Connect to database
doctl databases connect $DB_ID
```

**Using Web UI:**
```
https://cloud.digitalocean.com/databases → Your Database
```

### Scale Your App

**Vertical scaling (more power):**
```bash
# List available sizes
doctl apps tier instance-size list

# Update app size
doctl apps update $APP_ID --spec .do/app.yaml
# (Edit spec file first to change instance_size_slug)
```

**Horizontal scaling (more instances):**
Edit `.do/app.yaml`:
```yaml
services:
  - name: backend
    instance_count: 2  # Scale to 2 instances
```

Then update:
```bash
doctl apps update $APP_ID --spec .do/app.yaml
```

## Custom Domain Setup

### Step 1: Add Domain to DigitalOcean

**Using CLI:**
```bash
# Add domain
doctl apps update $APP_ID --spec .do/app.yaml
# (Add domain in spec file first)
```

**Using Web UI:**
1. Go to your app settings
2. Click "Domains"
3. Click "Add Domain"
4. Enter your domain: `yourdomain.com`
5. Click "Add Domain"

### Step 2: Configure DNS

Add these DNS records at your domain provider:

```
Type    Name    Value
CNAME   www     <your-app>.ondigitalocean.app
CNAME   @       <your-app>.ondigitalocean.app
```

Or point to DigitalOcean nameservers:
```
ns1.digitalocean.com
ns2.digitalocean.com
ns3.digitalocean.com
```

### Step 3: Enable HTTPS

DigitalOcean automatically provisions SSL certificates via Let's Encrypt!

- Automatic renewal
- Free forever
- No configuration needed

## Troubleshooting

### Build Fails

**Check build logs:**
```bash
doctl apps logs $APP_ID --type build
```

**Common issues:**
- Missing dependencies in package.json
- Build command incorrect
- Environment variables not set
- Docker build fails

**Solution:**
1. Test build locally
2. Check Dockerfile
3. Verify environment variables
4. Review build logs

### Deployment Fails

**Check deployment logs:**
```bash
doctl apps logs $APP_ID --type deploy
```

**Common issues:**
- Health check failing
- Port configuration wrong
- Database connection failed
- Redis connection failed

**Solution:**
1. Verify health check endpoint
2. Ensure PORT is 8080
3. Check database connection string
4. Verify Redis URL

### App Not Accessible

**Check app status:**
```bash
doctl apps get $APP_ID
```

**Common issues:**
- Deployment still in progress
- Health check failing
- CORS issues
- Environment variables wrong

**Solution:**
1. Wait for deployment to complete
2. Check health endpoint: `/health`
3. Verify ALLOWED_ORIGINS
4. Review runtime logs

### Database Connection Issues

**Test connection:**
```bash
# Get connection string
doctl databases connection $DB_ID

# Test with psql
psql "<connection-string>"
```

**Common issues:**
- Firewall rules
- Wrong connection string
- Database not ready
- SSL requirement

**Solution:**
1. Add app to database trusted sources
2. Use correct connection string format
3. Wait for database to be ready
4. Include SSL parameters

## Cost Optimization

### Development Setup ($12/month)

```yaml
# App: Basic tier
instance_size_slug: basic-xxs  # $5/month

# Database: Basic tier
databases:
  - name: db
    engine: PG
    size: db-s-1vcpu-1gb  # $7/month
```

### Production Setup ($40+/month)

```yaml
# App: Professional tier
instance_size_slug: professional-xs  # $12/month
instance_count: 2  # Load balanced

# Database: Professional tier
databases:
  - name: db
    engine: PG
    size: db-s-2vcpu-4gb  # $30/month
    num_nodes: 2  # High availability
```

### Free Tier Alternative

Use DigitalOcean's $200 free credit for 60 days:
1. Sign up with new account
2. Verify payment method
3. Get $200 credit
4. Deploy and test

## Security Best Practices

### 1. Environment Variables

✅ **DO:**
- Store all secrets in App Platform environment variables
- Use strong random values for JWT secrets
- Rotate secrets regularly

❌ **DON'T:**
- Commit secrets to git
- Use weak or default secrets
- Share secrets in plain text

### 2. Database Security

```bash
# Enable SSL
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require

# Restrict access
# Add only app components to database trusted sources
```

### 3. CORS Configuration

```bash
# Production
ALLOWED_ORIGINS=https://yourdomain.com

# Development
ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:5173
```

### 4. Rate Limiting

Already configured in the app:
- 100 requests per 15 minutes for auth endpoints
- Adjust in backend environment variables

## Backup & Recovery

### Database Backups

**Automatic:**
- Daily backups (retained for 7 days on Basic tier)
- Point-in-time recovery (Professional tier)

**Manual backup:**
```bash
# Create backup
doctl databases backup $DB_ID

# List backups
doctl databases backups list $DB_ID

# Restore from backup
doctl databases restore $DB_ID $BACKUP_ID
```

### App Rollback

**Via Web UI:**
1. Go to app → Deployments
2. Find working deployment
3. Click "..." → "Redeploy"

**Via CLI:**
```bash
# List deployments
doctl apps list-deployments $APP_ID

# Redeploy specific deployment
doctl apps create-deployment $APP_ID --deployment-id $DEPLOYMENT_ID
```

## Next Steps

1. ✅ Complete setup (follow steps above)
2. ✅ Test deployment
3. ✅ Configure custom domain
4. ✅ Enable monitoring
5. ✅ Set up alerts
6. ✅ Configure backups
7. ✅ Review security settings
8. ✅ Optimize costs

## Resources

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [doctl Reference](https://docs.digitalocean.com/reference/doctl/)
- [App Spec Reference](https://docs.digitalocean.com/products/app-platform/reference/app-spec/)
- [Pricing Calculator](https://www.digitalocean.com/pricing/app-platform)

## Support

- [DigitalOcean Community](https://www.digitalocean.com/community)
- [Support Tickets](https://cloud.digitalocean.com/support)
- [Status Page](https://status.digitalocean.com/)

---

**Ready to deploy? Start with Step 1!** 🚀
