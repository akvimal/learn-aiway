/**
 * GitHub Issues Generator
 *
 * Converts JIRA CSV format to GitHub issues using GitHub CLI
 *
 * Setup:
 * 1. Install GitHub CLI: https://cli.github.com/
 * 2. Authenticate: gh auth login
 * 3. npm install (in scripts directory)
 * 4. node create-github-issues.js
 */

const fs = require('fs');
const { execSync } = require('child_process');
const csv = require('csv-parser');
const path = require('path');

// Configuration
const DRY_RUN = process.env.DRY_RUN === 'true'; // Set to true to preview without creating
const BATCH_SIZE = 5; // Number of issues to create before pausing
const DELAY_MS = 2000; // Delay between batches to avoid rate limiting

// Color scheme for labels
const LABEL_COLORS = {
  // Issue types
  epic: '8B4789',
  story: '0E8A16',
  task: 'FBCA04',
  bug: 'D93F0B',

  // Components
  backend: '0E8A16',
  frontend: '1D76DB',
  database: '5319E7',
  api: 'F9D0C4',
  ui: '66D9EF',

  // Features
  ai: 'FF6B6B',
  auth: 'E99695',
  users: 'BFDADC',
  profile: 'C5DEF5',
  curriculum: 'BFD4F2',
  learning: 'D4C5F9',
  sessions: 'F9EAC5',
  evaluation: 'F9C0D4',
  analytics: 'C5DEF5',
  progress: 'A8E6CF',

  // Technical
  security: 'D93F0B',
  testing: 'FEF2C0',
  documentation: 'EDEDED',
  devops: '424242',
  infrastructure: '616161',
  docker: '2496ED',
  deployment: '00D084',

  // Areas
  rbac: 'FFB6C1',
  navigation: '87CEEB',
  interaction: 'DDA0DD',
  generation: 'F0E68C',
  gaps: 'FFE4B5',
  mastery: 'E6E6FA',
  export: 'B0E0E6',

  // Priority
  mvp: 'C2E0C6',
  'code-execution': 'FF8C00',
  adaptive: 'DA70D6',

  // Model related
  models: 'FF69B4',
  config: '9370DB',
  switching: '20B2AA',
  'local-llm': '8A2BE2',

  // Specific features
  recommendations: 'F5DEB3',
  'code-review': 'FF6347',
  quiz: 'FFD700',
  scenario: '98FB98',
  monitoring: 'FFA07A',
  logging: 'CD853F',
  migrations: '4682B4',
  backups: '2F4F4F',

  // Documentation
  docs: 'EDEDED',
  'user-guide': 'F0F0F0',
  'api-docs': 'E8E8E8',

  // Misc
  setup: 'DEB887',
  guided: '90EE90',
  exploratory: '87CEFA',
  admin: 'FF4500',
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute shell command
 */
function exec(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return result;
  } catch (error) {
    console.error(`Error executing: ${command}`);
    throw error;
  }
}

/**
 * Check if GitHub CLI is installed and authenticated
 */
function checkGitHubCLI() {
  try {
    exec('gh --version', { silent: true });
    const auth = exec('gh auth status', { silent: true });
    console.log('✓ GitHub CLI is installed and authenticated\n');
    return true;
  } catch (error) {
    console.error('✗ GitHub CLI is not installed or not authenticated');
    console.error('Please install: https://cli.github.com/');
    console.error('Then authenticate: gh auth login');
    return false;
  }
}

/**
 * Check if we're in a GitHub repository
 */
function checkRepository() {
  try {
    const result = exec('gh repo view --json nameWithOwner', { silent: true });
    const repo = JSON.parse(result);
    console.log(`✓ Connected to repository: ${repo.nameWithOwner}\n`);
    return true;
  } catch (error) {
    console.error('✗ Not in a GitHub repository or repository not found\n');
    console.error('You need to create a GitHub repository first!\n');
    console.error('Option 1: Create from command line');
    console.error('  cd ..');
    console.error('  gh repo create ai-assisted-learn --public --source=. --remote=origin\n');
    console.error('Option 2: Create on GitHub.com');
    console.error('  1. Go to https://github.com/new');
    console.error('  2. Create repository: ai-assisted-learn');
    console.error('  3. Then connect it:');
    console.error('     cd ..');
    console.error('     git init');
    console.error('     git add .');
    console.error('     git commit -m "Initial commit"');
    console.error('     git branch -M main');
    console.error('     git remote add origin https://github.com/YOUR-USERNAME/ai-assisted-learn.git');
    console.error('     git push -u origin main\n');
    return false;
  }
}

