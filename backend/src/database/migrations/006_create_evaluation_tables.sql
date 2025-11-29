-- Migration: Create evaluations, quizzes, and assessment tables
-- Description: Schema for various assessment types (quizzes, scenarios, evaluations) and rubrics

-- Create enum for evaluation type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evaluation_type') THEN
    CREATE TYPE evaluation_type AS ENUM ('quiz', 'code', 'scenario', 'open_ended', 'practical');
  END IF;
END $$;

-- Create enum for question type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
    CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'essay', 'code_review');
  END IF;
END $$;

-- Create learning_sessions table (must be created before evaluations)
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  curriculum_id UUID REFERENCES curricula(id) ON DELETE SET NULL,

  -- Session metadata
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,

  -- AI provider used in session
  ai_provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create evaluations table (session-based assessments)
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  session_id UUID REFERENCES learning_sessions(id) ON DELETE SET NULL, -- Optional link to learning session
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  type evaluation_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  instructions TEXT,

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP WITH TIME ZONE,
  time_limit_minutes INTEGER, -- Optional time limit

  -- Results
  score DECIMAL(5,2), -- Final score (0.00 to 100.00)
  max_score DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  passed BOOLEAN,

  -- AI evaluation metadata
  evaluated_by_ai BOOLEAN DEFAULT FALSE,
  ai_provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
  ai_feedback TEXT,

  -- Rubric
  rubric_id UUID, -- Will reference rubrics table

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Settings
  passing_score DECIMAL(5,2) DEFAULT 70.00,
  time_limit_minutes INTEGER,
  shuffle_questions BOOLEAN DEFAULT TRUE,
  show_answers_after_completion BOOLEAN DEFAULT TRUE,
  allow_retakes BOOLEAN DEFAULT TRUE,
  max_attempts INTEGER, -- NULL means unlimited

  -- Status
  is_published BOOLEAN DEFAULT FALSE,

  -- AI generation
  generated_by_ai BOOLEAN DEFAULT FALSE,
  ai_provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,

  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,

  question_type question_type NOT NULL DEFAULT 'multiple_choice',
  question_text TEXT NOT NULL,
  explanation TEXT, -- Explanation shown after answering

  -- Points
  points INTEGER NOT NULL DEFAULT 1,

  -- Ordering
  order_index INTEGER NOT NULL DEFAULT 0,

  -- AI generation
  generated_by_ai BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT quiz_questions_order_unique UNIQUE (quiz_id, order_index)
);

-- Create quiz_question_options table (for multiple choice questions)
CREATE TABLE IF NOT EXISTS quiz_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,

  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  explanation TEXT, -- Why this option is correct/incorrect

  order_index INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT quiz_question_options_order_unique UNIQUE (question_id, order_index)
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Attempt tracking
  attempt_number INTEGER NOT NULL DEFAULT 1,

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP WITH TIME ZONE,
  time_taken_seconds INTEGER,

  -- Results
  score DECIMAL(5,2), -- Percentage score (0.00 to 100.00)
  points_earned DECIMAL(5,2),
  total_points DECIMAL(5,2),
  passed BOOLEAN,

  -- Status
  is_completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz_attempt_answers table
CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,

  -- Answer data
  selected_option_id UUID REFERENCES quiz_question_options(id) ON DELETE SET NULL, -- For multiple choice
  text_answer TEXT, -- For short answer/essay

  -- Grading
  is_correct BOOLEAN,
  points_earned DECIMAL(5,2) DEFAULT 0.00,

  -- AI feedback for open-ended questions
  ai_feedback TEXT,

  answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT quiz_attempt_answers_unique UNIQUE (attempt_id, question_id)
);

-- Create scenarios table (for scenario-based assessments)
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,

  title VARCHAR(255) NOT NULL,
  context TEXT NOT NULL, -- The scenario/situation
  question TEXT NOT NULL, -- What the learner needs to address

  -- Expected answer characteristics (for AI evaluation)
  evaluation_criteria JSONB, -- Structured criteria for AI to check
  model_answer TEXT, -- Reference answer

  difficulty_level difficulty_level NOT NULL DEFAULT 'intermediate',
  points INTEGER NOT NULL DEFAULT 10,

  -- Status
  is_published BOOLEAN DEFAULT FALSE,

  -- AI generation
  generated_by_ai BOOLEAN DEFAULT FALSE,
  ai_provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,

  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create scenario_responses table
