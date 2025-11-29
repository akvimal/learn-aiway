-- Migration: Create exercises, test cases, and AI-generated content tables
-- Description: Schema for coding exercises, automated testing, and AI-generated learning content

-- Create enum for programming languages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'programming_language') THEN
    CREATE TYPE programming_language AS ENUM ('javascript', 'java', 'python', 'cpp', 'sql');
  END IF;
END $$;

-- Create enum for submission status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
    CREATE TYPE submission_status AS ENUM ('pending', 'running', 'passed', 'failed', 'error', 'timeout');
  END IF;
END $$;

-- Create enum for content variation type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_variation_type') THEN
    CREATE TYPE content_variation_type AS ENUM ('explanation', 'example', 'analogy', 'summary', 'deep_dive');
  END IF;
END $$;

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL, -- What the learner needs to implement
  language programming_language NOT NULL,
  difficulty_level difficulty_level NOT NULL DEFAULT 'beginner',
  starter_code TEXT, -- Initial code template
  solution_code TEXT, -- Reference solution (hidden from learners)
  explanation TEXT, -- Explanation of the solution
  order_index INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 10, -- Points awarded for completion
  time_limit_seconds INTEGER DEFAULT 300, -- Time limit for execution
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT exercises_order_unique UNIQUE (topic_id, order_index)
);

-- Create exercise_hints table (progressive hint system)
CREATE TABLE IF NOT EXISTS exercise_hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  hint_level INTEGER NOT NULL, -- 1, 2, 3, etc. (progressive hints)
  hint_text TEXT NOT NULL,
  reveals_solution BOOLEAN DEFAULT FALSE, -- If true, this hint gives away the answer
  generated_by_ai BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT exercise_hints_level_unique UNIQUE (exercise_id, hint_level)
);

-- Create exercise_test_cases table
CREATE TABLE IF NOT EXISTS exercise_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  test_name VARCHAR(255) NOT NULL,
  test_type VARCHAR(50) NOT NULL DEFAULT 'public', -- 'public', 'hidden', 'edge_case'

  -- For function-based testing (JavaScript, Java)
  input_data JSONB, -- e.g., {"args": [1, 2, 3]}
  expected_output JSONB, -- e.g., {"result": 6}

  -- For stdin/stdout testing
  stdin TEXT,
  expected_stdout TEXT,

  -- Test metadata
  points INTEGER NOT NULL DEFAULT 1,
  is_hidden BOOLEAN DEFAULT FALSE, -- Hidden tests not shown to learners before submission
  timeout_ms INTEGER DEFAULT 5000,
  order_index INTEGER NOT NULL DEFAULT 0,

  generated_by_ai BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT exercise_test_cases_order_unique UNIQUE (exercise_id, order_index)
);

-- Create code_submissions table
CREATE TABLE IF NOT EXISTS code_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Submission data
  code TEXT NOT NULL,
  language programming_language NOT NULL,

  -- Execution results
  status submission_status NOT NULL DEFAULT 'pending',
  passed_tests INTEGER DEFAULT 0,
  total_tests INTEGER NOT NULL,
  score DECIMAL(5,2) DEFAULT 0.00, -- Percentage score (0.00 to 100.00)
  execution_time_ms INTEGER,
  memory_used_kb INTEGER,

  -- Test results detail
  test_results JSONB, -- Array of individual test results
  error_message TEXT,
  compiler_output TEXT,

  -- Metadata
  hints_used INTEGER DEFAULT 0, -- Number of hints viewed before submission
  attempt_number INTEGER DEFAULT 1, -- Track multiple attempts

  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  executed_at TIMESTAMP WITH TIME ZONE,

  -- For tracking best submission per exercise
  is_best_submission BOOLEAN DEFAULT FALSE
);

-- Create topic_content_variations table (AI-generated explanations, examples, etc.)
CREATE TABLE IF NOT EXISTS topic_content_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  variation_type content_variation_type NOT NULL,
  difficulty_level difficulty_level NOT NULL, -- Target audience difficulty
  content TEXT NOT NULL,
  title VARCHAR(255), -- Optional title for the variation

  -- AI metadata
  generated_by_ai BOOLEAN DEFAULT FALSE,
  ai_provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
  ai_model VARCHAR(100),

  -- Quality metrics
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,

  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_hint_usage table (track which hints learners have viewed)
