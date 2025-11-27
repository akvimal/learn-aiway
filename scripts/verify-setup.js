/**
 * Verify Setup Script
 *
 * Checks if all required tools are installed and configured
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function exec(command, silent = true) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit'
    });
  } catch (error) {
    return null;
  }
}

function checkCommand(command, name) {
  const result = exec(command);
  if (result) {
    console.log(`✅ ${name} is installed`);
    console.log(`   ${result.trim().split('\n')[0]}`);
    return true;
  } else {
    console.log(`❌ ${name} is NOT installed or not in PATH`);
    return false;
  }
}

console.log('='.repeat(60));
console.log('Setup Verification');
console.log('='.repeat(60));
console.log('');

// Check Node.js
console.log('1. Checking Node.js...');
checkCommand('node --version', 'Node.js');
console.log('');

// Check npm
console.log('2. Checking npm...');
checkCommand('npm --version', 'npm');
console.log('');

// Check Git
console.log('3. Checking Git...');
checkCommand('git --version', 'Git');
console.log('');

// Check GitHub CLI
console.log('4. Checking GitHub CLI...');
const ghInstalled = checkCommand('gh --version', 'GitHub CLI');
console.log('');

if (!ghInstalled) {
  console.log('⚠️  GitHub CLI is not accessible in your PATH');
  console.log('');
  console.log('Solutions:');
  console.log('1. RESTART your terminal (close and reopen)');
  console.log('2. If still not working, check installation:');
  console.log('   - Default path: C:\\Program Files\\GitHub CLI\\');
  console.log('   - Verify gh.exe exists there');
  console.log('3. Add to PATH manually if needed');
  console.log('');
} else {
  // Check GitHub authentication
  console.log('5. Checking GitHub authentication...');
  const authStatus = exec('gh auth status 2>&1');

  if (authStatus && authStatus.includes('Logged in')) {
    console.log('✅ GitHub CLI is authenticated');
    const username = authStatus.match(/Logged in to github\.com as ([^\s]+)/);
    if (username) {
      console.log(`   User: ${username[1]}`);
    }
  } else {
    console.log('❌ GitHub CLI is NOT authenticated');
    console.log('');
    console.log('To authenticate:');
    console.log('   gh auth login');
  }
  console.log('');
}

// Check CSV file
console.log('6. Checking CSV file...');
const csvPath = path.join(__dirname, '..', 'jira-tickets-import.csv');
if (fs.existsSync(csvPath)) {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').length - 1;
  console.log(`✅ CSV file exists (${lines} issues)`);
} else {
  console.log('❌ CSV file not found');
}
console.log('');

// Check dependencies
console.log('7. Checking npm dependencies...');
const packageJsonPath = path.join(__dirname, 'package.json');
const nodeModulesPath = path.join(__dirname, 'node_modules');

if (fs.existsSync(packageJsonPath) && fs.existsSync(nodeModulesPath)) {
  console.log('✅ npm dependencies installed');
} else {
  console.log('❌ npm dependencies NOT installed');
  console.log('   Run: npm install');
}
console.log('');

console.log('='.repeat(60));
console.log('Summary');
console.log('='.repeat(60));
console.log('');

if (!ghInstalled) {
  console.log('⚠️  ACTION REQUIRED:');
  console.log('');
  console.log('1. CLOSE this terminal completely');
  console.log('2. OPEN a new terminal');
  console.log('3. Run this script again: npm run verify');
  console.log('');
  console.log('If GitHub CLI still not found:');
  console.log('- Check: C:\\Program Files\\GitHub CLI\\gh.exe');
  console.log('- Reinstall: winget install --id GitHub.cli');
} else {
  const authStatus = exec('gh auth status 2>&1');
  if (!authStatus || !authStatus.includes('Logged in')) {
    console.log('⚠️  ACTION REQUIRED:');
    console.log('');
    console.log('Authenticate GitHub CLI:');
    console.log('   gh auth login');
    console.log('');
  } else {
    console.log('✅ All set! You can now:');
    console.log('');
    console.log('1. Preview issues:');
    console.log('   npm run create-issues:dry-run');
    console.log('');
    console.log('2. Create all issues:');
    console.log('   npm run create-issues');
    console.log('');
    console.log('3. Use Claude commands:');
    console.log('   /gh-start 1');
    console.log('');
  }
}
