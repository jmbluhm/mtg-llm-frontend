'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendMessage, Message } from '../lib/fetchMessages';
import { processManaSymbols } from '../lib/manaSymbols';
import ThemeToggle from '../components/ThemeToggle';

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
    const extractTextContent = (children: React.ReactNode): string => {
      if (typeof children === 'string') {
        return children;
      }
      if (Array.isArray(children)) {
        return children.map(child => extractTextContent(child)).join('');
      }
      if (children && typeof children === 'object' && 'props' in children) {
        const childWithProps = children as { props?: { children?: React.ReactNode } };
        if (childWithProps.props && childWithProps.props.children) {
          return extractTextContent(childWithProps.props.children);
        }
      }
      return '';
    };

    return (
      <div className="markdown-content font-mtg-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Handle images with proper styling using Next.js Image component
            img: ({ src, alt }) => {
              // For external images (like Scryfall), use regular img tag to avoid Next.js optimization issues
              if (src && typeof src === 'string') {
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={src} 
                    alt={alt || ''} 
                    className="max-w-full h-auto rounded-lg shadow-md my-6 border-2 border-[var(--border-primary)]"
                    style={{ maxHeight: '300px' }}
                  />
                );
              }
              return null;
            },
            // Style links
            a: ({ href, children }) => (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[var(--text-accent)] hover:text-[var(--border-accent)] underline font-medium transition-colors"
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
                    className="mb-4 last:mb-0 leading-relaxed text-base"
                    dangerouslySetInnerHTML={{ __html: processManaSymbols(textContent) }}
                  />
                );
              }
              return <p className="mb-4 last:mb-0 leading-relaxed text-base">{children}</p>;
            },
            // Process mana symbols in strong text
            strong: ({ children }) => {
              const textContent = extractTextContent(children);
              if (textContent.includes('{') && textContent.includes('}')) {
                return (
                  <strong 
                    className="font-bold text-[var(--text-accent)]"
                    dangerouslySetInnerHTML={{ __html: processManaSymbols(textContent) }}
                  />
                );
              }
              return <strong className="font-bold text-[var(--text-accent)]">{children}</strong>;
            },
            // Style headers with mana symbol support
            h1: ({ children }) => {
              const textContent = extractTextContent(children);
              if (textContent.includes('{') && textContent.includes('}')) {
                return (
                  <h1 
                    className="text-2xl font-mtg font-bold mb-6 mt-8 first:mt-0 text-[var(--text-accent)] border-b-2 border-[var(--border-accent)] pb-3"
                    dangerouslySetInnerHTML={{ __html: processManaSymbols(textContent) }}
                  />
                );
              }
              return <h1 className="text-2xl font-mtg font-bold mb-6 mt-8 first:mt-0 text-[var(--text-accent)] border-b-2 border-[var(--border-accent)] pb-3">{children}</h1>;
            },
            h2: ({ children }) => {
              const textContent = extractTextContent(children);
              if (textContent.includes('{') && textContent.includes('}')) {
                return (
                  <h2 
                    className="text-xl font-mtg font-bold mb-4 mt-6 first:mt-0 text-[var(--text-accent)]"
                    dangerouslySetInnerHTML={{ __html: processManaSymbols(textContent) }}
                  />
                );
              }
              return <h2 className="text-xl font-mtg font-bold mb-4 mt-6 first:mt-0 text-[var(--text-accent)]">{children}</h2>;
            },
            h3: ({ children }) => {
              const textContent = extractTextContent(children);
              if (textContent.includes('{') && textContent.includes('}')) {
                return (
                  <h3 
                    className="text-lg font-mtg font-bold mb-3 mt-5 first:mt-0 text-[var(--text-accent)]"
                    dangerouslySetInnerHTML={{ __html: processManaSymbols(textContent) }}
                  />
                );
              }
              return <h3 className="text-lg font-mtg font-bold mb-3 mt-5 first:mt-0 text-[var(--text-accent)]">{children}</h3>;
            },
            // Style lists
            ul: ({ children }) => (
              <ul className="list-disc pl-8 mb-4 space-y-2">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-8 mb-4 space-y-2">{children}</ol>
            ),
            li: ({ children }) => {
              const textContent = extractTextContent(children);
              if (textContent.includes('{') && textContent.includes('}')) {
                return (
                  <li 
                    className="mb-2 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: processManaSymbols(textContent) }}
                  />
                );
              }
              return <li className="mb-2 leading-relaxed">{children}</li>;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6 font-mtg-body">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Card */}
        <div className="mtg-card relative">
          <div className="mtg-card-inner mtg-card-header text-center">
            <div className="flex justify-between items-start mb-8">
              <div className="w-10"></div> {/* Spacer */}
              <div className="flex-1">
                <h1 className="text-4xl font-mtg mtg-title mb-4">
                  Magic: The Gathering Oracle
                </h1>
                <div className="mtg-ornament mb-6 hidden sm:block"></div>
                <p className="text-lg text-[var(--text-secondary)] font-mtg-body italic hidden sm:block">
                  Consult the ancient wisdom of the multiverse
                </p>
              </div>
              <div className="w-10 flex justify-end">
                <ThemeToggle />
              </div>
            </div>
            {/* {sessionId && (
              <span className="mtg-session-pill">Session: {sessionId.substring(0, 8)}...</span>
            )} */}
          </div>
        </div>

        {/* Chat Messages Card */}
        <div className="mtg-card">
          <div className="mtg-card-inner min-h-96">
            <div className="space-y-6">
              {messages.length === 0 && !loading && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-6">📜</div>
                  <h3 className="text-xl font-mtg text-[var(--text-accent)] mb-4">Welcome, Human</h3>
                  <p className="text-[var(--text-secondary)] font-mtg-body">
                    Ask me about cards, rules, strategies, or the lore of the multiverse.
                  </p>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message-bubble text-lg mb-6 ${
                    message.role === 'user' ? 'message-user' : 'message-assistant'
                  }`}
                  aria-label={message.role === 'user' ? 'User message' : 'Oracle response'}
                >
                  <div className="flex items-center mb-8">
                    
                  </div>
                  <div className="ml-20 text-[var(--text-primary)]">
                    {message.role === 'user' ? (
                      <div 
                        className="font-mtg-body leading-relaxed text-base"
                        dangerouslySetInnerHTML={{ 
                          __html: processManaSymbols(message.text || '') 
                        }} 
                      />
                    ) : (
                      <MarkdownRenderer content={message.response || ''} />
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message-bubble message-assistant text-lg p-10 my-6 relative">
                  <div className="flex items-center mb-8">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold mr-8 flex-shrink-0"
                         style={{
                           background: 'linear-gradient(135deg, #10b981, #059669)',
                           color: 'white'
                         }}>
                      <span className="sr-only">Loading</span>
                      <span className="mana-spinner" aria-hidden="true"></span>
                    </div>
                  </div>
                  <div className="ml-20 flex items-center text-[var(--text-secondary)] italic">
                    <div className="mana-particle-trail"></div>
                    Summoning...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input Card */}
        <div className="mtg-card">
          <div className="mtg-card-inner">
            <form onSubmit={handleSendMessage} className="flex gap-4 items-center min-h-20 mb-8" aria-label="Send a message to the Oracle">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about a Magic card, rule, or strategy..."
                className="flex-1 max-w-[calc(100%-4rem)] mtg-input font-mtg-body text-base"
                disabled={loading}
                aria-label="Type your message"
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={!inputMessage.trim() || loading}
                className={`mtg-send-button ${loading ? 'loading' : ''}`}
              >
                {loading ? (
                  <span className="mana-spinner" aria-hidden="true"></span>
                ) : (
                  <span className="mtg-send-icon" aria-hidden="true"></span>
                )}
              </button>
            </form>
            <div className="text-center">
              <p className="text-xs text-[var(--text-muted)] font-mtg-body">
                You can reference mana symbols like {'{'}G{'}'}, {'{'}U{'}'}, {'{'}R{'}'}, {'{'}W{'}'}, {'{'}B{'}'} in your messages
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MTGChat() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mtg-spinner w-8 h-8 mx-auto mb-4"></div>
          <div className="text-[var(--text-secondary)] font-mtg">Loading the Oracle...</div>
        </div>
      </div>
    }>
      <MTGChatContent />
    </Suspense>
  );
}
