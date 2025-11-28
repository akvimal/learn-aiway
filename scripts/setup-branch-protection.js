/**
 * Setup Branch Protection Rules
 *
 * This script configures branch protection rules for the repository using GitHub API
 *
 * Usage:
 *   node scripts/setup-branch-protection.js
 *
 * Environment variables required:
 *   GITHUB_TOKEN - GitHub Personal Access Token with repo scope
 *   GITHUB_REPOSITORY - Format: owner/repo (e.g., "username/ai-learning")
 */

const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable is required');
  console.log('\nTo create a token:');
  console.log('1. Go to GitHub → Settings → Developer settings → Personal access tokens');
  console.log('2. Click "Generate new token (classic)"');
  console.log('3. Select "repo" scope');
  console.log('4. Copy the token and set it as GITHUB_TOKEN');
  process.exit(1);
}

if (!GITHUB_REPOSITORY) {
  console.error('❌ GITHUB_REPOSITORY environment variable is required');
  console.log('\nFormat: owner/repo (e.g., "username/ai-learning")');
  process.exit(1);
}

const [owner, repo] = GITHUB_REPOSITORY.split('/');

// Branch protection configuration
const mainBranchProtection = {
  required_status_checks: {
    strict: true,
    contexts: [
      'Test Backend',
      'Test Frontend',
      'Build Docker Images',
      'All Tests Passed'
    ]
  },
  enforce_admins: false,
  required_pull_request_reviews: {
    dismissal_restrictions: {},
    dismiss_stale_reviews: true,
    require_code_owner_reviews: true,
    required_approving_review_count: 1,
    require_last_push_approval: false,
  },
  restrictions: null,
  required_linear_history: true,
  allow_force_pushes: false,
  allow_deletions: false,
  block_creations: false,
  required_conversation_resolution: true,
  lock_branch: false,
  allow_fork_syncing: true
};

const developBranchProtection = {
  ...mainBranchProtection,
  required_pull_request_reviews: {
    ...mainBranchProtection.required_pull_request_reviews,
    required_approving_review_count: 0  // No approval required for develop
  }
};

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'AI-Learning-Setup-Script',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    };

    if (data) {
      options.headers['Content-Type'] = 'application/json';
    }

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            statusCode: res.statusCode,
            data: body ? JSON.parse(body) : null
          });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function setupBranchProtection(branch, config) {
  console.log(`\n📋 Setting up protection for branch: ${branch}`);

  try {
    const path = `/repos/${owner}/${repo}/branches/${branch}/protection`;
    const response = await makeRequest(path, 'PUT', config);

    console.log(`✅ Branch protection configured for ${branch}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to configure ${branch}:`, error.message);
    return false;
  }
}

async function checkBranchExists(branch) {
  try {
    const path = `/repos/${owner}/${repo}/branches/${branch}`;
    await makeRequest(path, 'GET');
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🚀 Setting up branch protection rules...');
  console.log(`Repository: ${GITHUB_REPOSITORY}\n`);

  // Check if main branch exists
  const mainExists = await checkBranchExists('main');
  if (!mainExists) {
    console.log('⚠️  Main branch does not exist yet. Skipping main branch protection.');
  } else {
    await setupBranchProtection('main', mainBranchProtection);
  }

  // Check if develop branch exists
  const developExists = await checkBranchExists('develop');
  if (!developExists) {
    console.log('\n⚠️  Develop branch does not exist yet. Skipping develop branch protection.');
    console.log('💡 To create develop branch:');
    console.log('   git checkout -b develop');
    console.log('   git push -u origin develop');
  } else {
    await setupBranchProtection('develop', developBranchProtection);
  }

  console.log('\n✨ Branch protection setup complete!');
  console.log('\n📚 Next steps:');
  console.log('1. Verify protection rules at:');
  console.log(`   https://github.com/${owner}/${repo}/settings/branches`);
  console.log('2. Configure GitHub Secrets for deployments');
  console.log('3. Review the CI/CD guide: Documentation/CICD-GUIDE.md');
}

main().catch((error) => {
  console.error('\n❌ Setup failed:', error.message);
  process.exit(1);
});
