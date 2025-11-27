/**
 * JIRA Import Script
 *
 * Imports tickets from CSV to JIRA via REST API
 *
 * Setup:
 * 1. npm install axios csv-parser dotenv
 * 2. Configure .env with JIRA credentials
 * 3. Run: node scripts/import-to-jira.js
 */

const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
require('dotenv').config();

// Configuration
const JIRA_URL = process.env.JIRA_URL;
const JIRA_USER = process.env.JIRA_USER;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const PROJECT_KEY = process.env.JIRA_PROJECT_KEY || 'AILEARN';

if (!JIRA_URL || !JIRA_USER || !JIRA_API_TOKEN) {
  console.error('Error: Missing JIRA credentials in .env file');
  console.error('Required: JIRA_URL, JIRA_USER, JIRA_API_TOKEN');
  process.exit(1);
}

const JIRA_AUTH = Buffer.from(`${JIRA_USER}:${JIRA_API_TOKEN}`).toString('base64');

// Delay helper to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create a JIRA issue
 */
async function createIssue(issue, parentKey = null, epicKey = null) {
  try {
    const fields = {
      project: { key: PROJECT_KEY },
      issuetype: { name: issue['Issue Type'] },
      summary: issue.Summary,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: issue.Description || issue.Summary
              }
            ]
          }
        ]
      }
    };

    // Add optional fields
    if (issue.Priority) {
      fields.priority = { name: issue.Priority };
    }

    if (issue.Labels) {
      fields.labels = issue.Labels.split('|').map(l => l.trim());
    }

    if (issue['Story Points'] && !isNaN(issue['Story Points'])) {
      fields.customfield_10016 = parseInt(issue['Story Points']); // Adjust field ID
    }

    if (issue.Components) {
      fields.components = issue.Components.split('|').map(c => ({ name: c.trim() }));
    }

    if (issue['Acceptance Criteria']) {
      // Add as description append or custom field
      fields.description.content.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Acceptance Criteria' }]
      });

      const criteria = issue['Acceptance Criteria'].split(';');
      criteria.forEach(criterion => {
        fields.description.content.push({
          type: 'paragraph',
          content: [{ type: 'text', text: `✓ ${criterion.trim()}` }]
        });
      });
    }

    // Link to parent (for Stories under Epics)
    if (parentKey) {
      fields.parent = { key: parentKey };
    }

    // Link to Epic (for Tasks under Stories)
    if (epicKey && issue['Issue Type'] !== 'Epic') {
      fields.customfield_10014 = epicKey; // Epic Link field (adjust ID)
    }

    // Epic Name for Epics
    if (issue['Issue Type'] === 'Epic' && issue['Epic Name']) {
      fields.customfield_10011 = issue['Epic Name']; // Epic Name field (adjust ID)
    }

    const response = await axios.post(
      `${JIRA_URL}/rest/api/3/issue`,
      { fields },
      {
        headers: {
          'Authorization': `Basic ${JIRA_AUTH}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Error creating issue: ${issue.Summary}`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

/**
 * Main import function
 */
async function importFromCSV() {
  console.log('Starting JIRA import...');
  console.log(`JIRA URL: ${JIRA_URL}`);
  console.log(`Project Key: ${PROJECT_KEY}`);
  console.log('');

  const csvPath = path.join(__dirname, '..', 'jira-tickets-import.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`Error: CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  const issues = [];

  // Read CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        issues.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Found ${issues.length} issues to import\n`);

  // Separate by type
  const epics = issues.filter(i => i['Issue Type'] === 'Epic');
  const stories = issues.filter(i => i['Issue Type'] === 'Story');
  const tasks = issues.filter(i => i['Issue Type'] === 'Task');

  console.log(`Epics: ${epics.length}`);
  console.log(`Stories: ${stories.length}`);
  console.log(`Tasks: ${tasks.length}\n`);

  // Maps to track created issues
  const epicMap = {}; // Epic Name -> JIRA Key
  const storyMap = {}; // Story Summary -> JIRA Key

  // Create Epics
  console.log('Creating Epics...');
  for (const epic of epics) {
    try {
      const created = await createIssue(epic);
      epicMap[epic['Epic Name']] = created.key;
      console.log(`✓ Created Epic: ${created.key} - ${epic.Summary}`);
      await delay(500); // Rate limiting
    } catch (error) {
      console.error(`✗ Failed to create Epic: ${epic.Summary}`);
    }
  }

  console.log('');

  // Create Stories
  console.log('Creating Stories...');
  for (const story of stories) {
    try {
      const epicKey = epicMap[story.Parent];
      const created = await createIssue(story, epicKey, epicKey);
      storyMap[story.Summary] = created.key;
      console.log(`✓ Created Story: ${created.key} - ${story.Summary}`);
      await delay(500);
    } catch (error) {
      console.error(`✗ Failed to create Story: ${story.Summary}`);
    }
  }

  console.log('');

  // Create Tasks
  console.log('Creating Tasks...');
  for (const task of tasks) {
    try {
      const storyKey = storyMap[task.Parent];

      if (!storyKey) {
        console.warn(`⚠ Warning: Parent story not found for task: ${task.Summary}`);
        continue;
      }

      // Find Epic for this task through its parent story
      const parentStory = stories.find(s => s.Summary === task.Parent);
      const epicKey = parentStory ? epicMap[parentStory.Parent] : null;

      const created = await createIssue(task, storyKey, epicKey);
      console.log(`✓ Created Task: ${created.key} - ${task.Summary}`);
      await delay(500);
    } catch (error) {
      console.error(`✗ Failed to create Task: ${task.Summary}`);
    }
  }

  console.log('');
  console.log('Import complete!');
  console.log('');
  console.log('Summary:');
  console.log(`  Epics created: ${Object.keys(epicMap).length}/${epics.length}`);
  console.log(`  Stories created: ${Object.keys(storyMap).length}/${stories.length}`);
  console.log('');
  console.log(`View your project at: ${JIRA_URL}/browse/${PROJECT_KEY}`);
}

/**
 * Validate JIRA connection
 */
async function validateConnection() {
  try {
    const response = await axios.get(
      `${JIRA_URL}/rest/api/3/project/${PROJECT_KEY}`,
      {
        headers: {
          'Authorization': `Basic ${JIRA_AUTH}`,
          'Accept': 'application/json'
        }
      }
    );

    console.log(`✓ Connected to JIRA project: ${response.data.name}`);
    return true;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error(`✗ Error: Project ${PROJECT_KEY} not found`);
      console.error('Please create the project in JIRA first or update JIRA_PROJECT_KEY in .env');
    } else if (error.response && error.response.status === 401) {
      console.error('✗ Error: Authentication failed');
      console.error('Please check JIRA_USER and JIRA_API_TOKEN in .env');
    } else {
      console.error('✗ Error connecting to JIRA:', error.message);
    }
    return false;
  }
}

// Run import
(async () => {
  console.log('='.repeat(60));
  console.log('JIRA Ticket Import Tool');
  console.log('='.repeat(60));
  console.log('');

  const isValid = await validateConnection();
  if (!isValid) {
    process.exit(1);
  }

  console.log('');

  await importFromCSV();
})();
