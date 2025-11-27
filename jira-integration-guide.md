# JIRA-Claude-GitHub Integration Guide

## Overview

This guide explains how to:
1. Import tickets into JIRA from the provided CSV
2. Integrate Claude Code with JIRA tickets
3. Connect JIRA with GitHub for PR and release management

---

## Part 1: Importing Tickets to JIRA

### Option 1: CSV Import (Recommended for Initial Setup)

1. **Prepare JIRA Project**
   - Create a new JIRA project (Scrum or Kanban)
   - Note the project key (e.g., "AILEARN")

2. **Import CSV**
   - Navigate to **Project Settings → Import**
   - Select **CSV** as import source
   - Upload `jira-tickets-import.csv`
   - Map CSV columns to JIRA fields:
     - `Issue Type` → Issue Type
     - `Summary` → Summary
     - `Description` → Description
     - `Parent` → Parent (for linking Stories to Epics)
     - `Epic Name` → Epic Name
     - `Story Points` → Story Points
     - `Priority` → Priority
     - `Components` → Components
     - `Labels` → Labels
     - `Acceptance Criteria` → Custom field (create if needed)

3. **Post-Import Configuration**
   - Verify Epic-Story-Task hierarchy
   - Ensure labels are applied correctly
   - Create custom field for "Acceptance Criteria" if not present

### Option 2: JIRA API Import (For Automation)

```bash
# Install JIRA CLI or use REST API
npm install -g jira-cli

# Configure JIRA credentials
export JIRA_URL="https://your-domain.atlassian.net"
export JIRA_USER="your-email@example.com"
export JIRA_API_TOKEN="your-api-token"

# Script to import from CSV (Node.js example)
node scripts/import-to-jira.js
```

Sample import script:

```javascript
// scripts/import-to-jira.js
const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');

const JIRA_URL = process.env.JIRA_URL;
const JIRA_AUTH = Buffer.from(
  `${process.env.JIRA_USER}:${process.env.JIRA_API_TOKEN}`
).toString('base64');

const PROJECT_KEY = 'AILEARN'; // Your project key

async function createIssue(issue) {
  const response = await axios.post(
    `${JIRA_URL}/rest/api/3/issue`,
    {
      fields: {
        project: { key: PROJECT_KEY },
        issuetype: { name: issue['Issue Type'] },
        summary: issue.Summary,
        description: {
          type: 'doc',
          version: 1,
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: issue.Description }]
          }]
        },
        labels: issue.Labels ? issue.Labels.split('|') : [],
        priority: { name: issue.Priority || 'Medium' },
        // Add other fields as needed
      }
    },
    {
      headers: {
        'Authorization': `Basic ${JIRA_AUTH}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

// Read CSV and create issues
const issues = [];
fs.createReadStream('jira-tickets-import.csv')
  .pipe(csv())
  .on('data', (row) => issues.push(row))
  .on('end', async () => {
    // First create Epics, then Stories, then Tasks
    const epics = issues.filter(i => i['Issue Type'] === 'Epic');
    const stories = issues.filter(i => i['Issue Type'] === 'Story');
    const tasks = issues.filter(i => i['Issue Type'] === 'Task');

    const epicMap = {};
    for (const epic of epics) {
      const created = await createIssue(epic);
      epicMap[epic['Epic Name']] = created.key;
      console.log(`Created Epic: ${created.key}`);
    }

    // Similar logic for stories and tasks with parent linking
  });
```

---

## Part 2: Integrating Claude Code with JIRA

### Workflow: JIRA Ticket → Claude Development → GitHub PR

#### Step 1: JIRA Ticket Structure

Each ticket should include:
- **Summary**: Clear task description
- **Description**: Detailed requirements
- **Acceptance Criteria**: Testable conditions
- **Labels**: For filtering (e.g., `backend`, `frontend`, `ai`)
- **Branch Name**: Auto-generated from ticket key

#### Step 2: Create Development Workflow

**1. Fetch JIRA Ticket from Claude**

Create a slash command `.claude/commands/jira-start.md`:

```markdown
Fetch JIRA ticket {{ arg }} and start development.

