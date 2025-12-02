import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../../services/quiz.service';
import { aiService } from '../../services/ai.service';
import { curriculumService } from '../../services/curriculum.service';
import type { Quiz, AIProvider, Topic } from '../../types';

export const QuizManager: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generation form state
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizTitle, setQuizTitle] = useState('');
  const [passingScore, setPassingScore] = useState(70);

  useEffect(() => {
    if (topicId) {
      loadQuizzes();
      loadProviders();
      loadTopicDetails();
    }
  }, [topicId]);

  const loadQuizzes = async () => {
    if (!topicId) return;
    try {
      setLoading(true);
      const data = await quizService.getQuizzesByTopic(topicId);
      setQuizzes(data.quizzes);
    } catch (err: any) {
      setError(err.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const data = await aiService.getUserProviders();
      setProviders(data.filter(p => p.is_active));
      if (data.length > 0) {
        setSelectedProviderId(data.find(p => p.is_default)?.id || data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load AI providers:', err);
    }
  };

  const loadTopicDetails = async () => {
    if (!topicId) return;

    try {
      const topicData = await curriculumService.getTopicSummary(topicId);
      setTopic(topicData);
    } catch (err) {
      console.error('Failed to load topic details:', err);
      setTopic({ id: topicId!, title: 'Topic', description: null } as Topic);
    }
  };

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId || !selectedProviderId) return;

    try {
      setGenerating(true);
      setError(null);
      const result = await quizService.generateQuiz({
        topicId,
        providerId: selectedProviderId,
        numQuestions,
        title: quizTitle || undefined,
        passingScore,
      });

      setQuizzes([...quizzes, result.quiz]);
      setShowGenerateForm(false);
      setQuizTitle('');
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
      await quizService.deleteQuiz(quizId);
      setQuizzes(quizzes.filter(q => q.id !== quizId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete quiz');
    }
  };

  const handleTogglePublish = async (quiz: Quiz) => {
    try {
      const updated = await quizService.updateQuiz(quiz.id, {
        is_published: !quiz.is_published,
      });
      setQuizzes(quizzes.map(q => (q.id === quiz.id ? updated.quiz : q)));
    } catch (err: any) {
      setError(err.message || 'Failed to update quiz');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading quizzes...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          {/* Back Button */}
          {topic && topic.curriculum_id && (
            <button
              onClick={() => navigate(`/instructor/curricula/${topic.curriculum_id}/topics`)}
              className="mb-4 flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Topic Management
            </button>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quiz Management</h2>
              <p className="text-sm text-gray-500 mt-1">
                {topic?.title ? `${topic.title} - ` : ''}Create and manage AI-generated quizzes for this topic
              </p>
            </div>
            <button
              onClick={() => setShowGenerateForm(!showGenerateForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showGenerateForm ? 'Cancel' : 'Generate New Quiz'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Generate Quiz Form */}
        {showGenerateForm && (
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Generate Quiz with AI
            </h3>
            <form onSubmit={handleGenerateQuiz} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AI Provider
                  </label>
                  <select
                    value={selectedProviderId}
                    onChange={e => setSelectedProviderId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.provider_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={numQuestions}
                    onChange={e => setNumQuestions(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quiz Title (optional)
                  </label>
                  <input
                    type="text"
                    value={quizTitle}
                    onChange={e => setQuizTitle(e.target.value)}
                    placeholder="Leave empty for auto-generated title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={passingScore}
                    onChange={e => setPassingScore(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={generating || providers.length === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {generating ? 'Generating...' : 'Generate Quiz'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateForm(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {providers.length === 0 && (
                <p className="text-sm text-yellow-600">
                  No AI providers configured. Please{' '}
                  <a href="/ai/providers" className="underline">
                    configure an AI provider
                  </a>{' '}
                  first.
                </p>
              )}
            </form>
          </div>
        )}

        {/* Quiz List */}
        <div className="p-6">
          {quizzes.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No quizzes</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by generating a quiz with AI.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map(quiz => (
                <div
                  key={quiz.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {quiz.title}
                        </h3>
                        {quiz.generated_by_ai && (
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                            AI Generated
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            quiz.is_published
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {quiz.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      {quiz.description && (
                        <p className="text-sm text-gray-600 mb-2">{quiz.description}</p>
                      )}
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Passing Score: {quiz.passing_score}%</span>
                        {quiz.time_limit_minutes && (
                          <span>Time Limit: {quiz.time_limit_minutes} min</span>
                        )}
                        {quiz.max_attempts && (
                          <span>Max Attempts: {quiz.max_attempts}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => navigate(`/quizzes/${quiz.id}/review`)}
                        className="px-3 py-1 text-sm text-purple-600 border border-purple-600 rounded hover:bg-purple-50 transition-colors font-medium"
                      >
                        📋 Review All
                      </button>
                      <button
                        onClick={() => navigate(`/quizzes/${quiz.id}`)}
                        className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleTogglePublish(quiz)}
                        className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        {quiz.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
