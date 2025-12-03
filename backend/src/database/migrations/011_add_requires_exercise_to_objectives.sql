-- Migration: Add requires_exercise flag to learning_objectives table
-- This flag indicates whether an objective requires hands-on exercise practice (true)
-- or is more conceptual/theoretical in nature (false)

ALTER TABLE learning_objectives
ADD COLUMN requires_exercise BOOLEAN DEFAULT true;

-- Add index for filtering practical objectives
CREATE INDEX idx_learning_objectives_requires_exercise
ON learning_objectives(topic_id, requires_exercise);

-- Add comment to explain the column
COMMENT ON COLUMN learning_objectives.requires_exercise IS
'Indicates whether this objective requires hands-on exercise practice (true) or is theoretical/conceptual (false).
Practical objectives (implement, create, build, write) should be true.
Conceptual objectives (explain, describe, understand, compare) should be false.';