CREATE TABLE IF NOT EXISTS user_hint_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  hint_id UUID NOT NULL REFERENCES exercise_hints(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_hint_usage_unique UNIQUE (user_id, hint_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercises_topic_id ON exercises(topic_id);
CREATE INDEX IF NOT EXISTS idx_exercises_language ON exercises(language);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_exercises_is_published ON exercises(is_published);
CREATE INDEX IF NOT EXISTS idx_exercises_order ON exercises(topic_id, order_index);

CREATE INDEX IF NOT EXISTS idx_exercise_hints_exercise_id ON exercise_hints(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_hints_level ON exercise_hints(exercise_id, hint_level);

CREATE INDEX IF NOT EXISTS idx_exercise_test_cases_exercise_id ON exercise_test_cases(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_test_cases_is_hidden ON exercise_test_cases(exercise_id, is_hidden);
CREATE INDEX IF NOT EXISTS idx_exercise_test_cases_order ON exercise_test_cases(exercise_id, order_index);

CREATE INDEX IF NOT EXISTS idx_code_submissions_exercise_id ON code_submissions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_code_submissions_user_id ON code_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_code_submissions_status ON code_submissions(status);
CREATE INDEX IF NOT EXISTS idx_code_submissions_best ON code_submissions(exercise_id, user_id, is_best_submission);
CREATE INDEX IF NOT EXISTS idx_code_submissions_submitted_at ON code_submissions(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_topic_content_variations_topic_id ON topic_content_variations(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_content_variations_type ON topic_content_variations(variation_type);
CREATE INDEX IF NOT EXISTS idx_topic_content_variations_difficulty ON topic_content_variations(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_topic_content_variations_published ON topic_content_variations(is_published);

CREATE INDEX IF NOT EXISTS idx_user_hint_usage_user_id ON user_hint_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_hint_usage_exercise_id ON user_hint_usage(exercise_id);

-- Triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_exercises_updated_at ON exercises;
CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_topic_content_variations_updated_at ON topic_content_variations;
CREATE TRIGGER update_topic_content_variations_updated_at
  BEFORE UPDATE ON topic_content_variations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update best submission when a new submission is created
CREATE OR REPLACE FUNCTION update_best_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if this submission passed and has a better score
  IF NEW.status = 'passed' THEN
    -- Unmark previous best submission for this user and exercise
    UPDATE code_submissions
    SET is_best_submission = FALSE
    WHERE user_id = NEW.user_id
      AND exercise_id = NEW.exercise_id
      AND id != NEW.id;

    -- Mark this as best if it has the highest score
    UPDATE code_submissions
    SET is_best_submission = TRUE
    WHERE id = (
      SELECT id FROM code_submissions
      WHERE user_id = NEW.user_id
        AND exercise_id = NEW.exercise_id
        AND status = 'passed'
      ORDER BY score DESC, execution_time_ms ASC
      LIMIT 1
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update best submission
DROP TRIGGER IF EXISTS update_best_submission_on_insert ON code_submissions;
CREATE TRIGGER update_best_submission_on_insert
  AFTER INSERT OR UPDATE ON code_submissions
  FOR EACH ROW
  WHEN (NEW.status = 'passed')
  EXECUTE FUNCTION update_best_submission();

-- Function to calculate exercise completion and update topic progress
CREATE OR REPLACE FUNCTION update_topic_progress_on_exercise_completion()
RETURNS TRIGGER AS $$
DECLARE
  topic_id_var UUID;
  total_exercises INTEGER;
  completed_exercises INTEGER;
BEGIN
  -- Get topic_id from exercise
  SELECT topic_id INTO topic_id_var FROM exercises WHERE id = NEW.exercise_id;

  -- Count total exercises in this topic
  SELECT COUNT(*) INTO total_exercises
  FROM exercises
  WHERE topic_id = topic_id_var AND is_published = TRUE;

  -- Count completed exercises by this user
  SELECT COUNT(DISTINCT exercise_id) INTO completed_exercises
  FROM code_submissions
  WHERE user_id = NEW.user_id
    AND exercise_id IN (
      SELECT id FROM exercises WHERE topic_id = topic_id_var AND is_published = TRUE
    )
    AND status = 'passed';

  -- Update user_topic_progress if all exercises are completed
  IF completed_exercises >= total_exercises AND total_exercises > 0 THEN
    INSERT INTO user_topic_progress (user_id, topic_id, status, completed_at)
    VALUES (NEW.user_id, topic_id_var, 'completed', CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, topic_id)
    DO UPDATE SET
      status = 'completed',
      completed_at = CURRENT_TIMESTAMP;
  ELSE
    -- Mark as in_progress if not completed
    INSERT INTO user_topic_progress (user_id, topic_id, status)
    VALUES (NEW.user_id, topic_id_var, 'in_progress')
    ON CONFLICT (user_id, topic_id)
    DO UPDATE SET
      status = 'in_progress'
    WHERE user_topic_progress.status != 'completed';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update topic progress when exercise is completed
DROP TRIGGER IF EXISTS update_topic_progress_on_submission ON code_submissions;
CREATE TRIGGER update_topic_progress_on_submission
  AFTER INSERT OR UPDATE ON code_submissions
  FOR EACH ROW
  WHEN (NEW.status = 'passed')
  EXECUTE FUNCTION update_topic_progress_on_exercise_completion();
