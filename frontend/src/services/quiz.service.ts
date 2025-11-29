import { httpClient } from '../utils/http-client';
import type {
  Quiz,
  QuizGenerateInput,
  QuizWithQuestions,
  QuizAttempt,
  QuizAttemptWithAnswers,
  SubmitAnswerInput,
  ApiResponse,
} from '../types';

class QuizService {
  private readonly BASE_URL = '/quizzes';

  /**
   * Generate quiz with AI
   */
  async generateQuiz(input: QuizGenerateInput): Promise<{ quiz: Quiz; questionsCount: number }> {
    const response: any = await httpClient.post(`${this.BASE_URL}/generate`, input);
    return response.data;
  }

  /**
   * Get quiz by ID with questions
   */
  async getQuizById(id: string): Promise<QuizWithQuestions> {
    const response: any = await httpClient.get(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Get quizzes by topic
   */
  async getQuizzesByTopic(topicId: string): Promise<{ quizzes: Quiz[] }> {
    const response: any = await httpClient.get(`${this.BASE_URL}/topic/${topicId}`);
    return response.data;
  }

  /**
   * Update quiz
   */
  async updateQuiz(id: string, updates: Partial<Quiz>): Promise<{ quiz: Quiz }> {
    const response: any = await httpClient.put(`${this.BASE_URL}/${id}`, updates);
    return response.data;
  }

  /**
   * Delete quiz
   */
  async deleteQuiz(id: string): Promise<{ message: string }> {
    const response: any = await httpClient.delete(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Start a quiz attempt
   */
  async startAttempt(quizId: string): Promise<{ attempt: QuizAttempt }> {
    const response: any = await httpClient.post(`${this.BASE_URL}/${quizId}/attempts`);
    return response.data;
  }

  /**
   * Submit an answer
   */
  async submitAnswer(attemptId: string, answer: SubmitAnswerInput): Promise<{ message: string }> {
    const response: any = await httpClient.post(
      `${this.BASE_URL}/attempts/${attemptId}/answers`,
      answer
    );
    return response.data;
  }

  /**
   * Complete quiz attempt
   */
  async completeAttempt(attemptId: string): Promise<{ attempt: QuizAttempt }> {
    const response: any = await httpClient.post(`${this.BASE_URL}/attempts/${attemptId}/complete`);
    return response.data;
  }

  /**
   * Get attempt results
   */
  async getAttemptResults(attemptId: string): Promise<QuizAttemptWithAnswers> {
    const response: any = await httpClient.get(`${this.BASE_URL}/attempts/${attemptId}`);
    return response.data;
  }

  /**
   * Get user's quiz history (all attempts)
   */
  async getMyQuizHistory(): Promise<{ history: any[] }> {
    const response: any = await httpClient.get(`${this.BASE_URL}/my/history`);
    return response.data;
  }

  /**
   * Get curriculum performance (quiz stats by topic)
   */
  async getCurriculumPerformance(curriculumId: string): Promise<any> {
    const response: any = await httpClient.get(`${this.BASE_URL}/curriculum/${curriculumId}/performance`);
    return response.data;
  }
}

export const quizService = new QuizService();
