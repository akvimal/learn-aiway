# AI-Assisted Learning Platform - Project Structure

## Recommended Directory Structure

```
ai-assisted-learn/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # CI pipeline (test, build)
│   │   ├── cd.yml                    # CD pipeline (deploy)
│   │   ├── jira-integration.yml      # JIRA status updates
│   │   └── release.yml               # Release management
│   ├── PULL_REQUEST_TEMPLATE.md      # PR template with JIRA reference
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
│
├── .claude/
│   ├── commands/
│   │   ├── jira-start.md             # Start JIRA ticket
│   │   ├── jira-update.md            # Update JIRA status
│   │   └── jira-pr.md                # Create PR with JIRA link
│   └── scripts/
│       ├── fetch-jira-ticket.sh      # Fetch ticket details
│       └── update-jira-status.sh     # Update ticket status
│
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── curriculum.routes.ts
│   │   │   │   ├── learning-session.routes.ts
│   │   │   │   ├── ai-model.routes.ts
│   │   │   │   ├── evaluation.routes.ts
│   │   │   │   └── analytics.routes.ts
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   └── rbac.middleware.ts
│   │   │   └── validators/
│   │   │
│   │   ├── services/
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── jwt.service.ts
│   │   │   ├── curriculum/
│   │   │   │   ├── curriculum.service.ts
│   │   │   │   └── progress.service.ts
│   │   │   ├── ai/
│   │   │   │   ├── ai-orchestrator.service.ts
│   │   │   │   ├── providers/
│   │   │   │   │   ├── provider.interface.ts
│   │   │   │   │   ├── openai.provider.ts
│   │   │   │   │   ├── anthropic.provider.ts
│   │   │   │   │   ├── local-llm.provider.ts
│   │   │   │   │   └── provider.factory.ts
│   │   │   │   ├── prompt-templates/
│   │   │   │   │   ├── guided-learning.template.ts
│   │   │   │   │   ├── exploratory.template.ts
│   │   │   │   │   └── evaluation.template.ts
│   │   │   │   └── context-manager.service.ts
│   │   │   ├── session/
│   │   │   │   └── learning-session.service.ts
│   │   │   ├── evaluation/
│   │   │   │   ├── evaluation.service.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── quiz.strategy.ts
│   │   │   │   │   ├── code-review.strategy.ts
│   │   │   │   │   └── scenario.strategy.ts
│   │   │   │   └── rubric.service.ts
│   │   │   └── analytics/
│   │   │       ├── analytics.service.ts
│   │   │       └── gap-analysis.service.ts
│   │   │
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   ├── curriculum.model.ts
│   │   │   ├── topic.model.ts
│   │   │   ├── learning-session.model.ts
│   │   │   ├── conversation.model.ts
│   │   │   ├── evaluation.model.ts
│   │   │   ├── ai-model.model.ts
│   │   │   └── progress.model.ts
│   │   │
│   │   ├── repositories/
│   │   │   ├── base.repository.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── curriculum.repository.ts
│   │   │   └── session.repository.ts
│   │   │
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   ├── redis.config.ts
│   │   │   └── environment.config.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── encryption.util.ts
│   │   │   ├── validation.util.ts
│   │   │   └── logger.util.ts
│   │   │
│   │   ├── types/
│   │   │   ├── express.d.ts
│   │   │   └── models.types.ts
│   │   │
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   │
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── curriculum/
│   │   │   │   ├── CurriculumBrowser.tsx
│   │   │   │   ├── CurriculumDetail.tsx
│   │   │   │   ├── TopicNavigator.tsx
│   │   │   │   └── ProgressIndicator.tsx
│   │   │   ├── learning/
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── MessageInput.tsx
│   │   │   │   └── CodeEditor.tsx
│   │   │   ├── evaluation/
│   │   │   │   ├── QuizInterface.tsx
│   │   │   │   ├── CodeSubmission.tsx
│   │   │   │   └── FeedbackDisplay.tsx
│   │   │   ├── analytics/
│   │   │   │   ├── ProgressDashboard.tsx
│   │   │   │   ├── MasteryChart.tsx
│   │   │   │   └── GapAnalysis.tsx
│   │   │   ├── settings/
│   │   │   │   ├── ProfileSettings.tsx
│   │   │   │   └── ModelConfiguration.tsx
│   │   │   └── common/
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Modal.tsx
│   │   │       └── Loading.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CurriculumList.tsx
│   │   │   ├── LearningSession.tsx
│   │   │   ├── Evaluation.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── Settings.tsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── curriculum.service.ts
│   │   │   ├── session.service.ts
│   │   │   └── websocket.service.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useCurriculum.ts
│   │   │   ├── useSession.ts
│   │   │   └── useWebSocket.ts
│   │   │
│   │   ├── store/
│   │   │   ├── index.ts
│   │   │   ├── slices/
│   │   │   │   ├── auth.slice.ts
│   │   │   │   ├── curriculum.slice.ts
│   │   │   │   └── session.slice.ts
│   │   │   └── api/
│   │   │       └── apiSlice.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   ├── formatting.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── types/
│   │   │   ├── user.types.ts
│   │   │   ├── curriculum.types.ts
│   │   │   └── session.types.ts
│   │   │
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── scripts/
│   ├── import-to-jira.js           # Import CSV to JIRA via API
│   ├── setup-dev-env.sh            # Setup development environment
│   └── seed-database.ts            # Seed initial data
│
├── docs/
│   ├── architecture/
│   │   ├── system-design.md
│   │   ├── data-model.md
│   │   └── api-specification.md
│   ├── user-guide/
│   │   ├── getting-started.md
│   │   ├── using-ai-models.md
│   │   └── evaluation-guide.md
│   └── development/
│       ├── setup.md
│       ├── contributing.md
│       └── testing.md
│
├── docker/
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── .gitignore
├── README.md
├── package.json                    # Root package.json for monorepo
├── jira-tickets-import.csv         # JIRA import file
└── jira-integration-guide.md       # Integration guide
```

