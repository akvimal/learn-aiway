Create a new GitHub issue using the issue template.

This command helps you create well-structured issues by using the GitHub web interface with templates.

Steps to follow:

1. **Open GitHub issue creation page**:
   - Run: `gh issue create --web`
   - This will open the browser with issue templates

2. **If user provides a title as {{ arg }}**:
   - Try to create a quick issue with the title
   - Ask user for:
     - Issue type (epic, story, task, bug)
     - Description
     - Acceptance criteria
     - Priority
     - Labels

3. **Format the issue body**:
   ```markdown
   ## Description
   <user-provided description>

   ## Acceptance Criteria
   - [ ] <criterion 1>
   - [ ] <criterion 2>

   ## Priority
   <priority>
   ```

4. **Create the issue**:
   - Run: `gh issue create --title "<title>" --body "<formatted-body>" --label "<labels>"`

5. **Display created issue**:
   - Show issue number and URL
   - Ask if user wants to start working on it immediately
   - If yes, run the gh-start command: `/gh-start <issue-number>`

Example usage:
- `/gh-issue` - Opens web interface with templates
- `/gh-issue Add user authentication` - Quick create with title
