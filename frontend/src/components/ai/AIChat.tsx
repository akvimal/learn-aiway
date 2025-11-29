import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { aiService } from '../../services/ai.service';
import type { AIProvider, AIChatMessage, AIUsageStats } from '../../types';

export const AIChat: React.FC = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [usageStats, setUsageStats] = useState<AIUsageStats | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProviders();
    loadUsageStats();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProviders = async () => {
    try {
      const data = await aiService.getUserProviders();
      // Filter to only show active providers
      const activeProviders = data.filter((p) => p.is_active);
      setProviders(activeProviders);
      const defaultProvider = activeProviders.find((p) => p.is_default);
      if (defaultProvider) {
        setSelectedProvider(defaultProvider.id);
      }
    } catch (err) {
      console.error('Failed to load providers:', err);
    }
  };

  const loadUsageStats = async () => {
    try {
      const stats = await aiService.getUserUsageStats();
      setUsageStats(stats);
    } catch (err) {
      console.error('Failed to load usage stats:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedProvider || loading) return;

    const userMessage: AIChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await aiService.sendChatCompletion({
        providerId: selectedProvider,
        messages: [...messages, userMessage],
        temperature: 0.7,
        max_tokens: 4000, // Increased for longer, detailed responses
      });

      const assistantMessage: AIChatMessage = {
        role: 'assistant',
        content: response.content,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      loadUsageStats(); // Refresh usage stats
    } catch (err: any) {
      const errorMessage: AIChatMessage = {
        role: 'assistant',
        content: `Error: ${err.response?.data?.error?.message || err.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm('Clear all messages?')) {
      setMessages([]);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Chat</h2>
            <p className="text-sm text-gray-600">Test your AI providers</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Clear Chat
            </button>
          )}
        </div>

        {/* Provider Selection */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Select a provider...</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.provider_name} ({provider.provider_type})
                  {provider.is_default && ' - Default'}
                </option>
              ))}
            </select>
          </div>

          {/* Usage Stats */}
          {usageStats && (
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-500 text-xs">Requests</div>
                <div className="font-semibold">{usageStats.total_requests}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 text-xs">Tokens</div>
                <div className="font-semibold">{usageStats.total_tokens}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 text-xs">Avg Latency</div>
                <div className="font-semibold">{parseFloat(usageStats.avg_latency).toFixed(0)}ms</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-lg">No messages yet</p>
              <p className="text-sm">Select a provider and start chatting</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`${message.role === 'user' ? 'max-w-[80%]' : 'max-w-full'} rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.content.startsWith('Error:')
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <div className="text-xs opacity-75 mb-1">
                    {message.role === 'user' ? 'You' : 'AI'}
                  </div>
                  {message.role === 'user' ? (
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  ) : (
                    <div className={`prose prose-sm max-w-none prose-slate
                      prose-headings:font-semibold prose-headings:text-gray-900
                      prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                      prose-p:text-gray-800 prose-p:leading-relaxed
                      prose-ul:text-gray-800 prose-ol:text-gray-800
                      prose-li:text-gray-800 prose-li:marker:text-gray-500
                      prose-strong:text-gray-900 prose-strong:font-semibold
                      prose-em:text-gray-800 prose-em:italic
                      prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
                      prose-code:before:content-none prose-code:after:content-none
                      prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-700
                      prose-blockquote:border-l-2 prose-blockquote:border-gray-300 prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-gray-600
                    `}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '');
                            const language = match ? match[1] : '';

                            // Extract clean code string
                            let codeString = String(children);
                            // Remove trailing newline if present
                            if (codeString.endsWith('\n')) {
                              codeString = codeString.slice(0, -1);
                            }

                            return !inline ? (
                              <div className="my-3 rounded-lg overflow-hidden border border-gray-700">
                                <div className="bg-gray-800 px-4 py-2 text-xs text-gray-300 font-mono flex justify-between items-center border-b border-gray-700">
                                  <span className="uppercase">{language || 'text'}</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(codeString);
                                    }}
                                    className="text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors text-xs"
                                    title="Copy code"
                                  >
                                    📋 Copy
                                  </button>
                                </div>
                                <div className="overflow-x-auto">
                                  <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={language || 'text'}
                                    PreTag="div"
                                    showLineNumbers={false}
                                    customStyle={{
                                      margin: 0,
                                      borderRadius: 0,
                                      fontSize: '0.875rem',
                                      lineHeight: '1.6',
                                      padding: '1rem',
                                      background: '#1e1e1e',
                                    }}
                                    codeTagProps={{
                                      style: {
                                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                      }
                                    }}
                                    wrapLines={false}
                                    wrapLongLines={false}
                                  >
                                    {codeString}
                                  </SyntaxHighlighter>
                                </div>
                              </div>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={selectedProvider ? 'Type your message...' : 'Select a provider first...'}
              disabled={!selectedProvider || loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={!selectedProvider || !inputMessage.trim() || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
