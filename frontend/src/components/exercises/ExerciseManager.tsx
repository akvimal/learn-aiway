import React, { useState } from 'react';
import { httpClient } from '../../utils/http-client';

interface ExerciseFormData {
  title: string;
  description: string;
  instructions: string;
  language: 'javascript' | 'java';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  starterCode: string;
  solutionCode: string;
  points: number;
}

interface TestCaseFormData {
  testName: string;
  testType: 'public' | 'hidden';
  inputData: string;
  expectedOutput: string;
  points: number;
}

interface ExerciseManagerProps {
  topicId: string;
  topicTitle: string;
  topicContent: string;
  learningObjectives: Array<{ id: string; objective_text: string; requires_exercise: boolean }>;
  onComplete?: () => void;
}

export const ExerciseManager: React.FC<ExerciseManagerProps> = ({
  topicId,
  topicTitle,
  topicContent,
  learningObjectives,
  onComplete,
}) => {
  const [step, setStep] = useState<'exercise' | 'testcases' | 'hints'>('exercise');
  const [exercise, setExercise] = useState<ExerciseFormData>({
    title: '',
    description: '',
    instructions: '',
    language: 'javascript',
    difficultyLevel: 'beginner',
    starterCode: '',
    solutionCode: '',
    points: 10,
  });

  const [testCases, setTestCases] = useState<TestCaseFormData[]>([
    {
      testName: 'Test Case 1',
      testType: 'public',
      inputData: '{"args": []}',
      expectedOutput: '{"result": null}',
      points: 1,
    },
  ]);

  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [generatedHints, setGeneratedHints] = useState<any[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);

  // Load AI providers on mount
  React.useEffect(() => {
    loadProviders();
  }, []);

  // Auto-dismiss success message after 5 seconds
  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadProviders = async () => {
    try {
      const response = await httpClient.get<{ success: boolean; data: any[] }>('/ai/providers');
      const activeProviders = response.data.filter((p: any) => p.is_active);
      setProviders(activeProviders);
      const defaultProvider = activeProviders.find((p: any) => p.is_default);
      if (defaultProvider) {
        setSelectedProvider(defaultProvider.id);
      }
    } catch (err) {
      console.error('Failed to load providers:', err);
    }
  };

  const handleGenerateExercise = async () => {
    if (!selectedProvider) {
      setError('Please select an AI provider');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Get the selected objective texts
      const selectedObjectiveTexts = selectedObjectives
        .map(id => learningObjectives.find(obj => obj.id === id)?.objective_text)
        .filter(text => text !== undefined);

      const response = await httpClient.post<{ success: boolean; data: any }>(
        '/ai/generate/exercise',
        {
          topicId,
          topicTitle,
          topicContent,
          language: exercise.language,
          difficultyLevel: exercise.difficultyLevel,
          providerId: selectedProvider,
          exerciseDescription: exercise.description || undefined,
          learningObjectives: selectedObjectiveTexts,
        }
      );

      const generated = response.data;
      setExercise({
        ...exercise,
        title: generated.title,
        description: generated.description,
        instructions: generated.instructions,
        starterCode: generated.starterCode,
        solutionCode: generated.solutionCode,
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to generate exercise');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleObjective = (objectiveId: string) => {
    setSelectedObjectives(prev =>
      prev.includes(objectiveId)
        ? prev.filter(id => id !== objectiveId)
        : [...prev, objectiveId]
    );
  };

  const handleGenerateTestCases = async () => {
    if (!selectedProvider || !exerciseId) {
      setError('Please save exercise first and select an AI provider');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await httpClient.post<{ success: boolean; data: any }>(
        '/ai/generate/test-cases',
        {
          exerciseId,
          exerciseTitle: exercise.title,
          exerciseDescription: exercise.description,
          solutionCode: exercise.solutionCode,
          language: exercise.language,
          providerId: selectedProvider,
          numTestCases: 5,
        }
      );

      const generated = response.data.testCases;
      const newTestCases = generated.map((tc: any) => ({
        testName: tc.test_name,
        testType: tc.test_type,
        inputData: JSON.stringify(tc.input_data),
        expectedOutput: JSON.stringify(tc.expected_output),
        points: 1,
      }));

      setTestCases(newTestCases);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to generate test cases');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateHints = async () => {
    if (!selectedProvider || !exerciseId) {
      setError('Please save exercise first and select an AI provider');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await httpClient.post('/ai/generate/hints', {
        exerciseId,
        exerciseTitle: exercise.title,
        exerciseDescription: exercise.description,
        solutionCode: exercise.solutionCode,
        providerId: selectedProvider,
        numHints: 3,
      });

      // Fetch the generated hints
      const hintsResponse = await httpClient.get(`/exercises/${exerciseId}`);
      const hints = hintsResponse.data.hints || [];
      setGeneratedHints(hints);

      setSuccessMessage(`Successfully generated ${hints.length} hints!`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to generate hints');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveExercise = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Save exercise (you'll need to implement this endpoint)
      const response = await httpClient.post<{ success: boolean; data: any }>(
        `/topics/${topicId}/exercises`,
        {
          ...exercise,
          topicId,
        }
      );

      setExerciseId(response.data.id);
      setStep('testcases');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save exercise');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTestCase = () => {
    setTestCases([
      ...testCases,
      {
        testName: `Test Case ${testCases.length + 1}`,
        testType: 'public',
        inputData: '{"args": []}',
        expectedOutput: '{"result": null}',
        points: 1,
      },
    ]);
  };

  const handleRemoveTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const handleUpdateTestCase = (index: number, field: keyof TestCaseFormData, value: any) => {
    const updated = [...testCases];
    updated[index] = { ...updated[index], [field]: value };
    setTestCases(updated);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg p-6">
        {/* Back Navigation */}
        <button
          onClick={() => onComplete?.()}
          className="mb-4 flex items-center text-purple-600 hover:text-purple-800 font-medium"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Exercises
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Exercise</h2>
        <p className="text-gray-600 mb-6">Topic: {topicTitle}</p>

        {/* AI Provider Selection */}
        {providers.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Provider (for content generation)
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select provider...</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.provider_name} ({p.provider_type})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Step Indicator */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setStep('exercise')}
            className={`px-4 py-2 rounded-md ${
              step === 'exercise'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            1. Exercise Details
          </button>
          <button
            onClick={() => setStep('testcases')}
            disabled={!exerciseId}
            className={`px-4 py-2 rounded-md ${
              step === 'testcases'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            } disabled:opacity-50`}
          >
            2. Test Cases
          </button>
          <button
            onClick={() => setStep('hints')}
            disabled={!exerciseId}
            className={`px-4 py-2 rounded-md ${
              step === 'hints'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            } disabled:opacity-50`}
          >
            3. Hints (Optional)
          </button>
        </div>

        {/* Exercise Form */}
        {step === 'exercise' && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  value={exercise.language}
                  onChange={(e) =>
                    setExercise({ ...exercise, language: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={exercise.difficultyLevel}
                  onChange={(e) =>
                    setExercise({ ...exercise, difficultyLevel: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Learning Objectives Selection */}
            {(() => {
              // Filter to show only practical objectives that require exercises
              const practicalObjectives = learningObjectives.filter(obj => obj.requires_exercise);

              if (practicalObjectives.length === 0) return null;

              return (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Learning Objectives (Optional)
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    Select one or more objectives to focus the AI-generated exercise on specific practical learning goals.
                    Only objectives requiring hands-on coding practice are shown.
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {practicalObjectives.map((objective) => (
                      <label
                        key={objective.id}
                        className="flex items-start gap-2 p-2 bg-white rounded cursor-pointer hover:bg-blue-100"
                      >
                        <input
                          type="checkbox"
                          checked={selectedObjectives.includes(objective.id)}
                          onChange={() => handleToggleObjective(objective.id)}
                          className="mt-1 h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700 flex-1">{objective.objective_text}</span>
                      </label>
                    ))}
                  </div>
                  {selectedObjectives.length > 0 && (
                    <p className="mt-2 text-xs text-green-700">
                      ✓ {selectedObjectives.length} objective{selectedObjectives.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                  {learningObjectives.length > practicalObjectives.length && (
                    <p className="mt-2 text-xs text-gray-500">
                      ℹ {learningObjectives.length - practicalObjectives.length} conceptual objective{learningObjectives.length - practicalObjectives.length > 1 ? 's' : ''} hidden (theoretical/explanatory)
                    </p>
                  )}
                </div>
              );
            })()}

            <button
              onClick={handleGenerateExercise}
              disabled={isGenerating || !selectedProvider}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isGenerating ? '🤖 Generating with AI...' : '🤖 Generate Exercise with AI'}
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={exercise.title}
                onChange={(e) => setExercise({ ...exercise, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={exercise.description}
                onChange={(e) => setExercise({ ...exercise, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructions *
              </label>
              <textarea
                value={exercise.instructions}
                onChange={(e) => setExercise({ ...exercise, instructions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starter Code
              </label>
              <textarea
                value={exercise.starterCode}
                onChange={(e) => setExercise({ ...exercise, starterCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                rows={6}
                placeholder="// Your starter code here..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Solution Code *
              </label>
              <textarea
                value={exercise.solutionCode}
                onChange={(e) => setExercise({ ...exercise, solutionCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                rows={8}
                placeholder="// Complete solution here..."
                required
              />
            </div>

            <button
              onClick={handleSaveExercise}
              disabled={isSaving || !exercise.title || !exercise.solutionCode}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Exercise & Continue'}
            </button>
          </div>
        )}

        {/* Test Cases Form */}
        {step === 'testcases' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Test Cases</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateTestCases}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : '🤖 Generate with AI'}
                </button>
                <button
                  onClick={handleAddTestCase}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  + Add Test Case
                </button>
              </div>
            </div>

            {testCases.map((tc, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between items-start mb-3">
                  <input
                    type="text"
                    value={tc.testName}
                    onChange={(e) => handleUpdateTestCase(index, 'testName', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md mr-4"
                    placeholder="Test name"
                  />
                  <button
                    onClick={() => handleRemoveTestCase(index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={tc.testType}
                      onChange={(e) => handleUpdateTestCase(index, 'testType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="public">Public</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points
                    </label>
                    <input
                      type="number"
                      value={tc.points}
                      onChange={(e) => handleUpdateTestCase(index, 'points', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Input Data (JSON)
                    </label>
                    <textarea
                      value={tc.inputData}
                      onChange={(e) => handleUpdateTestCase(index, 'inputData', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                      rows={3}
                      placeholder='{"args": [1, 2]}'
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Output (JSON)
                    </label>
                    <textarea
                      value={tc.expectedOutput}
                      onChange={(e) => handleUpdateTestCase(index, 'expectedOutput', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                      rows={3}
                      placeholder='{"result": 3}'
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => setStep('hints')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Continue to Hints
            </button>
          </div>
        )}

        {/* Hints Step */}
        {step === 'hints' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Generate Hints (Optional)</h3>
            <p className="text-sm text-gray-600">
              Generate progressive hints that guide learners without revealing the solution.
            </p>

            {/* Success Message */}
            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            )}

            <button
              onClick={handleGenerateHints}
              disabled={isGenerating}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : generatedHints.length > 0 ? '🔄 Regenerate Hints' : '🤖 Generate Hints with AI'}
            </button>

            {/* Display Generated Hints */}
            {generatedHints.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="font-medium text-gray-900">Generated Hints:</h4>
                {generatedHints
                  .sort((a, b) => a.hint_level - b.hint_level)
                  .map((hint, index) => (
                    <div
                      key={hint.id || index}
                      className="p-4 bg-gray-50 border border-gray-200 rounded-md"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">
                            Hint {hint.hint_level}
                            {hint.reveals_solution && (
                              <span className="ml-2 text-xs text-red-600">(Reveals Solution)</span>
                            )}
                          </h5>
                          <p className="mt-1 text-sm text-gray-700">{hint.hint_text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <button
              onClick={onComplete}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Finish & Publish Exercise
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
