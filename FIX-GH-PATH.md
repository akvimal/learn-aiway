# Fix: GitHub CLI Not in PATH

## The Situation

✅ **GitHub CLI IS installed** (version 2.83.1)
📍 **Location**: `C:\Program Files\GitHub CLI\gh.exe`
❌ **Problem**: Not accessible in current terminal session

This happens because the installer updated your system PATH, but your current terminal session still has the old PATH.

---

## 🚀 Quick Solutions

### Solution 1: Restart Terminal (Best - 30 seconds)

**This is the permanent fix and takes only 30 seconds:**

1. **Close this terminal completely** (not just this tab, close the entire terminal window)
2. **Open a new terminal** (PowerShell, CMD, or VS Code terminal)
3. **Test it works**:
   ```bash
   gh --version
   ```

You should see:
```
gh version 2.83.1 (2025-11-13)
```

✅ **After this, all `gh` commands will work permanently.**

---

### Solution 2: Continue in Current Terminal (Temporary Fix)

**If you don't want to restart right now, run this PowerShell command:**

```powershell
# In PowerShell terminal:
cd d:\workspace\ai-assited-learn\scripts
.\setup-path.ps1
```

OR manually add to PATH:

```powershell
# In PowerShell:
$env:Path += ";C:\Program Files\GitHub CLI"
gh --version
```

```cmd
# In CMD:
set PATH=%PATH%;C:\Program Files\GitHub CLI
gh --version
```

⚠️ **Note**: This only works for the current terminal session. When you close the terminal, you'll need to do it again.

---

### Solution 3: Use Full Path (One-Time Commands)

You can run GitHub CLI with the full path:

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" --version
& "C:\Program Files\GitHub CLI\gh.exe" auth login
```

---

## ✅ After Fixing PATH

Once `gh --version` works, follow these steps:

### 1. Authenticate GitHub CLI

```bash
gh auth login
```

Follow the prompts:
- **What account?** → GitHub.com
- **Protocol?** → HTTPS
- **Authenticate Git?** → Yes
- **How to authenticate?** → Login with web browser

### 2. Verify Setup

```bash
cd scripts
npm run verify
```

This will check:
- ✅ Node.js
- ✅ npm
- ✅ Git
- ✅ GitHub CLI
- ✅ GitHub authentication
- ✅ CSV file
- ✅ Dependencies

### 3. Create Issues (Dry Run)

```bash
npm run create-issues:dry-run
```

This previews what issues will be created (doesn't actually create them).

### 4. Create All Issues

```bash
npm run create-issues
```

This creates all 107+ issues in your GitHub repository.

---

## 🔍 Troubleshooting

### Still getting "gh not found" after restart?

Check if it's in system PATH:

```powershell
# PowerShell
$env:Path -split ';' | Select-String "GitHub CLI"
```

You should see: `C:\Program Files\GitHub CLI`

If not found, add it manually:

1. Press `Win + X` → Select **System**
2. Click **Advanced system settings**
3. Click **Environment Variables**
4. Under **User variables** or **System variables**, find **Path**
5. Click **Edit**
6. Click **New**
7. Add: `C:\Program Files\GitHub CLI`
8. Click **OK** on all dialogs
9. **Restart terminal**

### Verify installation location

```powershell
Test-Path "C:\Program Files\GitHub CLI\gh.exe"
```

Should return: `True`

### Run with full path to test

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" --version
```

Should show version 2.83.1

---

## 📋 Complete Setup Checklist

After fixing PATH:

- [ ] `gh --version` works
- [ ] `gh auth login` (authenticate)
- [ ] `gh auth status` (verify authentication)
- [ ] `npm run verify` (check all tools)
- [ ] `npm run create-issues:dry-run` (preview)
- [ ] Create GitHub repository (if not done)
- [ ] `npm run create-issues` (create all issues)
- [ ] Setup GitHub Project: `/gh-project-setup`
- [ ] Start first issue: `/gh-start 1`

---

## 💡 Why This Happened

When GitHub CLI installer runs, it:
1. ✅ Installs files to `C:\Program Files\GitHub CLI\`
2. ✅ Updates system PATH environment variable
3. ❌ Doesn't update **already running** terminal sessions

Your terminal session started **before** the installation, so it has the old PATH. New terminal sessions will have the updated PATH automatically.

---

## 🎯 Recommended Next Steps

**The absolute simplest solution:**

1. **Close this terminal**
2. **Open new terminal**
3. **Run**: `gh --version` ✅
4. **Run**: `gh auth login`
5. **Continue with setup**

That's it! After restart, everything will work smoothly.

---

## Need More Help?

After fixing PATH, proceed to:
- **Quick Start**: `QUICK-START-GITHUB.md`
- **Full Workflow**: `GITHUB-WORKFLOW-GUIDE.md`
- **Installation Details**: `INSTALL-GITHUB-CLI.md`
