Show current project status and issue overview.

Steps to follow:

1. **Get current git status**:
   - Run: `git status --short --branch`
   - Show current branch and any uncommitted changes

2. **Get current branch's issue** (if working on one):
   - Extract issue number from branch name
   - If found, run: `gh issue view <issue-number> --json title,state,labels,assignees`
   - Display current issue status and remaining acceptance criteria

3. **List assigned issues**:
   - Run: `gh issue list --assignee @me --limit 10 --json number,title,labels,state`
   - Format and display:
     ```
     Your Issues:
     #123 [story] User Registration (open)
     #124 [task] Setup database schema (in-progress)
     #125 [bug] Fix login error (open)
     ```

4. **Show recent activity**:
   - Run: `gh issue list --limit 5 --json number,title,updatedAt`
   - Display recently updated issues

5. **Show pull request status** (if any):
   - Run: `gh pr list --author @me --limit 5 --json number,title,state,reviewDecision`
   - Display PR status and review state

6. **Display todo list** (if any active todos):
   - Show current TodoWrite list with progress

7. **Provide suggestions**:
   - Based on the status, suggest next actions:
     - "Continue working on #123"
     - "Create PR for current work"
     - "Start a new issue"
     - "Review pending PRs"

This gives you a quick overview of your current work and what to do next.
