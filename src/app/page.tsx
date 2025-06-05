'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendMessage, Message } from '../lib/fetchMessages';
import { processManaSymbols } from '../lib/manaSymbols';

function MTGChatContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Initialize session ID
  useEffect(() => {
    let id = searchParams.get('session');
    
    if (!id) {
      // Try to get from localStorage
      id = localStorage.getItem('mtg-chat-session-id');
    }
    
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('mtg-chat-session-id', id);
    }
    
    setSessionId(id);
  }, [searchParams]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    // Immediately append the user message to the state
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: inputMessage.trim()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    try {
      // Send message and get assistant responses
      const result = await sendMessage(currentMessage, sessionId);
      
      if (result.success && result.assistantMessages) {
        // Append all assistant messages from the webhook response
        const assistantMessages: Message[] = result.assistantMessages.map(msg => ({
          id: msg.id,
          role: 'assistant',
          response: msg.response
        }));
        
        setMessages(prev => [...prev, ...assistantMessages]);
      } else if (result.error) {
        // Add an error message as an assistant response
        const errorMessage: Message = {
          id: `${Date.now()}-error`,
          role: 'assistant',
          response: `Error: ${result.error}`
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        response: 'An unexpected error occurred. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

// Custom component to render markdown with mana symbols
  const MarkdownRenderer = ({ content }: { content: string }) => {
    // Helper function to extract text content from ReactMarkdown children
    const extractTextContent = (children: any): string => {
      if (typeof children === 'string') {
        return children;
      }
      if (Array.isArray(children)) {
        return children.map(child => extractTextContent(child)).join('');
      }
      if (children && typeof children === 'object' && children.props && children.props.children) {
        return extractTextContent(children.props.children);
      }
      return '';
    };

    return (
      <div className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Handle images with proper styling
            img: ({ src, alt }) => (
              <img 
                src={src} 
                alt={alt} 
                className="max-w-full h-auto rounded-lg shadow-md my-2"
                style={{ maxHeight: '300px' }}
              />
            ),
            // Style links
            a: ({ href, children }) => (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {children}
              </a>
            ),
            // Add proper spacing and process mana symbols in paragraphs
            p: ({ children }) => {
              const textContent = extractTextContent(children);
              if (textContent.includes('{') && textContent.includes('}')) {
                return (
                  <p 
                    className="mb-2 last:mb-0"
                    dangerouslySetInnerHTML={{ __html: processManaSymbols(textContent) }}
                  />
                );
              }
              return <p className="mb-2 last:mb-0">{children}</p>;
            },
            // Process mana symbols in strong text
            strong: ({ children }) => {
              const textContent = extractTextContent(children);
              if (textContent.includes('{') && textContent.includes('}')) {
                return (
                  <strong 
                    dangerouslySetInnerHTML={{ __html: processManaSymbols(textContent) }}
                  />
                );
              }
              return <strong>{children}</strong>;
            },
            // Style headers with mana symbol support
            h1: ({ children }) => {
              const textContent = extractTextContent(children);
              if (textContent.includes('{') && textContent.includes('}')) {
                return (
                  <h1 
                    className="text-xl font-bold mb-2 text-stone-800"
                    dangerouslySetInnerHTML={{ __html: processManaSymbols(textContent) }}
                  />
                );
              }
              return <h1 className="text-xl font-bold mb-2 text-stone-800">{children}</h1>;
            },
            h2: ({ children }) => {
              const textContent = extractTextContent(children);
              if (textContent.includes('{') && textContent.includes('}')) {
                return (
                  <h2 
                    className="text-lg font-bold mb-2 text-stone-800"
                    dangerouslySetInnerHTML={{ __html: processManaSymbols(textContent) }}
                  />
                );
              }
              return <h2 className="text-lg font-bold mb-2 text-stone-800">{children}</h2>;
            },
            h3: ({ children }) => {
              const textContent = extractTextContent(children);
              if (textContent.includes('{') && textContent.includes('}')) {
                return (
                  <h3 
                    className="text-base font-bold mb-2 text-stone-800"
                    dangerouslySetInnerHTML={{ __html: processManaSymbols(textContent) }}
                  />
                );
              }
              return <h3 className="text-base font-bold mb-2 text-stone-800">{children}</h3>;
            },
            // Style lists
            ul: ({ children }) => (
              <ul className="list-disc pl-6 mb-2">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-6 mb-2">{children}</ol>
            ),
            li: ({ children }) => {
              const textContent = extractTextContent(children);
              if (textContent.includes('{') && textContent.includes('}')) {
                return (
                  <li 
                    className="mb-1"
                    dangerouslySetInnerHTML={{ __html: processManaSymbols(textContent) }}
                  />
                );
              }
              return <li className="mb-1">{children}</li>;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-200 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-stone-100 rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-3xl font-mtg font-bold text-stone-800 mb-4 text-center">
            Magic: The Gathering Oracle
          </h1>
          <p className="text-stone-600 text-center mb-6 font-mtg">
            Ask me about Magic cards, rules, strategies, and lore!
          </p>
          
          {sessionId && (
            <p className="text-xs text-stone-500 text-center mb-4">
              Session ID: {sessionId}
            </p>
          )}
        </div>

        <div className="bg-stone-100 rounded-lg shadow-lg p-6 mb-4 min-h-96">
          <div className="space-y-4 mb-6">
            {messages.length === 0 && !loading && (
              <div className="text-center text-stone-600 font-mtg italic py-8">
                Welcome! Ask me anything about Magic: The Gathering cards, rules, or lore.
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-100 border-l-4 border-blue-500 ml-8'
                    : 'bg-green-100 border-l-4 border-green-500 mr-8'
                } font-mtg`}
              >
                <div className="font-semibold text-sm mb-2 capitalize text-stone-700">
                  {message.role === 'user' ? 'You' : 'MTG Oracle'}
                </div>
                <div className="text-stone-800">
                  {message.role === 'user' ? (
                    // User messages: process mana symbols in plain text
                    <div dangerouslySetInnerHTML={{ 
                      __html: processManaSymbols(message.text || '') 
                    }} />
                  ) : (
                    // Assistant messages: render markdown with mana symbol support
                    <MarkdownRenderer content={message.response || ''} />
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="bg-green-100 border-l-4 border-green-500 mr-8 p-4 rounded-lg font-mtg">
                <div className="font-semibold text-sm mb-2 text-stone-700">MTG Oracle</div>
                <div className="text-stone-600 italic flex items-center">
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full mr-2"></div>
                  Thinking...
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-stone-100 rounded-lg shadow-lg p-6">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about a Magic card, rule, or strategy..."
              className="flex-1 px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mtg"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-stone-400 disabled:cursor-not-allowed font-mtg font-semibold transition-colors"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </form>
          <p className="text-xs text-stone-500 mt-2 font-mtg">
            You can reference mana symbols like {'{'}G{'}'}, {'{'}U{'}'}, {'{'}R{'}'}, {'{'}W{'}'}, {'{'}B{'}'} in your messages!
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MTGChat() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-200 flex items-center justify-center">
        <div className="text-stone-600 font-mtg">Loading chat...</div>
      </div>
    }>
      <MTGChatContent />
    </Suspense>
  );
}
