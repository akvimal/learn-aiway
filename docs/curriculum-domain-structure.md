# Curriculum Domain Structure

## Problem Statement
Current domain structure lacks logical hierarchy and consistency. Domains like "programming", "finance", "cloud", and "compliance" are at the same level but represent different abstraction levels. "Web development" is a subset of programming, not a peer domain.

## Proposed Solution: Two-Tier Domain System

### Tier 1: Primary Categories
High-level learning domains that represent distinct fields of knowledge.

### Tier 2: Specializations
Specific sub-domains or specializations within each primary category.

---

## Domain Taxonomy

### 1. **Technology & Engineering**
Core technical skills and engineering practices.

**Specializations:**
- **Web Development** (Frontend, Backend, Full-stack)
- **Mobile Development** (iOS, Android, Cross-platform)
- **Software Engineering** (Design Patterns, Architecture, Testing)
- **Data Engineering** (ETL, Data Pipelines, Big Data)
- **DevOps & Infrastructure** (CI/CD, Containers, Orchestration)
- **Cloud Computing** (AWS, Azure, GCP, Multi-cloud)
- **Database Systems** (SQL, NoSQL, Data Modeling)
- **Cybersecurity** (Application Security, Network Security, Pentesting)
- **Machine Learning & AI** (ML Algorithms, Deep Learning, NLP)
- **Game Development** (Unity, Unreal, Game Design)

### 2. **Business & Management**
Business operations, strategy, and management skills.

**Specializations:**
- **Project Management** (Agile, Scrum, PMP, Waterfall)
- **Product Management** (Product Strategy, Roadmapping, Analytics)
- **Business Analysis** (Requirements, Process Modeling, Stakeholder Management)
- **Entrepreneurship** (Startup Strategy, Business Models, Funding)
- **Operations Management** (Process Optimization, Supply Chain, Lean)
- **Strategic Planning** (Business Strategy, Competitive Analysis, Growth)

### 3. **Finance & Accounting**
Financial management, analysis, and accounting practices.

**Specializations:**
- **Corporate Finance** (Financial Analysis, Capital Budgeting, Valuation)
- **Investment & Trading** (Stock Trading, Portfolio Management, Options)
- **Financial Accounting** (GAAP, IFRS, Financial Statements)
- **Managerial Accounting** (Cost Accounting, Budgeting, Performance)
- **Personal Finance** (Budgeting, Saving, Retirement Planning)
- **FinTech** (Blockchain, DeFi, Digital Payments)
- **Risk Management** (Financial Risk, Derivatives, Hedging)

### 4. **Compliance & Governance**
Regulatory compliance, risk management, and governance frameworks.

**Specializations:**
- **Data Privacy** (GDPR, CCPA, Privacy Engineering)
- **Information Security** (ISO 27001, NIST, Security Controls)
- **Financial Compliance** (SOX, Basel III, AML, KYC)
- **Healthcare Compliance** (HIPAA, FDA, Clinical Trials)
- **IT Governance** (COBIT, ITIL, IT Service Management)
- **Corporate Governance** (Board Management, Ethics, Auditing)
- **Environmental Compliance** (ESG, Sustainability, Carbon Reporting)

### 5. **Data & Analytics**
Data analysis, business intelligence, and analytics.

**Specializations:**
- **Data Analysis** (Exploratory Analysis, Statistics, Visualization)
- **Business Intelligence** (Dashboards, Reporting, KPIs)
- **Data Science** (Predictive Modeling, Machine Learning, Statistical Analysis)
- **Analytics Engineering** (dbt, Data Transformation, Metrics)
- **Marketing Analytics** (Customer Analytics, Attribution, A/B Testing)
- **Product Analytics** (User Behavior, Funnel Analysis, Retention)

### 6. **Design & Creative**
Visual design, UX/UI, and creative skills.

