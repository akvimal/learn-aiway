import { database } from '../config/database.config';
import { logger } from '../config/logger.config';
import { aiProviderFactory } from './ai/provider.factory';
import type {
  AIChatMessage,
  AIChatCompletionRequest,
  AIChatCompletionResponse
} from '../types';

export interface GenerateExplanationInput {
  topicId: string;
  topicTitle: string;
  topicContent: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  providerId: string;
  variationType: 'explanation' | 'example' | 'analogy' | 'summary' | 'deep_dive';
}

export interface GenerateExerciseInput {
  topicId: string;
  topicTitle: string;
  topicContent: string;
  language: 'javascript' | 'java';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  providerId: string;
  exerciseDescription?: string;
}

export interface GenerateHintsInput {
  exerciseId: string;
  exerciseTitle: string;
  exerciseDescription: string;
  solutionCode: string;
  providerId: string;
  numHints: number; // 3-5 hints
}

export interface GenerateTestCasesInput {
  exerciseId: string;
  exerciseTitle: string;
  exerciseDescription: string;
  solutionCode: string;
  language: 'javascript' | 'java';
  providerId: string;
  numTestCases: number; // 5-10 test cases
}

export interface GenerateCurriculumTopicsInput {
  curriculumId: string;
  curriculumTitle: string;
  curriculumDescription: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  domain: string;
  numTopics: number; // 3-10 topics
}

export interface GenerateLearningObjectivesInput {
  topicId: string;
  topicTitle: string;
  topicDescription: string;
  topicContent: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  numObjectives: number; // 3-8 objectives
}

export class AIContentGeneratorService {
  /**
   * Generate a content variation for a topic (explanation, example, analogy, etc.)
   */
  async generateTopicContentVariation(
    input: GenerateExplanationInput,
    userId: string
  ): Promise<string> {
    try {
      // Get AI provider
      const provider = await aiProviderFactory.getProvider(input.providerId, userId);

      // Build prompt based on variation type
      const prompt = this.buildContentVariationPrompt(input);

      // Call AI
      const messages: AIChatMessage[] = [
        { role: 'user', content: prompt }
      ];

      const request: AIChatCompletionRequest = {
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      };

      const response: AIChatCompletionResponse = await provider.sendChatCompletion(request);

      // Store in database
      await database.query(
        `INSERT INTO topic_content_variations
         (topic_id, variation_type, difficulty_level, content, generated_by_ai, ai_provider_id, ai_model, created_by)
         VALUES ($1, $2, $3, $4, true, $5, $6, $7)`,
        [
          input.topicId,
          input.variationType,
          input.difficultyLevel,
          response.content,
          input.providerId,
          response.model,
          userId,
        ]
      );

      logger.info('Generated topic content variation', {
        topicId: input.topicId,
        variationType: input.variationType,
        difficultyLevel: input.difficultyLevel,
        provider: response.model,
      });

      return response.content;
    } catch (error) {
      logger.error('Failed to generate topic content variation', error);
      throw error;
    }
  }

  /**
   * Generate a complete exercise with starter code and solution
   */
  async generateExercise(
    input: GenerateExerciseInput,
    userId: string
  ): Promise<{
    title: string;
    description: string;
    instructions: string;
    starterCode: string;
    solutionCode: string;
  }> {
    try {
      const provider = await aiProviderFactory.getProvider(input.providerId, userId);

      const prompt = this.buildExercisePrompt(input);

      const messages: AIChatMessage[] = [
        {
          role: 'system',
          content: 'You are an expert programming instructor creating educational exercises. Return your response in valid JSON format with the following structure: {"title": "...", "description": "...", "instructions": "...", "starterCode": "...", "solutionCode": "..."}',
        },
        { role: 'user', content: prompt },
      ];

      const response: AIChatCompletionResponse = await provider.sendChatCompletion({
        messages,
        temperature: 0.8,
        max_tokens: 3000,
      });

      // Parse JSON response
      const exerciseData = this.parseJSONResponse(response.content);

      logger.info('Generated exercise', {
        topicId: input.topicId,
        language: input.language,
        difficultyLevel: input.difficultyLevel,
      });

      return exerciseData;
    } catch (error) {
      logger.error('Failed to generate exercise', error);
      throw error;
    }
  }

