Start working on GitHub issue #{{ arg }}.

Steps to follow:

1. **Fetch issue details**:
   - Run: `gh issue view {{ arg }} --json title,body,labels,number,assignees`
   - Parse the JSON response to extract issue information

2. **Display issue information**:
   - Show the issue title, description, and acceptance criteria
   - Display any labels and current assignees
   - Note the issue type (epic, story, task, bug)

3. **Create feature branch**:
   - Determine branch type based on labels:
     - If "bug" label: `bugfix/{{ arg }}-description`
     - If "epic" label: `epic/{{ arg }}-description`
     - Otherwise: `feature/{{ arg }}-description`
   - Generate a clean branch name from the issue title (lowercase, hyphens, max 50 chars)
   - Run: `git checkout -b <branch-name>`

4. **Create todo list**:
   - Extract acceptance criteria from the issue body
   - Create a TodoWrite entry for each criterion
   - Set the first item as "in_progress"
   - Set remaining items as "pending"

5. **Assign issue** (if not already assigned):
   - Run: `gh issue edit {{ arg }} --add-assignee @me`

6. **Ask for confirmation**:
   - Display the issue details and todo list
   - Ask: "Would you like me to proceed with implementation?"
   - Wait for user response before continuing

Remember to use the actual GitHub CLI commands and parse their output properly.
