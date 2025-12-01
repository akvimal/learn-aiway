# How Exercises Are Integrated with Topics and Learning Objectives

This guide explains how coding exercises are included in topics and learning objectives, and how to use the API endpoints.

## **Architecture Overview**

### **Relationship Hierarchy**

```
Curriculum
    ↓
  Topics (can have sub-topics)
    ↓
    ├── Learning Objectives
    ├── Exercises (with test cases & hints)
    └── Quizzes
```

### **Database Relationships**

1. **Exercises → Topics**: Direct one-to-many relationship
   - `exercises.topic_id` → `topics.id`
   - Exercises belong to a specific topic

2. **Learning Objectives → Topics**: Direct one-to-many relationship
   - `learning_objectives.topic_id` → `topics.id`
   - Objectives define what learners should achieve

3. **Exercises → Learning Objectives**: Many-to-many relationship (optional, for granular tracking)
   - `exercise_objectives` table links exercises to specific objectives
   - Allows tracking which exercises fulfill which learning objectives

---

## **API Endpoints**

### **1. Get Topic with Full Details (Including Exercises)**

**Endpoint:** `GET /api/v1/curricula/:curriculumId/topics/:topicId/details`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "topic-uuid",
    "curriculum_id": "curriculum-uuid",
    "title": "Introduction to Functions",
    "description": "Learn about functions in JavaScript",
    "content": "Functions are reusable blocks of code...",
    "order_index": 1,
    "estimated_duration_minutes": 120,
    "is_required": true,
    "learning_objectives": [
      {
        "id": "obj-uuid-1",
        "topic_id": "topic-uuid",
        "objective_text": "Understand function syntax and declaration",
        "order_index": 0
      },
      {
        "id": "obj-uuid-2",
        "topic_id": "topic-uuid",
        "objective_text": "Create and call functions with parameters",
        "order_index": 1
      }
    ],
    "exercises": [
      {
        "id": "exercise-uuid-1",
        "title": "Create a Sum Function",
        "description": "Write a function that adds two numbers",
        "instructions": "Create a function called 'sum' that takes two parameters...",
        "language": "javascript",
        "difficulty_level": "beginner",
        "starter_code": "function sum(a, b) {\n  // Your code here\n}",
        "points": 10,
        "time_limit_seconds": 300,
        "is_published": true,
        "order_index": 0,
        "total_tests": 5,
        "public_tests": 3,
        "hint_count": 2
      }
    ],
    "quizzes": [
      {
        "id": "quiz-uuid-1",
        "title": "Functions Quiz",
        "difficulty_level": "beginner",
        "time_limit_minutes": 15,
        "passing_score": 70,
        "is_published": true
      }
    ]
  }
}
```

### **2. Get Topic Summary (Counts Only)**

**Endpoint:** `GET /api/v1/topics/:topicId/summary`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "topic-uuid",
    "title": "Introduction to Functions",
    "description": "Learn about functions in JavaScript",
    "objective_count": 3,
    "exercise_count": 5,
    "quiz_count": 1
  }
}
```

### **3. Get Exercises for a Topic**

**Endpoint:** `GET /api/v1/topics/:topicId/exercises`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "exercise-uuid-1",
      "topic_id": "topic-uuid",
      "title": "Create a Sum Function",
      "description": "Write a function that adds two numbers",
      "language": "javascript",
      "difficulty_level": "beginner",
      "starter_code": "function sum(a, b) {\n  // Your code here\n}",
      "points": 10,
      "is_published": true,
      "order_index": 0
    }
  ]
}
```

---

## **Linking Exercises to Learning Objectives**

### **Purpose**
While exercises are automatically associated with a topic, you can optionally link them to specific learning objectives for:
- More granular progress tracking
- Better alignment between exercises and learning goals
- Analytics on which objectives are well-covered

### **Link Exercise to Objectives**

**Endpoint:** `POST /api/v1/exercises/:exerciseId/objectives`

**Request Body:**
```json
{
  "objectiveIds": ["obj-uuid-1", "obj-uuid-2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Exercise linked to objectives successfully"
}
```

### **Get Linked Objectives for an Exercise**

**Endpoint:** `GET /api/v1/exercises/:exerciseId/objectives`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "obj-uuid-1",
      "topic_id": "topic-uuid",
      "objective_text": "Understand function syntax and declaration",
      "order_index": 0
    },
    {
      "id": "obj-uuid-2",
      "topic_id": "topic-uuid",
      "objective_text": "Create and call functions with parameters",
      "order_index": 1
    }
  ]
}
```

### **Get Exercises for a Learning Objective**

**Endpoint:** `GET /api/v1/objectives/:objectiveId/exercises`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "exercise-uuid-1",
      "topic_id": "topic-uuid",
      "title": "Create a Sum Function",
      "description": "Write a function that adds two numbers",
      "language": "javascript",
      "difficulty_level": "beginner",
      "points": 10
    }
  ]
}
```

---

## **Complete Workflow Example**

### **Step 1: Instructor Creates Topic Structure**

```javascript
// 1. Create a topic
POST /api/v1/curricula/{curriculumId}/topics
{
  "title": "Functions in JavaScript",
  "description": "Learn about functions",
  "content": "Functions are reusable blocks of code...",
  "order_index": 1,
  "estimated_duration_minutes": 120
}
// Response: { "id": "topic-uuid", ... }

// 2. Add learning objectives to the topic
POST /api/v1/curricula/{curriculumId}/topics/{topicId}/objectives
{
  "objective_text": "Understand function syntax and declaration",
  "order_index": 0
}
// Response: { "id": "obj-uuid-1", ... }

