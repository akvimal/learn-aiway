# CI/CD Pipeline Guide

Complete guide for setting up and using the CI/CD pipeline for the AI Learning Platform.

## Table of Contents

- [Overview](#overview)
- [Workflows](#workflows)
- [Setup Instructions](#setup-instructions)
- [Deployment Platforms](#deployment-platforms)
- [Branch Protection](#branch-protection)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

## Overview

The CI/CD pipeline automates:
- ✅ **Testing**: Runs unit and integration tests on every PR
- ✅ **Building**: Builds Docker images and validates configurations
- ✅ **Security**: Scans for vulnerabilities
- ✅ **Preview**: Deploys PR previews for testing
- ✅ **Deployment**: Automatically deploys to production on main branch
- ✅ **Notifications**: Comments on PRs and issues with deployment status

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`

**Jobs:**
1. **Backend Tests**
   - Sets up PostgreSQL and Redis
   - Runs linting
   - Executes unit tests
   - Generates coverage reports
   - Builds TypeScript

2. **Frontend Tests**
   - Runs linting
   - Executes tests
   - Builds production bundle
   - Uploads build artifacts

3. **Docker Build**
   - Tests Docker image builds
   - Validates Dockerfiles

4. **Status Check**
   - Verifies all tests passed
   - Comments on PR with results

### 2. Deployment Workflow (`.github/workflows/deploy.yml`)

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch
- Tags matching `v*`

**Jobs:**
1. **Deploy Backend** (DigitalOcean/Railway/Render/AWS/Heroku)
2. **Deploy Frontend** (Vercel/Netlify/AWS S3)
3. **Create Release** (on tags)
4. **Notify Deployment**

### 3. PR Preview Workflow (`.github/workflows/pr-preview.yml`)

**Triggers:**
- PR opened, synchronized, or reopened

**Jobs:**
1. **Deploy Preview**
   - Builds frontend with preview API URL
   - Deploys to Netlify preview
   - Comments preview URL on PR

2. **Lighthouse Check**
   - Runs performance audit
   - Reports metrics

## Setup Instructions

### Step 1: Configure GitHub Repository Settings

1. **Navigate to Repository Settings**
   ```
   GitHub Repository → Settings → Secrets and variables → Actions
   ```

2. **Add Required Secrets**

#### For DigitalOcean (Current Setup)
```bash
DIGITALOCEAN_TOKEN=dop_v1_xxxxx
REGISTRY_NAME=your-registry-name
APP_ID=your-app-id
```

#### For Railway
```bash
RAILWAY_TOKEN=your-railway-token
```

#### For Render
```bash
RENDER_API_KEY=your-render-api-key
RENDER_BACKEND_SERVICE_ID=srv-xxxxx
```

#### For Vercel (Frontend)
```bash
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=team_xxxxx
VERCEL_PROJECT_ID=prj_xxxxx
```

#### For Netlify (Frontend/Preview)
```bash
NETLIFY_AUTH_TOKEN=nfp_xxxxx
NETLIFY_SITE_ID=xxxxx-xxxxx-xxxxx
NETLIFY_PREVIEW_SITE_ID=xxxxx-xxxxx-xxxxx
```

#### For AWS
```bash
AWS_ACCESS_KEY_ID=AKIAxxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=us-east-1
ECS_CLUSTER=ai-learning-cluster
ECS_SERVICE=ai-learning-service
ECS_TASK_DEFINITION=ai-learning-task
AWS_S3_BUCKET=ai-learning-frontend
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
```

3. **Add Repository Variables**

```bash
DEPLOY_PLATFORM=digitalocean  # or railway, render, vercel, netlify, aws
PREVIEW_API_URL=https://api-preview.yourdomain.com/api/v1
```

### Step 2: Set Up Branch Protection Rules

1. **Navigate to Branch Settings**
   ```
   Repository → Settings → Branches → Branch protection rules
   ```

2. **Add Protection for `main` branch:**

   ✅ **Require a pull request before merging**
   - Require approvals: `1`
   - Dismiss stale PR approvals when new commits are pushed
   - Require review from Code Owners

   ✅ **Require status checks to pass before merging**
   - Require branches to be up to date before merging
   - Status checks that are required:
     - `Test Backend`
     - `Test Frontend`
     - `Build Docker Images`
     - `All Tests Passed`

   ✅ **Require conversation resolution before merging**

   ✅ **Require signed commits**

   ✅ **Require linear history**

   ✅ **Do not allow bypassing the above settings**

   ✅ **Restrict who can push to matching branches**
   - Add: `Repository admins` only

3. **Add Protection for `develop` branch:**
   - Same as `main` but with `0` required approvals
   - Allows faster iteration while still running tests

### Step 3: Configure Deployment Platform

#### Option A: DigitalOcean App Platform

1. **Create App on DigitalOcean:**
   ```bash
   doctl apps create --spec .do/app.yaml
   ```

2. **Get App ID:**
   ```bash
   doctl apps list
   ```

3. **Add to GitHub Secrets:**
   ```
   APP_ID=<your-app-id>
   ```

#### Option B: Railway

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Link Project:**
   ```bash
   railway login
   railway link
   ```

3. **Get Token:**
   ```bash
   railway tokens create
   ```

4. **Add to GitHub Secrets:**
   ```
   RAILWAY_TOKEN=<your-token>
   ```

#### Option C: Render

1. **Create Services on Render Dashboard**
   - Backend: Web Service
   - Frontend: Static Site
   - Database: PostgreSQL
   - Redis: Redis

2. **Get Service IDs from URL:**
   ```
   https://dashboard.render.com/web/srv-xxxxx
   ```

3. **Generate API Key:**
   ```
   Account Settings → API Keys → Create API Key
   ```

4. **Add to GitHub Secrets**

#### Option D: Vercel (Frontend Only)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Link Project:**
   ```bash
   cd frontend
   vercel link
   ```

3. **Get Project Details:**
   ```bash
   vercel project ls
   ```

4. **Generate Token:**
   ```
   Settings → Tokens → Create Token
   ```

#### Option E: AWS

1. **Create ECR Repositories:**
   ```bash
   aws ecr create-repository --repository-name ai-learning-backend
   aws ecr create-repository --repository-name ai-learning-frontend
   ```

2. **Create ECS Cluster:**
   ```bash
   aws ecs create-cluster --cluster-name ai-learning-cluster
   ```

3. **Create S3 Bucket (for frontend):**
   ```bash
   aws s3 mb s3://ai-learning-frontend
   ```

4. **Create IAM User with appropriate permissions and add credentials to GitHub Secrets**

### Step 4: Configure Environment Variables

Update deployment platform with required environment variables:

**Backend:**
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=<secure-random-string>
JWT_REFRESH_SECRET=<secure-random-string>
ALLOWED_ORIGINS=https://yourdomain.com
```

**Frontend:**
```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

## Development Workflow

### Creating a Feature

1. **Create feature branch:**
   ```bash
   git checkout -b feature/user-dashboard
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "Add user dashboard with analytics

   - Create dashboard component
   - Add analytics charts
   - Implement data fetching

   Closes #42"
   ```

3. **Push to GitHub:**
   ```bash
   git push origin feature/user-dashboard
   ```

4. **Create Pull Request:**
   - Go to GitHub
   - Click "Compare & pull request"
   - Fill in PR template
   - Link related issue: `Closes #42`
   - Request reviewers

5. **CI Runs Automatically:**
   - Backend tests
   - Frontend tests
   - Docker builds
   - Security scans
   - PR preview deployed
   - Results commented on PR

6. **Address Review Comments:**
   ```bash
   git add .
   git commit -m "Address review feedback"
   git push
   ```
   - CI runs again automatically

7. **Merge to Main:**
   - Click "Squash and merge" (recommended)
   - Or "Merge pull request"
   - Delete branch

8. **Automatic Deployment:**
   - Deploy workflow triggered
   - Backend deployed
   - Frontend deployed
   - Deployment status commented on issue #42

### Hotfix Workflow

1. **Create hotfix branch from main:**
   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/critical-bug
   ```

2. **Fix, test, and push:**
   ```bash
   git add .
   git commit -m "Fix critical authentication bug

   Fixes #99"
   git push origin hotfix/critical-bug
   ```

3. **Create PR to main:**
   - Mark as "Ready for review"
   - Add "hotfix" label
   - Request immediate review

4. **Fast-track approval and merge**

5. **Automatic deployment to production**

### Release Workflow

1. **Create release branch:**
   ```bash
   git checkout main
   git pull
   git checkout -b release/v1.0.0
   ```

2. **Update version numbers:**
   ```bash
   # Update package.json versions
   cd backend && npm version 1.0.0
   cd ../frontend && npm version 1.0.0
   ```

3. **Create tag:**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

4. **GitHub Release created automatically:**
   - Changelog generated
   - Artifacts attached
   - Related milestone closed

## Deployment Platforms Comparison

| Platform | Backend | Frontend | Database | Pros | Cons |
|----------|---------|----------|----------|------|------|
| **Railway** | ✅ | ✅ | ✅ | Easy setup, built-in DB | Limited free tier |
| **Render** | ✅ | ✅ | ✅ | Good free tier | Slower cold starts |
| **DigitalOcean** | ✅ | ✅ | ✅ | Full control | More configuration |
| **Vercel** | ❌ | ✅ | ❌ | Excellent DX | Frontend only |
| **Netlify** | ❌ | ✅ | ❌ | Great for static | Frontend only |
| **Heroku** | ✅ | ✅ | ✅ | Well-established | Expensive |
| **AWS** | ✅ | ✅ | ✅ | Scalable | Complex setup |

## Troubleshooting

### Tests Failing in CI

**Problem:** Tests pass locally but fail in CI

**Solutions:**
1. Check database connection:
   ```yaml
   DATABASE_URL: postgresql://postgres:postgres@localhost:5432/ai_learning_test
   ```

2. Ensure services are healthy:
   ```yaml
   options: >-
     --health-cmd pg_isready
     --health-interval 10s
   ```

3. Check environment variables are set

4. Run tests locally with same Node version:
   ```bash
   nvm use 20
   npm test
   ```

### Deployment Fails

**Problem:** Deployment workflow fails

**Solutions:**
1. Verify secrets are set correctly
2. Check platform status page
3. Review logs in GitHub Actions
4. Ensure environment variables are configured on platform

### Docker Build Issues

**Problem:** Docker build fails in CI

**Solutions:**
1. Test build locally:
   ```bash
   docker-compose build
   ```

2. Check Dockerfile syntax

3. Verify all dependencies are in package.json

4. Clear build cache:
   ```yaml
   cache-from: type=gha
   cache-to: type=gha,mode=max
   ```

### PR Preview Not Working

**Problem:** Preview deployment fails

**Solutions:**
1. Check Netlify token is valid
2. Verify site ID is correct
3. Ensure build command works locally
4. Check build logs in Netlify dashboard

## Best Practices

### Commit Messages

Follow Conventional Commits:
```
feat: add user dashboard
fix: resolve authentication bug
docs: update API documentation
test: add integration tests for auth
refactor: simplify user service
chore: update dependencies
```

### PR Descriptions

Use the PR template:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change

## How to Test
1. Step 1
2. Step 2

## Checklist
- [ ] Tests added
- [ ] Documentation updated
- [ ] No breaking changes
```

### Code Review

- Review within 24 hours
- Check for security issues
- Verify tests are comprehensive
- Ensure documentation is updated

### Testing

- Write tests for new features
- Maintain >80% code coverage
- Include integration tests
- Test edge cases

## Security

### Secrets Management

- Never commit secrets to git
- Use GitHub Secrets for CI/CD
- Rotate secrets regularly
- Use different secrets for staging/production

### Dependency Updates

- Enable Dependabot
- Review security advisories
- Test updates in staging first
- Keep dependencies up to date

## Monitoring

### Deployment Status

Check deployment status:
```bash
# Railway
railway status

# Render
render services list

# DigitalOcean
doctl apps list
```

### Logs

View application logs:
```bash
# Railway
railway logs

# Render
render logs <service-id>

# DigitalOcean
doctl apps logs <app-id>
```

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [DigitalOcean App Platform](https://docs.digitalocean.com/products/app-platform/)
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)

## Support

For issues with CI/CD:
1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Check platform status pages
4. Open an issue in the repository
