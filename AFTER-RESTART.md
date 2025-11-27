# After Restarting Your Terminal

Welcome back! Here's what to do now that you've restarted your terminal.

## Step 1: Verify GitHub CLI Works (10 seconds)

```bash
gh --version
```

Expected output:
```
gh version 2.83.1 (2025-11-13)
https://github.com/cli/cli/releases/tag/v2.83.1
```

✅ **If you see this**, GitHub CLI is working! Continue below.

❌ **If you still get "gh not found"**, see troubleshooting at bottom.

---

## Step 2: Authenticate with GitHub (2 minutes)

```bash
gh auth login
```

**Answer the prompts:**
1. **What account do you want to log into?** → `GitHub.com` (press Enter)
2. **What is your preferred protocol?** → `HTTPS` (press Enter)
3. **Authenticate Git with your GitHub credentials?** → `Yes` (press Enter)
4. **How would you like to authenticate?** → `Login with a web browser` (press Enter)
5. **Copy the one-time code** shown (8 characters like: `1234-5678`)
6. **Press Enter** to open browser
7. **Paste the code** in browser and authorize
8. **Return to terminal** - you should see "✓ Authentication complete"

**Verify authentication:**
```bash
gh auth status
```

Expected output:
```
✓ Logged in to github.com as YOUR-USERNAME
✓ Git operations for github.com configured to use https protocol.
```

---

## Step 3: Navigate to Project (5 seconds)

```bash
cd d:\workspace\ai-assited-learn\scripts
```

---

## Step 4: Verify Complete Setup (10 seconds)

```bash
npm run verify
```

This checks:
- ✅ Node.js installed
- ✅ npm installed
- ✅ Git installed
- ✅ GitHub CLI installed
- ✅ GitHub CLI authenticated
- ✅ CSV file exists
- ✅ Dependencies installed

Expected output:
```
✅ Node.js is installed
✅ npm is installed
✅ Git is installed
✅ GitHub CLI is installed
✅ GitHub CLI is authenticated
✅ CSV file exists (107 issues)
✅ npm dependencies installed

✅ All set! You can now:
1. Preview issues: npm run create-issues:dry-run
2. Create all issues: npm run create-issues
3. Use Claude commands: /gh-start 1
```

---

## Step 5: Create GitHub Repository (2 minutes)

**Option A: Quick create from command line**
```bash
cd ..
gh repo create ai-assisted-learn --public --source=. --remote=origin
```

**Option B: Create manually on GitHub**
1. Go to https://github.com/new
2. Repository name: `ai-assisted-learn`
3. Choose **Public** or **Private**
4. **Don't** initialize with README (you have files already)
5. Click **Create repository**
6. Then connect it:
```bash
cd d:\workspace\ai-assited-learn
git init
git add .
git commit -m "Initial commit with GitHub-native setup"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ai-assisted-learn.git
git push -u origin main
```

---

## Step 6: Preview Issues (30 seconds)

```bash
cd scripts
npm run create-issues:dry-run
```

This shows what will be created **without actually creating anything**. You'll see:
```
🔍 DRY RUN MODE - No issues will be created

Setting up labels...
  ✓ Created label: epic
  ✓ Created label: story
  ...

Creating Epics...
[DRY RUN] Would create issue: User Authentication & Account Management
[DRY RUN] Would create issue: Curriculum Management System
...

Summary:
Epics: 9
Stories: 33
Tasks: 65+
```

---

## Step 7: Create All Issues (5 minutes)

**Ready to create 107+ issues?**

```bash
npm run create-issues
```

This will:
1. ✅ Create all labels with colors
2. ✅ Create 9 Epics
3. ✅ Create 33 Stories (linked to Epics)
4. ✅ Create 65+ Tasks (linked to Stories)
5. ✅ Add parent-child relationships
6. ✅ Apply proper labels

**What you'll see:**
```
Creating Epics...
✓ Created Epic #1: User Authentication & Account Management
✓ Created Epic #2: Curriculum Management System
...

Creating Stories...
✓ Created Story #10: User Registration and Login
  └─ Linked to parent #1
...

Creating Tasks...
✓ Created Task #43: Setup authentication database schema
  └─ Linked to parent #10
...

✓ All issues created successfully!
```

---

## Step 8: Setup GitHub Project (2 minutes)

```bash
# Return to root directory
cd ..

# Use Claude command
/gh-project-setup
```

OR manually:
```bash
gh project create --title "AI Learning Platform" --owner @me
```

**Save the project URL** for later:
1. Go to **Repository Settings → Secrets and variables → Actions → Variables**
2. Add variable: `PROJECT_URL` = `<your-project-url>`

---

## Step 9: Start Your First Issue! 🚀

```bash
/gh-start 1
```

Claude will:
1. ✅ Fetch issue #1 details
2. ✅ Create branch: `feature/1-development-environment-setup`
3. ✅ Show acceptance criteria
4. ✅ Create todo list
5. ✅ Ask if you want to proceed

**Then you're off and building!** 🎉

---

## 🎯 Quick Command Reference

| Command | Purpose |
|---------|---------|
| `gh --version` | Check GitHub CLI version |
| `gh auth status` | Check authentication |
| `npm run verify` | Verify complete setup |
| `npm run create-issues:dry-run` | Preview issues |
| `npm run create-issues` | Create all issues |
| `/gh-start <number>` | Start working on issue |
| `/gh-pr` | Create pull request |
| `/gh-status` | Show current status |

---

## ❌ Troubleshooting

### Still getting "gh not found"?

**Check installation:**
```powershell
Test-Path "C:\Program Files\GitHub CLI\gh.exe"
```

If `True`, GitHub CLI is installed but not in PATH. Add manually:

1. Press `Win + X` → **System**
2. **Advanced system settings**
3. **Environment Variables**
4. Edit **Path** (User or System variables)
5. Add: `C:\Program Files\GitHub CLI`
6. **OK** all dialogs
7. **Restart terminal again**

**Or reinstall:**
```powershell
winget install --id GitHub.cli --force
```

Then restart terminal.

---

### Authentication fails?

**Use token instead:**
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `read:org`, `workflow`, `project`
4. Copy token
5. Run:
```bash
gh auth login --with-token
# Paste token, press Enter, Ctrl+Z, Enter
```

---

## 📚 Next Steps After Setup

Once everything is working:

1. **Explore issues** on GitHub: https://github.com/YOUR-USERNAME/ai-assisted-learn/issues
2. **Setup project board** views (Table, Board, Roadmap)
3. **Read workflow guide**: `GITHUB-WORKFLOW-GUIDE.md`
4. **Start development**: `/gh-start 1`
5. **Setup DigitalOcean** (when ready to deploy)

---

## 🎊 You're All Set!

You now have:
- ✅ GitHub CLI authenticated
- ✅ 107+ issues created
- ✅ Labels and hierarchy configured
- ✅ GitHub Actions workflows
- ✅ Claude commands ready
- ✅ Complete documentation

**Time to build your AI-powered learning platform!** 🚀

Start with: `/gh-start 1`

---

Having issues? See:
- `FIX-GH-PATH.md` - PATH troubleshooting
- `INSTALL-GITHUB-CLI.md` - Installation help
- `GITHUB-WORKFLOW-GUIDE.md` - Complete workflow
- `QUICK-START-GITHUB.md` - Quick reference
