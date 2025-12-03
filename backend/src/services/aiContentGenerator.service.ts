import { database } from '../config/database.config';
import { logger } from '../config/logger.config';
import { AIProviderFactory } from './ai/provider.factory';
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
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  domain: string;
  numTopics: number; // 1-50 topics recommended
}

export interface GenerateLearningObjectivesInput {
  topicId: string;
  topicTitle: string;
  topicDescription: string;
  topicContent: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
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
      const provider = await AIProviderFactory.getProvider(input.providerId, userId);

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
      const provider = await AIProviderFactory.getProvider(input.providerId, userId);

      const prompt = this.buildExercisePrompt(input);

      const messages: AIChatMessage[] = [
        {
          role: 'system',
          content: 'You are an expert programming instructor. Return ONLY valid JSON. Use \\n for newlines in code, not actual line breaks. Escape all special characters properly.',
        },
        { role: 'user', content: prompt },
      ];

      const response: AIChatCompletionResponse = await provider.sendChatCompletion({
        messages,
        temperature: 0.8,
        max_tokens: 5000, // Increased for full exercise with starter + solution code
      });

      logger.info('Raw AI response for exercise generation', {
        contentLength: response.content.length,
        preview: response.content.substring(0, 500)
      });

      // Parse JSON response
      const exerciseData = this.parseJSONResponse(response.content);

