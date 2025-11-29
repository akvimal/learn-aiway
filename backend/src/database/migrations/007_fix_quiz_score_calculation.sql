-- Migration: Fix ambiguous column reference in calculate_quiz_score function
-- Description: Rename local variables to avoid ambiguity with column names

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS calculate_quiz_score_on_answer ON quiz_attempt_answers;
DROP FUNCTION IF EXISTS calculate_quiz_score();

-- Recreate function with fixed variable names
CREATE OR REPLACE FUNCTION calculate_quiz_score()
RETURNS TRIGGER AS $$
DECLARE
  v_total_points DECIMAL(5,2);
  v_earned_points DECIMAL(5,2);
  v_percentage_score DECIMAL(5,2);
  v_quiz_passing_score DECIMAL(5,2);
BEGIN
  -- Get total points for the quiz
  SELECT COALESCE(SUM(points), 0) INTO v_total_points
  FROM quiz_questions
  WHERE quiz_id = (SELECT quiz_id FROM quiz_attempts WHERE id = NEW.attempt_id);

  -- Get earned points
  SELECT COALESCE(SUM(points_earned), 0) INTO v_earned_points
  FROM quiz_attempt_answers
  WHERE attempt_id = NEW.attempt_id;

  -- Calculate percentage
  IF v_total_points > 0 THEN
    v_percentage_score := (v_earned_points / v_total_points) * 100;
  ELSE
    v_percentage_score := 0;
  END IF;

  -- Get passing score for the quiz
  SELECT passing_score INTO v_quiz_passing_score
  FROM quizzes
  WHERE id = (SELECT quiz_id FROM quiz_attempts WHERE id = NEW.attempt_id);

  -- Update quiz attempt with final score
  UPDATE quiz_attempts
  SET
    score = v_percentage_score,
    points_earned = v_earned_points,
    total_points = v_total_points,
    passed = (v_percentage_score >= v_quiz_passing_score)
  WHERE id = NEW.attempt_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER calculate_quiz_score_on_answer
  AFTER INSERT OR UPDATE ON quiz_attempt_answers
  FOR EACH ROW
  EXECUTE FUNCTION calculate_quiz_score();
