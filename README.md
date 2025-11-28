# AI-Assisted Learning Platform

A comprehensive web application that enables learners to study any domain (Java, Cloud, Finance, Compliance, etc.) with AI-powered guidance, evaluation, and progress tracking.

## Features

- **Multi-Domain Learning**: Support for programming, cloud, business, finance, compliance, and more
- **AI-Powered Tutoring**: Interactive learning with configurable AI models (OpenAI, Anthropic, local LLMs)
- **Flexible Learning Modes**: Guided learning paths and exploratory learning
- **Adaptive Evaluation**: Domain-appropriate assessments (code review, quizzes, scenarios)
- **Progress Tracking**: Comprehensive analytics and knowledge gap identification
- **Multi-Model Support**: Configure and switch between multiple AI providers
- **Local LLM Support**: Use local models for cost savings and privacy

## Quick Start

### 1. Clone and Setup

```bash
# Clone repository
git clone https://github.com/your-org/ai-assisted-learn.git
cd ai-assisted-learn

# Install dependencies for GitHub automation
cd scripts
npm install
cd ..

# Setup backend
cd backend
npm install
cd ..

# Setup frontend
cd frontend
npm install
cd ..
```

### 2. Create GitHub Issues

```bash
# Preview issues that will be created (dry run)
cd scripts
npm run create-issues:dry-run

# Create all GitHub issues with proper labels and hierarchy
npm run create-issues
cd ..
```

### 3. Start Development Environment

```bash
# Start databases
docker-compose up -d

# Start backend (new terminal)
cd backend
npm run dev

# Start frontend (new terminal)
cd frontend
npm run dev
```

### 4. Start Working on GitHub Issues with Claude

```bash
# Start a GitHub issue
/gh-start 1

# Claude will:
# 1. Fetch issue details from GitHub
# 2. Create feature branch
# 3. Create todo list from acceptance criteria
# 4. Ask if you want to proceed with implementation

# After development, create PR
/gh-pr
```

## Project Structure

```
ai-assisted-learn/
├── backend/                 # Node.js/TypeScript backend
│   ├── src/
│   │   ├── api/            # REST API routes and controllers
│   │   ├── services/       # Business logic (AI, auth, curriculum)
│   │   ├── models/         # Database models
│   │   └── config/         # Configuration files
│   └── tests/              # Unit, integration, E2E tests
│
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── store/         # Redux store
│   └── public/
│
├── .github/
│   └── workflows/         # CI/CD and GitHub automation
│
├── .claude/
│   └── commands/          # Claude slash commands for GitHub workflow
│
├── scripts/               # GitHub automation and setup scripts
├── docs/                  # Documentation
│   ├── setup/            # Setup guides
│   ├── deployment/       # Deployment and CI/CD guides
│   └── github-workflow/  # GitHub workflow documentation
└── .do/                  # DigitalOcean configuration
```

## Documentation

- **[Getting Started](docs/setup/GETTING-STARTED.md)**: Complete setup guide
- **[GitHub Workflow Guide](docs/github-workflow/GITHUB-WORKFLOW-GUIDE.md)**: GitHub-native development workflow
- **[Project Structure](docs/project-structure.md)**: Detailed project organization
- **[CI/CD Guide](docs/deployment/CICD-GUIDE.md)**: CI/CD setup and deployment
- **[DigitalOcean Setup](docs/deployment/DIGITALOCEAN-SETUP.md)**: Cloud deployment guide

## Development Workflow

### Working with GitHub Issues

1. **Start Issue**: `/gh-start 1`
   - Fetches issue details from GitHub
   - Creates feature branch
   - Displays acceptance criteria
   - Creates todo list

2. **Develop with Claude**
   - Claude implements based on issue requirements
   - Tracks progress with todo list
   - Commits changes as needed

3. **Create Pull Request**: `/gh-pr`
   - Generates PR with issue reference
   - Includes acceptance criteria checklist
   - Links to related issues

4. **Merge and Complete**
   - PR review and approval
   - Merge to main branch
   - Issue automatically closed

### Branch Naming Convention

```
feature/1-user-authentication
epic/1-user-authentication-account-management
bugfix/issue-number-description
hotfix/critical-fix-description
```

### Commit Message Format