---

## Technology Stack per Module

### Backend (`/backend`)
- **Framework**: Express.js (Node.js) or FastAPI (Python)
- **Language**: TypeScript or Python
- **Database**: PostgreSQL
- **Cache**: Redis
- **ORM**: Prisma, TypeORM, or SQLAlchemy
- **Authentication**: JWT + bcrypt
- **Validation**: Zod or Joi
- **Testing**: Jest, Supertest

### Frontend (`/frontend`)
- **Framework**: React + Vite
- **Language**: TypeScript
- **State Management**: Redux Toolkit or Zustand
- **UI Library**: TailwindCSS
- **API Client**: Axios or Fetch
- **Code Editor**: Monaco Editor or CodeMirror
- **Charts**: Recharts or Chart.js
- **Testing**: Vitest, React Testing Library

### AI Integration
- **Libraries**:
  - OpenAI SDK (`openai`)
  - Anthropic SDK (`@anthropic-ai/sdk`)
  - LangChain (optional for advanced flows)
  - LiteLLM (for unified interface)

### DevOps
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry (errors), Prometheus + Grafana (metrics)
- **Logging**: Winston or Pino

---

## Initial Setup Commands

### 1. Clone and Setup

```bash
# Create project directory
mkdir ai-assisted-learn
cd ai-assisted-learn

# Initialize git
git init
git remote add origin https://github.com/your-org/ai-assisted-learn.git

# Setup backend
mkdir -p backend/src
cd backend
npm init -y
npm install express typescript ts-node @types/node @types/express
npm install jsonwebtoken bcrypt dotenv pg redis
npm install -D jest @types/jest ts-jest
cd ..

# Setup frontend
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install @reduxjs/toolkit react-redux axios react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
cd ..

# Setup Docker
touch docker-compose.yml docker-compose.dev.yml
```

### 2. Setup JIRA Integration

```bash
# Create Claude commands
mkdir -p .claude/commands .claude/scripts

# Create JIRA scripts
touch .claude/scripts/fetch-jira-ticket.sh
touch .claude/scripts/update-jira-status.sh
chmod +x .claude/scripts/*.sh

# Create GitHub workflows
mkdir -p .github/workflows
touch .github/workflows/jira-integration.yml
```

### 3. Setup Environment Variables

