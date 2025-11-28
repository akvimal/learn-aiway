# Getting Started - AI-Assisted Learning Platform

This guide walks you through setting up the complete development environment with JIRA, GitHub, and Claude Code integration.

## Prerequisites

- [ ] JIRA account (create at https://www.atlassian.com/software/jira)
- [ ] GitHub account with repository created
- [ ] Node.js 18+ and npm installed
- [ ] Docker and Docker Compose installed
- [ ] Git installed
- [ ] Claude Code installed

## Step 1: Setup JIRA Project

### 1.1 Create JIRA Project

1. Go to JIRA and click **Create Project**
2. Select **Scrum** or **Kanban** template
3. Set project name: "AI-Assisted Learning Platform"
4. Set project key: **AILEARN**
5. Click **Create**

### 1.2 Configure Custom Fields (Optional)

If not already present, create these custom fields:

1. Go to **Project Settings → Fields**
2. Create custom field: "Acceptance Criteria" (Type: Paragraph)
3. Ensure "Story Points" field is available

### 1.3 Import Tickets

**Option A: CSV Import (Easiest)**

1. In JIRA, go to **Settings (⚙️) → System**
2. Click **External System Import** → **CSV**
3. Click **Select file** and upload `jira-tickets-import.csv`
4. Map columns:
   - Issue Type → Issue Type
   - Summary → Summary
   - Description → Description
   - Parent → Parent
   - Epic Name → Epic Name
   - Story Points → Story Points
   - Priority → Priority
   - Labels → Labels
5. Click **Begin Import**
6. Wait for completion (107+ tickets)

**Option B: API Import (Automated)**

```bash
# Navigate to scripts directory
cd scripts

# Install dependencies
npm install

# Configure .env in root directory
cd ..
cp .env.example .env

# Edit .env and add:
# JIRA_URL=https://your-domain.atlassian.net
# JIRA_USER=your-email@example.com
# JIRA_API_TOKEN=get-from-https://id.atlassian.com/manage-profile/security/api-tokens
# JIRA_PROJECT_KEY=AILEARN

# Run import
cd scripts
npm run import-jira
```

### 1.4 Verify Import

1. Go to your JIRA project
2. You should see 9 Epics in the backlog
3. Each Epic should have Stories and Tasks nested

## Step 2: Setup GitHub Repository

### 2.1 Create Repository

```bash
# If not already created
gh repo create ai-assisted-learn --public --clone
cd ai-assisted-learn

# Or clone existing
git clone https://github.com/your-org/ai-assisted-learn.git
cd ai-assisted-learn
```

### 2.2 Copy Project Files

All files have been created in `D:\workspace\ai-assited-learn\`:

```bash
# Files created:
# - README.md
# - GETTING-STARTED.md (this file)
# - jira-tickets-import.csv
# - jira-integration-guide.md
# - project-structure.md
# - scripts/import-to-jira.js
# - scripts/package.json

# These are ready to commit
```

### 2.3 Install JIRA-GitHub Integration

**Option 1: GitHub for JIRA App (Recommended)**

1. Go to https://github.com/marketplace/jira-software-github
2. Click **Install it for free**
3. Select your organization/account
4. Authorize the app
5. In JIRA, go to **Project Settings → GitHub**
6. Connect your repository

**Option 2: Manual Integration via GitHub Actions**

This is already configured in `.github/workflows/jira-integration.yml` (you'll create this in Step 4).

### 2.4 Setup GitHub Secrets

1. Go to **Repository Settings → Secrets and variables → Actions**
2. Add these secrets:
   - `JIRA_URL`: Your JIRA URL (e.g., https://your-domain.atlassian.net)
   - `JIRA_AUTH`: Base64 encoded `email:api_token` (generate below)
   - `JIRA_PROJECT_KEY`: AILEARN

Generate JIRA_AUTH:

```bash
# In terminal
echo -n "your-email@example.com:your-api-token" | base64
```

## Step 3: Setup Development Environment

### 3.1 Environment Variables

```bash
# Create root .env
cp .env.example .env

# Edit .env with your credentials:
# JIRA_URL=https://your-domain.atlassian.net
# JIRA_USER=your-email@example.com
# JIRA_API_TOKEN=your-api-token
# JIRA_PROJECT_KEY=AILEARN
# GITHUB_TOKEN=ghp_your_token
```

### 3.2 Create Project Structure

```bash
# Create directories
mkdir -p backend/src frontend .github/workflows .claude/commands .claude/scripts docs

# Create backend structure
mkdir -p backend/src/{api,services,models,config,utils}
mkdir -p backend/src/api/{routes,controllers,middleware}

# Create frontend structure
mkdir -p frontend/src/{components,pages,services,store,hooks}
```

### 3.3 Initialize Backend

```bash
cd backend

# Initialize package.json
npm init -y

# Install dependencies
npm install express typescript ts-node @types/node @types/express
npm install jsonwebtoken bcrypt dotenv pg redis cors
npm install @anthropic-ai/sdk openai
npm install -D @types/bcrypt @types/jsonwebtoken jest ts-jest

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create .env.example
cat > .env.example << 'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_learning
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d

# AI Provider API Keys (configured by users in the app)
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
EOF

cd ..
```

### 3.4 Initialize Frontend

```bash
# Create React app with Vite
npm create vite@latest frontend -- --template react-ts

cd frontend

# Install dependencies
npm install
npm install @reduxjs/toolkit react-redux react-router-dom axios
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Configure Tailwind
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Update src/index.css
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

cd ..
```

### 3.5 Setup Docker Development Environment

```bash
# Create docker-compose.dev.yml
cat > docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ai_learning
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
EOF

# Start services
docker-compose -f docker-compose.dev.yml up -d
```

## Step 4: Setup Claude Code Integration

### 4.1 Create Claude Commands

```bash
mkdir -p .claude/commands .claude/scripts

# Create jira-start command
cat > .claude/commands/jira-start.md << 'EOF'
Fetch JIRA ticket {{ arg }} and prepare for development.

Steps:
1. Run the script to fetch ticket details: `bash .claude/scripts/fetch-jira-ticket.sh {{ arg }}`
2. Parse and display the ticket information (summary, description, acceptance criteria)
3. Create a feature branch named: `feature/{{ arg }}-description` (use the summary to create a short description)
4. Create a todo list based on the acceptance criteria
5. Ask me if you should proceed with implementation

After completion, show me the ticket details and ask if I want to start working on it.
EOF

# Create jira-pr command
cat > .claude/commands/jira-pr.md << 'EOF'
Create a pull request for JIRA ticket {{ arg }}.

Steps:
1. Fetch the ticket details using: `bash .claude/scripts/fetch-jira-ticket.sh {{ arg }}`
2. Get the current branch name
3. Ensure all changes are committed
4. Push the current branch if needed
5. Create a PR with:
   - Title: [{{ arg }}] Summary from JIRA
   - Body including:
     - Link to JIRA ticket
     - Summary of changes from commits
     - Acceptance criteria as checklist
     - Test plan
6. After creating the PR, update JIRA status to "In Review" using: `bash .claude/scripts/update-jira-status.sh {{ arg }} "In Review"`
EOF

# Create fetch ticket script
cat > .claude/scripts/fetch-jira-ticket.sh << 'EOF'
#!/bin/bash
TICKET_KEY=$1

if [ -z "$TICKET_KEY" ]; then
  echo "Usage: fetch-jira-ticket.sh <TICKET_KEY>"
  exit 1
fi

# Load environment variables
source .env 2>/dev/null || true

if [ -z "$JIRA_URL" ] || [ -z "$JIRA_USER" ] || [ -z "$JIRA_API_TOKEN" ]; then
  echo "Error: Missing JIRA credentials in .env"
  exit 1
fi

JIRA_AUTH=$(echo -n "${JIRA_USER}:${JIRA_API_TOKEN}" | base64)

curl -s -X GET \
  -H "Authorization: Basic ${JIRA_AUTH}" \
  -H "Content-Type: application/json" \
  "${JIRA_URL}/rest/api/3/issue/${TICKET_KEY}?fields=summary,description,labels,status,issuetype,priority" \
  | jq '{
    key: .key,
    type: .fields.issuetype.name,
    summary: .fields.summary,
    description: (.fields.description.content[0].content[0].text // "No description"),
    status: .fields.status.name,
    priority: .fields.priority.name,
    labels: .fields.labels
  }'
EOF

# Create update status script
cat > .claude/scripts/update-jira-status.sh << 'EOF'
#!/bin/bash
TICKET_KEY=$1
STATUS=$2

if [ -z "$TICKET_KEY" ] || [ -z "$STATUS" ]; then
  echo "Usage: update-jira-status.sh <TICKET_KEY> <STATUS>"
  exit 1
fi

source .env 2>/dev/null || true

if [ -z "$JIRA_URL" ] || [ -z "$JIRA_USER" ] || [ -z "$JIRA_API_TOKEN" ]; then
  echo "Error: Missing JIRA credentials in .env"
  exit 1
fi

JIRA_AUTH=$(echo -n "${JIRA_USER}:${JIRA_API_TOKEN}" | base64)

# Get available transitions
TRANSITIONS=$(curl -s -X GET \
  -H "Authorization: Basic ${JIRA_AUTH}" \
  "${JIRA_URL}/rest/api/3/issue/${TICKET_KEY}/transitions")

# Find transition ID for the status
TRANSITION_ID=$(echo "$TRANSITIONS" | jq -r ".transitions[] | select(.name == \"${STATUS}\") | .id")

if [ -z "$TRANSITION_ID" ]; then
  echo "Error: Could not find transition to '${STATUS}'"
  echo "Available transitions:"
  echo "$TRANSITIONS" | jq -r '.transitions[] | "- \(.name)"'
  exit 1
fi

# Execute transition
curl -s -X POST \
  -H "Authorization: Basic ${JIRA_AUTH}" \
  -H "Content-Type: application/json" \
  "${JIRA_URL}/rest/api/3/issue/${TICKET_KEY}/transitions" \
  -d "{\"transition\": {\"id\": \"${TRANSITION_ID}\"}}"

echo "✓ Updated ${TICKET_KEY} to '${STATUS}'"
EOF

# Make scripts executable
chmod +x .claude/scripts/*.sh
```

### 4.2 Create GitHub Workflows

```bash
mkdir -p .github/workflows

# Create JIRA integration workflow
cat > .github/workflows/jira-integration.yml << 'EOF'
name: JIRA Integration

on:
  pull_request:
    types: [opened, reopened, closed]

jobs:
  update-jira:
    runs-on: ubuntu-latest
    steps:
      - name: Extract JIRA Issue Key
        id: jira-key
        run: |
          BRANCH="${{ github.head_ref }}"
          KEY=$(echo "$BRANCH" | grep -oE '[A-Z]+-[0-9]+' || echo "")
          echo "key=$KEY" >> $GITHUB_OUTPUT

      - name: Transition JIRA Issue
        if: steps.jira-key.outputs.key != ''
        run: |
          STATUS="In Progress"
          if [[ "${{ github.event.action }}" == "opened" ]] || [[ "${{ github.event.action }}" == "reopened" ]]; then
            STATUS="In Review"
          elif [[ "${{ github.event.action }}" == "closed" ]] && [[ "${{ github.event.pull_request.merged }}" == "true" ]]; then
            STATUS="Done"
          fi

          # Get available transitions
          TRANSITIONS=$(curl -s -X GET \
            -H "Authorization: Basic ${{ secrets.JIRA_AUTH }}" \
            "${{ secrets.JIRA_URL }}/rest/api/3/issue/${{ steps.jira-key.outputs.key }}/transitions")

          # Find transition ID
          TRANSITION_ID=$(echo "$TRANSITIONS" | jq -r ".transitions[] | select(.name == \"${STATUS}\") | .id")

          if [ -n "$TRANSITION_ID" ]; then
            curl -X POST \
              -H "Authorization: Basic ${{ secrets.JIRA_AUTH }}" \
              -H "Content-Type: application/json" \
              "${{ secrets.JIRA_URL }}/rest/api/3/issue/${{ steps.jira-key.outputs.key }}/transitions" \
              -d "{\"transition\": {\"id\": \"${TRANSITION_ID}\"}}"
            echo "Updated ${{ steps.jira-key.outputs.key }} to ${STATUS}"
          fi

      - name: Add PR Link to JIRA
        if: steps.jira-key.outputs.key != '' && github.event.action == 'opened'
        run: |
          curl -X POST \
            -H "Authorization: Basic ${{ secrets.JIRA_AUTH }}" \
            -H "Content-Type: application/json" \
            "${{ secrets.JIRA_URL }}/rest/api/3/issue/${{ steps.jira-key.outputs.key }}/remotelink" \
            -d "{
              \"object\": {
                \"url\": \"${{ github.event.pull_request.html_url }}\",
                \"title\": \"PR #${{ github.event.pull_request.number }}: ${{ github.event.pull_request.title }}\",
                \"icon\": {
                  \"url16x16\": \"https://github.com/favicon.ico\"
                }
              }
            }"
EOF

# Create CI workflow
cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Backend Dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run Backend Tests
        working-directory: ./backend
        run: npm test

      - name: Install Frontend Dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run Frontend Tests
        working-directory: ./frontend
        run: npm test
EOF
```

## Step 5: First Commit and Push

```bash
# Initialize git if not already
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
frontend/node_modules/
backend/node_modules/
scripts/node_modules/

# Environment variables
.env
.env.local
.env.*.local

# Build outputs
backend/dist/
frontend/dist/
frontend/build/

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
coverage/

# Docker
docker-compose.override.yml
EOF

# Stage all files
git add .

# First commit
git commit -m "Initial project setup with JIRA integration

- Added JIRA ticket import CSV (107+ tickets)
- Created JIRA-Claude-GitHub integration
- Setup project structure
- Added documentation
- Created Claude Code commands for JIRA workflow

AILEARN-1: Setup project infrastructure"

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 6: Start Your First Ticket

```bash
# In Claude Code, start your first ticket
/jira-start AILEARN-1

# Claude will:
# 1. Fetch the ticket details
# 2. Create a feature branch
# 3. Show you the requirements
# 4. Create a todo list
# 5. Ask if you want to proceed

# Then work with Claude to implement the ticket!
```

## Complete Workflow Example

```bash
# 1. Start a ticket
/jira-start AILEARN-15

# 2. Claude creates branch: feature/AILEARN-15-implement-jwt-token-generation
# 3. Claude shows you the ticket and creates todos
# 4. You say "yes, let's implement this"
# 5. Claude implements based on acceptance criteria
# 6. Claude marks todos as complete

# 7. Create a PR
/jira-pr AILEARN-15

# 8. GitHub Actions automatically:
#    - Updates JIRA status to "In Review"
#    - Adds PR link to JIRA ticket

# 9. After review and merge:
#    - GitHub Actions updates JIRA to "Done"
#    - Ticket is complete!
```

## Verification Checklist

Before starting development, verify:

- [ ] JIRA project created with key "AILEARN"
- [ ] All 107+ tickets imported successfully
- [ ] GitHub repository created and pushed
- [ ] GitHub-JIRA integration active (app or Actions)
- [ ] GitHub secrets configured (JIRA_URL, JIRA_AUTH, JIRA_PROJECT_KEY)
- [ ] Root `.env` file configured with JIRA credentials
- [ ] Backend initialized with dependencies
- [ ] Frontend initialized with Vite + React
- [ ] Docker services running (postgres, redis)
- [ ] Claude commands created (`.claude/commands/`)
- [ ] JIRA scripts created and executable
- [ ] First commit pushed to GitHub
- [ ] `/jira-start AILEARN-1` command works

## Next Steps

1. **Read the documentation**:
   - `README.md` - Project overview
   - `jira-integration-guide.md` - Detailed integration guide
   - `project-structure.md` - Architecture and structure

2. **Start with MVP tickets**:
   - AILEARN-1: Development Environment Setup
   - AILEARN-2: Setup authentication database schema
   - AILEARN-3: Implement JWT token generation

3. **Follow the workflow**:
   - Use `/jira-start <ticket-key>` to begin
   - Develop with Claude
   - Use `/jira-pr <ticket-key>` to create PRs
   - Review, merge, and move to next ticket

## Troubleshooting

### JIRA Import Failed
- Ensure all required fields exist in your JIRA project
- Check that custom fields are configured
- Try CSV import if API fails

### GitHub Actions Not Updating JIRA
- Verify secrets are set correctly
- Check that JIRA_AUTH is base64 encoded
- Ensure branch name includes ticket key

### Docker Services Won't Start
- Check if ports 5432 and 6379 are available
- Run `docker-compose -f docker-compose.dev.yml logs`
- Try `docker-compose down -v` then `up -d` again

### Claude Commands Not Working
- Ensure scripts are executable: `chmod +x .claude/scripts/*.sh`
- Check that `.env` file exists in root with JIRA credentials
- Verify JIRA credentials with: `bash .claude/scripts/fetch-jira-ticket.sh AILEARN-1`

## Support

If you encounter issues:

1. Check the detailed guides in the docs
2. Review JIRA and GitHub integration settings
3. Verify all environment variables are set
4. Check Docker logs for database issues

---

**You're all set!** Start with `/jira-start AILEARN-1` and build your AI-powered learning platform! 🚀