Steps:
1. Use the JIRA API to fetch ticket details for {{ arg }}
2. Display the ticket summary, description, and acceptance criteria
3. Create a feature branch: `feature/{{ arg }}-description`
4. Ask if I should proceed with implementation
5. Track subtasks using TodoWrite tool
```

Usage:
```bash
/jira-start AILEARN-123
```

**2. Create JIRA API Integration Script**

```bash
# .claude/scripts/fetch-jira-ticket.sh
#!/bin/bash
TICKET_KEY=$1

curl -X GET \
  -H "Authorization: Basic $JIRA_AUTH" \
  -H "Content-Type: application/json" \
  "${JIRA_URL}/rest/api/3/issue/${TICKET_KEY}?fields=summary,description,labels,acceptanceCriteria" \
  | jq '{
    key: .key,
    summary: .fields.summary,
    description: .fields.description.content[0].content[0].text,
    labels: .fields.labels,
    acceptanceCriteria: .fields.acceptanceCriteria
  }'
```

**3. Automate Branch Creation**

Add to your `.bashrc` or `.zshrc`:

```bash
jira-start() {
  TICKET_KEY=$1
  TICKET_INFO=$(bash .claude/scripts/fetch-jira-ticket.sh $TICKET_KEY)
  BRANCH_NAME="feature/${TICKET_KEY}-$(echo $TICKET_INFO | jq -r '.summary' | sed 's/ /-/g' | tr '[:upper:]' '[:lower:]')"

  git checkout -b "$BRANCH_NAME"
  echo "Created branch: $BRANCH_NAME"
  echo "Ticket Info:"
  echo "$TICKET_INFO" | jq '.'
}
```

#### Step 3: Development with Claude

1. **Start ticket**: `/jira-start AILEARN-123`
2. **Claude reads ticket** and creates todo list from acceptance criteria
3. **Develop with Claude**: Claude implements based on ticket requirements
4. **Track progress**: Update JIRA status via API or manually

#### Step 4: Update JIRA During Development

Create a script to update JIRA status:

```bash
# scripts/update-jira-status.sh
#!/bin/bash
TICKET_KEY=$1
STATUS=$2  # "In Progress", "In Review", "Done"

curl -X POST \
  -H "Authorization: Basic $JIRA_AUTH" \
  -H "Content-Type: application/json" \
  "${JIRA_URL}/rest/api/3/issue/${TICKET_KEY}/transitions" \
  -d "{
    \"transition\": {
      \"name\": \"${STATUS}\"
    }
  }"
```

---

## Part 3: GitHub Integration

### Setup GitHub-JIRA Integration

#### Option 1: GitHub for JIRA App (Official)

1. **Install JIRA App in GitHub**
   - Go to: https://github.com/marketplace/jira-software-github
   - Click "Install" and authorize for your repository

2. **Connect JIRA Project**
   - In JIRA: Go to **Project Settings → GitHub**
   - Authenticate and select repository

3. **Automatic Linking**
   - Branch names with JIRA key: `feature/AILEARN-123-description`
   - Commit messages with JIRA key: `AILEARN-123: Implement user auth`
   - PR titles with JIRA key: `[AILEARN-123] Add user authentication`

#### Option 2: Manual Integration via API

**1. Create GitHub PR from Claude with JIRA Reference**

Modify your commit and PR workflow:

```bash
# When creating commits
git commit -m "$(cat <<'EOF'
AILEARN-123: Implement user registration endpoint

- Created POST /api/auth/register endpoint
- Added email validation
- Implemented JWT token generation

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**2. Create PR with JIRA Integration**