POST /api/v1/curricula/{curriculumId}/topics/{topicId}/objectives
{
  "objective_text": "Create and call functions with parameters",
  "order_index": 1
}
// Response: { "id": "obj-uuid-2", ... }
```

### **Step 2: Instructor Creates Exercises**

```javascript
// 3. Create an exercise for the topic
POST /api/v1/topics/{topicId}/exercises
{
  "title": "Create a Sum Function",
  "description": "Write a function that adds two numbers",
  "instructions": "Create a function called 'sum' that takes two parameters a and b, and returns their sum.",
  "language": "javascript",
  "difficultyLevel": "beginner",
  "starterCode": "function sum(a, b) {\n  // Your code here\n}",
  "solutionCode": "function sum(a, b) {\n  return a + b;\n}",
  "points": 10,
  "isPublished": true
}
// Response: { "id": "exercise-uuid-1", ... }

// 4. Add test cases to the exercise
POST /api/v1/exercises/{exerciseId}/test-cases
{
  "testName": "Test basic addition",
  "testType": "public",
  "inputData": { "args": [2, 3] },
  "expectedOutput": { "result": 5 },
  "points": 1,
  "isHidden": false
}

// 5. Link exercise to specific objectives (optional)
POST /api/v1/exercises/{exerciseId}/objectives
{
  "objectiveIds": ["obj-uuid-1", "obj-uuid-2"]
}
```

### **Step 3: Learner Views Topic**

```javascript
// Learner navigates to topic details
GET /api/v1/curricula/{curriculumId}/topics/{topicId}/details

// Response includes:
// - Topic content
// - Learning objectives
// - All exercises (with test counts, hints)
// - Quizzes
```

### **Step 4: Learner Works on Exercise**

```javascript
// Get exercise details
GET /api/v1/exercises/{exerciseId}

// Get test cases (hidden tests not shown to learners)
GET /api/v1/exercises/{exerciseId}/test-cases

// Submit code
POST /api/v1/exercises/{exerciseId}/submit/javascript
{
  "code": "function sum(a, b) { return a + b; }",
  "testResults": [...]
}

// Response includes:
// - Submission ID
// - Status (passed/failed)
// - Test results
// - Score
```

---

## **Database Schema Reference**

### **Topics Table**
```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY,
  curriculum_id UUID REFERENCES curricula(id),
  parent_topic_id UUID REFERENCES topics(id), -- For subtopics
  title VARCHAR(255),
  description TEXT,
  content TEXT,
  order_index INTEGER,
  estimated_duration_minutes INTEGER,
  is_required BOOLEAN
);
```

### **Learning Objectives Table**
```sql
CREATE TABLE learning_objectives (
  id UUID PRIMARY KEY,
  topic_id UUID REFERENCES topics(id),
  objective_text TEXT,
  order_index INTEGER
);
```

### **Exercises Table**
```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY,
  topic_id UUID REFERENCES topics(id), -- Direct link to topic
  title VARCHAR(255),
  description TEXT,
  instructions TEXT,
  language programming_language, -- javascript, java, python
  difficulty_level difficulty_level,
  starter_code TEXT,
  solution_code TEXT,
  explanation TEXT,
  order_index INTEGER,
  points INTEGER DEFAULT 10,
  time_limit_seconds INTEGER,
  is_published BOOLEAN,
  created_by UUID REFERENCES users(id)
);
```

### **Exercise-Objective Mapping Table (Optional)**
```sql
CREATE TABLE exercise_objectives (
  id UUID PRIMARY KEY,
  exercise_id UUID REFERENCES exercises(id),
  objective_id UUID REFERENCES learning_objectives(id),
  UNIQUE(exercise_id, objective_id)
);
```

---

## **Frontend Usage Examples**

### **Display Topic with Exercises**

```typescript
// Fetch topic details
const response = await fetch(`/api/v1/curricula/${curriculumId}/topics/${topicId}/details`);
const { data } = await response.json();

// Render structure:
// 1. Topic title and content
// 2. Learning objectives list
// 3. Exercises section
//    - Show exercise cards with title, description, difficulty
//    - Display test counts and hint availability
//    - Link to exercise detail page
// 4. Quizzes section

return (
  <div>
    <h1>{data.title}</h1>
    <div>{data.content}</div>

    <section>
      <h2>Learning Objectives</h2>
      <ul>
        {data.learning_objectives.map(obj => (
          <li key={obj.id}>{obj.objective_text}</li>
        ))}
      </ul>
    </section>

    <section>
      <h2>Practice Exercises</h2>
      {data.exercises.map(exercise => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          objectives={data.learning_objectives}
        />
      ))}
    </section>
  </div>
);
```

---

## **Key Features**

✅ **Automatic Topic Association**: Exercises automatically belong to topics
✅ **Optional Objective Linking**: Link exercises to specific learning objectives for detailed tracking
✅ **Comprehensive Details**: Fetch topics with all related content in one API call
✅ **Progress Tracking**: System automatically tracks exercise completion and topic progress
✅ **Flexible Organization**: Support for hierarchical topics (subtopics)
✅ **Multi-language Support**: JavaScript, Java, Python exercises per topic

---

## **Migration Required**

Before using the exercise-objective linking feature, run the new migration:

```bash
npm run migrate
```

This will create the `exercise_objectives` table for many-to-many relationships.

---

## **Summary**

Exercises are integrated into topics and learning objectives through:

1. **Direct topic association** via `topic_id` (required)
2. **Optional objective linking** via `exercise_objectives` table (for detailed tracking)
3. **Comprehensive API endpoints** to fetch topics with all related exercises
4. **Automatic progress tracking** when learners complete exercises

The system provides flexibility to use exercises at the topic level only, or to create more granular associations with specific learning objectives.
