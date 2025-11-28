# DigitalOcean Quick Start Guide

Deploy your AI Learning Platform to DigitalOcean in 30 minutes!

## 🎯 What You'll Get

- ✅ Production-ready deployment
- ✅ PostgreSQL database with automatic backups
- ✅ Redis cache
- ✅ SSL certificates (automatic)
- ✅ Auto-scaling capabilities
- ✅ CI/CD pipeline from GitHub

**Cost:** ~$19/month ($7 database + $7 Redis + $5 app)

## 📋 Prerequisites

1. **DigitalOcean Account**
   - Sign up: https://cloud.digitalocean.com/registrations/new
   - Add payment method (required)
   - Optional: Get $200 free credit for 60 days

2. **GitHub Repository**
   - Code pushed to GitHub
   - Admin access to repository

3. **Local Tools**
   - Git installed
   - Node.js 20+ installed
   - doctl CLI (we'll install this)

## 🚀 Quick Setup (Automated)

### Step 1: Install doctl CLI

**Windows (PowerShell as Administrator):**
```powershell
choco install doctl
```

**macOS:**
```bash
brew install doctl
```

**Linux:**
```bash
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.98.1/doctl-1.98.1-linux-amd64.tar.gz
tar xf doctl-1.98.1-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin
```

**Verify:**
```bash
doctl version
```

### Step 2: Authenticate

1. **Get API Token:**
   - Go to: https://cloud.digitalocean.com/account/api/tokens
   - Click "Generate New Token"
   - Name: `GitHub Actions CI/CD`
   - Scopes: ✅ Read ✅ Write
   - Click "Generate Token"
   - **Copy the token!**

2. **Authenticate:**
   ```bash
   doctl auth init
   # Paste your token when prompted
   ```

3. **Verify:**
   ```bash
   doctl account get
   ```

### Step 3: Update App Configuration

Edit `.do/app.yaml` and replace:
```yaml
repo: YOUR_GITHUB_USERNAME/ai-learning
```

With your actual repository:
```yaml
repo: yourusername/your-repo-name
```

### Step 4: Run Automated Setup

**Windows:**
```powershell
.\scripts\setup-digitalocean.ps1
```

**macOS/Linux:**
```bash
chmod +x scripts/setup-digitalocean.sh
./scripts/setup-digitalocean.sh
```

The script will:
- ✅ Create PostgreSQL database
- ✅ Create Redis cluster
- ✅ Create container registry
- ✅ Deploy your app
- ✅ Generate JWT secrets
- ✅ Display next steps

**This takes ~15-20 minutes** (mostly waiting for resources to provision)

### Step 5: Add GitHub Secrets

The script will display these. Add them to GitHub:

Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

Click "New repository secret" for each:

1. **DIGITALOCEAN_TOKEN**
   - Value: Your API token from Step 2

2. **REGISTRY_NAME**
   - Value: `ai-learning`

3. **APP_ID**
   - Value: (displayed by script)

Then add a variable (Variables tab):

4. **DEPLOY_PLATFORM**
   - Value: `digitalocean`

### Step 6: Add App Environment Variables

The script will display JWT secrets. Add them to your app:

Go to: `https://cloud.digitalocean.com/apps/[YOUR_APP_ID]/settings`

Click "App-Level Environment Variables" → "Edit"

Add these (mark as encrypted):

1. **JWT_SECRET**
   - Value: (from script output)
   - ✅ Encrypt

2. **JWT_REFRESH_SECRET**
   - Value: (from script output)
   - ✅ Encrypt

Click "Save"

### Step 7: Wait for Deployment

Monitor deployment:
```bash
# Watch deployment
doctl apps list-deployments [YOUR_APP_ID]

# View logs
doctl apps logs [YOUR_APP_ID] --type run --follow
```

Your app will be available at: `https://[app-name].ondigitalocean.app`

### Step 8: Test Your App!

Visit your app URL and:
1. Try the health check: `/health`
2. Register a new account
3. Login
4. Test the dashboard

## ✅ Verification Checklist

- [ ] doctl installed and authenticated
- [ ] App created on DigitalOcean
- [ ] Database created and online
- [ ] Redis created and online
- [ ] GitHub Secrets added
- [ ] App environment variables set
- [ ] Deployment successful
- [ ] Health check responds
- [ ] Can register new user
- [ ] Can login
- [ ] Dashboard loads

## 🔧 Manual Setup (Alternative)

If you prefer manual setup, follow the detailed guide:

📖 **[Complete DigitalOcean Setup Guide](Documentation/DIGITALOCEAN-SETUP.md)**

## 🎨 Customization

### Update App Name

Edit `.do/app.yaml`:
```yaml
name: your-custom-name  # Change this
```

### Scale Your App

**Vertical Scaling (More Power):**
```yaml
instance_size_slug: professional-xs  # $12/month
```

Options:
- `basic-xxs` - $5/month (512MB RAM)
- `basic-xs` - $10/month (1GB RAM)
- `professional-xs` - $12/month (1GB RAM, better CPU)
- `professional-s` - $24/month (2GB RAM)

**Horizontal Scaling (More Instances):**
```yaml
instance_count: 2  # Load balanced
```

### Add Custom Domain

1. **In DigitalOcean:**
   - Apps → Your App → Settings → Domains
   - Click "Add Domain"
   - Enter: `yourdomain.com`

2. **In Your DNS Provider:**
   ```
   Type    Name    Value
   CNAME   @       your-app.ondigitalocean.app
   CNAME   www     your-app.ondigitalocean.app
   ```

3. **Wait for SSL:** Auto-provisioned by Let's Encrypt

### Database Backups

Automatic daily backups included!

**Manual Backup:**
```bash
doctl databases backup [DB_ID]
```

**Restore:**
```bash
doctl databases restore [DB_ID] [BACKUP_ID]
```

## 🎯 CI/CD Workflow

Now when you push to GitHub:

```bash
# 1. Create feature branch
git checkout -b feature/new-dashboard

# 2. Make changes
# ... code ...

# 3. Commit and push
git commit -am "feat: add user dashboard"
git push origin feature/new-dashboard

# 4. Create PR
# → CI runs tests
# → Results posted on PR

# 5. Merge to main
# → Automatically deploys to DigitalOcean!
# → Your changes are live!
```

## 📊 Monitoring

### View Logs

**Real-time:**
```bash
doctl apps logs [APP_ID] --type run --follow
```

**Build logs:**
```bash
doctl apps logs [APP_ID] --type build
```

**Web UI:**
https://cloud.digitalocean.com/apps → Your App → Runtime Logs

### Performance Insights

Go to: Apps → Your App → Insights

Monitor:
- Response times
- Error rates
- Resource usage
- Request volume

### Alerts

Configure in app settings:
- Deployment failures
- High error rates
- Resource limits

## 🆘 Troubleshooting

### ❌ Build Failed

**Check logs:**
```bash
doctl apps logs [APP_ID] --type build
```

**Common fixes:**
- Verify Dockerfile syntax
- Check package.json dependencies
- Ensure Node version is 20

### ❌ Health Check Failing

**Verify health endpoint:**
```bash
curl https://your-app.ondigitalocean.app/health
```

**Common fixes:**
- Check PORT is 3000 (or 8080)
- Verify app is listening on correct port
- Check health_check path in app.yaml

### ❌ Database Connection Error

**Test connection:**
```bash
doctl databases connection [DB_ID]
```

**Common fixes:**
- Add app to database trusted sources
- Verify DATABASE_URL format
- Check SSL mode: `?sslmode=require`

### ❌ Can't Login

**Check JWT secrets:**
```bash
# View app env vars
doctl apps spec get [APP_ID]
```

**Common fixes:**
- Ensure JWT_SECRET is set
- Verify JWT_REFRESH_SECRET is set
- Check ALLOWED_ORIGINS includes your domain

## 💰 Cost Optimization

### Development ($12/month)
```yaml
# App
instance_size_slug: basic-xxs  # $5

# Database & Redis
size: db-s-1vcpu-1gb  # $7 each
```

### Production ($40+/month)
```yaml
# App (load balanced)
instance_size_slug: professional-xs  # $12
instance_count: 2  # $24 total

# Database (high availability)
size: db-s-2vcpu-4gb  # $30
num_nodes: 2
```

### Free Testing

Use $200 credit for 60 days:
1. New DigitalOcean account
2. Verify payment method
3. Get $200 credit automatically
4. Deploy and test for free!

## 📚 Next Steps

1. ✅ **Complete this quick start**
2. ✅ **Review full guide:** [Documentation/DIGITALOCEAN-SETUP.md](Documentation/DIGITALOCEAN-SETUP.md)
3. ✅ **Set up monitoring:** Configure alerts
4. ✅ **Add custom domain:** Professional appearance
5. ✅ **Enable backups:** Already automatic!
6. ✅ **Scale as needed:** Adjust resources

## 🔗 Useful Links

- [DigitalOcean Dashboard](https://cloud.digitalocean.com/apps)
- [Database Management](https://cloud.digitalocean.com/databases)
- [Container Registry](https://cloud.digitalocean.com/registry)
- [doctl Reference](https://docs.digitalocean.com/reference/doctl/)
- [App Platform Docs](https://docs.digitalocean.com/products/app-platform/)

## 🎉 Success!

Your AI Learning Platform is now live on DigitalOcean with:
- ✅ Automatic deployments from GitHub
- ✅ Production database with backups
- ✅ SSL certificates
- ✅ Professional infrastructure
- ✅ CI/CD pipeline

**Start building features - deployment is automated!** 🚀

---

**Need help?** Check the [full documentation](Documentation/DIGITALOCEAN-SETUP.md) or open an issue.
