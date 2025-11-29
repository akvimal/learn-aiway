export class Quiz {
  id: string;
  topic_id: string;
  title: string;
  description: string | null;
  passing_score: number;
  time_limit_minutes: number | null;
  shuffle_questions: boolean;
  show_answers_after_completion: boolean;
  allow_retakes: boolean;
  max_attempts: number | null;
  is_published: boolean;
  generated_by_ai: boolean;
  ai_provider_id: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;

  constructor(data: any) {
    this.id = data.id;
    this.topic_id = data.topic_id;
    this.title = data.title;
    this.description = data.description;
    this.passing_score = parseFloat(data.passing_score);
    this.time_limit_minutes = data.time_limit_minutes;
    this.shuffle_questions = data.shuffle_questions;
    this.show_answers_after_completion = data.show_answers_after_completion;
    this.allow_retakes = data.allow_retakes;
    this.max_attempts = data.max_attempts;
    this.is_published = data.is_published;
    this.generated_by_ai = data.generated_by_ai;
    this.ai_provider_id = data.ai_provider_id;
    this.created_by = data.created_by;
    this.created_at = new Date(data.created_at);
    this.updated_at = new Date(data.updated_at);
  }

  toJSON() {
    return {
      id: this.id,
      topic_id: this.topic_id,
      title: this.title,
      description: this.description,
      passing_score: this.passing_score,
      time_limit_minutes: this.time_limit_minutes,
      shuffle_questions: this.shuffle_questions,
      show_answers_after_completion: this.show_answers_after_completion,
      allow_retakes: this.allow_retakes,
      max_attempts: this.max_attempts,
      is_published: this.is_published,
      generated_by_ai: this.generated_by_ai,
      ai_provider_id: this.ai_provider_id,
      created_by: this.created_by,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

export class QuizQuestion {
  id: string;
  quiz_id: string;
  question_type: string;
  question_text: string;
  explanation: string | null;
  points: number;
  order_index: number;
  generated_by_ai: boolean;
  created_at: Date;

  constructor(data: any) {
    this.id = data.id;
    this.quiz_id = data.quiz_id;
    this.question_type = data.question_type;
    this.question_text = data.question_text;
    this.explanation = data.explanation;
    this.points = data.points;
    this.order_index = data.order_index;
    this.generated_by_ai = data.generated_by_ai;
    this.created_at = new Date(data.created_at);
  }

  toJSON() {
    return {
      id: this.id,
      quiz_id: this.quiz_id,
      question_type: this.question_type,
      question_text: this.question_text,
      explanation: this.explanation,
      points: this.points,
      order_index: this.order_index,
      generated_by_ai: this.generated_by_ai,
      created_at: this.created_at,
    };
  }
}

export class QuizQuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  explanation: string | null;
  order_index: number;
  created_at: Date;

  constructor(data: any) {
    this.id = data.id;
    this.question_id = data.question_id;
    this.option_text = data.option_text;
    this.is_correct = data.is_correct;
    this.explanation = data.explanation;
    this.order_index = data.order_index;
    this.created_at = new Date(data.created_at);
  }

  toJSON() {
    return {
      id: this.id,
      question_id: this.question_id,
      option_text: this.option_text,
      is_correct: this.is_correct,
      explanation: this.explanation,
      order_index: this.order_index,
      created_at: this.created_at,
    };
  }
}

export class QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  attempt_number: number;
  started_at: Date;
  submitted_at: Date | null;
  time_taken_seconds: number | null;
  score: number | null;
  points_earned: number | null;
  total_points: number | null;
  passed: boolean | null;
  is_completed: boolean;
  created_at: Date;

  constructor(data: any) {
    this.id = data.id;
    this.quiz_id = data.quiz_id;
    this.user_id = data.user_id;
    this.attempt_number = data.attempt_number;
    this.started_at = new Date(data.started_at);
    this.submitted_at = data.submitted_at ? new Date(data.submitted_at) : null;
    this.time_taken_seconds = data.time_taken_seconds;
    this.score = data.score ? parseFloat(data.score) : null;
    this.points_earned = data.points_earned ? parseFloat(data.points_earned) : null;
    this.total_points = data.total_points ? parseFloat(data.total_points) : null;
    this.passed = data.passed;
    this.is_completed = data.is_completed;
    this.created_at = new Date(data.created_at);
  }

  toJSON() {
    return {
      id: this.id,
      quiz_id: this.quiz_id,
      user_id: this.user_id,
      attempt_number: this.attempt_number,
      started_at: this.started_at,
      submitted_at: this.submitted_at,
      time_taken_seconds: this.time_taken_seconds,
      score: this.score,
      points_earned: this.points_earned,
      total_points: this.total_points,
      passed: this.passed,
      is_completed: this.is_completed,
      created_at: this.created_at,
    };
  }
}