**Specializations:**
- **UI/UX Design** (User Research, Wireframing, Prototyping, Usability)
- **Graphic Design** (Visual Design, Branding, Typography)
- **Motion Design** (Animation, Video Editing, Motion Graphics)
- **3D Design & Modeling** (3D Modeling, Rendering, CAD)
- **Game Design** (Level Design, Game Mechanics, Narrative Design)
- **Product Design** (Design Thinking, Design Systems, Interaction Design)

### 7. **Marketing & Sales**
Marketing strategy, sales techniques, and customer engagement.

**Specializations:**
- **Digital Marketing** (SEO, SEM, Social Media, Content Marketing)
- **Growth Marketing** (Growth Hacking, Viral Marketing, Retention)
- **Sales Strategy** (Sales Process, Negotiation, Account Management)
- **Brand Management** (Brand Strategy, Positioning, Identity)
- **Marketing Analytics** (Campaign Analysis, ROI, Attribution)
- **Customer Success** (Onboarding, Support, Retention, Advocacy)

### 8. **Languages & Communication**
Programming languages, human languages, and communication skills.

**Specializations:**
- **Programming Languages** (Python, JavaScript, Java, C++, Go, Rust)
- **Foreign Languages** (Spanish, Mandarin, French, German, Japanese)
- **Technical Writing** (Documentation, API Docs, User Guides)
- **Business Communication** (Presentations, Writing, Negotiation)
- **Public Speaking** (Presentations, Speaking Skills, Storytelling)

---

## Difficulty Level System

### Beginner
- **Target Audience:** Complete newcomers to the subject
- **Prerequisites:** None or minimal
- **Learning Outcomes:** Basic understanding, fundamental concepts, simple applications
- **Examples:**
  - Introduction to Python Programming
  - Financial Accounting Basics
  - Introduction to UX Design
  - Cloud Computing Fundamentals

### Intermediate
- **Target Audience:** Learners with foundational knowledge
- **Prerequisites:** Beginner-level understanding
- **Learning Outcomes:** Practical skills, real-world applications, problem-solving
- **Examples:**
  - React Web Development
  - Corporate Finance Analysis
  - Advanced SQL and Database Design
  - AWS Solutions Architect

### Advanced
- **Target Audience:** Experienced practitioners
- **Prerequisites:** Solid intermediate knowledge + practical experience
- **Learning Outcomes:** Expert-level mastery, complex systems, optimization, leadership
- **Examples:**
  - Distributed Systems Architecture
  - Algorithmic Trading Strategies
  - Enterprise Security Architecture
  - Machine Learning System Design

### Expert/Specialized
- **Target Audience:** Senior professionals seeking niche expertise
- **Prerequisites:** Advanced knowledge + years of experience
- **Learning Outcomes:** Cutting-edge techniques, research, innovation, thought leadership
- **Examples:**
  - High-Frequency Trading Systems
  - Zero Trust Security Architecture
  - Large Language Model Fine-tuning
  - Quantum Computing Algorithms

---

## Database Schema Updates

### Option 1: Two-Field Approach (Recommended)
```sql
ALTER TABLE curricula
  ADD COLUMN category VARCHAR(100), -- Primary category
  ADD COLUMN specialization VARCHAR(100); -- Specialization

-- Update existing domain field to category
UPDATE curricula SET category = domain;

-- Add indexes
CREATE INDEX idx_curricula_category ON curricula(category);
CREATE INDEX idx_curricula_specialization ON curricula(specialization);
CREATE INDEX idx_curricula_category_specialization ON curricula(category, specialization);
```

**Pros:**
- Clear separation of hierarchy
- Easy filtering by category or specialization
- Maintains backward compatibility

### Option 2: Hierarchical Domain Path
```sql
ALTER TABLE curricula
  ADD COLUMN domain_path VARCHAR(255); -- e.g., 'Technology/Web Development'

-- Keep domain for backward compatibility, populate domain_path
UPDATE curricula SET domain_path = domain;
```

