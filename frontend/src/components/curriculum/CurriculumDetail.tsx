import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { curriculumService } from '../../services/curriculum.service';
import { CurriculumPerformance } from './CurriculumPerformance';
import type { CurriculumWithDetails, DifficultyLevel, Topic } from '../../types';

export const CurriculumDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<CurriculumWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (id) {
      loadCurriculum();
    }
  }, [id]);

  const loadCurriculum = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await curriculumService.getCurriculumById(id, true);
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  const getDifficultyColor = (level: DifficultyLevel): string => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTopic = (topic: Topic, level: number = 0) => {
    const isExpanded = expandedTopics.has(topic.id);
    const hasChildren = topic.children && topic.children.length > 0;
    const hasObjectives = topic.learning_objectives && topic.learning_objectives.length > 0;

    return (
      <div key={topic.id} className={`${level > 0 ? 'ml-6' : ''} mb-4`}>
        <div
          className={`bg-white border ${
            level === 0 ? 'border-gray-200' : 'border-gray-100'
          } rounded-lg p-4 hover:shadow-md transition-shadow`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {(hasChildren || hasObjectives) && (
                  <button
                    onClick={() => toggleTopic(topic.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className={`w-5 h-5 transition-transform ${
                        isExpanded ? 'transform rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                )}
                <h3 className={`${level === 0 ? 'text-lg' : 'text-base'} font-semibold text-gray-900`}>
                  {topic.title}
                </h3>
                {topic.is_required && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Required
                  </span>
                )}
              </div>

              {topic.description && (
                <p className="text-gray-600 text-sm mb-2">{topic.description}</p>
              )}

              {topic.estimated_duration_minutes && (
                <div className="text-sm text-gray-500">
                  <svg
                    className="inline w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {topic.estimated_duration_minutes} minutes
                </div>
              )}

              {/* Learning Objectives */}
              {isExpanded && hasObjectives && (
                <div className="mt-4 bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Learning Objectives:
                  </h4>
                  <ul className="space-y-2">
                    {topic.learning_objectives!.map((objective) => (
                      <li key={objective.id} className="flex items-start gap-2 text-sm text-gray-700">
                        <svg
                          className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
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
                        <span>{objective.objective_text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Render children topics */}
        {isExpanded && hasChildren && (
          <div className="mt-2">
            {topic.children!.map((child) => renderTopic(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || 'Curriculum not found'}</p>
            <button
              onClick={() => navigate('/curricula')}
              className="mt-4 text-blue-600 hover:text-blue-700 underline"
            >
              Back to curricula
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { curriculum, topics, progress } = data;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/curricula')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to curricula
        </button>

        {/* Curriculum Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{curriculum.title}</h1>

          <div className="flex flex-wrap gap-2 mb-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
                curriculum.difficulty_level
              )}`}
            >
              {curriculum.difficulty_level}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {curriculum.domain}
            </span>
            {curriculum.estimated_duration_hours && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                {curriculum.estimated_duration_hours} hours
              </span>
            )}
          </div>

          {curriculum.description && (
            <p className="text-gray-700 leading-relaxed mb-4">{curriculum.description}</p>
          )}

          {curriculum.tags && curriculum.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {curriculum.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Progress (if available) */}
        {progress && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Progress</h2>
            <div className="bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: '0%' }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">Last accessed: {new Date(progress.last_accessed_at).toLocaleDateString()}</p>
          </div>
        )}

        {/* Quiz Performance */}
        <div className="mb-6">
          <CurriculumPerformance curriculumId={curriculum.id} />
        </div>

        {/* Topics */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Curriculum Topics</h2>
            <button
              onClick={() => {
                if (expandedTopics.size === topics.length) {
                  setExpandedTopics(new Set());
                } else {
                  const allTopicIds = new Set<string>();
                  const collectIds = (topicList: Topic[]) => {
                    topicList.forEach((topic) => {
                      allTopicIds.add(topic.id);
                      if (topic.children) collectIds(topic.children);
                    });
                  };
                  collectIds(topics);
                  setExpandedTopics(allTopicIds);
                }
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {expandedTopics.size === topics.length ? 'Collapse All' : 'Expand All'}
            </button>
          </div>

          {topics.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">No topics available yet</p>
            </div>
          ) : (
            <div className="space-y-4">{topics.map((topic) => renderTopic(topic))}</div>
          )}
        </div>

        {/* Start Learning Button */}
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <button
            onClick={() => navigate(`/curricula/${id}/learn`)}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Learning
          </button>
        </div>
      </div>
    </div>
  );
};