  /**
   * Generate progressive hints for an exercise
   */
  async generateHints(
    input: GenerateHintsInput,
    userId: string
  ): Promise<string[]> {
    try {
      const provider = await aiProviderFactory.getProvider(input.providerId, userId);

      const prompt = `Given this programming exercise, generate ${input.numHints} progressive hints that guide learners toward the solution WITHOUT giving away the answer directly.

Exercise Title: ${input.exerciseTitle}
Description: ${input.exerciseDescription}

Solution Code (for reference only, do NOT include in hints):
\`\`\`
${input.solutionCode}
\`\`\`

Requirements for hints:
1. Hint 1: Gentle nudge about the approach (most vague)
2. Hint 2: Explain the key concept needed
3. Hint 3: Describe the algorithm or steps
4. Hint 4 (if needed): Provide pseudocode
5. Hint 5 (if needed): Almost reveal the solution but stop short

Return your response as a JSON array of strings:
["Hint 1 text", "Hint 2 text", "Hint 3 text", ...]`;

      const messages: AIChatMessage[] = [
        {
          role: 'system',
          content: 'You are an expert programming instructor creating progressive hints. Return valid JSON array only.',
        },
        { role: 'user', content: prompt },
      ];

      const response: AIChatCompletionResponse = await provider.sendChatCompletion({
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      });

      // Parse JSON array
      const hints = this.parseJSONResponse(response.content);

      if (!Array.isArray(hints)) {
        throw new Error('AI did not return a valid hints array');
      }

      // Store hints in database
      for (let i = 0; i < hints.length; i++) {
        await database.query(
          `INSERT INTO exercise_hints
           (exercise_id, hint_level, hint_text, reveals_solution, generated_by_ai, created_by)
           VALUES ($1, $2, $3, $4, true, $5)`,
          [
            input.exerciseId,
            i + 1,
            hints[i],
            i === hints.length - 1, // Last hint might reveal solution
            userId,
          ]
        );
      }

      logger.info('Generated hints', {
        exerciseId: input.exerciseId,
        numHints: hints.length,
      });

      return hints;
    } catch (error) {
      logger.error('Failed to generate hints', error);
      throw error;
    }
  }

