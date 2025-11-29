import { database } from '../config/database.config';
import { logger } from '../config/logger.config';
import axios from 'axios';

export interface TestCase {
  id: string;
  test_name: string;
  test_type: string;
  input_data: any;
  expected_output: any;
  is_hidden: boolean;
  points: number;
}

export interface TestResult {
  testCaseId: string;
  testName: string;
  passed: boolean;
  actual: any;
  expected: any;
  error?: string;
  isHidden: boolean;
  points: number;
}

export interface SubmissionResult {
  submissionId: string;
  status: 'passed' | 'failed' | 'error' | 'timeout';
  passedTests: number;
  totalTests: number;
  score: number;
  testResults: TestResult[];
  executionTimeMs?: number;
  errorMessage?: string;
}

export class CodeExecutionService {
  /**
   * Execute JavaScript code in a sandboxed environment
   * Note: Actual execution happens in the browser for security
   * This method validates and stores the submission
   */
  async executeJavaScript(
    exerciseId: string,
    userId: string,
    code: string,
    testResults: TestResult[]
  ): Promise<SubmissionResult> {
    try {
      // Fetch test cases from database
      const testCasesQuery = await database.query<TestCase>(
        `SELECT * FROM exercise_test_cases
         WHERE exercise_id = $1
         ORDER BY order_index`,
        [exerciseId]
      );

      const testCases = testCasesQuery.rows;
      const passedTests = testResults.filter((r) => r.passed).length;
      const totalTests = testCases.length;
      const score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
      const status: 'passed' | 'failed' = score === 100 ? 'passed' : 'failed';

      // Create submission record
      const submissionQuery = await database.query(
        `INSERT INTO code_submissions
         (exercise_id, user_id, code, language, status, passed_tests, total_tests, score, test_results, executed_at)
         VALUES ($1, $2, $3, 'javascript', $4, $5, $6, $7, $8, NOW())
         RETURNING id`,
        [
          exerciseId,
          userId,
          code,
          status,
          passedTests,
          totalTests,
          score,
          JSON.stringify(testResults),
        ]
      );

      const submissionId = submissionQuery.rows[0].id;

      logger.info('JavaScript code executed', {
        exerciseId,
        userId,
        submissionId,
        passedTests,
        totalTests,
        score,
      });

      return {
        submissionId,
        status,
        passedTests,
        totalTests,
        score,
        testResults,
      };
    } catch (error) {
      logger.error('Failed to execute JavaScript code', error);
      throw error;
    }
  }

  /**
   * Execute Java code using Judge0 API
   */
  async executeJava(
    exerciseId: string,
    userId: string,
    code: string
  ): Promise<SubmissionResult> {
    try {
      // Fetch test cases
      const testCasesQuery = await database.query<TestCase>(
        `SELECT * FROM exercise_test_cases
         WHERE exercise_id = $1
         ORDER BY order_index`,
        [exerciseId]
      );

      const testCases = testCasesQuery.rows;
      const testResults: TestResult[] = [];
      let passedTests = 0;

      // Execute code against each test case using Judge0
      for (const testCase of testCases) {
        try {
          const result = await this.executeWithJudge0(
            code,
            'java',
            testCase.input_data,
            testCase.expected_output
          );

          const passed = result.passed;
          if (passed) passedTests++;

          testResults.push({
            testCaseId: testCase.id,
            testName: testCase.test_name,
            passed,
            actual: result.output,
            expected: testCase.expected_output,
            error: result.error,
            isHidden: testCase.is_hidden,
            points: testCase.points,
          });
        } catch (error: any) {
          testResults.push({
            testCaseId: testCase.id,
            testName: testCase.test_name,
            passed: false,
            actual: null,
            expected: testCase.expected_output,
            error: error.message,
            isHidden: testCase.is_hidden,
            points: testCase.points,
          });
        }
      }

      const totalTests = testCases.length;
      const score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
      const status: 'passed' | 'failed' = score === 100 ? 'passed' : 'failed';

      // Create submission record
      const submissionQuery = await database.query(
        `INSERT INTO code_submissions
         (exercise_id, user_id, code, language, status, passed_tests, total_tests, score, test_results, executed_at)
         VALUES ($1, $2, $3, 'java', $4, $5, $6, $7, $8, NOW())
         RETURNING id`,
        [
          exerciseId,
          userId,
          code,
          status,
          passedTests,
          totalTests,
          score,
          JSON.stringify(testResults),
        ]
      );

      const submissionId = submissionQuery.rows[0].id;

      logger.info('Java code executed', {
        exerciseId,
        userId,
        submissionId,
        passedTests,
        totalTests,
        score,
      });

      return {
        submissionId,
        status,
        passedTests,
        totalTests,
        score,
        testResults,
      };
    } catch (error) {
      logger.error('Failed to execute Java code', error);
      throw error;
    }
  }

