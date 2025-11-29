-- Migration: Create curriculum management tables
-- Description: Database schema for curriculum, topics, learning objectives, and progress tracking

-- Create enum for difficulty levels
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level') THEN
    CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
  END IF;
END $$;

-- Create enum for topic completion status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'topic_status') THEN
    CREATE TYPE topic_status AS ENUM ('not_started', 'in_progress', 'completed');
  END IF;
END $$;

-- Create curricula table
CREATE TABLE IF NOT EXISTS curricula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  domain VARCHAR(100) NOT NULL, -- e.g., 'programming', 'cloud', 'finance', 'compliance'
  difficulty_level difficulty_level NOT NULL DEFAULT 'beginner',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_published BOOLEAN DEFAULT FALSE,
  estimated_duration_hours INTEGER, -- Estimated time to complete in hours
  tags TEXT[], -- Array of tags for searching/filtering
  metadata JSONB, -- Flexible field for additional metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create topics table (supports hierarchical structure via parent_topic_id)
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id UUID NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
  parent_topic_id UUID REFERENCES topics(id) ON DELETE CASCADE, -- NULL for top-level topics
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT, -- Main content/explanation for the topic
  order_index INTEGER NOT NULL DEFAULT 0, -- For ordering topics within same level
  estimated_duration_minutes INTEGER, -- Estimated time for this topic
  is_required BOOLEAN DEFAULT TRUE, -- Whether topic is required or optional
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT topics_order_unique UNIQUE (curriculum_id, parent_topic_id, order_index)
);

-- Create learning_objectives table
CREATE TABLE IF NOT EXISTS learning_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  objective_text TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT learning_objectives_order_unique UNIQUE (topic_id, order_index)
);

-- Create user_curriculum_progress table
CREATE TABLE IF NOT EXISTS user_curriculum_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  curriculum_id UUID NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
  current_topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  completion_percentage DECIMAL(5,2) DEFAULT 0.00, -- 0.00 to 100.00
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT user_curriculum_unique UNIQUE (user_id, curriculum_id)
);

-- Create user_topic_progress table
CREATE TABLE IF NOT EXISTS user_topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  status topic_status NOT NULL DEFAULT 'not_started',
  time_spent_minutes INTEGER DEFAULT 0,
  notes TEXT, -- User's personal notes for this topic
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_topic_unique UNIQUE (user_id, topic_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_curricula_domain ON curricula(domain);
CREATE INDEX IF NOT EXISTS idx_curricula_difficulty ON curricula(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_curricula_created_by ON curricula(created_by);
CREATE INDEX IF NOT EXISTS idx_curricula_is_published ON curricula(is_published);
CREATE INDEX IF NOT EXISTS idx_curricula_tags ON curricula USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_topics_curriculum_id ON topics(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_topics_parent_topic_id ON topics(parent_topic_id);
CREATE INDEX IF NOT EXISTS idx_topics_order ON topics(curriculum_id, parent_topic_id, order_index);

CREATE INDEX IF NOT EXISTS idx_learning_objectives_topic_id ON learning_objectives(topic_id);
CREATE INDEX IF NOT EXISTS idx_learning_objectives_order ON learning_objectives(topic_id, order_index);

CREATE INDEX IF NOT EXISTS idx_user_curriculum_progress_user_id ON user_curriculum_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_curriculum_progress_curriculum_id ON user_curriculum_progress(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_user_curriculum_progress_completed ON user_curriculum_progress(completed_at);

CREATE INDEX IF NOT EXISTS idx_user_topic_progress_user_id ON user_topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_topic_id ON user_topic_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_status ON user_topic_progress(status);

-- Triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_curricula_updated_at ON curricula;
CREATE TRIGGER update_curricula_updated_at
  BEFORE UPDATE ON curricula
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_topics_updated_at ON topics;
CREATE TRIGGER update_topics_updated_at
  BEFORE UPDATE ON topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_learning_objectives_updated_at ON learning_objectives;
CREATE TRIGGER update_learning_objectives_updated_at
  BEFORE UPDATE ON learning_objectives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_topic_progress_updated_at ON user_topic_progress;
CREATE TRIGGER update_user_topic_progress_updated_at
  BEFORE UPDATE ON user_topic_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update user_curriculum_progress completion percentage
CREATE OR REPLACE FUNCTION update_curriculum_completion_percentage()
RETURNS TRIGGER AS $$
DECLARE
  total_topics INTEGER;
  completed_topics INTEGER;
  new_percentage DECIMAL(5,2);
  curr_id UUID;
BEGIN
  -- Get curriculum_id from the topic
  SELECT curriculum_id INTO curr_id FROM topics WHERE id = NEW.topic_id;

  -- Count total required topics in the curriculum
  SELECT COUNT(*) INTO total_topics
  FROM topics
  WHERE curriculum_id = curr_id AND is_required = TRUE;

  -- Count completed required topics for this user
  SELECT COUNT(*) INTO completed_topics
  FROM user_topic_progress utp
  JOIN topics t ON utp.topic_id = t.id
  WHERE utp.user_id = NEW.user_id
    AND t.curriculum_id = curr_id
    AND t.is_required = TRUE
    AND utp.status = 'completed';

  -- Calculate percentage
  IF total_topics > 0 THEN
    new_percentage := (completed_topics::DECIMAL / total_topics::DECIMAL) * 100;
  ELSE
    new_percentage := 0;
  END IF;

  -- Update or insert user_curriculum_progress
  INSERT INTO user_curriculum_progress (user_id, curriculum_id, completion_percentage, last_accessed_at)
  VALUES (NEW.user_id, curr_id, new_percentage, CURRENT_TIMESTAMP)
  ON CONFLICT (user_id, curriculum_id)
  DO UPDATE SET
    completion_percentage = new_percentage,
    last_accessed_at = CURRENT_TIMESTAMP,
    completed_at = CASE
      WHEN new_percentage = 100 THEN CURRENT_TIMESTAMP
      ELSE NULL
    END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update curriculum completion percentage
DROP TRIGGER IF EXISTS update_curriculum_progress_on_topic_completion ON user_topic_progress;
CREATE TRIGGER update_curriculum_progress_on_topic_completion
  AFTER INSERT OR UPDATE ON user_topic_progress
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_curriculum_completion_percentage();