```bash
# Backend
cat > backend/.env.example << EOF
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/ai_learning
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# AI Providers (user will configure these)
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
EOF

# Root
cat > .env.example << EOF
JIRA_URL=https://your-domain.atlassian.net
JIRA_USER=your-email@example.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=AILEARN
GITHUB_TOKEN=ghp_your_token
EOF
```

---

## Development Workflow

### Starting Development

```bash
# Terminal 1: Start database and Redis
docker-compose -f docker-compose.dev.yml up

# Terminal 2: Start backend
cd backend
npm run dev

# Terminal 3: Start frontend
cd frontend
npm run dev
```

### Working with JIRA Tickets

```bash
# 1. Start a ticket
/jira-start AILEARN-123

# 2. Claude creates branch and todo list
# 3. Develop with Claude
# 4. Commit with JIRA reference
git commit -m "AILEARN-123: Implement feature"

# 5. Create PR
/jira-pr AILEARN-123

# 6. After merge, ticket auto-transitions to Done
```

---

## Key Files to Create First (MVP)

### Priority 1 - Core Infrastructure
1. `backend/src/config/database.config.ts`
2. `backend/src/models/user.model.ts`
3. `backend/src/api/routes/auth.routes.ts`
4. `frontend/src/services/api.service.ts`
5. `docker-compose.dev.yml`

### Priority 2 - Authentication
6. `backend/src/services/auth/auth.service.ts`
7. `backend/src/middleware/auth.middleware.ts`
8. `frontend/src/components/auth/LoginForm.tsx`
9. `frontend/src/hooks/useAuth.ts`

### Priority 3 - Basic Curriculum
10. `backend/src/models/curriculum.model.ts`
11. `backend/src/services/curriculum/curriculum.service.ts`
12. `frontend/src/components/curriculum/CurriculumBrowser.tsx`

### Priority 4 - AI Integration
13. `backend/src/services/ai/providers/provider.interface.ts`
14. `backend/src/services/ai/providers/openai.provider.ts`
15. `backend/src/services/ai/ai-orchestrator.service.ts`
16. `frontend/src/components/learning/ChatInterface.tsx`

---

## Database Schema (Initial Migration)

```sql
-- migrations/001_initial_schema.sql

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'learner',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Curricula
CREATE TABLE curricula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(50),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Topics
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id UUID REFERENCES curricula(id) ON DELETE CASCADE,
  parent_topic_id UUID REFERENCES topics(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content JSONB,
  position INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Models
CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  endpoint_url TEXT,
  model_id VARCHAR(100),
  api_key_encrypted TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Learning Sessions
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id),
  ai_model_id UUID REFERENCES ai_models(id),
  status VARCHAR(50) DEFAULT 'in_progress',
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  metadata JSONB
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  model_used VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Evaluations
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES learning_sessions(id),
  user_id UUID REFERENCES users(id),
  topic_id UUID REFERENCES topics(id),
  type VARCHAR(50) NOT NULL,
  questions JSONB,
  answers JSONB,
  score NUMERIC(5,2),
  feedback TEXT,
  evaluated_at TIMESTAMP DEFAULT NOW()
);

-- Progress Tracking
CREATE TABLE progress_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'not_started',
  completion_rate NUMERIC(5,2) DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  last_accessed TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- Indexes
CREATE INDEX idx_sessions_user ON learning_sessions(user_id);
CREATE INDEX idx_sessions_topic ON learning_sessions(topic_id);
CREATE INDEX idx_conversations_session ON conversations(session_id);
CREATE INDEX idx_progress_user ON progress_tracking(user_id);
CREATE INDEX idx_topics_curriculum ON topics(curriculum_id);
```

---

## Next Steps

1. **Import JIRA Tickets**: Use the CSV file to import tickets into your JIRA project
2. **Setup Repository**: Initialize git and push to GitHub
3. **Configure Integrations**: Setup JIRA-GitHub integration following the guide
4. **Start Development**: Begin with Priority 1 tickets (authentication and database)
5. **Use Claude**: Start tickets with `/jira-start` command and develop with Claude

---

This structure provides a solid foundation for the AI-powered learning platform with complete JIRA-Claude-GitHub integration.