```bash
# Get current branch and extract JIRA ticket
BRANCH=$(git branch --show-current)
TICKET_KEY=$(echo $BRANCH | grep -oE '[A-Z]+-[0-9]+')

# Create PR with JIRA reference
gh pr create \
  --title "[${TICKET_KEY}] $(git log -1 --pretty=%s)" \
  --body "$(cat <<EOF
## JIRA Ticket
[${TICKET_KEY}](${JIRA_URL}/browse/${TICKET_KEY})

## Changes
$(git log origin/main..HEAD --pretty=format:"- %s")

## Acceptance Criteria
✅ Criteria from JIRA ticket

## Test Plan
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing complete

🤖 Generated with Claude Code
EOF
)"
```

**3. Auto-transition JIRA on PR Events**

Use GitHub Actions to update JIRA:

```yaml
# .github/workflows/jira-integration.yml
name: JIRA Integration

on:
  pull_request:
    types: [opened, closed, merged]

jobs:
  update-jira:
    runs-on: ubuntu-latest
    steps:
      - name: Extract JIRA Issue Key
        id: jira-key
        run: |
          BRANCH="${{ github.head_ref }}"
          KEY=$(echo $BRANCH | grep -oE '[A-Z]+-[0-9]+')
          echo "key=$KEY" >> $GITHUB_OUTPUT

      - name: Transition JIRA Issue
        if: steps.jira-key.outputs.key != ''
        run: |
          STATUS="In Review"
          if [[ "${{ github.event.action }}" == "merged" ]]; then
            STATUS="Done"
          fi

          curl -X POST \
            -H "Authorization: Basic ${{ secrets.JIRA_AUTH }}" \
            -H "Content-Type: application/json" \
            "${{ secrets.JIRA_URL }}/rest/api/3/issue/${{ steps.jira-key.outputs.key }}/transitions" \
            -d "{\"transition\": {\"name\": \"${STATUS}\"}}"

      - name: Add PR Link to JIRA
        if: steps.jira-key.outputs.key != ''
        run: |
          curl -X POST \
            -H "Authorization: Basic ${{ secrets.JIRA_AUTH }}" \
            -H "Content-Type: application/json" \
            "${{ secrets.JIRA_URL }}/rest/api/3/issue/${{ steps.jira-key.outputs.key }}/remotelink" \
            -d "{
              \"object\": {
                \"url\": \"${{ github.event.pull_request.html_url }}\",
                \"title\": \"PR #${{ github.event.pull_request.number }}\",
                \"icon\": {
                  \"url16x16\": \"https://github.com/favicon.ico\"
                }
              }
            }"
```

---

## Part 4: Complete Workflow

### End-to-End Development Cycle

```
┌─────────────────────────────────────────────────────────┐
│ 1. JIRA: Create/Assign Ticket                          │
│    - AILEARN-123: "Implement user registration"        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Developer: Start Work                                │
│    $ jira-start AILEARN-123                             │
│    - Fetches ticket details                             │
│    - Creates feature/AILEARN-123-user-registration      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Claude: Implement Based on Ticket                    │
│    - Reads acceptance criteria                          │
│    - Creates todo list                                  │
│    - Implements feature                                 │
│    - Writes tests                                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Update JIRA Status                                   │
│    $ update-jira-status AILEARN-123 "In Progress"       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Commit & Push                                        │
│    $ git add .                                          │
│    $ git commit -m "AILEARN-123: Implement user reg"    │
│    $ git push -u origin feature/AILEARN-123-...         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Create Pull Request                                  │
│    $ gh pr create --title "[AILEARN-123] User reg"      │
│    - GitHub Actions triggers                            │
│    - JIRA status → "In Review"                          │
│    - PR link added to JIRA ticket                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 7. Code Review & Merge                                  │
│    - Reviewers approve PR                               │
│    - Merge to main                                      │
│    - GitHub Actions triggers                            │
│    - JIRA status → "Done"                               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 8. Release Management                                   │
│    - GitHub Release created                             │
│    - JIRA Release version updated                       │
│    - Tickets marked in release                          │
└─────────────────────────────────────────────────────────┘
```

---

## Part 5: Advanced Integration

### Claude Slash Commands for JIRA

