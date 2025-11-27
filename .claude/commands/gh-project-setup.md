Setup GitHub Project board for the AI Learning Platform.

This command helps you create and configure a GitHub Project with proper views and automation.

Steps to follow:

1. **Check if project already exists**:
   - Run: `gh project list --owner @me --limit 10 --format json`
   - Look for "AI Learning Platform" project

2. **Create project if it doesn't exist**:
   - Run: `gh project create --title "AI Learning Platform" --owner @me`
   - Save the project number/ID for later use

3. **Get the project URL**:
   - Run: `gh project list --owner @me --limit 10`
   - Extract the project URL
   - Display it to the user

4. **Explain next steps**:
   - Tell the user to save the PROJECT_URL in repository variables:
     ```bash
     # In GitHub repo settings → Secrets and variables → Actions → Variables
     # Add: PROJECT_URL = <project-url>
     ```

5. **Suggest project customization**:
   - Explain that they can add custom fields in the GitHub UI:
     - **Status**: Todo, In Progress, In Review, Done
     - **Priority**: High, Medium, Low
     - **Story Points**: Number field
     - **Sprint**: Text field
     - **Epic**: Text field

6. **Explain automation**:
   - The GitHub Actions workflows will automatically:
     - Add new issues to the project
     - Add new PRs to the project
     - Update status based on PR events
     - Link child issues to parent issues

7. **Add existing issues to project** (if requested):
   - Ask user if they want to add existing issues
   - If yes, run: `gh project item-add <project-number> --owner @me --url <issue-url>`
   - Loop through all open issues

8. **Display project board URL**:
   - Show the direct link to the project board
   - Explain the different views available:
     - **Table**: Spreadsheet view
     - **Board**: Kanban view
     - **Roadmap**: Timeline view

This sets up a complete project management system integrated with your workflow.
