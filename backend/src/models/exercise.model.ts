export class Exercise {
  id: string;
  topic_id: string;
  title: string;
  description: string;
  instructions: string;
  language: string;
  difficulty_level: string;
  starter_code: string | null;
  solution_code: string | null;
  explanation: string | null;
  order_index: number;
  points: number;
  time_limit_seconds: number | null;
  is_published: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;

  constructor(data: any) {
    this.id = data.id;
    this.topic_id = data.topic_id;
    this.title = data.title;
    this.description = data.description;
    this.instructions = data.instructions;
    this.language = data.language;
    this.difficulty_level = data.difficulty_level;
    this.starter_code = data.starter_code;
    this.solution_code = data.solution_code;
    this.explanation = data.explanation;
    this.order_index = data.order_index;
    this.points = data.points;
    this.time_limit_seconds = data.time_limit_seconds;
    this.is_published = data.is_published;
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
      instructions: this.instructions,
      language: this.language,
      difficulty_level: this.difficulty_level,
      starter_code: this.starter_code,
      solution_code: this.solution_code,
      explanation: this.explanation,
      order_index: this.order_index,
      points: this.points,
      time_limit_seconds: this.time_limit_seconds,
      is_published: this.is_published,
      created_by: this.created_by,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

export class ExerciseHint {
  id: string;
  exercise_id: string;
  hint_level: number;
  hint_text: string;
  reveals_solution: boolean;
  generated_by_ai: boolean;
  created_by: string;
  created_at: Date;

  constructor(data: any) {
    this.id = data.id;
    this.exercise_id = data.exercise_id;
    this.hint_level = data.hint_level;
    this.hint_text = data.hint_text;
    this.reveals_solution = data.reveals_solution;
    this.generated_by_ai = data.generated_by_ai;
    this.created_by = data.created_by;
    this.created_at = new Date(data.created_at);
  }

  toJSON() {
    return {
      id: this.id,
      exercise_id: this.exercise_id,
      hint_level: this.hint_level,
      hint_text: this.hint_text,
      reveals_solution: this.reveals_solution,
      generated_by_ai: this.generated_by_ai,
      created_by: this.created_by,
      created_at: this.created_at,
    };
  }
}

export class ExerciseTestCase {
  id: string;
  exercise_id: string;
  test_name: string;
  test_type: string;
  input_data: any;
  expected_output: any;
  stdin: string | null;
  expected_stdout: string | null;
  points: number;
  is_hidden: boolean;
  timeout_ms: number;
  order_index: number;
  generated_by_ai: boolean;
  created_by: string;
  created_at: Date;

  constructor(data: any) {
    this.id = data.id;
    this.exercise_id = data.exercise_id;
    this.test_name = data.test_name;
    this.test_type = data.test_type;
    this.input_data = data.input_data;
    this.expected_output = data.expected_output;
    this.stdin = data.stdin;
    this.expected_stdout = data.expected_stdout;
    this.points = data.points;
    this.is_hidden = data.is_hidden;
    this.timeout_ms = data.timeout_ms;
    this.order_index = data.order_index;
    this.generated_by_ai = data.generated_by_ai;
    this.created_by = data.created_by;
    this.created_at = new Date(data.created_at);
  }

  toJSON() {
    return {
      id: this.id,
      exercise_id: this.exercise_id,
      test_name: this.test_name,
      test_type: this.test_type,
      input_data: this.input_data,
      expected_output: this.expected_output,
      stdin: this.stdin,
      expected_stdout: this.expected_stdout,
      points: this.points,
      is_hidden: this.is_hidden,
      timeout_ms: this.timeout_ms,
      order_index: this.order_index,
      generated_by_ai: this.generated_by_ai,
      created_by: this.created_by,
      created_at: this.created_at,
    };
  }
}
