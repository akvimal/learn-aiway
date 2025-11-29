import { logger } from '../config/logger.config';
import { AIProviderFactory } from './ai/provider.factory';
import { AIChatMessage, AIChatCompletionResponse } from '../types';
import { quizRepository } from '../repositories/quiz.repository';

interface GenerateQuizInput {
  topicId: string;
  topicTitle: string;
  topicContent?: string;
  difficultyLevel: string;
  numQuestions?: number;
}

export class QuizGenerationService {
  /**
   * Generate quiz questions using AI
   */
  async generateQuiz(
    input: GenerateQuizInput,
    userId: string,
    providerId: string
  ): Promise<any> {
    try {
      const provider = await AIProviderFactory.getProvider(providerId, userId);

      const prompt = `Generate ${input.numQuestions || 5} multiple-choice quiz questions to test understanding of this topic.

Topic: ${input.topicTitle}
${input.topicContent ? `Content:\n${input.topicContent}` : ''}
Difficulty Level: ${input.difficultyLevel}

CRITICAL REQUIREMENTS:
1. Questions MUST test specific knowledge from "${input.topicTitle}"
2. Each question should have 4 answer options (A, B, C, D)
3. Only ONE option should be correct
4. Include brief explanations for why each answer is correct/incorrect
5. Questions should progress from basic recall to application/analysis
6. Avoid ambiguous or trick questions

Return as JSON array in this EXACT format:
[
  {
    "question": "Question text here?",
    "options": [
      {"text": "Option A", "isCorrect": false, "explanation": "Why this is wrong"},
      {"text": "Option B", "isCorrect": true, "explanation": "Why this is correct"},
      {"text": "Option C", "isCorrect": false, "explanation": "Why this is wrong"},
      {"text": "Option D", "isCorrect": false, "explanation": "Why this is wrong"}
    ],
    "explanation": "Overall explanation of the concept being tested"
  }
]`;

      const messages: AIChatMessage[] = [
        {
          role: 'system',
          content: 'You are an expert educator creating assessment questions. Generate clear, unambiguous quiz questions that accurately test knowledge. Return ONLY valid JSON, no markdown formatting.',
        },
        { role: 'user', content: prompt },
      ];

      const response: AIChatCompletionResponse = await provider.sendChatCompletion({
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      const questions = this.parseJSONResponse(response.content);

      if (!Array.isArray(questions)) {
        throw new Error('AI did not return a valid questions array');
      }

      logger.info('Generated quiz questions', {
        topicId: input.topicId,
        numQuestions: questions.length,
      });

      return questions;
    } catch (error) {
      logger.error('Failed to generate quiz questions', error);
      throw error;
    }
  }

  /**
   * Create quiz with AI-generated questions
   */
  async createAIGeneratedQuiz(
    input: GenerateQuizInput & {
      title: string;
      passingScore?: number;
    },
    userId: string,
    providerId: string
  ): Promise<any> {
    try {
      // Generate questions
      const aiQuestions = await this.generateQuiz(input, userId, providerId);

      // Create quiz
      const quiz = await quizRepository.create({
        topic_id: input.topicId,
        title: input.title,
        description: `AI-generated quiz for ${input.topicTitle}`,
        passing_score: input.passingScore || 70,
        generated_by_ai: true,
        ai_provider_id: providerId,
        created_by: userId,
      });

      // Add questions and options
      for (let i = 0; i < aiQuestions.length; i++) {
        const aiQ = aiQuestions[i];

        const question = await quizRepository.addQuestion({
          quiz_id: quiz.id,
          question_type: 'multiple_choice',
          question_text: aiQ.question,
          explanation: aiQ.explanation,
          points: 1,
          order_index: i,
          generated_by_ai: true,
        });

        // Add options
        for (let j = 0; j < aiQ.options.length; j++) {
          const opt = aiQ.options[j];
          await quizRepository.addQuestionOption({
            question_id: question.id,
            option_text: opt.text,
            is_correct: opt.isCorrect,
            explanation: opt.explanation,
            order_index: j,
          });
        }
      }

      logger.info('Created AI-generated quiz', {
        quizId: quiz.id,
        topicId: input.topicId,
        numQuestions: aiQuestions.length,
      });

      return {
        quiz: quiz.toJSON(),
        questionsCount: aiQuestions.length,
      };
    } catch (error) {
      logger.error('Failed to create AI-generated quiz', error);
      throw error;
    }
  }

  /**
   * Parse JSON response from AI
   */
  private parseJSONResponse(content: string): any {
    // Remove markdown code blocks if present
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '');
    }

    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      logger.error('Failed to parse JSON from AI response', { content });
      throw new Error('Invalid JSON response from AI');
    }
  }
}

export const quizGenerationService = new QuizGenerationService();
