# Quick Start: CI/CD Setup

Get your CI/CD pipeline up and running in 15 minutes.

## Prerequisites

- GitHub repository with the code
- GitHub account with admin access
- Deployment platform account (Railway/Render/Vercel/etc.)

## 1. Choose Your Deployment Platform

### Option A: Railway (Recommended for Beginners)

**Pros:** Easiest setup, built-in database, generous free tier

1. **Sign up:** https://railway.app
2. **Install CLI:**
   ```bash
   npm install -g @railway/cli
   ```
3. **Login:**
   ```bash
   railway login
   ```
4. **Create project:**
   ```bash
   railway init
   ```
5. **Link GitHub repo:**
   ```bash
   railway link
   ```
6. **Get token:**
   ```bash
   railway tokens create
   ```
7. **Add to GitHub Secrets:**
   - Go to: `Settings → Secrets → Actions → New repository secret`
   - Name: `RAILWAY_TOKEN`
   - Value: (paste token)

### Option B: Render (Good Free Tier)

**Pros:** Good free tier, easy setup, built-in SSL

1. **Sign up:** https://render.com
2. **Create services:**
   - New Web Service (Backend)
   - New Static Site (Frontend)
   - New PostgreSQL
   - New Redis
3. **Get API Key:**
   - Dashboard → Account Settings → API Keys → Create
4. **Add to GitHub Secrets:**
   - `RENDER_API_KEY`
   - `RENDER_BACKEND_SERVICE_ID` (from service URL)

### Option C: Vercel + Railway

**Pros:** Best frontend DX, fast deployments

**Frontend (Vercel):**
1. **Sign up:** https://vercel.com
2. **Install CLI:**
   ```bash
   npm i -g vercel
   ```
3. **Link project:**
   ```bash
   cd frontend
   vercel link
   ```
4. **Get token:** Dashboard → Settings → Tokens
5. **Add to GitHub Secrets:**
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

**Backend (Railway):** See Option A

## 2. Configure GitHub Secrets

Go to: `Repository → Settings → Secrets and variables → Actions`

### Required Secrets

Click "New repository secret" and add:

```
# For Railway
RAILWAY_TOKEN=<your-token>

# For Render
RENDER_API_KEY=<your-key>
RENDER_BACKEND_SERVICE_ID=srv-xxxxx

# For Vercel (Frontend)
VERCEL_TOKEN=<your-token>
VERCEL_ORG_ID=team_xxxxx
VERCEL_PROJECT_ID=prj_xxxxx

# For Netlify (PR Previews)
NETLIFY_AUTH_TOKEN=<your-token>
NETLIFY_SITE_ID=<your-site-id>
NETLIFY_PREVIEW_SITE_ID=<your-preview-site-id>
```

### Repository Variables

Click "New repository variable" and add:

```
DEPLOY_PLATFORM=railway  # or render, vercel, netlify
PREVIEW_API_URL=https://api-preview.yourdomain.com/api/v1
```

## 3. Update Deployment Workflow

Edit `.github/workflows/deploy.yml`:

**For Railway:**
```yaml
jobs:
  deploy-backend:
    steps:
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend
```

**For Render:**
```yaml
jobs:
  deploy-backend:
    steps:
      - name: Deploy to Render
        uses: JorgeLNJunior/render-deploy@v1.4.4
        with:
          service_id: ${{ secrets.RENDER_BACKEND_SERVICE_ID }}
          api_key: ${{ secrets.RENDER_API_KEY }}
```

## 4. Set Up Branch Protection

### Quick Setup (Automated)

```bash
# Set environment variables
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
export GITHUB_REPOSITORY=username/ai-learning

# Run setup script
node scripts/setup-branch-protection.js
```

### Manual Setup

1. **Go to:** `Repository → Settings → Branches`
2. **Add rule for `main`:**
   - Branch name pattern: `main`
   - ✅ Require a pull request before merging
     - Required approvals: 1
   - ✅ Require status checks to pass before merging
     - Select: `Test Backend`, `Test Frontend`, `All Tests Passed`
   - ✅ Require conversation resolution
   - ✅ Require linear history
3. **Save changes**

## 5. Test the Pipeline

### Create a Test PR

```bash
# Create feature branch
git checkout -b test/ci-setup

# Make a small change
echo "# CI/CD Setup Complete" >> README.md

# Commit and push
git add .
git commit -m "test: verify CI/CD pipeline"
git push origin test/ci-setup
```

### Verify Workflows

1. **Go to:** `Repository → Pull requests → Open your PR`
2. **Check for:**
   - ✅ CI workflow running
   - ✅ Preview deployment (if configured)
   - ✅ Status checks passing
   - ✅ Comment from bot with results

### Merge and Deploy

1. **Click:** "Squash and merge"
2. **Verify:**
   - ✅ Deploy workflow triggered
   - ✅ Backend deployed
   - ✅ Frontend deployed
   - ✅ Application accessible

## 6. Configure Production Environment

### Railway

```bash
# Add environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway variables set JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Add database (automatic)
railway add

# Deploy
railway up
```

### Render

In Render Dashboard:
1. **Backend Service → Environment**
   ```
   NODE_ENV=production
   JWT_SECRET=<generate-random>
   JWT_REFRESH_SECRET=<generate-random>
   DATABASE_URL=<auto-filled>
   REDIS_URL=<auto-filled>
   ```

2. **Frontend Service → Environment**
   ```
   VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
   ```

## 7. Verification Checklist

- [ ] CI workflow runs on PR
- [ ] Tests pass
- [ ] PR preview deployed
- [ ] Branch protection enabled
- [ ] Can't merge without approval
- [ ] Can't merge with failing tests
- [ ] Deploy workflow runs on merge
- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Application accessible
- [ ] Environment variables configured
- [ ] Database connected
- [ ] Redis connected

## Common Issues

### ❌ "No status checks found"

**Solution:** Push a commit to trigger CI, then add status checks to branch protection

### ❌ "Tests failing in CI but pass locally"

**Solution:** Check environment variables in workflow file match local setup

### ❌ "Deployment failed"

**Solutions:**
1. Verify secrets are set correctly
2. Check platform status page
3. Review workflow logs
4. Ensure environment variables configured on platform

### ❌ "Preview deployment not working"

**Solutions:**
1. Verify Netlify token is valid
2. Check site ID is correct
3. Ensure build command works locally

## Next Steps

1. **Review Full Guide:** See `Documentation/CICD-GUIDE.md`
2. **Set Up Monitoring:** Configure error tracking (Sentry)
3. **Add More Tests:** Improve test coverage
4. **Configure Alerts:** Set up deployment notifications (Slack/Discord)
5. **Enable Dependabot:** Keep dependencies updated
6. **Add Code Scanning:** GitHub Advanced Security

## Getting Help

- Check workflow logs in GitHub Actions
- Review platform documentation
- Check platform status pages
- Open an issue in the repository

## Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