/**
 * Create a label if it doesn't exist
 */
function createLabel(name, color, description = '') {
  const labelName = name.toLowerCase();

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would create label: ${labelName}`);
    return true;
  }

  try {
    // Try to create the label
    const cmd = `gh label create "${labelName}" --color "${color}" --description "${description}"`;
    console.log(`  Creating: ${labelName}...`);

    execSync(cmd, {
      encoding: 'utf-8',
      stdio: 'inherit' // Show output in real-time for debugging
    });

    console.log(`  ✓ Created label: ${labelName}`);
    return true;
  } catch (err) {
    console.log(`  ✗ Failed to create label: ${labelName}`);
    if (err.stderr) {
      console.log(`     Error: ${err.stderr.toString()}`);
    }
    return false;
  }
}

/**
 * Extract all unique labels from issues
 */
function extractLabelsFromIssues(issues) {
  const labelSet = new Set();

  issues.forEach(issue => {
    if (issue.Labels) {
      issue.Labels.split('|').forEach(label => {
        labelSet.add(label.trim().toLowerCase());
      });
    }
    // Add issue type as label
    if (issue['Issue Type']) {
      labelSet.add(issue['Issue Type'].toLowerCase());
    }
  });

  return Array.from(labelSet);
}

/**
 * Setup all labels from CSV
 */
function setupLabels(issues) {
  console.log('Setting up labels...\n');

  // Extract all unique labels from CSV
  const labelsFromCSV = extractLabelsFromIssues(issues);

  console.log(`Found ${labelsFromCSV.length} unique labels to create\n`);

  // Create each label and track success
  let successCount = 0;
  let failCount = 0;

  labelsFromCSV.forEach(labelName => {
    const color = LABEL_COLORS[labelName] || 'CCCCCC'; // Default gray if not defined
    const description = `Label: ${labelName}`;
    const success = createLabel(labelName, color, description);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  });

  console.log('');
  console.log(`Labels created: ${successCount} successful, ${failCount} failed\n`);

  if (failCount > 0) {
    console.log('⚠️  Warning: Some labels failed to create. Issues may fail if they use these labels.\n');
    console.log('Do you want to continue anyway? (Ctrl+C to cancel, Enter to continue)');
    // Give user a chance to cancel
  } else if (!DRY_RUN) {
    console.log('Waiting 2 seconds for GitHub to sync labels...');
    // Small delay to ensure labels are available
    const start = Date.now();
    while (Date.now() - start < 2000) {
      // Blocking wait
    }
    console.log('');
  }
}

/**
 * Format issue body
 */
function formatIssueBody(issue) {
  let body = '';

  // Add description
  if (issue.Description) {
    body += `${issue.Description}\n\n`;
  }

  // Add acceptance criteria
  if (issue['Acceptance Criteria']) {
    body += `## Acceptance Criteria\n\n`;
    const criteria = issue['Acceptance Criteria'].split(';');
    criteria.forEach(criterion => {
      body += `- [ ] ${criterion.trim()}\n`;
    });
    body += '\n';
  }

  // Add metadata
  if (issue['Story Points']) {
    body += `**Story Points**: ${issue['Story Points']}\n`;
  }

  if (issue.Priority) {
    body += `**Priority**: ${issue.Priority}\n`;
  }

  if (issue.Components) {
    body += `**Components**: ${issue.Components}\n`;
  }

  // Add parent reference if exists
  if (issue.Parent) {
    body += `\n**Part of**: ${issue.Parent}\n`;
  }

  return body.trim();
}

/**
 * Create a GitHub issue
 */
