export class Evaluation {
  id: string;
  topic_id: string;
  session_id: string | null;
  user_id: string;
  type: string;
  title: string;
  instructions: string | null;
  started_at: Date;
  submitted_at: Date | null;
  time_limit_minutes: number | null;
  score: number | null;
  max_score: number;
  passed: boolean | null;
  evaluated_by_ai: boolean;
  ai_provider_id: string | null;
  ai_feedback: string | null;
  rubric_id: string | null;
  created_at: Date;
  updated_at: Date;

  constructor(data: any) {
    this.id = data.id;
    this.topic_id = data.topic_id;
    this.session_id = data.session_id;
    this.user_id = data.user_id;
    this.type = data.type;
    this.title = data.title;
    this.instructions = data.instructions;
    this.started_at = new Date(data.started_at);
    this.submitted_at = data.submitted_at ? new Date(data.submitted_at) : null;
    this.time_limit_minutes = data.time_limit_minutes;
    this.score = data.score ? parseFloat(data.score) : null;
    this.max_score = parseFloat(data.max_score);
    this.passed = data.passed;
    this.evaluated_by_ai = data.evaluated_by_ai;
    this.ai_provider_id = data.ai_provider_id;
    this.ai_feedback = data.ai_feedback;
    this.rubric_id = data.rubric_id;
    this.created_at = new Date(data.created_at);
    this.updated_at = new Date(data.updated_at);
  }

  toJSON() {
    return {
      id: this.id,
      topic_id: this.topic_id,
      session_id: this.session_id,
      user_id: this.user_id,
      type: this.type,
      title: this.title,
      instructions: this.instructions,
      started_at: this.started_at,
      submitted_at: this.submitted_at,
      time_limit_minutes: this.time_limit_minutes,
      score: this.score,
      max_score: this.max_score,
      passed: this.passed,
      evaluated_by_ai: this.evaluated_by_ai,
      ai_provider_id: this.ai_provider_id,
      ai_feedback: this.ai_feedback,
      rubric_id: this.rubric_id,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

export class Scenario {
  id: string;
  topic_id: string;
  title: string;
  context: string;
  question: string;
  evaluation_criteria: any;
  model_answer: string | null;
  difficulty_level: string;
  points: number;
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
    this.context = data.context;
    this.question = data.question;
    this.evaluation_criteria = data.evaluation_criteria;
    this.model_answer = data.model_answer;
    this.difficulty_level = data.difficulty_level;
    this.points = data.points;
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
      context: this.context,
      question: this.question,
      evaluation_criteria: this.evaluation_criteria,
      model_answer: this.model_answer,
      difficulty_level: this.difficulty_level,
      points: this.points,
      is_published: this.is_published,
      generated_by_ai: this.generated_by_ai,
      ai_provider_id: this.ai_provider_id,
      created_by: this.created_by,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
