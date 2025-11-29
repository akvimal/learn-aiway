import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { curriculumService } from '../../services/curriculum.service';
import { quizService } from '../../services/quiz.service';
import type { CurriculumWithDetails, Topic, Quiz } from '../../types';

export const TopicNavigation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<CurriculumWithDetails | null>(null);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [flatTopics, setFlatTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [topicQuizzes, setTopicQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  useEffect(() => {
    if (id) {
      loadCurriculum();
    }
  }, [id]);

  useEffect(() => {
    if (flatTopics.length > 0 && flatTopics[currentTopicIndex]) {
      loadTopicQuizzes(flatTopics[currentTopicIndex].id);
    }
  }, [currentTopicIndex, flatTopics]);

  const loadCurriculum = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await curriculumService.getCurriculumById(id, true);
      setData(response);

      // Flatten topics for navigation
      const flattened = flattenTopics(response.topics);
      setFlatTopics(flattened);
    } catch (err: any) {
      setError(err.message || 'Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  };

  const flattenTopics = (topics: Topic[]): Topic[] => {
    const result: Topic[] = [];
    const flatten = (topicList: Topic[]) => {
      topicList.forEach((topic) => {
        result.push(topic);
        if (topic.children && topic.children.length > 0) {
          flatten(topic.children);
        }
      });
    };
    flatten(topics);
    return result;
  };

  const loadTopicQuizzes = async (topicId: string) => {
    try {
      setLoadingQuizzes(true);
      const response = await quizService.getQuizzesByTopic(topicId);
      // Only show published quizzes to learners
      setTopicQuizzes(response.quizzes.filter(q => q.is_published));
    } catch (err: any) {
      console.error('Failed to load quizzes:', err);
      setTopicQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const goToNextTopic = () => {
    if (currentTopicIndex < flatTopics.length - 1) {
      setCurrentTopicIndex(currentTopicIndex + 1);
    }
  };

  const goToPreviousTopic = () => {
    if (currentTopicIndex > 0) {
      setCurrentTopicIndex(currentTopicIndex - 1);
    }
  };

  const goToTopic = (index: number) => {
    setCurrentTopicIndex(index);
  };

  const renderContent = (content: string) => {
    // First, check if it's malformed JSON (keys without values like {"key1","key2"})
    // This pattern matches: {" followed by text, followed by ", or }
    const malformedObjectPattern = /^\{("[^"]+",?)+\}$/;
    if (malformedObjectPattern.test(content.trim())) {
      console.log('Detected malformed JSON object (keys only), converting to array');
      try {
        // Extract the quoted strings and create an array
        const matches = content.match(/"([^"]+)"/g);
        if (matches) {
          const items = matches.map(m => m.replace(/"/g, ''));
          console.log('Extracted items:', items);

          return (
            <div className="bg-gray-50 rounded-lg p-6">
              <ul className="space-y-3">
                {items.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }
      } catch (e) {
        console.log('Failed to extract from malformed JSON:', e);
      }
    }

    // Try to parse as valid JSON
    try {
      console.log('Attempting to parse content:', content);
      const parsed = JSON.parse(content);
      console.log('Successfully parsed:', parsed);

      // If it's an object with numbered keys (like {"1. ...": "", "2. ...": ""})
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        const entries = Object.entries(parsed);
        console.log('Processing as object, entries:', entries);

        // Check if all keys look like list items
        const isListFormat = entries.every(([key]) => /^\d+\./.test(key));

        if (isListFormat) {
          return (
            <div className="bg-gray-50 rounded-lg p-6">
              <ul className="space-y-3">
                {entries.map(([key, value]) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="font-semibold text-blue-600 min-w-fit">{key}</span>
                    <span className="text-gray-700">{String(value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        // Otherwise render as key-value pairs
        return (
          <div className="bg-gray-50 rounded-lg p-6">
            <dl className="space-y-3">
              {entries.map(([key, value]) => (
                <div key={key}>
                  <dt className="font-semibold text-gray-900">{key}</dt>
                  <dd className="text-gray-700 mt-1">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        );
      }

      // If it's an array
      if (Array.isArray(parsed)) {
        return (
          <div className="bg-gray-50 rounded-lg p-6">
            <ul className="list-disc list-inside space-y-2">
              {parsed.map((item, index) => (
                <li key={index} className="text-gray-700">{String(item)}</li>
              ))}
            </ul>
          </div>
        );
      }
    } catch (e) {
      // Not JSON, render as normal text
      console.log('Failed to parse as JSON, error:', e);
      console.log('Rendering as plain text');
    }

    // Default: render as text with whitespace preserved
    return (
      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data || flatTopics.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || 'No topics available'}</p>
            <button
              onClick={() => navigate(`/curricula/${id}`)}
              className="mt-4 text-blue-600 hover:text-blue-700 underline"
            >
              Back to curriculum
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentTopic = flatTopics[currentTopicIndex];
  const progress = ((currentTopicIndex + 1) / flatTopics.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? 'w-80' : 'w-0'
        } bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Topics</h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="text-gray-500 hover:text-gray-700 lg:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            {flatTopics.map((topic, index) => (
              <button
                key={topic.id}
                onClick={() => goToTopic(index)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  index === currentTopicIndex
                    ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-900'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      index < currentTopicIndex
                        ? 'bg-green-500 text-white'
                        : index === currentTopicIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index < currentTopicIndex ? '✓' : index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{topic.title}</p>
                    {topic.estimated_duration_minutes && (
                      <p className="text-xs text-gray-500 mt-1">
                        {topic.estimated_duration_minutes} min
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {!showSidebar && (
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => navigate(`/curricula/${id}`)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Exit
                </button>
              </div>
              <div className="text-sm text-gray-600">
                {currentTopicIndex + 1} / {flatTopics.length}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Topic Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentTopic.title}</h1>
                {currentTopic.description && (
                  <p className="text-gray-600">{currentTopic.description}</p>
                )}
              </div>

              {/* Learning Objectives */}
              {currentTopic.learning_objectives && currentTopic.learning_objectives.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    What you'll learn:
                  </h2>
                  <ul className="space-y-2">
                    {currentTopic.learning_objectives.map((objective) => (
                      <li key={objective.id} className="flex items-start gap-3">
                        <svg
                          className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-gray-700">{objective.objective_text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Topic Content */}
              {currentTopic.content && (
                <div className="prose max-w-none mb-6">
                  {renderContent(currentTopic.content)}
                </div>
              )}

              {!currentTopic.content && (
                <div className="bg-gray-50 rounded-lg p-8 text-center mb-6">
                  <p className="text-gray-600">Content coming soon...</p>
                </div>
              )}

              {/* Quizzes Section */}
              {topicQuizzes.length > 0 && (
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Test Your Knowledge
                  </h2>
                  <div className="space-y-4">
                    {topicQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {quiz.title}
                            </h3>
                            {quiz.description && (
                              <p className="text-sm text-gray-600 mb-3">{quiz.description}</p>
                            )}
                            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Passing Score: {quiz.passing_score}%
                              </span>
                              {quiz.time_limit_minutes && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Time Limit: {quiz.time_limit_minutes} min
                                </span>
                              )}
                              {quiz.generated_by_ai && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                                  AI Generated
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/quizzes/${quiz.id}`)}
                            className="ml-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            Start Quiz
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loadingQuizzes && (
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <div className="text-center text-gray-500">Loading quizzes...</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={goToPreviousTopic}
              disabled={currentTopicIndex === 0}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Previous
            </button>

            <button
              onClick={goToNextTopic}
              disabled={currentTopicIndex === flatTopics.length - 1}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {currentTopicIndex === flatTopics.length - 1 ? 'Complete' : 'Next'}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