Create these commands in `.claude/commands/`:

**1. `/jira-start <ticket-key>`**
```markdown
# .claude/commands/jira-start.md
Fetch JIRA ticket {{ arg }} and prepare for development.

Execute:
1. Run: `bash .claude/scripts/fetch-jira-ticket.sh {{ arg }}`
2. Parse the ticket details
3. Create a feature branch: `feature/{{ arg }}-description`
4. Create a todo list from acceptance criteria
5. Ask if I should proceed with implementation
```

**2. `/jira-update <ticket-key> <status>`**
```markdown
# .claude/commands/jira-update.md
Update JIRA ticket {{ arg1 }} to status {{ arg2 }}.

Execute:
1. Run: `bash scripts/update-jira-status.sh {{ arg1 }} "{{ arg2 }}"`
2. Confirm status update
```

**3. `/jira-pr <ticket-key>`**
```markdown
# .claude/commands/jira-pr.md
Create a pull request for JIRA ticket {{ arg }}.

Execute:
1. Fetch ticket details for context
2. Generate PR title: `[{{ arg }}] Summary from JIRA`
3. Generate PR body with:
   - Link to JIRA ticket
   - Acceptance criteria checklist
   - Test plan
4. Run: `gh pr create` with generated content
5. Update JIRA status to "In Review"
```

### Release Management

**Link GitHub Releases to JIRA Versions**

```yaml
# .github/workflows/release.yml
name: Create Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}

      - name: Create JIRA Version
        run: |
          VERSION="${GITHUB_REF#refs/tags/}"
          curl -X POST \
            -H "Authorization: Basic ${{ secrets.JIRA_AUTH }}" \
            -H "Content-Type: application/json" \
            "${{ secrets.JIRA_URL }}/rest/api/3/version" \
            -d "{
              \"name\": \"${VERSION}\",
              \"project\": \"AILEARN\",
              \"released\": true,
              \"releaseDate\": \"$(date +%Y-%m-%d)\"
            }"
```

---

## Configuration Checklist

- [ ] JIRA project created with appropriate issue types
- [ ] CSV imported or API script executed
- [ ] GitHub repository connected to JIRA
- [ ] GitHub Actions configured for JIRA updates
- [ ] Environment variables set (JIRA_URL, JIRA_AUTH, JIRA_USER, JIRA_API_TOKEN)
- [ ] Claude slash commands created
- [ ] Branch naming convention established
- [ ] Commit message format defined
- [ ] PR template with JIRA reference created
- [ ] Release workflow configured

---

## Environment Variables

Add to your `.env` or shell profile:

```bash
# JIRA Configuration
export JIRA_URL="https://your-domain.atlassian.net"
export JIRA_USER="your-email@example.com"
export JIRA_API_TOKEN="your-api-token"  # Generate at: https://id.atlassian.com/manage-profile/security/api-tokens
export JIRA_PROJECT_KEY="AILEARN"
export JIRA_AUTH=$(echo -n "${JIRA_USER}:${JIRA_API_TOKEN}" | base64)

# GitHub Configuration
export GITHUB_TOKEN="ghp_your_token"  # Generate at: https://github.com/settings/tokens
```

---

## Troubleshooting

### Issue: CSV Import Fails
- **Solution**: Ensure all required fields exist in JIRA project
- Create custom field for "Acceptance Criteria"
- Check that Epic Name field is enabled

### Issue: GitHub Actions Can't Update JIRA
- **Solution**: Verify JIRA_AUTH secret is base64 encoded
- Check API token has write permissions
- Ensure transition names match JIRA workflow

### Issue: JIRA Ticket Key Not Detected in PR
- **Solution**: Ensure branch name includes ticket key: `feature/AILEARN-123-description`
- Update regex in GitHub Actions if using different format

---

## Resources

- [JIRA REST API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GitHub for JIRA App](https://github.com/marketplace/jira-software-github)
- [Claude Code Documentation](https://github.com/anthropics/claude-code)
