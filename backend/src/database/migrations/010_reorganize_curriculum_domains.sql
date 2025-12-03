-- Migration: Reorganize curriculum domains into hierarchical structure
-- Description: Add category and specialization fields for better domain organization

-- Add new columns for hierarchical domain structure
ALTER TABLE curricula
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS specialization VARCHAR(100);

-- Make domain nullable for transition (it's now optional)
ALTER TABLE curricula
  ALTER COLUMN domain DROP NOT NULL;

-- For backward compatibility, populate category from existing domain field
UPDATE curricula
SET category = domain
WHERE category IS NULL AND domain IS NOT NULL;

-- Add expert difficulty level to existing enum
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'expert'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'difficulty_level')
  ) THEN
    ALTER TYPE difficulty_level ADD VALUE 'expert' AFTER 'advanced';
  END IF;
END $$;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_curricula_category ON curricula(category);
CREATE INDEX IF NOT EXISTS idx_curricula_specialization ON curricula(specialization);
CREATE INDEX IF NOT EXISTS idx_curricula_category_specialization ON curricula(category, specialization);

-- Add check constraint to ensure category is from approved list (optional, for data integrity)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_curricula_category'
  ) THEN
    ALTER TABLE curricula
    ADD CONSTRAINT check_curricula_category CHECK (
      category IS NULL OR category IN (
        'Technology & Engineering',
        'Business & Management',
        'Finance & Accounting',
        'Compliance & Governance',
        'Data & Analytics',
        'Design & Creative',
        'Marketing & Sales',
        'Languages & Communication'
      )
    );
  END IF;
END $$;

-- Add comment to domain column indicating deprecation
COMMENT ON COLUMN curricula.domain IS 'DEPRECATED: Use category and specialization instead. Kept for backward compatibility.';
COMMENT ON COLUMN curricula.category IS 'Primary domain category (e.g., Technology & Engineering, Finance & Accounting)';
COMMENT ON COLUMN curricula.specialization IS 'Specific specialization within category (e.g., Web Development, Corporate Finance)';

-- Create view for backward compatibility
CREATE OR REPLACE VIEW curricula_with_domain_path AS
SELECT
  c.*,
  CASE
    WHEN c.specialization IS NOT NULL THEN c.category || ' > ' || c.specialization
    WHEN c.category IS NOT NULL THEN c.category
    ELSE c.domain
  END as domain_path
FROM curricula c;

-- Grant permissions on the view
GRANT SELECT ON curricula_with_domain_path TO PUBLIC;
