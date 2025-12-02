import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { curriculumService } from '../../services/curriculum.service';
import { exerciseService } from '../../services/exercise.service';
import { quizService } from '../../services/quiz.service';
import { aiService } from '../../services/ai.service';
import { httpClient } from '../../utils/http-client';
import type { AIProvider } from '../../types';

interface ReviewFindings {
  category: 'alignment' | 'coverage' | 'quality' | 'difficulty' | 'completeness' | 'pedagogy';
  severity: 'critical' | 'warning' | 'suggestion';
  title: string;
  description: string;
  affectedItems?: string[];
  suggestion: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export const TopicReview: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  // Data state
  const [topic, setTopic] = useState<any>(null);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI state
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [findings, setFindings] = useState<ReviewFindings[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [reviewCreatedAt, setReviewCreatedAt] = useState<Date | null>(null);
  const [hasExistingReview, setHasExistingReview] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Deep dive state
  const [deepDivingFinding, setDeepDivingFinding] = useState<number | null>(null);

  useEffect(() => {
    loadData();
    loadProviders();
    loadExistingReview();
  }, [topicId]);

  const findTopicInCurriculum = (topics: any[], targetTopicId: string): any => {
    for (const topic of topics) {
      if (topic.id === targetTopicId) {
        return topic;
      }
      if (topic.children && topic.children.length > 0) {
        const found = findTopicInCurriculum(topic.children, targetTopicId);
        if (found) return found;
      }
    }
    return null;
  };

  const loadData = async () => {
    if (!topicId) return;

    try {
      setLoading(true);
      setError(null);

      // Load topic summary
      const topicData = await curriculumService.getTopicSummary(topicId);
      setTopic(topicData);

      // Extract objectives from topic data (if available)
      // If not available in summary, we'll need to fetch from curriculum
      if (topicData.learning_objectives) {
        setObjectives(topicData.learning_objectives);
      } else {
        // Fallback: fetch objectives via curriculum endpoint
        try {
          const curriculumData = await curriculumService.getCurriculumById(topicData.curriculum_id);
          const currentTopic = findTopicInCurriculum(curriculumData.topics, topicId);
          setObjectives(currentTopic?.learning_objectives || []);
        } catch (err) {
          console.error('Failed to load objectives:', err);
          setObjectives([]);
        }
      }

      // Load exercises with full details
      const exercisesData = await exerciseService.getExercisesByTopic(topicId);

      // Load full exercise details including test cases and hints
      const exercisesWithDetails = await Promise.all(
        exercisesData.map(async (ex: any) => {
          try {
            return await exerciseService.getExerciseById(ex.id);
          } catch (err) {
            console.error(`Failed to load exercise ${ex.id}:`, err);
            return ex;
          }
        })
      );
      setExercises(exercisesWithDetails);

      // Load quizzes with questions
      const quizzesResponse = await quizService.getQuizzesByTopic(topicId);
      const quizzesWithQuestions = await Promise.all(
        quizzesResponse.quizzes.map(async (quiz: any) => {
          try {
            return await quizService.getQuizById(quiz.id);
          } catch (err) {
            console.error(`Failed to load quiz ${quiz.id}:`, err);
            return quiz;
          }
        })
      );
      setQuizzes(quizzesWithQuestions);
    } catch (err: any) {
      setError(err.message || 'Failed to load topic data');
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const data = await aiService.getUserProviders();
      const activeProviders = data.filter((p: AIProvider) => p.is_active);
      setProviders(activeProviders);

      const defaultProvider = activeProviders.find((p: AIProvider) => p.is_default);
      if (defaultProvider) {
        setSelectedProviderId(defaultProvider.id);
      } else if (activeProviders.length > 0) {
        setSelectedProviderId(activeProviders[0].id);
      }
    } catch (err) {
      console.error('Failed to load AI providers:', err);
    }
  };

  const loadExistingReview = async () => {
    if (!topicId) return;

    try {
      const response: any = await httpClient.get(`/ai/review/topic/${topicId}`);
      console.log('Load existing review response:', response);

      // httpClient.get() returns the axios response.data, which is { success: true, data: review }
      if (response.success && response.data) {
        const review = response.data;
        console.log('Found existing review:', review);
        setFindings(review.findings || []);
        setOverallScore(review.overallScore);
        setSummary(review.summary);
        setReviewCreatedAt(new Date(review.createdAt));
        setHasExistingReview(true);
      } else {
        console.log('No existing review found');
        setHasExistingReview(false);
      }
    } catch (err) {
      console.error('Failed to load existing review:', err);
      setHasExistingReview(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedProviderId || !topicId) {
      setError('Please select an AI provider');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      setFindings([]);
      setSummary('');
      setOverallScore(null);

      // Prepare comprehensive topic data
      const topicData = {
        topic: {
          id: topic.id,
          title: topic.title,
          description: topic.description,
          content: topic.content,
        },
        objectives: objectives.map(obj => ({
          id: obj.id,
          text: obj.objective_text,
          order: obj.order_index,
        })),
        exercises: exercises.map(ex => ({
          id: ex.id,
          title: ex.title,
          description: ex.description,
          instructions: ex.instructions,
          language: ex.language,
          difficulty: ex.difficulty_level,
          points: ex.points,
          testCasesCount: ex.test_cases?.length || 0,
          hintsCount: ex.hints?.length || 0,
          hints: ex.hints?.map((h: any) => ({
            level: h.hint_level,
            text: h.hint_text,
            revealsSolution: h.reveals_solution,
          })) || [],
        })),
        quizzes: quizzes.map(q => ({
          id: q.quiz?.id || q.id,
          title: q.quiz?.title || q.title,
          description: q.quiz?.description || q.description,
          passingScore: q.quiz?.passing_score || q.passing_score,
          questionsCount: q.questions?.length || 0,
          questions: q.questions?.map((qn: any) => ({
            id: qn.id,
            type: qn.question_type,
            text: qn.question_text,
            difficulty: qn.difficulty,
            points: qn.points,
            explanation: qn.explanation,
          })) || [],
        })),
      };

      // Call AI review endpoint
      const response = await httpClient.post<{ success: boolean; data: any }>(
        '/ai/review/topic',
        {
          topicData,
          providerId: selectedProviderId,
        }
      );

      console.log('Review generation response:', response);
      const result = response.data;
      console.log('Review result:', result);
      setFindings(result.findings || []);
      setSummary(result.summary || '');
      setOverallScore(result.overallScore || null);
      setReviewCreatedAt(new Date());
      setHasExistingReview(true);

      // Add system message to chat
      setChatMessages([
        {
          role: 'system',
          content: 'Topic review completed. You can now ask questions about the findings.',
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze topic');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeepDiveFinding = async (finding: ReviewFindings, findingIndex: number) => {
    if (!selectedProviderId || !topicId) {
      setError('Please select an AI provider');
      return;
    }

    try {
      setDeepDivingFinding(findingIndex);
      setError(null);

      // Prepare topic data for context
      const topicData = {
        topic: {
          id: topic.id,
          title: topic.title,
          description: topic.description,
          content: topic.content,
        },
        objectives: objectives.map(obj => ({
          id: obj.id,
          text: obj.objective_text,
          order: obj.order_index,
        })),
        exercises: exercises.map(ex => ({
          id: ex.id,
          title: ex.title,
          description: ex.description,
          difficulty: ex.difficulty_level,
        })),
        quizzes: quizzes.map(q => ({
          id: q.quiz?.id || q.id,
          title: q.quiz?.title || q.title,
          questionsCount: q.questions?.length || 0,
        })),
      };

      // Call deep dive endpoint
      const response = await httpClient.post<{ success: boolean; data: any }>(
        '/ai/review/finding/deep-dive',
        {
          topicData,
          finding,
          providerId: selectedProviderId,
        }
      );

      console.log('Deep dive response:', response);
      const result = response.data;

      // Update the finding with enhanced details
      const updatedFindings = [...findings];
      updatedFindings[findingIndex] = {
        ...finding,
        description: result.enhancedDescription || finding.description,
        suggestion: result.enhancedSuggestion || finding.suggestion,
        affectedItems: result.enhancedAffectedItems || finding.affectedItems,
      };
      setFindings(updatedFindings);

      // Add notification
      setChatMessages(prev => [
        ...prev,
        {
          role: 'system',
          content: `Deep dive analysis completed for: ${finding.title}`,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      console.error('Deep dive error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to perform deep dive analysis';
      setError(errorMessage);

      // Add error message to chat
      setChatMessages(prev => [
        ...prev,
        {
          role: 'system',
          content: `Deep dive failed: ${errorMessage}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setDeepDivingFinding(null);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedProviderId) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      // Prepare context for AI
      const context = {
        topic: topic.title,
        findings: findings,
        summary: summary,
      };

      const response = await httpClient.post<{ success: boolean; data: any }>(
        '/ai/chat',
        {
          messages: [...chatMessages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          context,
          providerId: selectedProviderId,
        }
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setChatLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      alignment: '🎯',
      coverage: '📊',
      quality: '⭐',
      difficulty: '📈',
      completeness: '✅',
      pedagogy: '📚',
    };
    return icons[category] || '📝';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      alignment: 'bg-blue-100 text-blue-800',
      coverage: 'bg-purple-100 text-purple-800',
      quality: 'bg-yellow-100 text-yellow-800',
      difficulty: 'bg-green-100 text-green-800',
      completeness: 'bg-indigo-100 text-indigo-800',
      pedagogy: 'bg-pink-100 text-pink-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      case 'suggestion':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '⚠️';
      case 'suggestion':
        return '💡';
      default:
        return 'ℹ️';
    }
  };

  // Show loading spinner only if we don't have topic data yet AND no existing review
  if (loading && !topic && !hasExistingReview) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!loading && !topic) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Topic not found</p>
        </div>
      </div>
    );
  }

  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const warningCount = findings.filter(f => f.severity === 'warning').length;
  const suggestionCount = findings.filter(f => f.severity === 'suggestion').length;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Topic Review</h1>
              {topic && <p className="text-gray-600 mt-1">{topic.title}</p>}
              {loading && !topic && (
                <p className="text-gray-400 mt-1 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  Loading topic details...
                </p>
              )}
            </div>
            {overallScore !== null && (
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">{overallScore}/100</div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
            )}
          </div>
        </div>

        {/* Existing Review Notice */}
        {hasExistingReview && reviewCreatedAt && !analyzing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-blue-800">
                <strong>Saved Review:</strong> This review was generated on {reviewCreatedAt.toLocaleString()}.
                Click "Review Again using AI" to create a new analysis with updated content.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Topic Statistics - Only show when topic data is loaded */}
        {topic && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">{objectives.length}</div>
              <div className="text-sm text-gray-600">Learning Objectives</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-purple-600">{exercises.length}</div>
              <div className="text-sm text-gray-600">Exercises</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">{quizzes.length}</div>
              <div className="text-sm text-gray-600">Quizzes</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
          </div>
        )}

        {/* AI Provider Selection & Analyze Button */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Options</h2>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select AI Provider
              </label>
              <select
                value={selectedProviderId}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={analyzing}
              >
                <option value="">Select a provider...</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.provider_name} - {provider.model_name}
                    {provider.is_default && ' (Default)'}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !selectedProviderId}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {hasExistingReview ? 'Review Again using AI' : 'Review using AI'}
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            The AI will analyze objectives, exercises, quizzes, and hints for alignment, quality, and completeness.
          </p>
        </div>

        {/* Summary */}
        {summary && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
              {reviewCreatedAt && (
                <span className="text-sm text-gray-500">
                  Generated on {reviewCreatedAt.toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
          </div>
        )}

        {/* Findings Overview */}
        {findings.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
              <div className="text-sm text-red-800">Critical Issues</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-yellow-600">{warningCount}</div>
              <div className="text-sm text-yellow-800">Warnings</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600">{suggestionCount}</div>
              <div className="text-sm text-blue-800">Suggestions</div>
            </div>
          </div>
        )}

        {/* Findings List */}
        {findings.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Findings</h2>
            <div className="space-y-4">
              {findings.map((finding, index) => (
                <div
                  key={index}
                  className={`border-l-4 rounded-lg p-4 ${getSeverityColor(finding.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getSeverityIcon(finding.severity)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(finding.category)}`}>
                          {getCategoryIcon(finding.category)} {finding.category.toUpperCase()}
                        </span>
                        <h3 className="font-semibold text-gray-900">{finding.title}</h3>
                      </div>
                      <p className="text-gray-700 mb-2 whitespace-pre-wrap">
                        {finding.description.replace(/\\n/g, '\n').replace(/\\t/g, '\t')}
                      </p>
                      {finding.affectedItems && finding.affectedItems.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-gray-700">Affected items:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {finding.affectedItems.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="bg-white bg-opacity-50 rounded p-3 mt-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">💡 Suggestion:</p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {finding.suggestion.replace(/\\n/g, '\n').replace(/\\t/g, '\t')}
                        </p>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleDeepDiveFinding(finding, index)}
                          disabled={analyzing || deepDivingFinding !== null}
                          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {deepDivingFinding === index ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                              Deep Dive
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Chat Interface */}
        {findings.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ask AI for More Details</h2>

            {/* Chat Messages */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4 h-96 overflow-y-auto">
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Start a conversation to get more insights about the review findings</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-3xl rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : msg.role === 'system'
                            ? 'bg-gray-100 text-gray-700 italic'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 rounded-lg p-3">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about the findings, request clarification, or get suggestions..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={chatLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
