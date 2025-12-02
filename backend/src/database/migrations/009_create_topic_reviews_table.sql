-- Create topic reviews table to store AI-generated topic quality reviews
CREATE TABLE IF NOT EXISTS topic_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  summary TEXT NOT NULL,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_provider_id UUID REFERENCES ai_providers(id),
  ai_model VARCHAR(100),
  reviewed_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Metadata about what was reviewed
  objectives_count INTEGER DEFAULT 0,
  exercises_count INTEGER DEFAULT 0,
  quizzes_count INTEGER DEFAULT 0
);

-- Index for fetching latest review for a topic
CREATE INDEX idx_topic_reviews_topic_id ON topic_reviews(topic_id);
CREATE INDEX idx_topic_reviews_created_at ON topic_reviews(created_at DESC);

-- Composite index for fetching latest review per topic
CREATE INDEX idx_topic_reviews_topic_created ON topic_reviews(topic_id, created_at DESC);

-- Add comment
COMMENT ON TABLE topic_reviews IS 'Stores AI-generated quality reviews for learning topics';
COMMENT ON COLUMN topic_reviews.findings IS 'Array of finding objects with category, severity, title, description, affectedItems, and suggestion';
COMMENT ON COLUMN topic_reviews.overall_score IS 'Overall quality score from 0-100';