function createIssue(issue, parentNumber = null) {
  const title = issue.Summary;
  const body = formatIssueBody(issue);

  // Parse labels
  let labels = [];
  if (issue.Labels) {
    labels = issue.Labels.split('|').map(l => l.trim().toLowerCase());
  }

  // Add issue type as label
  labels.push(issue['Issue Type'].toLowerCase());

  // Build command
  let cmd = `gh issue create --title "${title.replace(/"/g, '\\"')}"`;

  // Add body
  const bodyFile = path.join(__dirname, '.temp-issue-body.md');
  fs.writeFileSync(bodyFile, body);
  cmd += ` --body-file "${bodyFile}"`;

  // Add labels
  if (labels.length > 0) {
    cmd += ` --label "${labels.join(',')}"`;
  }

  if (DRY_RUN) {
    console.log(`[DRY RUN] Would create issue: ${title}`);
    console.log(`  Labels: ${labels.join(', ')}`);
    console.log(`  Parent: ${parentNumber || 'none'}`);
    return null;
  }

  try {
    const output = exec(cmd, { silent: true });

    // Extract issue number from output
    const match = output.match(/\/issues\/(\d+)/);
    const issueNumber = match ? match[1] : null;

    console.log(`✓ Created issue #${issueNumber}: ${title}`);

    // Clean up temp file
    if (fs.existsSync(bodyFile)) {
      fs.unlinkSync(bodyFile);
    }

    // If there's a parent, add a comment linking them
    if (parentNumber && issueNumber) {
      const commentBody = `Part of #${parentNumber}`;
      exec(`gh issue comment ${issueNumber} --body "${commentBody}"`, { silent: true });
      console.log(`  └─ Linked to parent #${parentNumber}`);
    }

    return issueNumber;
  } catch (error) {
    console.error(`✗ Failed to create issue: ${title}`);
    console.error(error.message);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('GitHub Issues Generator');
  console.log('='.repeat(60));
  console.log('');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No issues will be created\n');
  }

  // Check GitHub CLI
  if (!checkGitHubCLI()) {
    process.exit(1);
  }

  // Check repository
  if (!checkRepository()) {
    process.exit(1);
  }

  // Read CSV first
  const csvPath = path.join(__dirname, '..', 'jira-tickets-import.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`Error: CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  const issues = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => issues.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Found ${issues.length} issues to create\n`);

  // Setup labels from CSV
  setupLabels(issues);

  // Separate by type
  const epics = issues.filter(i => i['Issue Type'] === 'Epic');
  const stories = issues.filter(i => i['Issue Type'] === 'Story');
  const tasks = issues.filter(i => i['Issue Type'] === 'Task');

  console.log(`Epics: ${epics.length}`);
  console.log(`Stories: ${stories.length}`);
  console.log(`Tasks: ${tasks.length}\n`);

  // Tracking maps
  const epicMap = {}; // Epic Name -> Issue Number
  const storyMap = {}; // Story Summary -> Issue Number

  // Create Epics
  console.log('Creating Epics...\n');
  for (let i = 0; i < epics.length; i++) {
    const epic = epics[i];
    const issueNumber = createIssue(epic);

    if (issueNumber) {
      epicMap[epic['Epic Name']] = issueNumber;
    }

    // Batch delay
    if ((i + 1) % BATCH_SIZE === 0 && i + 1 < epics.length) {
      console.log(`  ⏸ Pausing for ${DELAY_MS}ms to avoid rate limiting...\n`);
      await delay(DELAY_MS);
    }
  }

  console.log('');

  // Create Stories
  console.log('Creating Stories...\n');
  for (let i = 0; i < stories.length; i++) {
    const story = stories[i];
    const parentEpicNumber = epicMap[story.Parent];
    const issueNumber = createIssue(story, parentEpicNumber);

    if (issueNumber) {
      storyMap[story.Summary] = issueNumber;
    }

    // Batch delay
    if ((i + 1) % BATCH_SIZE === 0 && i + 1 < stories.length) {
      console.log(`  ⏸ Pausing for ${DELAY_MS}ms to avoid rate limiting...\n`);
      await delay(DELAY_MS);
    }
  }

  console.log('');

  // Create Tasks
  console.log('Creating Tasks...\n');
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const parentStoryNumber = storyMap[task.Parent];

    if (!parentStoryNumber && !DRY_RUN) {
      console.warn(`⚠ Warning: Parent story not found for task: ${task.Summary}`);
    }

    createIssue(task, parentStoryNumber);

    // Batch delay
    if ((i + 1) % BATCH_SIZE === 0 && i + 1 < tasks.length) {
      console.log(`  ⏸ Pausing for ${DELAY_MS}ms to avoid rate limiting...\n`);
      await delay(DELAY_MS);
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Epics: ${Object.keys(epicMap).length}/${epics.length}`);
  console.log(`Stories: ${Object.keys(storyMap).length}/${stories.length}`);
  console.log(`Tasks: ${tasks.length}`);
  console.log('');

  if (DRY_RUN) {
    console.log('This was a DRY RUN. No issues were created.');
    console.log('To create issues for real, run: npm run create-issues');
  } else {
    console.log('✓ All issues created successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Create a GitHub Project: gh project create --title "AI Learning Platform"');
    console.log('2. Add issues to project: gh project item-add <project-id> --issue <issue-number>');
    console.log('3. Start working: gh issue develop <issue-number>');
  }
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
