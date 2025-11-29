import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/ai.service';
import type { AIProvider, AIProviderType } from '../../types';
import { AIProviderForm } from './AIProviderForm';

export const AIProviderManagement: React.FC = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await aiService.getUserProviders();
      setProviders(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) {
      return;
    }

    try {
      await aiService.deleteProvider(id);
      await loadProviders();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete provider');
    }
  };

  const handleTestConnection = async (id: string) => {
    try {
      setTestingProvider(id);
      const isValid = await aiService.testProviderConnection(id);
      alert(isValid ? 'Connection successful!' : 'Connection failed');
    } catch (err: any) {
      alert('Connection test failed: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProvider(null);
    loadProviders();
  };

  const getProviderIcon = (type: AIProviderType) => {
    const icons = {
      openai: '🤖',
      anthropic: '🧠',
      ollama: '🦙',
      lmstudio: '💻',
    };
    return icons[type] || '⚡';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading providers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Providers</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your AI provider configurations and API keys
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Provider
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Provider Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {editingProvider ? 'Edit Provider' : 'Add New Provider'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingProvider(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <AIProviderForm
                provider={editingProvider}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setShowForm(false);
                  setEditingProvider(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Providers List */}
      {providers.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 text-5xl mb-4">🤖</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No AI Providers Configured
          </h3>
          <p className="text-gray-600 mb-4">
            Add your first AI provider to start using AI-powered features
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Provider
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getProviderIcon(provider.provider_type)}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {provider.provider_name}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {provider.provider_type}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {provider.is_default && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      Default
                    </span>
                  )}
                  {!provider.is_active && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              {provider.api_endpoint && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500">Endpoint</p>
                  <p className="text-sm text-gray-700 font-mono">{provider.api_endpoint}</p>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleTestConnection(provider.id)}
                  disabled={testingProvider === provider.id}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50 text-sm"
                >
                  {testingProvider === provider.id ? 'Testing...' : 'Test'}
                </button>
                <button
                  onClick={() => {
                    setEditingProvider(provider);
                    setShowForm(true);
                  }}
                  className="flex-1 px-3 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(provider.id)}
                  className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
