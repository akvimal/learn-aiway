#!/bin/bash
#
# DigitalOcean App Platform Setup Script
#
# This script automates the setup of your app on DigitalOcean
#
# Prerequisites:
#   - doctl installed and authenticated
#   - GitHub repository configured
#
# Usage:
#   ./scripts/setup-digitalocean.sh
#

set -e

echo "🚀 DigitalOcean App Platform Setup"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}❌ doctl is not installed${NC}"
    echo "Please install doctl first:"
    echo "  - macOS: brew install doctl"
    echo "  - Linux: wget https://github.com/digitalocean/doctl/releases/download/v1.98.1/doctl-1.98.1-linux-amd64.tar.gz"
    echo "  - Windows: choco install doctl"
    exit 1
fi

# Check if authenticated
if ! doctl account get &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with DigitalOcean${NC}"
    echo "Please run: doctl auth init"
    exit 1
fi

echo -e "${GREEN}✅ doctl is installed and authenticated${NC}"
echo ""

# Get GitHub repository
echo "📝 Configuration"
echo "---------------"
read -p "Enter your GitHub repository (format: username/repo): " GITHUB_REPO
read -p "Enter region (default: nyc1): " REGION
REGION=${REGION:-nyc1}

echo ""
echo -e "${YELLOW}Creating DigitalOcean resources...${NC}"
echo ""

# 1. Create PostgreSQL Database
echo "1️⃣  Creating PostgreSQL database cluster..."
DB_CREATE=$(doctl databases create ai-learning-db \
  --engine pg \
  --version 16 \
  --region $REGION \
  --size db-s-1vcpu-1gb \
  --num-nodes 1 \
  --format ID \
  --no-header)

DB_ID=$(echo $DB_CREATE | awk '{print $1}')
echo -e "${GREEN}✅ Database cluster created: $DB_ID${NC}"

# Wait for database to be ready
echo "   Waiting for database to be ready (this takes 5-10 minutes)..."
while true; do
    DB_STATUS=$(doctl databases get $DB_ID --format Status --no-header)
    if [ "$DB_STATUS" = "online" ]; then
        break
    fi
    echo "   Status: $DB_STATUS - waiting..."
    sleep 30
done
echo -e "${GREEN}✅ Database is online${NC}"

# Create database
echo "   Creating database 'ai_learning'..."
doctl databases db create $DB_ID ai_learning
echo -e "${GREEN}✅ Database created${NC}"

# Get database connection
DB_URL=$(doctl databases connection $DB_ID --format URI --no-header)
echo "   Connection: $DB_URL"

echo ""

# 2. Create Redis Cluster
echo "2️⃣  Creating Redis cluster..."
REDIS_CREATE=$(doctl databases create ai-learning-redis \
  --engine redis \
  --version 7 \
  --region $REGION \
  --size db-s-1vcpu-1gb \
  --num-nodes 1 \
  --format ID \
  --no-header)

REDIS_ID=$(echo $REDIS_CREATE | awk '{print $1}')
echo -e "${GREEN}✅ Redis cluster created: $REDIS_ID${NC}"

# Wait for Redis to be ready
echo "   Waiting for Redis to be ready..."
while true; do
    REDIS_STATUS=$(doctl databases get $REDIS_ID --format Status --no-header)
    if [ "$REDIS_STATUS" = "online" ]; then
        break
    fi
    echo "   Status: $REDIS_STATUS - waiting..."
    sleep 30
done
echo -e "${GREEN}✅ Redis is online${NC}"

# Get Redis connection
REDIS_URL=$(doctl databases connection $REDIS_ID --format URI --no-header)
echo "   Connection: $REDIS_URL"

echo ""

# 3. Create Container Registry
echo "3️⃣  Creating container registry..."
REGISTRY_NAME="ai-learning"
doctl registry create $REGISTRY_NAME || echo "   Registry already exists"
echo -e "${GREEN}✅ Registry: $REGISTRY_NAME${NC}"

echo ""

# 4. Update app.yaml with GitHub repo
echo "4️⃣  Updating app.yaml configuration..."
sed -i.bak "s|YOUR_GITHUB_USERNAME/ai-learning|$GITHUB_REPO|g" .do/app.yaml
echo -e "${GREEN}✅ App spec updated${NC}"

echo ""

# 5. Create App
echo "5️⃣  Creating app on DigitalOcean..."
APP_CREATE=$(doctl apps create --spec .do/app.yaml --format ID --no-header)
APP_ID=$APP_CREATE
echo -e "${GREEN}✅ App created: $APP_ID${NC}"

# Wait for initial deployment
echo "   Waiting for initial deployment (this takes 5-10 minutes)..."
sleep 60

echo ""

# 6. Generate JWT Secrets
echo "6️⃣  Generating JWT secrets..."
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
echo -e "${GREEN}✅ Secrets generated${NC}"

echo ""

# 7. Display GitHub Secrets to add
echo "📋 GitHub Secrets to Add"
echo "========================"
echo ""
echo "Go to: https://github.com/$GITHUB_REPO/settings/secrets/actions"
echo ""
echo "Add these secrets:"
echo ""
echo -e "${YELLOW}DIGITALOCEAN_TOKEN${NC}"
echo "  Value: (your DigitalOcean API token)"
echo ""
echo -e "${YELLOW}REGISTRY_NAME${NC}"
echo "  Value: $REGISTRY_NAME"
echo ""
echo -e "${YELLOW}APP_ID${NC}"
echo "  Value: $APP_ID"
echo ""

echo "Add this variable:"
echo ""
echo -e "${YELLOW}DEPLOY_PLATFORM${NC}"
echo "  Value: digitalocean"
echo ""

# 8. Display App Environment Variables
echo "📋 App Environment Variables to Add"
echo "===================================="
echo ""
echo "Go to: https://cloud.digitalocean.com/apps/$APP_ID/settings"
echo ""
echo "Add these encrypted variables:"
echo ""
echo -e "${YELLOW}JWT_SECRET${NC}"
echo "  Value: $JWT_SECRET"
echo ""
echo -e "${YELLOW}JWT_REFRESH_SECRET${NC}"
echo "  Value: $JWT_REFRESH_SECRET"
echo ""

# 9. Get App URL
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
APP_URL=$(doctl apps get $APP_ID --format DefaultIngress --no-header)
echo "Your app will be available at: https://$APP_URL"
echo ""
echo "📝 Next Steps:"
echo "1. Add GitHub Secrets (see above)"
echo "2. Add App Environment Variables (see above)"
echo "3. Wait for deployment to complete"
echo "4. Visit your app!"
echo ""
echo "To check deployment status:"
echo "  doctl apps list-deployments $APP_ID"
echo ""
echo "To view logs:"
echo "  doctl apps logs $APP_ID --type run --follow"
echo ""

# Save configuration
cat > .do/setup-info.txt << EOF
DigitalOcean Setup Information
==============================

App ID: $APP_ID
Database ID: $DB_ID
Redis ID: $REDIS_ID
Registry: $REGISTRY_NAME
Region: $REGION

Database URL: $DB_URL
Redis URL: $REDIS_URL

JWT Secret: $JWT_SECRET
JWT Refresh Secret: $JWT_REFRESH_SECRET

App URL: https://$APP_URL

GitHub Repository: $GITHUB_REPO

Setup Date: $(date)
EOF

echo "Configuration saved to: .do/setup-info.txt"
echo ""
echo -e "${GREEN}✅ All done! Your app is deploying now.${NC}"