### Option 3: Domain Taxonomy Table (Most Flexible)
```sql
CREATE TABLE domain_taxonomy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  specialization VARCHAR(100),
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- For UI display
  order_index INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_category_specialization UNIQUE(category, specialization)
);

ALTER TABLE curricula
  ADD COLUMN domain_taxonomy_id UUID REFERENCES domain_taxonomy(id);
```

**Pros:**
- Most flexible and maintainable
- Centralized domain management
- Easy to add new domains
- Can include metadata (icons, descriptions)

---

## Recommended Implementation

Use **Option 1** for simplicity with a future migration path to **Option 3** for scalability.

### Migration Steps

1. Add `category` and `specialization` columns
2. Populate seed data with new taxonomy
3. Update API endpoints to filter by category/specialization
4. Update frontend to display hierarchical domain navigation
5. Add difficulty level badges and filtering

### Seed Data Examples

```sql
-- Example: Technology & Engineering > Web Development > Beginner
INSERT INTO curricula (
  title,
  description,
  category,
  specialization,
  difficulty_level,
  created_by,
  is_published,
  estimated_duration_hours,
  tags
) VALUES (
  'Frontend Web Development with React',
  'Learn modern frontend development using React, JavaScript, and responsive design principles.',
  'Technology & Engineering',
  'Web Development',
  'beginner',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  true,
  40,
  ARRAY['react', 'javascript', 'frontend', 'web', 'html', 'css']
);

-- Example: Finance & Accounting > Corporate Finance > Intermediate
INSERT INTO curricula (
  title,
  description,
  category,
  specialization,
  difficulty_level,
  created_by,
  is_published,
  estimated_duration_hours,
  tags
) VALUES (
  'Corporate Financial Analysis',
  'Master financial statement analysis, ratio analysis, and financial forecasting for corporate decision-making.',
  'Finance & Accounting',
  'Corporate Finance',
  'intermediate',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  true,
  30,
  ARRAY['finance', 'accounting', 'analysis', 'corporate', 'financial-statements']
);
```

---

## UI/UX Recommendations

### Curriculum Browse Page

```
┌─────────────────────────────────────────┐
│ Browse Curricula                        │
├─────────────────────────────────────────┤
│ Filters:                                │
│ □ Technology & Engineering              │
│   └─ □ Web Development                 │
│   └─ □ Cloud Computing                 │
│ □ Finance & Accounting                  │
│   └─ □ Corporate Finance               │
│                                         │
│ Difficulty: ○ All ○ Beginner ○ Int...  │
├─────────────────────────────────────────┤
│ Results (12 curricula)                  │
│                                         │
│ [TECH] Frontend Web Development 🟢      │
│ Web Development • Beginner • 40h        │
│                                         │
│ [FINANCE] Corporate Financial Analysis 🟡│
│ Corporate Finance • Intermediate • 30h  │
└─────────────────────────────────────────┘
```

### Difficulty Level Badges
- 🟢 **Beginner** - Green
- 🟡 **Intermediate** - Yellow/Orange
- 🔴 **Advanced** - Red
- 🟣 **Expert** - Purple

---

## Benefits of This Structure

1. **Logical Hierarchy:** Clear parent-child relationships between categories and specializations
2. **Scalability:** Easy to add new specializations without restructuring
3. **Discoverability:** Users can browse by high-level interest, then drill down
4. **Consistency:** Peer domains are truly comparable (not mixing "programming" with "finance")
5. **Flexibility:** Same specialization can appear in multiple categories if needed
6. **Filtering:** Efficient queries for category + specialization + difficulty
7. **User Experience:** Clear learning paths from beginner to expert within each specialization
8. **SEO & Marketing:** Better content organization for external discovery

---

## Next Steps

1. Review and approve taxonomy
2. Implement database migration (Option 1 recommended)
3. Update API endpoints and repositories
4. Create seed data with diverse examples
5. Update frontend components for hierarchical navigation
6. Add difficulty level filtering and badges
7. Update documentation and API docs
