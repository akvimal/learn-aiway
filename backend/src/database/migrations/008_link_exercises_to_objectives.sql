-- Migration: Link exercises to learning objectives
-- Description: Create many-to-many relationship between exercises and learning objectives

-- Create exercise_objective mapping table (optional - for more granular tracking)
CREATE TABLE IF NOT EXISTS exercise_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  objective_id UUID NOT NULL REFERENCES learning_objectives(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT exercise_objectives_unique UNIQUE (exercise_id, objective_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_exercise_objectives_exercise_id ON exercise_objectives(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_objectives_objective_id ON exercise_objectives(objective_id);

-- Function to check if topic has exercises for all objectives
CREATE OR REPLACE FUNCTION check_topic_objectives_coverage(p_topic_id UUID)
RETURNS TABLE (
  objective_id UUID,
  objective_text TEXT,
  exercise_count BIGINT,
  has_exercises BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lo.id as objective_id,
    lo.objective_text,
    COUNT(DISTINCT eo.exercise_id) as exercise_count,
    COUNT(DISTINCT eo.exercise_id) > 0 as has_exercises
  FROM learning_objectives lo
  LEFT JOIN exercise_objectives eo ON lo.id = eo.objective_id
  WHERE lo.topic_id = p_topic_id
  GROUP BY lo.id, lo.objective_text
  ORDER BY lo.order_index;
END;
$$ LANGUAGE plpgsql;
