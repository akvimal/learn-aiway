# GitHub-Native Workflow Guide

Complete guide for managing your AI Learning Platform project using GitHub Issues, Projects, and Actions.

## Quick Start

### 1. Install GitHub CLI

```bash
# Windows (winget)
winget install --id GitHub.cli

# Or download from: https://cli.github.com/

# Verify installation
gh --version

# Authenticate
gh auth login
```

### 2. Setup Repository

```bash
# Clone or initialize repository
git clone https://github.com/your-username/ai-assisted-learn.git
cd ai-assisted-learn

# Or if starting fresh
git init
gh repo create ai-assisted-learn --public --source=. --remote=origin
```

### 3. Create Issues from CSV

```bash
# Navigate to scripts directory
cd scripts

# Install dependencies
npm install

# Preview what will be created (dry run)
npm run create-issues:dry-run

# Create all issues
npm run create-issues
```

This will create 107+ issues organized with proper labels and parent-child relationships.

### 4. Setup GitHub Project

```bash
# Use Claude command
/gh-project-setup

# Or manually
gh project create --title "AI Learning Platform" --owner @me
```

### 5. Configure Repository Variables

1. Go to **Repository Settings → Secrets and variables → Actions → Variables**
2. Add variable: `PROJECT_URL` = `https://github.com/users/your-username/projects/X`

---

## Daily Workflow

### Starting Work on an Issue

```bash
# Option 1: Use Claude command
/gh-start 123

# Option 2: Manual with gh CLI
gh issue develop 123 --checkout

# This will:
# - Create a branch: feature/123-issue-title
# - Checkout the branch
# - Show issue details
```

### While Developing

```bash
# Check current status
/gh-status

# Or manually
gh issue view 123
git status
```

### Committing Changes

```bash
# Stage changes
git add .

# Commit with issue reference
git commit -m "feat: implement user authentication

- Add JWT token generation
- Create auth middleware
- Add login endpoint

Closes #123"
```

### Creating a Pull Request

```bash
# Option 1: Use Claude command
/gh-pr 123

# Option 2: Manual
git push -u origin feature/123-user-auth
gh pr create --fill

# Option 3: Interactive
gh pr create
```

### Reviewing Pull Requests

```bash
# Use Claude command
/gh-review 45

# Or manually
gh pr view 45
gh pr diff 45
gh pr checkout 45  # Test locally
gh pr review 45 --approve
```

### Merging Pull Request

```bash
# From GitHub CLI
gh pr merge 45 --squash --delete-branch

# Or use GitHub web interface
# GitHub Actions will:
# - Close linked issues
# - Update project status
# - Add deployment comments
```

---

## Claude Commands Reference

### `/gh-start <issue-number>`
Start working on an issue
- Fetches issue details
- Creates feature branch
- Creates todo list from acceptance criteria
- Assigns issue to you

**Example:**
```bash
/gh-start 123
```

### `/gh-pr [issue-number]`
Create pull request for current work
- Detects issue from branch name or uses provided number
- Formats PR with issue details
- Links PR to issue
- Pushes branch if needed

**Example:**
```bash
/gh-pr 123
# or just
/gh-pr
```

### `/gh-issue [title]`
Create a new issue
- Opens web interface with templates (no title)
- Quick create with title (if provided)

**Example:**
```bash
/gh-issue
# or
/gh-issue Add password reset feature
```

### `/gh-status`
Show current project status
- Git status
- Current issue progress
- Assigned issues
- PR status
- Suggestions for next steps

**Example:**
```bash
/gh-status
```

### `/gh-project-setup`
Setup GitHub Project board
- Creates project
- Configures automation
- Explains customization options

**Example:**
```bash
/gh-project-setup
```

### `/gh-review <pr-number>`
Review a pull request
- Fetches PR details
- Shows diff
- Helps analyze code
- Submits review

**Example:**
```bash
/gh-review 45
```

---

## GitHub Actions Workflows

### CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`

**Jobs:**
- ✅ Test Backend (with PostgreSQL & Redis)
- ✅ Test Frontend
- ✅ Build Docker images
- ✅ Comment test results on PR

### Project Automation (`.github/workflows/project-automation.yml`)

**Triggers:**
- Issue opened/reopened/closed
- PR opened/reopened/closed