  /**
   * Generate test cases for an exercise
   */
  async generateTestCases(
    input: GenerateTestCasesInput,
    userId: string
  ): Promise<any[]> {
    try {
      const provider = await aiProviderFactory.getProvider(input.providerId, userId);

      const prompt = `Generate ${input.numTestCases} test cases for this ${input.language} programming exercise.

Exercise Title: ${input.exerciseTitle}
Description: ${input.exerciseDescription}

Solution Code:
\`\`\`${input.language}
${input.solutionCode}
\`\`\`

Requirements:
1. Include basic test cases (expected inputs)
2. Include edge cases (empty, null, boundary values)
3. Include stress tests (large inputs)
4. For each test case, provide:
   - test_name: descriptive name
   - test_type: "public" (shown to learners) or "hidden" (for grading only)
   - input_data: {"args": [arg1, arg2, ...]}
   - expected_output: {"result": expectedValue}

Return as JSON array:
[
  {
    "test_name": "Basic addition",
    "test_type": "public",
    "input_data": {"args": [1, 2]},
    "expected_output": {"result": 3}
  },
  ...
]`;

      const messages: AIChatMessage[] = [
        {
          role: 'system',
          content: 'You are an expert test engineer creating comprehensive test cases. Return valid JSON array only.',
        },
        { role: 'user', content: prompt },
      ];

      const response: AIChatCompletionResponse = await provider.sendChatCompletion({
        messages,
        temperature: 0.6,
        max_tokens: 2500,
      });

      // Parse JSON array
      const testCases = this.parseJSONResponse(response.content);

      if (!Array.isArray(testCases)) {
        throw new Error('AI did not return a valid test cases array');
      }

      // Store test cases in database
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        await database.query(
          `INSERT INTO exercise_test_cases
           (exercise_id, test_name, test_type, input_data, expected_output, is_hidden, points, order_index, generated_by_ai, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)`,
          [
            input.exerciseId,
            tc.test_name,
            tc.test_type,
            JSON.stringify(tc.input_data),
            JSON.stringify(tc.expected_output),
            tc.test_type === 'hidden',
            1, // Default 1 point per test
            i,
            userId,
          ]
        );
      }

      logger.info('Generated test cases', {
        exerciseId: input.exerciseId,
        numTestCases: testCases.length,
      });

      return testCases;
    } catch (error) {
      logger.error('Failed to generate test cases', error);
      throw error;
    }
  }

  /**
   * Generate topics for a curriculum
   */
  async generateCurriculumTopics(
    input: GenerateCurriculumTopicsInput,
    userId: string,
    providerId: string
  ): Promise<Array<{
    title: string;
    description: string;
    suggestedContent?: string;
    estimatedDurationMinutes?: number;
  }>> {
    try {
      const provider = await aiProviderFactory.getProvider(providerId, userId);

      const prompt = `Generate ${input.numTopics} learning topics for a curriculum in the ${input.domain} domain.

Curriculum Title: ${input.curriculumTitle}
Curriculum Description: ${input.curriculumDescription}
Difficulty Level: ${input.difficultyLevel}
Domain: ${input.domain}

Requirements:
1. Each topic should build on previous ones (logical progression)
2. Topics should be appropriate for ${input.difficultyLevel} level learners
3. Each topic should have:
   - title: Clear, concise title (3-8 words)
   - description: What the topic covers (2-3 sentences)
   - suggestedContent: Brief outline or key points to cover (optional)
   - estimatedDurationMinutes: Estimated time to complete (15-120 minutes)

Return as JSON array:
[
  {
    "title": "Introduction to Variables",
    "description": "Learn about variables, data types, and how to declare and use them in programming.",
    "suggestedContent": "1. What are variables\n2. Variable declaration\n3. Common data types\n4. Variable naming conventions",
    "estimatedDurationMinutes": 30
  },
  ...
]`;

      const messages: AIChatMessage[] = [
        {
          role: 'system',
          content: 'You are an expert curriculum designer creating structured learning topics. Return valid JSON array only.',
        },
        { role: 'user', content: prompt },
      ];

      const response: AIChatCompletionResponse = await provider.sendChatCompletion({
        messages,
        temperature: 0.7,
        max_tokens: 3000,
      });

      // Parse JSON array
      const topics = this.parseJSONResponse(response.content);

      if (!Array.isArray(topics)) {
        throw new Error('AI did not return a valid topics array');
      }

      logger.info('Generated curriculum topics', {
        curriculumId: input.curriculumId,
        numTopics: topics.length,
        domain: input.domain,
      });

      return topics;
    } catch (error) {
      logger.error('Failed to generate curriculum topics', error);
      throw error;
    }
  }

  /**
   * Generate learning objectives for a topic
   */
  async generateLearningObjectives(
    input: GenerateLearningObjectivesInput,
    userId: string,
    providerId: string
  ): Promise<string[]> {
    try {
      const provider = await aiProviderFactory.getProvider(providerId, userId);

      const prompt = `Generate ${input.numObjectives} specific, measurable learning objectives for this topic.

Topic Title: ${input.topicTitle}
${input.topicDescription ? `Topic Description: ${input.topicDescription}` : ''}
${input.topicContent ? `Topic Content:\n${input.topicContent}` : ''}
Difficulty Level: ${input.difficultyLevel}

Requirements:
1. Use action verbs (understand, explain, implement, analyze, create, etc.)
2. Make each objective specific and measurable
3. Appropriate for ${input.difficultyLevel} level learners
4. Focus on what learners will be able to DO after completing the topic
5. Follow Bloom's Taxonomy principles
6. Each objective should be 1-2 sentences

Examples:
- "Explain the difference between var, let, and const in JavaScript"
- "Implement functions using arrow syntax and understand their scope behavior"
- "Analyze code to identify and fix common variable scoping issues"

Return as JSON array of strings:
["Objective 1", "Objective 2", "Objective 3", ...]`;

      const messages: AIChatMessage[] = [
        {
          role: 'system',
          content: 'You are an expert instructional designer creating learning objectives using Bloom\'s Taxonomy. Return valid JSON array only.',
        },
        { role: 'user', content: prompt },
      ];

      const response: AIChatCompletionResponse = await provider.sendChatCompletion({
        messages,
        temperature: 0.6,
        max_tokens: 1500,
      });

      // Parse JSON array
      const objectives = this.parseJSONResponse(response.content);

      if (!Array.isArray(objectives)) {
        throw new Error('AI did not return a valid objectives array');
      }

      logger.info('Generated learning objectives', {
        topicId: input.topicId,
        numObjectives: objectives.length,
      });

      return objectives;
    } catch (error) {
      logger.error('Failed to generate learning objectives', error);
      throw error;
    }
  }

  // Helper methods for building prompts
  private buildContentVariationPrompt(input: GenerateExplanationInput): string {
    const variationInstructions = {
      explanation: `Provide a clear, comprehensive explanation of the topic suitable for ${input.difficultyLevel} learners.`,
      example: `Provide practical code examples demonstrating the topic for ${input.difficultyLevel} learners.`,
      analogy: `Provide real-world analogies to help ${input.difficultyLevel} learners understand this concept.`,
      summary: `Provide a concise summary of the key points for ${input.difficultyLevel} learners.`,
      deep_dive: `Provide an in-depth, detailed exploration of the topic for ${input.difficultyLevel} learners.`,
    };

    return `Topic: ${input.topicTitle}

Current Content:
${input.topicContent}

Task: ${variationInstructions[input.variationType]}

Target Audience: ${input.difficultyLevel} level learners

Please generate content that is:
- Clear and well-structured
- Uses appropriate technical depth for ${input.difficultyLevel} level
- Includes code examples where relevant (with syntax highlighting markers)
- Uses markdown formatting for better readability

Generate the content now:`;
  }

  private buildExercisePrompt(input: GenerateExerciseInput): string {
    return `Create a ${input.language} programming exercise for ${input.difficultyLevel} learners on the topic: "${input.topicTitle}"

Topic Content:
${input.topicContent}

${input.exerciseDescription ? `Specific Requirements:\n${input.exerciseDescription}\n` : ''}

Create an exercise with:
1. A clear, concise title
2. A description explaining what the exercise teaches
3. Detailed instructions for what the learner should implement
4. Starter code (template with TODOs or function signatures)
5. A complete solution (working code)

Return the exercise in this exact JSON format:
{
  "title": "Exercise title here",
  "description": "What this exercise teaches",
  "instructions": "Step-by-step instructions",
  "starterCode": "// Starter code template",
  "solutionCode": "// Complete working solution"
}

Make sure the exercise is:
- Appropriate for ${input.difficultyLevel} level
- Focused on one clear learning objective
- Has testable inputs/outputs
- Includes helpful comments

Generate the exercise now:`;
  }

  private parseJSONResponse(content: string): any {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // Try to parse directly
    try {
      return JSON.parse(content);
    } catch (e) {
      // Try to find JSON object/array in the content
      const objectMatch = content.match(/\{[\s\S]*\}/);
      const arrayMatch = content.match(/\[[\s\S]*\]/);

      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }

      throw new Error('Could not parse JSON from AI response');
    }
  }
}

export const aiContentGeneratorService = new AIContentGeneratorService();