      logger.info('Generated exercise', {
        topicId: input.topicId,
        language: input.language,
        difficultyLevel: input.difficultyLevel,
        hasTitle: !!exerciseData.title,
        hasDescription: !!exerciseData.description,
        hasInstructions: !!exerciseData.instructions,
        hasStarterCode: !!exerciseData.starterCode,
        hasSolutionCode: !!exerciseData.solutionCode,
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
      const provider = await AIProviderFactory.getProvider(input.providerId, userId);

      const prompt = `Generate ${input.numHints} progressive hints for this exercise.

Exercise: ${input.exerciseTitle}
Description: ${input.exerciseDescription}

Solution (reference only):
${input.solutionCode.substring(0, 200)}...

IMPORTANT: Return ONLY a JSON array. Do NOT add explanations, markdown, or additional text.

Format (use exactly ${input.numHints} hints):
[
  "Hint 1: gentle nudge",
  "Hint 2: key concept",
  "Hint 3: algorithm steps"
]

Rules:
- Return ONLY the JSON array, nothing else
- Each hint is progressively more revealing
- No markdown code blocks
- No explanatory text
- Keep hints brief (1-2 sentences each)`;

      const messages: AIChatMessage[] = [
        {
          role: 'system',
          content: 'You are an expert instructor. Return ONLY a valid JSON array of strings. No markdown, no explanations, ONLY the JSON array.',
        },
        { role: 'user', content: prompt },
      ];

      const response: AIChatCompletionResponse = await provider.sendChatCompletion({
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      });

      // Log the raw response for debugging
      logger.debug('AI response for hints', {
        content: response.content,
        length: response.content.length
      });

      // Parse JSON array
      const hints = this.parseJSONResponse(response.content);

      if (!Array.isArray(hints)) {
        throw new Error('AI did not return a valid hints array');
      }

      // Delete existing AI-generated hints for this exercise before inserting new ones
      await database.query(
        `DELETE FROM exercise_hints
         WHERE exercise_id = $1 AND generated_by_ai = true`,
        [input.exerciseId]
      );

      logger.info('Deleted existing AI-generated hints', {
        exerciseId: input.exerciseId,
      });

      // Store new hints in database
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
      const provider = await AIProviderFactory.getProvider(input.providerId, userId);

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
      const provider = await AIProviderFactory.getProvider(providerId, userId);

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
      const provider = await AIProviderFactory.getProvider(providerId, userId);

      const prompt = `Generate ${input.numObjectives} HIGHLY SPECIFIC, measurable learning objectives for this EXACT topic.

Topic Title: ${input.topicTitle}
${input.topicDescription ? `Topic Description: ${input.topicDescription}` : ''}
${input.topicContent ? `Topic Content:\n${input.topicContent}` : ''}
Difficulty Level: ${input.difficultyLevel}

CRITICAL REQUIREMENTS:
1. Objectives MUST be SPECIFIC to "${input.topicTitle}" - not generic statements that could apply to any topic
2. Use concrete action verbs (understand, explain, implement, analyze, create, compare, demonstrate, etc.)
3. Make each objective measurable and testable
4. Appropriate for ${input.difficultyLevel} level learners
5. Focus on what learners will be able to DO after completing THIS SPECIFIC topic
6. Follow Bloom's Taxonomy principles (Knowledge -> Comprehension -> Application -> Analysis -> Synthesis -> Evaluation)
7. Each objective should be 1-2 sentences
8. Reference specific concepts, tools, or techniques mentioned in the topic title and content

WRONG (too generic):
- "Understand the basics of programming"
- "Learn how to write code"

RIGHT (specific to topic):
- "Explain the difference between var, let, and const in JavaScript and when to use each"
- "Implement arrow functions and demonstrate understanding of their lexical 'this' binding"
- "Compare traditional functions with arrow functions and identify use cases for each"

Return ONLY a valid JSON array of strings (no markdown, no code blocks):
["Objective 1", "Objective 2", "Objective 3", ...]`;

      const messages: AIChatMessage[] = [
        {
          role: 'system',
          content: 'You are an expert instructional designer creating HIGHLY SPECIFIC learning objectives using Bloom\'s Taxonomy. Your objectives must be uniquely tailored to each topic - never use generic statements. Return ONLY a valid JSON array, no markdown formatting.',
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
    return `Create a ${input.language} ${input.difficultyLevel} programming exercise: "${input.topicTitle}"

Topic: ${input.topicContent}
${input.exerciseDescription ? `Requirements: ${input.exerciseDescription}` : ''}

IMPORTANT: Return ONLY valid JSON with DOUBLE QUOTES. Do NOT use backticks or template literals.
Use \\n for line breaks inside strings.

{
  "title": "Clear exercise title",
  "description": "Brief 1-2 sentence description",
  "instructions": "Step 1\\nStep 2\\nStep 3",
  "starterCode": "// Code here\\nfunction example() {\\n  // TODO\\n}",
  "solutionCode": "// Solution\\nfunction example() {\\n  return true;\\n}"
}

Rules:
- Use ONLY double quotes for strings, NEVER backticks
- Use \\n for newlines inside strings
- Escape special characters: \\n \\t \\" \\\\
- Keep code concise (5-10 lines)`;
  }

  /**
   * Get the latest review for a topic
   */
  async getLatestTopicReview(topicId: string): Promise<{
    id: string;
    overallScore: number;
    summary: string;
    findings: Array<{
      category: string;
      severity: 'critical' | 'warning' | 'suggestion';
      title: string;
      description: string;
      affectedItems?: string[];
      suggestion: string;
    }>;
    aiProvider?: string;
    aiModel?: string;
    createdAt: Date;
    objectivesCount: number;
    exercisesCount: number;
    quizzesCount: number;
  } | null> {
    try {
      const result = await database.query(
        `SELECT tr.*, ap.provider_name as ai_provider_name
         FROM topic_reviews tr
         LEFT JOIN ai_providers ap ON tr.ai_provider_id = ap.id
         WHERE tr.topic_id = $1
         ORDER BY tr.created_at DESC
         LIMIT 1`,
        [topicId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        overallScore: row.overall_score,
        summary: row.summary,
        findings: row.findings,
        aiProvider: row.ai_provider_name,
        aiModel: row.ai_model,
        createdAt: row.created_at,
        objectivesCount: row.objectives_count,
        exercisesCount: row.exercises_count,
        quizzesCount: row.quizzes_count,
      };
    } catch (error) {
      logger.error('Failed to get latest topic review', error);
      throw error;
    }
  }

  /**
   * Review topic quality, alignment, and completeness with AI
   */
  async reviewTopicQuality(
    topicData: any,
    providerId: string,
    userId: string
  ): Promise<{
    overallScore: number;
    summary: string;
    findings: Array<{
      category: string;
      severity: 'critical' | 'warning' | 'suggestion';
      title: string;
      description: string;
      affectedItems?: string[];
      suggestion: string;
    }>;
  }> {
    try {
      const provider = await AIProviderFactory.getProvider(providerId, userId);

      const prompt = this.buildTopicReviewPrompt(topicData);

      const messages: AIChatMessage[] = [
        {
          role: 'system',
          content: `You are an expert educational content reviewer and instructional designer. Your role is to analyze learning topics for quality, alignment, and pedagogical soundness. You evaluate:

1. ALIGNMENT: Do exercises and quizzes align with learning objectives?
2. COVERAGE: Are all objectives adequately covered by assessments?
3. QUALITY: Are instructions clear? Are questions unambiguous? Are test cases comprehensive?
4. DIFFICULTY: Is there appropriate progression? Are difficulty levels consistent?
5. COMPLETENESS: Are there sufficient hints? Adequate test cases? Complete solutions?
6. PEDAGOGY: Does the content follow sound educational principles?

Return valid JSON only with this structure:
{
  "overallScore": 85,
  "summary": "Brief overall assessment (2-3 sentences)",
  "findings": [
    {
      "category": "alignment|coverage|quality|difficulty|completeness|pedagogy",
      "severity": "critical|warning|suggestion",
      "title": "Brief title",
      "description": "Detailed explanation",
      "affectedItems": ["item1", "item2"],
      "suggestion": "Specific actionable recommendation to fix this issue"
    }
  ]
}`,
        },
        { role: 'user', content: prompt },
      ];

      const response: AIChatCompletionResponse = await provider.sendChatCompletion({
        messages,
        temperature: 0.4, // Lower temperature for more consistent analysis
        max_tokens: 4000,
      });

      // Parse JSON response
      const review = this.parseJSONResponse(response.content);

      if (!review.overallScore || !review.summary || !Array.isArray(review.findings)) {
        throw new Error('AI did not return a valid review structure');
      }

      // Save review to database
      await database.query(
        `INSERT INTO topic_reviews
         (topic_id, overall_score, summary, findings, ai_provider_id, ai_model, reviewed_by, objectives_count, exercises_count, quizzes_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          topicData.topic?.id,
          review.overallScore,
          review.summary,
          JSON.stringify(review.findings),
          providerId,
          response.model,
          userId,
          topicData.objectives?.length || 0,
          topicData.exercises?.length || 0,
          topicData.quizzes?.length || 0,
        ]
      );

      logger.info('Generated and saved topic review', {
        topicId: topicData.topic?.id,
        overallScore: review.overallScore,
        findingsCount: review.findings.length,
      });

      return review;
    } catch (error) {
      logger.error('Failed to review topic quality', error);
      throw error;
    }
  }

  private buildTopicReviewPrompt(topicData: any): string {
    const { topic, objectives, exercises, quizzes } = topicData;

    let prompt = `Please conduct a comprehensive quality review of this learning topic:

TOPIC INFORMATION:
Title: ${topic.title}
Description: ${topic.description || 'N/A'}
Content Preview: ${topic.content ? topic.content.substring(0, 500) + '...' : 'N/A'}

LEARNING OBJECTIVES (${objectives?.length || 0}):
${objectives?.map((obj: any, idx: number) => `${idx + 1}. ${obj.text || obj.objective_text}`).join('\n') || 'No objectives defined'}

EXERCISES (${exercises?.length || 0}):
${exercises?.map((ex: any, idx: number) => `
${idx + 1}. ${ex.title} (${ex.difficulty_level})
   Description: ${ex.description}
   Language: ${ex.language}
   Test Cases: ${ex.testCasesCount || 0}
   Hints: ${ex.hintsCount || 0}
   ${ex.hints?.length ? `\n   Hints Preview:\n${ex.hints.map((h: any) => `      - Level ${h.hint_level}: ${h.hint_text?.substring(0, 100)}...`).join('\n')}` : ''}
`).join('\n') || 'No exercises defined'}

QUIZZES (${quizzes?.length || 0}):
${quizzes?.map((quiz: any, idx: number) => `
${idx + 1}. ${quiz.title} (${quiz.difficulty_level})
   Passing Score: ${quiz.passing_score}%
   Questions: ${quiz.questions?.length || 0}
   ${quiz.questions?.length ? `\n   Questions Preview:\n${quiz.questions.slice(0, 3).map((q: any) => `      - [${q.question_type}] ${q.question_text?.substring(0, 100)}...`).join('\n')}` : ''}
`).join('\n') || 'No quizzes defined'}

REVIEW INSTRUCTIONS:
Analyze this topic thoroughly and identify issues in these categories:

1. ALIGNMENT: Do the exercises and quiz questions directly test the learning objectives? Are there mismatches?

2. COVERAGE: Is each learning objective covered by at least one exercise or quiz? Are there gaps?

3. QUALITY:
   - Are exercise instructions clear and complete?
   - Are quiz questions unambiguous and well-written?
   - Do exercises have sufficient test cases (both public and hidden)?
   - Are test cases comprehensive (basic, edge cases, stress tests)?

4. DIFFICULTY:
   - Is there logical progression from easier to harder content?
   - Are difficulty labels (beginner/intermediate/advanced) accurate?
   - Are early exercises/quizzes accessible to learners?

5. COMPLETENESS:
   - Does each exercise have adequate hints (3-5 progressive hints)?
   - Do hints properly guide without revealing the solution too early?
   - Are there enough exercises and quizzes to reinforce learning?

6. PEDAGOGY:
   - Does the content follow sound teaching principles?
   - Is there a good balance of theory and practice?
   - Are examples and exercises relevant and practical?

For each issue found, provide:
- category (alignment, coverage, quality, difficulty, completeness, pedagogy)
- severity (critical = must fix, warning = should fix, suggestion = nice to have)
- title (brief summary)
- description (detailed explanation with specific examples)
- affectedItems (list of specific objectives, exercises, or quiz questions affected)
- suggestion (specific, actionable recommendation on how to fix this issue - e.g., "Add an exercise that tests the difference between var, let, and const" or "Revise the quiz question to include multiple-choice options testing scope differences")

Also provide:
- overallScore (0-100, where 100 is perfect)
- summary (2-3 sentence overall assessment)

Return ONLY valid JSON, no markdown formatting.`;

    return prompt;
  }

  /**
   * Deep dive analysis on a specific finding
   */
  async deepDiveFinding(
    topicData: any,
    finding: any,
    providerId: string,
    userId: string
  ): Promise<{
    enhancedDescription: string;
    enhancedSuggestion: string;
    enhancedAffectedItems: string[];
  }> {
    try {
      const provider = await AIProviderFactory.getProvider(providerId, userId);

      const prompt = this.buildDeepDiveFindingPrompt(topicData, finding);

      const messages: AIChatMessage[] = [
        {
          role: 'system',
          content: `You are an expert educational content reviewer conducting a deep-dive analysis. Provide detailed, actionable insights with specific examples and recommendations. Return valid JSON only.`,
        },
        { role: 'user', content: prompt },
      ];

      const response: AIChatCompletionResponse = await provider.sendChatCompletion({
        messages,
        temperature: 0.5,
        max_tokens: 4000, // Increased from 2000 for longer analysis
      });

      logger.info('Raw AI response for deep dive', {
        contentLength: response.content.length,
        fullContent: response.content
      });

      // Parse JSON response
      const result = this.parseJSONResponse(response.content);

      logger.info('Parsed deep dive result', {
        hasDescription: !!result.enhancedDescription,
        hasSuggestion: !!result.enhancedSuggestion,
        hasAffectedItems: !!result.enhancedAffectedItems,
        keys: Object.keys(result)
      });

      if (!result.enhancedDescription || !result.enhancedSuggestion) {
        logger.error('Invalid deep dive response structure', {
          result,
          rawContent: response.content.substring(0, 500)
        });
        throw new Error('AI did not return valid deep dive analysis');
      }

      logger.info('Generated deep dive finding analysis', {
        topicId: topicData.topic?.id,
        findingCategory: finding.category,
        findingSeverity: finding.severity,
      });

      return result;
    } catch (error) {
      logger.error('Failed to perform deep dive finding analysis', error);
      throw error;
    }
  }

  private buildDeepDiveFindingPrompt(topicData: any, finding: any): string {
    const { topic, objectives, exercises, quizzes } = topicData;

    return `Analyze this finding in detail:

FINDING:
- Category: ${finding.category}
- Severity: ${finding.severity}
- Title: ${finding.title}
- Description: ${finding.description}
- Suggestion: ${finding.suggestion}
- Affected: ${finding.affectedItems?.join(', ') || 'None'}

CONTEXT:
Topic: ${topic.title}
Objectives (${objectives?.length || 0}): ${objectives?.slice(0, 5).map((obj: any) => obj.text).join('; ') || 'None'}
Exercises (${exercises?.length || 0}): ${exercises?.slice(0, 3).map((ex: any) => `${ex.title} (${ex.difficulty})`).join('; ') || 'None'}

TASK:
1. Enhanced Description: 2-3 detailed paragraphs explaining WHY this matters and specific impact
2. Enhanced Suggestion: 3-5 concrete, actionable steps to fix this
3. Enhanced Affected Items: Specific list of what's impacted

Return ONLY valid JSON (use \\n for line breaks):
{
  "enhancedDescription": "Detailed description with \\n for paragraphs",
  "enhancedSuggestion": "Step 1: ...\\nStep 2: ...\\nStep 3: ...",
  "enhancedAffectedItems": ["Item 1", "Item 2"]
}

Keep response concise but detailed. Escape all special characters.`;
  }

  private parseJSONResponse(content: string): any {
    let jsonString: string | null = null;

    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    } else {
      // Try to parse directly
      try {
        return JSON.parse(content);
      } catch (e) {
        // Try to find the first complete JSON object or array
        // Use non-greedy matching and proper bracket counting
        jsonString = this.extractFirstValidJSON(content);
      }
    }

    if (!jsonString) {
      // Try to fix incomplete JSON arrays (missing closing bracket)
      const trimmed = content.trim();
      if (trimmed.startsWith('[')) {
        // Count open brackets and try to complete the array
        let bracketCount = 0;
        let lastCompleteItem = 0;
        let inString = false;
        let escaped = false;

        for (let i = 0; i < trimmed.length; i++) {
          const char = trimmed[i];

          if (char === '\\' && inString) {
            escaped = !escaped;
            continue;
          }

          if (char === '"' && !escaped) {
            inString = !inString;
          }

          if (!inString) {
            if (char === '[') bracketCount++;
            if (char === ']') bracketCount--;

            // Track last complete item (after a comma outside strings)
            if (char === ',' && bracketCount === 1) {
              lastCompleteItem = i;
            }
          }

          escaped = false;
        }

        // If array is incomplete, try to complete it
        if (bracketCount > 0) {
          // Find the last complete string before truncation
          let fixed = trimmed;
          if (lastCompleteItem > 0) {
            // Truncate after last complete item and close array
            fixed = trimmed.substring(0, lastCompleteItem) + '\n]';
          } else if (!trimmed.endsWith(']')) {
            // Just add closing bracket if there's at least one complete item
            fixed = trimmed + '\n]';
          }

          logger.info('Attempting to fix incomplete JSON array', {
            original: trimmed.substring(0, 200),
            fixed: fixed.substring(0, 200)
          });

          try {
            return JSON.parse(fixed);
          } catch (fixError) {
            logger.warn('Failed to fix incomplete JSON', { error: fixError });
          }
        }
      }

      throw new Error('Could not find JSON in AI response');
    }

    // Preprocess: Convert template literals (backticks) to escaped JSON strings
    jsonString = this.convertTemplateLiteralsToJSON(jsonString);

    // Try to parse the JSON string
    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      // If parsing fails, try to fix common JSON issues (unescaped control characters)
      logger.warn('JSON parse failed, attempting to clean', {
        error: parseError,
        sample: jsonString.substring(0, 200)
      });

      // Clean the JSON by escaping control characters in string values
      const cleaned = this.cleanJSONString(jsonString);

      try {
        return JSON.parse(cleaned);
      } catch (cleanError) {
        logger.error('Failed to parse JSON even after cleaning', {
          originalError: parseError,
          cleanError,
          originalSample: jsonString.substring(0, 500),
          cleanedSample: cleaned.substring(0, 500),
          originalFull: jsonString,
          cleanedFull: cleaned
        });
        throw new Error('Could not parse JSON from AI response');
      }
    }
  }

  private cleanJSONString(jsonString: string): string {
    // Simple but effective approach: replace control characters in string values
    let inString = false;
    let escaped = false;
    let result = '';

    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];
      const prevChar = i > 0 ? jsonString[i - 1] : '';

      if (char === '"' && !escaped) {
        inString = !inString;
        result += char;
      } else if (inString && !escaped) {
        // Inside a string value, escape control characters
        if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          result += '\\r';
        } else if (char === '\t') {
          result += '\\t';
        } else if (char === '\\') {
          escaped = true;
          result += char;
        } else {
          result += char;
        }
      } else {
        result += char;
        if (escaped) escaped = false;
      }
    }

    return result;
  }

  private extractFirstValidJSON(content: string): string | null {
    // Find the first { or [ and extract until we have a complete JSON structure
    const firstBrace = content.indexOf('{');
    const firstBracket = content.indexOf('[');

    let startChar: string;
    let endChar: string;
    let startIndex: number;

    if (firstBrace === -1 && firstBracket === -1) {
      return null;
    } else if (firstBrace === -1) {
      startChar = '[';
      endChar = ']';
      startIndex = firstBracket;
    } else if (firstBracket === -1) {
      startChar = '{';
      endChar = '}';
      startIndex = firstBrace;
    } else {
      // Use whichever comes first
      if (firstBrace < firstBracket) {
        startChar = '{';
        endChar = '}';
        startIndex = firstBrace;
      } else {
        startChar = '[';
        endChar = ']';
        startIndex = firstBracket;
      }
    }

    // Count brackets/braces to find the matching closing bracket/brace
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\' && inString) {
        escaped = true;
        continue;
      }

      if (char === '"' && !escaped) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === startChar) {
          depth++;
        } else if (char === endChar) {
          depth--;
          if (depth === 0) {
            // Found the matching closing bracket/brace
            return content.substring(startIndex, i + 1);
          }
        }
      }
    }

    return null;
  }

  private convertTemplateLiteralsToJSON(jsonString: string): string {
    // Replace JavaScript template literals (backticks) with proper JSON strings
    // Pattern: "key": `value with newlines` -> "key": "value with \\n"

    return jsonString.replace(/:\s*`([^`]*)`/g, (match, content) => {
      // Escape special characters in the content
      const escaped = content
        .replace(/\\/g, '\\\\')  // Escape backslashes first
        .replace(/"/g, '\\"')    // Escape double quotes
        .replace(/\n/g, '\\n')   // Escape newlines
        .replace(/\r/g, '\\r')   // Escape carriage returns
        .replace(/\t/g, '\\t');  // Escape tabs

      return `: "${escaped}"`;
    });
  }
}

export const aiContentGeneratorService = new AIContentGeneratorService();