```
Summary of changes

- Detailed change 1
- Detailed change 2
- Detailed change 3

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

## GitHub Issues Breakdown

### Epics (9 Total)

1. **User Authentication & Account Management**
2. **Curriculum Management System**
3. **AI Model Integration Layer**
4. **Learning Session Management**
5. **AI-Powered Learning Interactions**
6. **Evaluation and Assessment System**
7. **Progress Tracking and Analytics**
8. **AI-Generated Curriculum** (Advanced)
9. **Infrastructure and DevOps**

**Total**: 9 Epics, 33 Stories, 107+ Tasks

Use `/gh-status` to see current progress and available issues.

## Technology Stack

### Backend
- **Framework**: Express.js (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **ORM**: Prisma or TypeORM
- **Authentication**: JWT + bcrypt

### Frontend
- **Framework**: React 18+ with Vite
- **Language**: TypeScript
- **State**: Redux Toolkit
- **Styling**: TailwindCSS
- **Code Editor**: Monaco Editor
- **Charts**: Recharts

### AI Integration
- OpenAI SDK
- Anthropic SDK
- LangChain (optional)
- Support for local LLMs (Ollama, LM Studio)

### DevOps
- Docker & Docker Compose
- GitHub Actions
- Sentry (error tracking)
- Prometheus + Grafana (metrics)

## Key Features by Epic

### 1. User Management
- Registration, login, JWT authentication
- Role-based access control (learner, instructor, admin)
- User profiles with learning preferences

### 2. Curriculum System
- Browse and select curricula by domain
- Hierarchical topic structure
- Progress tracking and navigation
- Curriculum creation for instructors

### 3. AI Integration
- Configure multiple AI providers
- Secure API key management
- Model selection and switching
- Local LLM support
- Provider abstraction layer

### 4. Learning Sessions
- Session lifecycle management
- Conversation history storage
- Context management for AI
- Resume from where you left off

### 5. AI Learning Modes
- **Guided**: Structured tutoring aligned to curriculum
- **Exploratory**: Tangential learning with relevance checking
- **Interactive Code**: Code execution and explanation
- **Resource Recommendations**: AI-suggested learning materials

### 6. Evaluation System
- **Quiz**: Multiple choice for conceptual knowledge
- **Code Review**: Automated testing and AI feedback
- **Scenarios**: Business/cloud/compliance case analysis
- **Adaptive Difficulty**: Performance-based question selection
- **Gap Identification**: Weak area detection and recommendations

### 7. Analytics
- Learning progress dashboard
- Topic mastery scoring
- Time tracking and learning pace
- Export analytics (CSV, JSON)

### 8. AI Curriculum Generation
- Generate personalized learning paths
- User inputs: domain, goals, skill level
- Review and edit before accepting

## Implementation Phases

### Phase 1: MVP (Weeks 1-4)
- User authentication
- Single curriculum support
- Basic AI integration (1 provider)
- Guided learning mode
- Simple quiz evaluation
- **JIRA Epics**: 1, 2 (partial), 3 (partial), 9

### Phase 2: Enhanced (Weeks 5-8)
- Multiple curricula
- Multi-model support (2-3 providers)
- Exploratory learning
- Code evaluation
- Progress analytics
- **JIRA Epics**: 2, 3, 4, 5, 6 (partial), 7

### Phase 3: Advanced (Weeks 9-12)
- Local LLM integration
- Adaptive evaluation
- Advanced analytics
- Scenario assessments
- **JIRA Epics**: 6, 8

### Phase 4: Polish (Weeks 13-16)
- AI curriculum generation
- Performance optimization
- Mobile responsiveness
- Documentation
- **Remaining tickets and polish**

## Environment Variables

### Backend `.env`
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/ai_learning
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# Users configure these in the app
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
```

## Getting API Keys

- **GitHub Token**: https://github.com/settings/tokens (for CLI automation)
- **OpenAI API Key**: https://platform.openai.com/api-keys (configured in app)
- **Anthropic API Key**: https://console.anthropic.com/settings/keys (configured in app)

## Database Setup

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Run migrations
cd backend
npm run migrate

# Seed sample data (optional)
npm run seed
```

## Testing

```bash
# Backend tests
cd backend
npm test                 # Unit tests
npm run test:integration # Integration tests
npm run test:e2e        # E2E tests

# Frontend tests
cd frontend
npm test                 # Unit tests
npm run test:e2e        # E2E tests with Playwright
```

## CI/CD Pipeline

### Automated Workflows
- **CI**: Run tests on every PR
- **CD**: Deploy to staging on merge to `main`
- **Release**: Deploy to production on tag `v*`
- **Project Automation**: Auto-update GitHub project boards

### GitHub Actions
- `.github/workflows/ci.yml` - Test and build
- `.github/workflows/deploy.yml` - Deploy to DigitalOcean
- `.github/workflows/pr-preview.yml` - Preview deployments
- `.github/workflows/project-automation.yml` - Project board updates

## Contributing

1. Pick a GitHub issue from the board
2. Start with `/gh-start <issue-number>`
3. Develop with Claude Code
4. Follow commit message format
5. Create PR with `/gh-pr`
6. Wait for review and merge

See [GitHub Workflow Guide](docs/github-workflow/GITHUB-WORKFLOW-GUIDE.md) for details.

## Troubleshooting

### GitHub CLI Issues
- Verify GitHub CLI is installed: `gh --version`
- Authenticate: `gh auth login`
- Check permissions for repo access

### Database Connection Issues
- Verify Docker containers are running: `docker ps`
- Check DATABASE_URL format
- Test connection: `npm run db:test`

### AI Provider Errors
- Verify API keys are correct
- Check rate limits and quotas
- Test with simple completion first

## Resources

- [Getting Started Guide](docs/setup/GETTING-STARTED.md)
- [GitHub Workflow Guide](docs/github-workflow/GITHUB-WORKFLOW-GUIDE.md)
- [Project Structure Details](docs/project-structure.md)
- [CI/CD Guide](docs/deployment/CICD-GUIDE.md)
- [DigitalOcean Setup](docs/deployment/DIGITALOCEAN-SETUP.md)

## Available Claude Commands

- `/gh-start <issue-number>` - Start working on a GitHub issue
- `/gh-pr` - Create a pull request
- `/gh-status` - Show current GitHub status
- `/gh-issue` - Create a new GitHub issue
- `/gh-review` - Review pull request
- `/gh-project-setup` - Setup GitHub project board

## License

MIT License - See LICENSE file for details

## Support

- **Issues**: https://github.com/your-org/ai-assisted-learn/issues
- **Discussions**: https://github.com/your-org/ai-assisted-learn/discussions

---

**Ready to start learning with AI?** Create GitHub issues, setup your environment, and start with `/gh-start 1`!
