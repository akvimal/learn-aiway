# Quick Start: GitHub-Native Workflow

Get started with your AI Learning Platform using GitHub Issues and Projects in under 10 minutes.

## Prerequisites

- [ ] GitHub account
- [ ] Git installed
- [ ] Node.js 18+ installed

## Step 1: Install GitHub CLI (2 minutes)

```bash
# Windows (PowerShell or Command Prompt)
winget install --id GitHub.cli

# After installation, restart your terminal

# Authenticate
gh auth login
```

**Detailed Instructions**: See `INSTALL-GITHUB-CLI.md` for troubleshooting and alternative methods.

**Verify Installation**:
```bash
gh --version
gh auth status
```

## Step 2: Setup Repository (2 minutes)

```bash
# If you haven't pushed the code yet
cd d:\workspace\ai-assited-learn
git init
gh repo create ai-assisted-learn --public --source=. --remote=origin --push
```

## Step 3: Create Issues (3 minutes)

```bash
# Navigate to scripts
cd scripts

# Install dependencies
npm install

# Preview (optional)
npm run create-issues:dry-run

# Create all 107+ issues
npm run create-issues
```

This creates:
- 9 Epics (major features)
- 33 Stories (user-facing functionality)
- 65+ Tasks (implementation work)

## Step 4: Setup Project Board (2 minutes)

```bash
# Use Claude command
/gh-project-setup

# Or manually
gh project create --title "AI Learning Platform" --owner @me
```

**Save the project URL:**
1. Go to **Repo Settings → Secrets and variables → Actions → Variables**
2. Add: `PROJECT_URL` = (your project URL)

## Step 5: Start Your First Issue (1 minute)

```bash
# Use Claude command to start work
/gh-start 1
```

This will:
- ✅ Fetch issue #1 details
- ✅ Create branch: `feature/1-description`
- ✅ Show acceptance criteria
- ✅ Create todo list
- ✅ Ask if you want to proceed

---

## Daily Workflow

### 1. Start Work
```bash
/gh-start 123
```

### 2. Develop
- Claude helps you implement
- Tracks progress with todos

### 3. Commit
```bash
git add .
git commit -m "feat: implement feature\n\nCloses #123"
```

### 4. Create PR
```bash
/gh-pr
```

### 5. Merge
- Review on GitHub
- Merge PR
- Issue auto-closes
- Deploys automatically

---

## Claude Commands Cheat Sheet

| Command | Purpose |
|---------|---------|
| `/gh-start 123` | Start working on issue #123 |
| `/gh-pr` | Create pull request |
| `/gh-status` | Show current status |
| `/gh-issue` | Create new issue |
| `/gh-review 45` | Review PR #45 |

---

## What You Get

### ✅ Automatic Issue Management
- 107+ pre-created issues
- Proper labels and hierarchy
- Parent-child relationships

### ✅ Project Board
- Table, Board, and Roadmap views
- Custom fields (Status, Priority, Points)
- Automatic updates

### ✅ GitHub Actions
- **CI**: Auto-test on every PR
- **CD**: Auto-deploy to DigitalOcean
- **Automation**: Auto-link issues, update status

### ✅ Claude Integration
- Simple commands with `gh` CLI
- Automatic branch creation
- Smart PR generation
- Progress tracking

---

## Cost Comparison

### JIRA Approach
- JIRA: $0-58.75/month (5 users)
- GitHub: $20/month
- Setup: 2-4 hours
- **Total: $20-78.75/month**

### GitHub Approach (This Setup)
- GitHub: $20/month
- Setup: 10 minutes
- **Total: $20/month**

**Savings: $0-58.75/month + 2-4 hours of setup time**

---

## Next Steps

1. ✅ **Installed GitHub CLI**
2. ✅ **Created repository**
3. ✅ **Imported 107+ issues**
4. ✅ **Setup project board**
5. ⬜ **Start first issue**: `/gh-start 1`
6. ⬜ **Setup DigitalOcean** (when ready to deploy)
7. ⬜ **Invite team members** (if working with others)

---

## Need Help?

- **Detailed Guide**: See `GITHUB-WORKFLOW-GUIDE.md`
- **Comparison**: See `JIRA-vs-GITHUB-COMPARISON.md`
- **Commands**: All commands in `.claude/commands/`
- **Templates**: Issue templates in `.github/ISSUE_TEMPLATE/`

---

## File Structure Created

```
ai-assisted-learn/
├── .github/
│   ├── ISSUE_TEMPLATE/          # Issue templates (Epic, Story, Task, Bug)
│   ├── PULL_REQUEST_TEMPLATE.md # PR template
│   └── workflows/               # GitHub Actions
│       ├── ci.yml              # Test and build
│       ├── deploy.yml          # Deploy to DigitalOcean
│       └── project-automation.yml # Auto-link issues
│
├── .claude/
│   └── commands/               # Claude commands for GitHub workflow
│       ├── gh-start.md         # Start working on issue
│       ├── gh-pr.md            # Create pull request
│       ├── gh-status.md        # Show status
│       ├── gh-issue.md         # Create issue
│       ├── gh-review.md        # Review PR
│       └── gh-project-setup.md # Setup project board
│
├── scripts/
│   ├── create-github-issues.js # Import issues from CSV
│   └── package.json
│
├── jira-tickets-import.csv     # Source data for issues
├── GITHUB-WORKFLOW-GUIDE.md    # Complete workflow guide
├── QUICK-START-GITHUB.md       # This file
└── JIRA-vs-GITHUB-COMPARISON.md # Detailed comparison
```

---

## Summary

You now have:
- ✅ 107+ issues ready to work on
- ✅ GitHub Project board for tracking
- ✅ Automated CI/CD pipelines
- ✅ Claude commands for easy workflow
- ✅ Issue and PR templates
- ✅ Complete documentation

**Time to start building!** Run `/gh-start 1` and begin developing your AI-powered learning platform! 🚀
