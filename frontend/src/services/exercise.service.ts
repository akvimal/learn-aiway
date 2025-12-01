import { httpClient } from '../utils/http-client';

export interface Exercise {
  id: string;
  topic_id: string;
  title: string;
  description: string;
  instructions: string;
  language: 'javascript' | 'java' | 'python';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  starter_code?: string;
  solution_code?: string;
  explanation?: string;
  order_index: number;
  points: number;
  time_limit_seconds?: number;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExerciseWithDetails extends Exercise {
  hints: ExerciseHint[];
  test_cases: ExerciseTestCase[];
}

export interface ExerciseHint {
  id: string;
  exercise_id: string;
  hint_level: number;
  hint_text: string;
  reveals_solution: boolean;
  generated_by_ai: boolean;
  created_by: string;
  created_at: string;
}

export interface ExerciseTestCase {
  id: string;
  exercise_id: string;
  test_name: string;
  test_type: 'public' | 'hidden' | 'edge_case';
  input_data?: any;
  expected_output?: any;
  stdin?: string;
  expected_stdout?: string;
  points: number;
  is_hidden: boolean;
  timeout_ms: number;
  order_index: number;
  generated_by_ai: boolean;
  created_by: string;
  created_at: string;
}

export interface CreateExerciseInput {
  title: string;
  description: string;
  instructions: string;
  language: 'javascript' | 'java' | 'python';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  starterCode?: string;
  solutionCode: string;
  explanation?: string;
  points?: number;
  timeLimitSeconds?: number;
  isPublished?: boolean;
}

export interface CreateTestCaseInput {
  testName: string;
  testType?: 'public' | 'hidden' | 'edge_case';
  inputData?: any;
  expectedOutput?: any;
  stdin?: string;
  expectedStdout?: string;
  points?: number;
  isHidden?: boolean;
  orderIndex?: number;
}

export interface CreateHintInput {
  hintLevel: number;
  hintText: string;
  revealsSolution?: boolean;
}

class ExerciseService {
  /**
   * Create a new exercise for a topic
   */
  async createExercise(topicId: string, input: CreateExerciseInput): Promise<Exercise> {
    const response: any = await httpClient.post(`/topics/${topicId}/exercises`, input);
    return response.data;
  }

  /**
   * Get exercise by ID with details
   */
  async getExerciseById(exerciseId: string): Promise<ExerciseWithDetails> {
    const response: any = await httpClient.get(`/exercises/${exerciseId}`);
    return response.data;
  }

  /**
   * Get exercises for a topic
   */
  async getExercisesByTopic(topicId: string): Promise<Exercise[]> {
    const response: any = await httpClient.get(`/topics/${topicId}/exercises`);
    return response.data;
  }

  /**
   * Update exercise
   */
  async updateExercise(exerciseId: string, updates: Partial<CreateExerciseInput>): Promise<Exercise> {
    const response: any = await httpClient.patch(`/exercises/${exerciseId}`, updates);
    return response.data;
  }

  /**
   * Delete exercise
   */
  async deleteExercise(exerciseId: string): Promise<{ message: string }> {
    const response: any = await httpClient.delete(`/exercises/${exerciseId}`);
    return response.data;
  }

  /**
   * Add test case to exercise
   */
  async addTestCase(exerciseId: string, testCase: CreateTestCaseInput): Promise<ExerciseTestCase> {
    const response: any = await httpClient.post(`/exercises/${exerciseId}/test-cases`, testCase);
    return response.data;
  }

  /**
   * Get test cases for exercise
   */
  async getTestCases(exerciseId: string): Promise<ExerciseTestCase[]> {
    const response: any = await httpClient.get(`/exercises/${exerciseId}/test-cases`);
    return response.data;
  }

  /**
   * Delete test case
   */
  async deleteTestCase(testCaseId: string): Promise<{ message: string }> {
    const response: any = await httpClient.delete(`/test-cases/${testCaseId}`);
    return response.data;
  }

  /**
   * Add hint to exercise
   */
  async addHint(exerciseId: string, hint: CreateHintInput): Promise<ExerciseHint> {
    const response: any = await httpClient.post(`/exercises/${exerciseId}/hints`, hint);
    return response.data;
  }

  /**
   * Get hints for exercise
   */
  async getHints(exerciseId: string): Promise<ExerciseHint[]> {
    const response: any = await httpClient.get(`/exercises/${exerciseId}/hints`);
    return response.data;
  }

  /**
   * Request a hint (learner endpoint - tracks usage)
   */
  async requestHint(exerciseId: string, hintLevel: number): Promise<ExerciseHint> {
    const response: any = await httpClient.post(`/exercises/${exerciseId}/hints/${hintLevel}/request`);
    return response.data;
  }

  /**
   * Get hint usage for current user
   */
  async getHintUsage(exerciseId: string): Promise<string[]> {
    const response: any = await httpClient.get(`/exercises/${exerciseId}/hints/usage`);
    return response.data;
  }

  /**
   * Delete hint
   */
  async deleteHint(hintId: string): Promise<{ message: string }> {
    const response: any = await httpClient.delete(`/hints/${hintId}`);
    return response.data;
  }

  /**
   * Link exercise to learning objectives
   */
  async linkToObjectives(exerciseId: string, objectiveIds: string[]): Promise<{ message: string }> {
    const response: any = await httpClient.post(`/exercises/${exerciseId}/objectives`, { objectiveIds });
    return response.data;
  }

  /**
   * Get linked learning objectives for exercise
   */
  async getLinkedObjectives(exerciseId: string): Promise<any[]> {
    const response: any = await httpClient.get(`/exercises/${exerciseId}/objectives`);
    return response.data;
  }

  /**
   * Get exercises for a learning objective
   */
  async getExercisesByObjective(objectiveId: string): Promise<Exercise[]> {
    const response: any = await httpClient.get(`/objectives/${objectiveId}/exercises`);
    return response.data;
  }
}

export const exerciseService = new ExerciseService();