**Jobs:**
- ✅ Auto-add issues/PRs to project
- ✅ Auto-label issues
- ✅ Link child issues to parents
- ✅ Close linked issues on PR merge

### Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers:**
- Push to `main`
- Tag push (`v*`)
- Manual trigger

**Jobs:**
- ✅ Build and push Docker images to DigitalOcean Registry
- ✅ Deploy to DigitalOcean App Platform
- ✅ Comment deployment URL on related issues
- ✅ Create GitHub Release (on tag)

---

## Issue Templates

### Creating Issues via Web UI

1. Go to **Issues → New Issue**
2. Select template:
   - **Epic**: Major feature or initiative
   - **User Story**: User-facing functionality
   - **Task**: Implementation work
   - **Bug Report**: Report bugs

### Template Fields

**Epic Template:**
- Epic Title
- Description
- Goals and Objectives
- Scope (in/out)
- Success Criteria
- Priority
- Implementation Phase
- Technical Considerations

**Story Template:**
- Story Title
- User Story (As a... I want... So that...)
- Description
- Acceptance Criteria
- Parent Epic (#)
- Priority
- Story Points
- Components
- Technical Notes
- Test Scenarios

**Task Template:**
- Task Title
- Description
- Implementation Details
- Acceptance Criteria
- Parent Story (#)
- Priority
- Task Type (labels)
- Technical Notes
- Dependencies

**Bug Template:**
- Bug Description
- Expected Behavior
- Actual Behavior
- Steps to Reproduce
- Error Messages/Logs
- Severity
- Environment
- Additional Context

---

## Project Board Management

### Views

**Table View:**
- Spreadsheet-like interface
- Sort and filter by any field
- Bulk edit capabilities
- Add custom fields

**Board View:**
- Kanban-style columns
- Drag and drop issues
- Group by status, assignee, labels
- Quick status updates

**Roadmap View:**
- Timeline visualization
- Set start and end dates
- Track milestones
- Epic progress tracking

### Custom Fields

Add these custom fields to your project:

1. **Status** (Single Select)
   - Todo
   - In Progress
   - In Review
   - Done

2. **Priority** (Single Select)
   - High
   - Medium
   - Low

3. **Story Points** (Number)
   - Fibonacci: 1, 2, 3, 5, 8, 13

4. **Sprint** (Text)
   - Sprint 1, Sprint 2, etc.

5. **Epic** (Text)
   - Epic name for grouping

6. **Phase** (Single Select)
   - Phase 1 - MVP
   - Phase 2 - Enhanced
   - Phase 3 - Advanced
   - Phase 4 - Polish

### Automation

GitHub Projects supports built-in automation:

1. **Auto-add to project**
   - New issues → Added to project
   - New PRs → Added to project

2. **Auto-set status**
   - PR opened → Status: In Review
   - PR merged → Status: Done
   - PR closed (not merged) → Status: Todo

3. **Auto-archive**
   - Closed issues → Archived after 30 days

---

## Branch Naming Convention

### Format

```
<type>/<issue-number>-<short-description>

Examples:
feature/123-user-authentication
bugfix/456-fix-login-error
epic/789-ai-integration
hotfix/101-security-patch
```

### Types

- `feature/` - New features
- `bugfix/` - Bug fixes
- `epic/` - Epic-level work
- `hotfix/` - Urgent production fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates

### Automated by `/gh-start`

The Claude command automatically creates properly named branches based on issue type and title.

---

## Commit Message Convention

### Format

```
<type>: <subject>

<body>

<footer>
```

### Example

```
feat: implement JWT authentication

- Add JWT token generation service
- Create auth middleware for protected routes
- Implement token refresh mechanism
- Add token expiration handling

Closes #123
Co-authored-by: Claude <noreply@anthropic.com>
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style (formatting)
- `refactor:` - Code refactoring
- `test:` - Add/update tests
- `chore:` - Maintenance tasks

### Footer Keywords

- `Closes #123` - Closes issue
- `Fixes #123` - Fixes issue
- `Resolves #123` - Resolves issue
- `Related to #123` - Related but doesn't close

---

## Deployment to DigitalOcean

### Setup

1. **Create DigitalOcean Account**
   - Sign up at https://www.digitalocean.com

2. **Generate API Token**
   - Go to **API → Tokens/Keys**
   - Generate new token with read/write permissions

3. **Create Container Registry**
   - Go to **Container Registry**
   - Create registry (e.g., `my-registry`)

4. **Create App Platform App**
   - Go to **Apps**
   - Create new app from Docker Hub (temporary)
   - Note the App ID

5. **Add GitHub Secrets**
   - Go to **Repository Settings → Secrets and variables → Actions → Secrets**
   - Add secrets:
     - `DIGITALOCEAN_TOKEN`: Your API token
     - `REGISTRY_NAME`: Your registry name
     - `APP_ID`: Your App Platform app ID

### Deploy

```bash
# Automatic on push to main
git push origin main

# Manual trigger
gh workflow run deploy.yml

# Deploy to staging
gh workflow run deploy.yml -f environment=staging

# Deploy to production
gh workflow run deploy.yml -f environment=production
```

### Monitor Deployment

```bash
# View workflow runs
gh run list

# Watch specific run
gh run watch

# View logs
gh run view <run-id> --log
```

---

## Tips and Best Practices

### 1. Keep Issues Small

Break large features into smaller, manageable issues:
```
❌ Bad: "Implement entire authentication system" (too big)
✅ Good: "Setup user database schema" (focused)
✅ Good: "Create JWT service" (specific)
✅ Good: "Build login API endpoint" (clear)
```

### 2. Write Clear Acceptance Criteria

```
❌ Bad: "Make it work"
✅ Good:
- [ ] User can register with email and password
- [ ] Email validation is performed
- [ ] JWT token is generated on successful login
- [ ] Invalid credentials show error message
```

### 3. Link Related Issues

Use references to connect work:
```markdown
- Part of #123 (Epic)
- Depends on #124
- Related to #125
- Blocks #126
```

### 4. Update Issue Status

Keep your team informed:
```bash
# Add progress comments
gh issue comment 123 --body "50% complete - login endpoint done"

# Update labels
gh issue edit 123 --add-label "in-progress"
```

### 5. Review Your Own PRs

Before requesting review:
```bash
# View your changes
gh pr diff

# Check for issues
npm run lint
npm test

# Test locally
npm start
```

### 6. Use Draft PRs

For work-in-progress:
```bash
gh pr create --draft --title "WIP: Add authentication"
```

### 7. Close Stale Issues

Regularly clean up:
```bash
# List old open issues
gh issue list --state open --json number,title,createdAt

# Close with reason
gh issue close 123 --comment "No longer needed"
```

---

## Troubleshooting

### Issue: gh CLI not authenticated

```bash
# Re-authenticate
gh auth login

# Check status
gh auth status
```

### Issue: Can't create branch from issue

```bash
# Make sure you're on main/develop
git checkout main
git pull

# Then use /gh-start or
gh issue develop 123 --checkout
```

### Issue: PR not linking to issue

Make sure commit message or PR body contains:
```
Closes #123
```

### Issue: GitHub Actions not running

1. Check workflow file syntax
2. Verify secrets are set
3. Check workflow permissions in repo settings

### Issue: Can't push to branch

```bash
# Set upstream
git push -u origin <branch-name>

# Or force push (careful!)
git push --force-with-lease
```

---

## Quick Reference Card

### Most Used Commands

```bash
# Start work
/gh-start 123

# Check status
/gh-status

# Commit
git add .
git commit -m "feat: description\n\nCloses #123"

# Create PR
/gh-pr

# Review PR
/gh-review 45

# Merge PR
gh pr merge 45 --squash --delete-branch
```

### Most Used gh Commands

```bash
gh issue list                    # List issues
gh issue view 123                # View issue
gh issue create                  # Create issue
gh pr list                       # List PRs
gh pr view 45                    # View PR
gh pr create                     # Create PR
gh pr checkout 45                # Checkout PR
gh pr review 45 --approve        # Approve PR
gh pr merge 45                   # Merge PR
gh run list                      # List workflows
gh run watch                     # Watch workflow
```

---

## Additional Resources

- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GitHub Projects Guide](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [DigitalOcean App Platform](https://docs.digitalocean.com/products/app-platform/)

---

**Ready to start?** Run `/gh-project-setup` to initialize your project, then `/gh-start 1` to begin work on your first issue!