CREATE TABLE IF NOT EXISTS scenario_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  response_text TEXT NOT NULL,

  -- AI evaluation
  ai_score DECIMAL(5,2), -- 0.00 to 100.00
  ai_feedback TEXT,
  ai_provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,

  -- Instructor review
  instructor_score DECIMAL(5,2),
  instructor_feedback TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,

  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create rubrics table (for consistent evaluation)
CREATE TABLE IF NOT EXISTS rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Applicable contexts
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE, -- NULL means global rubric
  evaluation_type evaluation_type,

  max_score DECIMAL(5,2) NOT NULL DEFAULT 100.00,

  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create rubric_criteria table
CREATE TABLE IF NOT EXISTS rubric_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,

  criterion_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Scoring
  max_points DECIMAL(5,2) NOT NULL,
  weight DECIMAL(5,2) DEFAULT 1.00, -- Weighting factor

  -- Performance levels (e.g., Excellent, Good, Fair, Poor)
  levels JSONB, -- Array of {level: "Excellent", points: 10, description: "..."}

  order_index INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rubric_criteria_order_unique UNIQUE (rubric_id, order_index)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_evaluations_topic_id ON evaluations(topic_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_session_id ON evaluations(session_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_type ON evaluations(type);
CREATE INDEX IF NOT EXISTS idx_evaluations_submitted_at ON evaluations(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_quizzes_topic_id ON quizzes(topic_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_published ON quizzes(is_published);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_order ON quiz_questions(quiz_id, order_index);

CREATE INDEX IF NOT EXISTS idx_quiz_question_options_question_id ON quiz_question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_question_options_is_correct ON quiz_question_options(question_id, is_correct);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed ON quiz_attempts(user_id, quiz_id, is_completed);

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_attempt_id ON quiz_attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_question_id ON quiz_attempt_answers(question_id);

CREATE INDEX IF NOT EXISTS idx_scenarios_topic_id ON scenarios(topic_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_is_published ON scenarios(is_published);

CREATE INDEX IF NOT EXISTS idx_scenario_responses_scenario_id ON scenario_responses(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_responses_user_id ON scenario_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_rubrics_topic_id ON rubrics(topic_id);
CREATE INDEX IF NOT EXISTS idx_rubrics_type ON rubrics(evaluation_type);

CREATE INDEX IF NOT EXISTS idx_rubric_criteria_rubric_id ON rubric_criteria(rubric_id);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_topic_id ON learning_sessions(topic_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_curriculum_id ON learning_sessions(curriculum_id);

-- Triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_evaluations_updated_at ON evaluations;
CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scenarios_updated_at ON scenarios;
CREATE TRIGGER update_scenarios_updated_at
  BEFORE UPDATE ON scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rubrics_updated_at ON rubrics;
CREATE TRIGGER update_rubrics_updated_at
  BEFORE UPDATE ON rubrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate quiz score after all answers are submitted
CREATE OR REPLACE FUNCTION calculate_quiz_score()
RETURNS TRIGGER AS $$
DECLARE
  total_points DECIMAL(5,2);
  earned_points DECIMAL(5,2);
  percentage_score DECIMAL(5,2);
  quiz_passing_score DECIMAL(5,2);
BEGIN
  -- Get total points for the quiz
  SELECT COALESCE(SUM(points), 0) INTO total_points
  FROM quiz_questions
  WHERE quiz_id = (SELECT quiz_id FROM quiz_attempts WHERE id = NEW.attempt_id);

  -- Get earned points
  SELECT COALESCE(SUM(points_earned), 0) INTO earned_points
  FROM quiz_attempt_answers
  WHERE attempt_id = NEW.attempt_id;

  -- Calculate percentage
  IF total_points > 0 THEN
    percentage_score := (earned_points / total_points) * 100;
  ELSE
    percentage_score := 0;
  END IF;

  -- Get passing score for the quiz
  SELECT passing_score INTO quiz_passing_score
  FROM quizzes
  WHERE id = (SELECT quiz_id FROM quiz_attempts WHERE id = NEW.attempt_id);

  -- Update quiz attempt with final score
  UPDATE quiz_attempts
  SET
    score = percentage_score,
    points_earned = earned_points,
    total_points = total_points,
    passed = (percentage_score >= quiz_passing_score)
  WHERE id = NEW.attempt_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate score when answer is added
DROP TRIGGER IF EXISTS calculate_quiz_score_on_answer ON quiz_attempt_answers;
CREATE TRIGGER calculate_quiz_score_on_answer
  AFTER INSERT OR UPDATE ON quiz_attempt_answers
  FOR EACH ROW
  EXECUTE FUNCTION calculate_quiz_score();
