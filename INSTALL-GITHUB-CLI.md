# Install GitHub CLI on Windows

## Method 1: winget (Recommended)

```powershell
# In PowerShell or Command Prompt
winget install --id GitHub.cli
```

## Method 2: Chocolatey

```powershell
# If you have Chocolatey installed
choco install gh
```

## Method 3: Manual Download

1. Go to https://cli.github.com/
2. Click "Download for Windows"
3. Run the installer (MSI file)
4. Restart your terminal

## After Installation

### 1. Verify Installation

```bash
gh --version
```

You should see something like:
```
gh version 2.40.0 (2024-01-09)
https://github.com/cli/cli/releases/tag/v2.40.0
```

### 2. Authenticate

```bash
gh auth login
```

Follow the prompts:
1. **What account do you want to log into?** → GitHub.com
2. **What is your preferred protocol?** → HTTPS
3. **Authenticate Git with your GitHub credentials?** → Yes
4. **How would you like to authenticate?** → Login with a web browser
5. Copy the one-time code shown
6. Press Enter to open browser
7. Paste the code and authorize

### 3. Verify Authentication

```bash
gh auth status
```

You should see:
```
✓ Logged in to github.com as your-username
✓ Git operations for github.com configured to use https protocol.
✓ Token: gho_************************************
```

## Alternative: Setup Without GitHub CLI First

If you want to get started without installing GitHub CLI, you can:

### 1. Create Repository Manually

1. Go to https://github.com/new
2. Repository name: `ai-assisted-learn`
3. Choose public or private
4. Don't initialize with README (you already have files)
5. Click "Create repository"

### 2. Push Your Code

```bash
cd d:\workspace\ai-assited-learn
git init
git add .
git commit -m "Initial commit with GitHub-native setup"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ai-assisted-learn.git
git push -u origin main
```

### 3. Create Issues Manually (Temporary)

You can create issues through GitHub web UI using the templates:
1. Go to your repository on GitHub
2. Click "Issues" → "New Issue"
3. Select a template (Epic, Story, Task, Bug)
4. Fill in the details

### 4. Install GitHub CLI Later

Once you're comfortable, install GitHub CLI to:
- Bulk create all 107+ issues from CSV
- Use Claude commands (`/gh-start`, `/gh-pr`, etc.)
- Manage issues from command line

## Troubleshooting

### Issue: Command not found after installation

**Solution**: Restart your terminal or add to PATH manually:
- Default installation path: `C:\Program Files\GitHub CLI\`
- Add to PATH if needed

### Issue: Authentication fails

**Solution**:
1. Generate a Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Generate new token (classic)
   - Select scopes: `repo`, `read:org`, `workflow`
2. Use token for authentication:
   ```bash
   gh auth login --with-token < token.txt
   ```

### Issue: Permission denied

**Solution**: Run as Administrator or check token permissions

## Next Steps After Installation

1. **Test GitHub CLI**:
   ```bash
   gh auth status
   gh repo view
   ```

2. **Create Issues from CSV**:
   ```bash
   cd scripts
   npm run create-issues:dry-run  # Preview
   npm run create-issues          # Create all issues
   ```

3. **Setup Project Board**:
   ```bash
   gh project create --title "AI Learning Platform" --owner @me
   ```

4. **Start Using Claude Commands**:
   ```bash
   /gh-start 1
   ```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `gh auth login` | Authenticate GitHub CLI |
| `gh auth status` | Check authentication status |
| `gh repo create` | Create new repository |
| `gh repo view` | View current repository |
| `gh issue list` | List issues |
| `gh issue create` | Create new issue |
| `gh pr create` | Create pull request |
| `gh project create` | Create project board |

---

**Ready?** Install GitHub CLI, authenticate, then run the issue creation script!
