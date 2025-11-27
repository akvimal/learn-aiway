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

### 1. Import JIRA Tickets

```bash
# Option 1: CSV Import via JIRA UI
# Go to JIRA → Import → Upload jira-tickets-import.csv

# Option 2: API Import
npm install
node scripts/import-to-jira.js
```

### 2. Clone and Setup

```bash
# Clone repository
git clone https://github.com/your-org/ai-assisted-learn.git
cd ai-assisted-learn

# Setup environment variables
cp .env.example .env
# Edit .env with your JIRA and GitHub credentials

# Setup backend
cd backend
cp .env.example .env
npm install
cd ..

# Setup frontend
cd frontend
npm install
cd ..
```

### 3. Start Development Environment

```bash
# Start databases
docker-compose -f docker-compose.dev.yml up -d

# Start backend (new terminal)
cd backend
npm run dev

# Start frontend (new terminal)
cd frontend
npm run dev
```

### 4. Start Working on JIRA Tickets with Claude

```bash
# Start a JIRA ticket
/jira-start AILEARN-123

# Claude will:
# 1. Fetch ticket details
# 2. Create feature branch
# 3. Create todo list from acceptance criteria
# 4. Ask if you want to proceed with implementation

# After development, create PR
/jira-pr AILEARN-123
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
│   └── workflows/         # CI/CD and JIRA integration
│
├── .claude/
│   ├── commands/          # Claude slash commands
│   └── scripts/           # JIRA integration scripts
│
├── scripts/               # Utility scripts
├── docs/                  # Documentation
└── docker/                # Docker configurations
```

## Documentation

- **[System Design](design-outline.md)**: Comprehensive design outline
- **[JIRA Integration Guide](jira-integration-guide.md)**: JIRA-Claude-GitHub workflow
- **[Project Structure](project-structure.md)**: Detailed project organization
- **[JIRA Tickets](jira-tickets-import.csv)**: Complete ticket breakdown

## Development Workflow

### Working with JIRA Tickets

1. **Start Ticket**: `/jira-start AILEARN-123`
   - Fetches ticket details from JIRA
   - Creates feature branch
   - Displays acceptance criteria
   - Creates todo list

2. **Develop with Claude**
   - Claude implements based on ticket requirements
   - Tracks progress with todo list
   - Updates JIRA status automatically

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "AILEARN-123: Implement user authentication"
   git push -u origin feature/AILEARN-123-user-auth
   ```

4. **Create Pull Request**: `/jira-pr AILEARN-123`
   - Generates PR with JIRA link
   - Updates JIRA status to "In Review"
   - Adds PR link to JIRA ticket

5. **Merge and Complete**
   - PR merged → JIRA status automatically updates to "Done"
   - Ticket linked to GitHub release

### Branch Naming Convention

```
feature/AILEARN-123-short-description
bugfix/AILEARN-456-bug-description
hotfix/AILEARN-789-critical-fix
```

### Commit Message Format

```
AILEARN-123: Summary of changes

- Detailed change 1
- Detailed change 2
- Detailed change 3

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

## JIRA Ticket Breakdown

### Epics (9 Total)

1. **User Authentication & Account Management** (3 stories, 9 tasks)
2. **Curriculum Management System** (4 stories, 13 tasks)
3. **AI Model Integration Layer** (5 stories, 17 tasks)
4. **Learning Session Management** (3 stories, 8 tasks)
5. **AI-Powered Learning Interactions** (4 stories, 15 tasks)
6. **Evaluation and Assessment System** (6 stories, 20 tasks)
7. **Progress Tracking and Analytics** (3 stories, 8 tasks)
8. **AI-Generated Curriculum** (1 story, 4 tasks) - Advanced
9. **Infrastructure and DevOps** (4 stories, 13 tasks)

**Total**: 9 Epics, 33 Stories, 107+ Tasks

See `jira-tickets-import.csv` for complete breakdown.

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

### Root `.env`
```bash
JIRA_URL=https://your-domain.atlassian.net
JIRA_USER=your-email@example.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=AILEARN
GITHUB_TOKEN=ghp_your_token
```

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

- **JIRA API Token**: https://id.atlassian.com/manage-profile/security/api-tokens
- **GitHub Token**: https://github.com/settings/tokens
- **OpenAI API Key**: https://platform.openai.com/api-keys
- **Anthropic API Key**: https://console.anthropic.com/settings/keys

## Database Setup

```bash
# Start PostgreSQL and Redis
docker-compose -f docker-compose.dev.yml up -d

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
- **CD**: Deploy to staging on merge to `develop`
- **Release**: Deploy to production on tag `v*`
- **JIRA Integration**: Auto-update ticket status on PR events

### GitHub Actions
- `.github/workflows/ci.yml` - Test and build
- `.github/workflows/cd.yml` - Deploy
- `.github/workflows/jira-integration.yml` - JIRA updates
- `.github/workflows/release.yml` - Release management

## Contributing

1. Pick a JIRA ticket from the backlog
2. Start with `/jira-start AILEARN-XXX`
3. Develop with Claude Code
4. Follow commit message format
5. Create PR with `/jira-pr AILEARN-XXX`
6. Wait for review and merge

See [Contributing Guidelines](docs/development/contributing.md) for details.

## Troubleshooting

### JIRA Integration Issues
- Verify API token has write permissions
- Check that JIRA_AUTH is base64 encoded
- Ensure ticket key format matches regex in workflows

### Database Connection Issues
- Verify Docker containers are running: `docker ps`
- Check DATABASE_URL format
- Test connection: `npm run db:test`

### AI Provider Errors
- Verify API keys are correct
- Check rate limits and quotas
- Test with simple completion first

## Resources

- [System Design Outline](design-outline.md)
- [JIRA Integration Guide](jira-integration-guide.md)
- [Project Structure Details](project-structure.md)
- [API Documentation](docs/architecture/api-specification.md)
- [Development Setup](docs/development/setup.md)

## License

MIT License - See LICENSE file for details

## Support

- **Issues**: https://github.com/your-org/ai-assisted-learn/issues
- **Discussions**: https://github.com/your-org/ai-assisted-learn/discussions
- **JIRA**: https://your-domain.atlassian.net/browse/AILEARN

---

**Ready to start learning with AI?** Import the JIRA tickets, setup your environment, and start with `/jira-start AILEARN-1`!