  /**
   * Execute code using Judge0 API
   * Note: This requires Judge0 to be set up (self-hosted or cloud)
   */
  private async executeWithJudge0(
    code: string,
    language: string,
    input: any,
    expectedOutput: any
  ): Promise<{ passed: boolean; output: any; error?: string }> {
    const judge0Url = process.env.JUDGE0_URL || 'http://localhost:2358';

    // Language IDs for Judge0
    const languageIds: Record<string, number> = {
      javascript: 63, // Node.js
      java: 62, // Java (OpenJDK)
      python: 71, // Python 3
    };

    const languageId = languageIds[language];
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    try {
      // Prepare stdin from input data
      const stdin = typeof input === 'object'
        ? JSON.stringify(input)
        : String(input);

      // Submit code to Judge0
      const submitResponse = await axios.post(`${judge0Url}/submissions?wait=true`, {
        source_code: Buffer.from(code).toString('base64'),
        language_id: languageId,
        stdin: Buffer.from(stdin).toString('base64'),
        cpu_time_limit: 2,
        memory_limit: 128000, // 128 MB
      });

      const submission = submitResponse.data;

      // Check for compilation/runtime errors
      if (submission.status.id === 6) {
        // Compilation error
        return {
          passed: false,
          output: null,
          error: Buffer.from(submission.compile_output || '', 'base64').toString(),
        };
      }

      if (submission.status.id === 11 || submission.status.id === 12) {
        // Runtime error or timeout
        return {
          passed: false,
          output: null,
          error: Buffer.from(submission.stderr || '', 'base64').toString(),
        };
      }

      // Get stdout
      const stdout = Buffer.from(submission.stdout || '', 'base64').toString().trim();

      // Compare output
      const expectedStr = typeof expectedOutput === 'object'
        ? JSON.stringify(expectedOutput)
        : String(expectedOutput).trim();

      const passed = stdout === expectedStr;

      return {
        passed,
        output: stdout,
        error: passed ? undefined : `Expected: ${expectedStr}, Got: ${stdout}`,
      };
    } catch (error: any) {
      logger.error('Judge0 execution error', error);
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }

  /**
   * Get submission history for a user and exercise
   */
  async getSubmissionHistory(
    exerciseId: string,
    userId: string
  ): Promise<any[]> {
    try {
      const result = await database.query(
        `SELECT id, status, passed_tests, total_tests, score, submitted_at, is_best_submission
         FROM code_submissions
         WHERE exercise_id = $1 AND user_id = $2
         ORDER BY submitted_at DESC
         LIMIT 10`,
        [exerciseId, userId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get submission history', error);
      throw error;
    }
  }

  /**
   * Get detailed submission results
   */
  async getSubmissionDetails(submissionId: string, userId: string): Promise<any> {
    try {
      const result = await database.query(
        `SELECT * FROM code_submissions
         WHERE id = $1 AND user_id = $2`,
        [submissionId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Submission not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get submission details', error);
      throw error;
    }
  }
}

export const codeExecutionService = new CodeExecutionService();
