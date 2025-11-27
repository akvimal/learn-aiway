Create a pull request for the current work.

Steps to follow:

1. **Get current branch information**:
   - Run: `git branch --show-current` to get the current branch name
   - Extract issue number from branch name (e.g., feature/123-description → 123)

2. **If issue number provided as {{ arg }}**:
   - Use the provided issue number: {{ arg }}
   - Otherwise, use the issue number extracted from branch name

3. **Fetch issue details**:
   - Run: `gh issue view <issue-number> --json title,body,labels`
   - Parse the issue information for PR creation

4. **Verify all changes are committed**:
   - Run: `git status --porcelain`
   - If there are uncommitted changes, warn the user and ask if they want to commit them first
   - If yes, stage and commit: `git add .` then `git commit`

5. **Push current branch**:
   - Run: `git push -u origin <current-branch>`
   - Handle the case where branch is already pushed

6. **Create pull request**:
   - Extract acceptance criteria from issue body
   - Format PR body with:
     ```
     ## Related Issues
     Closes #<issue-number>

     ## Changes Made
     [List from commit messages]

     ## Acceptance Criteria
     [Checklist from issue]

     ## Test Plan
     - [ ] Unit tests pass
     - [ ] Integration tests pass
     - [ ] Manual testing complete

     🤖 Generated with Claude Code
     ```
   - Run: `gh pr create --title "[#<issue-number>] <issue-title>" --body "<formatted-body>"`

7. **Display PR information**:
   - Show the PR URL
   - Show PR number
   - Confirm that it's linked to the issue

8. **Optional: Update issue status**:
   - Add a comment to the issue: `gh issue comment <issue-number> --body "PR created: #<pr-number>"`

The PR will automatically be linked to the issue through the "Closes #<issue-number>" reference, and GitHub Actions will handle status updates.
