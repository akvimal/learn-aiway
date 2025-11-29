import React, { useState, useEffect } from 'react';
import { codeExecutionService, TestCase, TestResult } from '../../services/codeExecution.service';

interface CodeEditorProps {
  exerciseId: string;
  starterCode: string;
  language: 'javascript' | 'java';
  testCases: TestCase[];
  onSubmissionComplete?: (result: any) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  exerciseId,
  starterCode,
  language,
  testCases,
  onSubmissionComplete,
}) => {
  const [code, setCode] = useState(starterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    setError(null);
    setTestResults([]);

    try {
      if (language === 'javascript') {
        const results = await codeExecutionService.executeJavaScript(code, testCases);
        setTestResults(results);
      } else {
        setError('Run tests only available for JavaScript. Submit to test Java code.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to execute code');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      let result;

      if (language === 'javascript') {
        // First run tests if not already run
        let results = testResults;
        if (results.length === 0) {
          results = await codeExecutionService.executeJavaScript(code, testCases);
          setTestResults(results);
        }

        // Submit results to backend
        result = await codeExecutionService.submitJavaScript(exerciseId, code, results);
      } else {
        // Java: submit to backend for Judge0 execution
        result = await codeExecutionService.submitJava(exerciseId, code);
        setTestResults(result.testResults);
      }

      setSubmissionResult(result);
      if (onSubmissionComplete) {
        onSubmissionComplete(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCode(starterCode);
    setTestResults([]);
    setError(null);
    setSubmissionResult(null);
  };

  const passedTests = testResults.filter((r) => r.passed).length;
  const totalTests = testResults.length;
  const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Code Editor */}
      <div className="flex-1 mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Your Code ({language === 'javascript' ? 'JavaScript' : 'Java'})
          </label>
          <button
            onClick={handleReset}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Reset to starter code
          </button>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-full min-h-[400px] p-4 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Write your code here..."
          spellCheck={false}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-4">
        {language === 'javascript' && (
          <button
            onClick={handleRunTests}
            disabled={isRunning || isSubmitting}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={isRunning || isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Solution'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Submission Result */}
      {submissionResult && (
        <div className={`mb-4 p-4 rounded-md border ${
          submissionResult.status === 'passed'
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">
              {submissionResult.status === 'passed' ? '✅ All Tests Passed!' : '⚠️ Some Tests Failed'}
            </h3>
            <span className="text-2xl font-bold">{submissionResult.score}%</span>
          </div>
          <p className="text-sm">
            Passed {submissionResult.passedTests} of {submissionResult.totalTests} tests
          </p>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="border border-gray-200 rounded-md">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              Test Results ({passedTests}/{totalTests} passed - {score}%)
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {testResults.filter(r => !r.isHidden).map((result, index) => (
              <div
                key={index}
                className={`p-4 ${result.passed ? 'bg-white' : 'bg-red-50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {result.passed ? '✅' : '❌'} {result.testName}
                  </span>
                  <span className="text-sm text-gray-600">
                    {result.points} {result.points === 1 ? 'point' : 'points'}
                  </span>
                </div>
                {!result.passed && (
                  <div className="mt-2 space-y-1">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Expected:</span>{' '}
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {JSON.stringify(result.expected)}
                      </code>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Got:</span>{' '}
                      <code className="bg-red-100 px-2 py-1 rounded text-xs">
                        {JSON.stringify(result.actual)}
                      </code>
                    </div>
                    {result.error && (
                      <div className="text-sm text-red-700 mt-1">
                        {result.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {testResults.some(r => r.isHidden) && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-sm text-gray-600">
              {testResults.filter(r => r.isHidden).length} hidden test case(s) not shown
            </div>
          )}
        </div>
      )}
    </div>
  );
};
