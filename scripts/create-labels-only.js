/**
 * Create Labels Only
 *
 * Simple script to create all labels from CSV
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

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

  // Other
  rbac: 'FFB6C1',
  navigation: '87CEEB',
  mvp: 'C2E0C6',
  models: 'FF69B4',
  config: '9370DB',
};

async function main() {
  console.log('='.repeat(60));
  console.log('Label Creation Script');
  console.log('='.repeat(60));
  console.log('');

  // Read CSV
  const csvPath = path.join(__dirname, '..', 'jira-tickets-import.csv');
  const issues = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => issues.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  // Extract unique labels
  const labelSet = new Set();

  issues.forEach(issue => {
    if (issue.Labels) {
      issue.Labels.split('|').forEach(label => {
        labelSet.add(label.trim().toLowerCase());
      });
    }
    if (issue['Issue Type']) {
      labelSet.add(issue['Issue Type'].toLowerCase());
    }
  });

  const labels = Array.from(labelSet).sort();

  console.log(`Found ${labels.length} unique labels from CSV\n`);

  let successCount = 0;
  let failCount = 0;
  let existCount = 0;

  for (const labelName of labels) {
    const color = LABEL_COLORS[labelName] || 'CCCCCC';
    const description = `Label: ${labelName}`;

    try {
      const cmd = `gh label create "${labelName}" --color "${color}" --description "${description}"`;

      execSync(cmd, {
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      console.log(`✅ Created: ${labelName}`);
      successCount++;

    } catch (err) {
      const stderr = err.stderr ? err.stderr.toString() : err.message;

      if (stderr.includes('already exists')) {
        console.log(`✓  Exists:  ${labelName}`);
        existCount++;
      } else {
        console.log(`❌ Failed:  ${labelName}`);
        console.log(`   Error: ${stderr.trim()}`);
        failCount++;
      }
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total labels:   ${labels.length}`);
  console.log(`Created:        ${successCount}`);
  console.log(`Already exist:  ${existCount}`);
  console.log(`Failed:         ${failCount}`);
  console.log('');

  if (failCount === 0) {
    console.log('✅ All labels ready! You can now run:');
    console.log('   npm run create-issues');
  } else {
    console.log('⚠️  Some labels failed. Check errors above.');
  }

  // Verify by listing all labels
  console.log('');
  console.log('Verifying labels in repository...');
  try {
    const result = execSync('gh label list --limit 1000 --json name', {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    const repoLabels = JSON.parse(result);
    console.log(`✓ Repository now has ${repoLabels.length} labels total`);
  } catch (err) {
    console.log('Could not verify labels');
  }
}

main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
