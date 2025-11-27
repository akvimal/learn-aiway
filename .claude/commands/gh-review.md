Review a pull request and provide feedback.

Usage: `/gh-review <pr-number>`

Steps to follow:

1. **Fetch PR details**:
   - Run: `gh pr view {{ arg }} --json title,body,files,commits,reviews,url`
   - Parse the PR information

2. **Display PR overview**:
   - Show PR title and description
   - Display linked issues
   - Show number of commits and files changed
   - List existing reviews (if any)

3. **Get PR diff**:
   - Run: `gh pr diff {{ arg }}`
   - Review the code changes

4. **Checkout PR branch** (if user wants to test):
   - Ask: "Would you like to checkout this PR branch for testing?"
   - If yes, run: `gh pr checkout {{ arg }}`
   - Explain they can test locally and return with: `git checkout <previous-branch>`

5. **Analyze the changes**:
   - Review code quality
   - Check for:
     - Security issues
     - Best practices
     - Test coverage
     - Code style consistency
     - Performance concerns
     - Documentation

6. **Prepare review feedback**:
   - Summarize findings:
     - ✅ Strengths
     - ⚠️ Suggestions for improvement
     - 🔴 Issues that should be addressed

7. **Ask user for review decision**:
   - **Approve**: `gh pr review {{ arg }} --approve --body "<feedback>"`
   - **Request Changes**: `gh pr review {{ arg }} --request-changes --body "<feedback>"`
   - **Comment**: `gh pr review {{ arg }} --comment --body "<feedback>"`

8. **Submit review**:
   - Execute the chosen review command
   - Display confirmation

9. **Suggest next actions**:
   - If approved: "PR is ready to merge"
   - If changes requested: "Waiting for author to address feedback"
   - If commented: "Consider approving once satisfied"

This helps maintain code quality through thorough reviews.
