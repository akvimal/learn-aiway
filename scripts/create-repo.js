/**
 * Create GitHub Repository Helper
 *
 * This script helps you create a GitHub repository and push your code
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function exec(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: options.cwd || process.cwd()
    });
    return result;
  } catch (error) {
    if (!options.ignoreError) {
      console.error(`Error executing: ${command}`);
      if (error.stderr) console.error(error.stderr);
    }
    return null;
  }
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('GitHub Repository Setup');
  console.log('='.repeat(60));
  console.log('');

  // Check if already in a repo
  const repoCheck = exec('gh repo view --json nameWithOwner 2>&1', { silent: true, ignoreError: true });
  if (repoCheck && !repoCheck.includes('error')) {
    try {
      const repo = JSON.parse(repoCheck);
      console.log(`✓ Already connected to repository: ${repo.nameWithOwner}`);
      console.log('');
      console.log('You can now run:');
      console.log('  npm run create-issues:dry-run');
      console.log('  npm run create-issues');
      rl.close();
      return;
    } catch (e) {
      // Continue if parsing fails
    }
  }

  console.log('You need to create a GitHub repository first.\n');
  console.log('Choose an option:\n');
  console.log('1. Create NEW repository from command line (quick)');
  console.log('2. Connect to EXISTING repository on GitHub');
  console.log('3. Exit and create manually\n');

  const choice = await question('Enter your choice (1, 2, or 3): ');
  console.log('');

  if (choice === '1') {
    // Create new repository
    const repoName = await question('Repository name [ai-assisted-learn]: ') || 'ai-assisted-learn';
    const isPublic = await question('Public or Private? (pub/priv) [pub]: ') || 'pub';
    const visibility = isPublic.toLowerCase().startsWith('priv') ? 'private' : 'public';

    console.log('');
    console.log(`Creating ${visibility} repository: ${repoName}...`);
    console.log('');

    // Navigate to parent directory
    const parentDir = require('path').join(__dirname, '..');

    // Check if git is initialized
    const gitCheck = exec('git status', { silent: true, ignoreError: true, cwd: parentDir });

    if (!gitCheck) {
      console.log('Initializing git repository...');
      exec('git init', { cwd: parentDir });
      exec('git add .', { cwd: parentDir });
      exec('git commit -m "Initial commit with GitHub-native setup"', { cwd: parentDir });
      exec('git branch -M main', { cwd: parentDir });
    }

    // Create GitHub repository
    const createCmd = `gh repo create ${repoName} --${visibility} --source=. --remote=origin --push`;
    console.log(`Running: ${createCmd}\n`);

    const result = exec(createCmd, { cwd: parentDir });

    if (result !== null) {
      console.log('');
      console.log('✓ Repository created and code pushed!');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Preview issues: npm run create-issues:dry-run');
      console.log('  2. Create issues: npm run create-issues');
      console.log('  3. Start working: /gh-start 1');
    } else {
      console.log('');
      console.log('✗ Failed to create repository');
      console.log('Try creating manually at: https://github.com/new');
    }

  } else if (choice === '2') {
    // Connect to existing repository
    console.log('Enter your existing repository details:\n');
    const username = await question('GitHub username: ');
    const repoName = await question('Repository name: ');

    console.log('');
    console.log(`Connecting to https://github.com/${username}/${repoName}...`);
    console.log('');

    const parentDir = require('path').join(__dirname, '..');

    // Check if git is initialized
    const gitCheck = exec('git status', { silent: true, ignoreError: true, cwd: parentDir });

    if (!gitCheck) {
      console.log('Initializing git repository...');
      exec('git init', { cwd: parentDir });
      exec('git add .', { cwd: parentDir });
      exec('git commit -m "Initial commit with GitHub-native setup"', { cwd: parentDir });
      exec('git branch -M main', { cwd: parentDir });
    }

    // Add remote and push
    exec(`git remote add origin https://github.com/${username}/${repoName}.git`, { cwd: parentDir, ignoreError: true });
    exec('git push -u origin main', { cwd: parentDir });

    console.log('');
    console.log('✓ Connected to repository!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Preview issues: npm run create-issues:dry-run');
    console.log('  2. Create issues: npm run create-issues');

  } else {
    console.log('Create your repository manually:');
    console.log('');
    console.log('1. Go to https://github.com/new');
    console.log('2. Create repository: ai-assisted-learn');
    console.log('3. Then run this script again and choose option 2');
  }

  rl.close();
}

main().catch(error => {
  console.error('Error:', error.message);
  rl.close();
  process.exit(1);
});
