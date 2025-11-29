import { httpClient } from '../utils/http-client';

export interface TestCase {
  id: string;
  test_name: string;
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

class CodeExecutionService {
  /**
   * Execute JavaScript code in the browser
   */
  async executeJavaScript(
    code: string,
    testCases: TestCase[]
  ): Promise<TestResult[]> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(
        URL.createObjectURL(
          new Blob(
            [this.getWorkerCode()],
            { type: 'application/javascript' }
          )
        )
      );

      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error('Execution timeout (5 seconds)'));
      }, 5000);

      worker.onmessage = (e) => {
        clearTimeout(timeout);
        worker.terminate();

        if (e.data.error) {
          reject(new Error(e.data.error));
        } else {
          resolve(e.data.results);
        }
      };

      worker.onerror = (error) => {
        clearTimeout(timeout);
        worker.terminate();
        reject(error);
      };

      worker.postMessage({ code, testCases });
    });
  }

  /**
   * Submit JavaScript code execution results
   */
  async submitJavaScript(
    exerciseId: string,
    code: string,
    testResults: TestResult[]
  ): Promise<SubmissionResult> {
    const response = await httpClient.post<{ success: boolean; data: SubmissionResult }>(
      `/exercises/${exerciseId}/submit/javascript`,
      { code, testResults }
    );
    return response.data;
  }

  /**
   * Submit Java code for server-side execution
   */
  async submitJava(exerciseId: string, code: string): Promise<SubmissionResult> {
    const response = await httpClient.post<{ success: boolean; data: SubmissionResult }>(
      `/exercises/${exerciseId}/submit/java`,
      { code }
    );
    return response.data;
  }

  /**
   * Get submission history
   */
  async getSubmissionHistory(exerciseId: string): Promise<any[]> {
    const response = await httpClient.get<{ success: boolean; data: any[] }>(
      `/exercises/${exerciseId}/submissions`
    );
    return response.data;
  }

  /**
   * Get submission details
   */
  async getSubmissionDetails(submissionId: string): Promise<any> {
    const response = await httpClient.get<{ success: boolean; data: any }>(
      `/submissions/${submissionId}`
    );
    return response.data;
  }

  /**
   * Web Worker code for executing JavaScript
   */
  private getWorkerCode(): string {
    return `
      self.onmessage = function(e) {
        const { code, testCases } = e.data;
        const results = [];

        try {
          // Wrap user code in a function
          const userFunction = new Function('return ' + code)();

          // Run each test case
          for (const testCase of testCases) {
            try {
              // Extract arguments from input_data
              const args = testCase.input_data.args || [];

              // Execute the user function
              const startTime = performance.now();
              const result = userFunction(...args);
              const endTime = performance.now();

              // Compare result with expected output
              const expected = testCase.expected_output.result;
              const actual = result;
              const passed = JSON.stringify(actual) === JSON.stringify(expected);

              results.push({
                testCaseId: testCase.id,
                testName: testCase.test_name,
                passed,
                actual,
                expected,
                error: passed ? undefined : \`Expected: \${JSON.stringify(expected)}, Got: \${JSON.stringify(actual)}\`,
                isHidden: testCase.is_hidden,
                points: testCase.points,
                executionTime: endTime - startTime,
              });
            } catch (error) {
              results.push({
                testCaseId: testCase.id,
                testName: testCase.test_name,
                passed: false,
                actual: null,
                expected: testCase.expected_output.result,
                error: error.message,
                isHidden: testCase.is_hidden,
                points: testCase.points,
              });
            }
          }

          self.postMessage({ results });
        } catch (error) {
          self.postMessage({ error: error.message });
        }
      };
    `;
  }
}

export const codeExecutionService = new CodeExecutionService();
