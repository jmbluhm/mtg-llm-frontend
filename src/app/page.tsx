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
  const [isClient, setIsClient] = useState(false);

  // Ensure particles only render on client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

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
          role: msg.role,
          response: msg.response,
          content: msg.content
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

  // Helper type guard for structured ruling format
  function isStructuredRuling(content: unknown): content is {
    overallExplanation: string;
    cards: Array<{ name: string; type: string; oracleText: string; imageUrl: string }>;
    citations?: Array<{ type: string; id?: string; source?: string; text: string }>;
  } {
    try {
      if (
        typeof content === 'object' &&
        content !== null &&
        typeof (content as { overallExplanation?: unknown }).overallExplanation === 'string' &&
        Array.isArray((content as { cards?: unknown }).cards)
      ) {
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  return (
    <div className="min-h-screen flex flex-col font-mtg-body bg-[var(--bg-primary)]">
      {/* Floating Mana Particles - Client Side Only */}
      {isClient && (
        <div className="fixed inset-0 pointer-events-none z-0">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="mana-float"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${6 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <div className="max-w-4xl w-full mx-auto space-y-8 relative z-10">
        <div className="mtg-card relative">
          <div className="mtg-card-inner mtg-card-header text-center">
            <div className="flex justify-between items-start mb-8">
              <div className="w-10"></div> {/* Spacer */}
              <div className="flex-1">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <h1 className="text-4xl font-mtg-decorative mtg-title">
                    CommanderGPT
                  </h1>
                </div>
                <h2 className="text-lg font-mtg-body mtg-subtitle mb-4 font-normal">
                  Neither friend nor foe, your MTG AI Companion
                </h2>
                <div className="mtg-ornament mb-6 hidden sm:block"></div>
              </div>
              <div className="w-10 flex justify-end">
                <ThemeToggle />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-60"></div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-0 sm:px-4 pt-4 pb-28 overflow-y-auto z-10">
        <div className="flex-1 flex flex-col justify-end">
          <div className="space-y-0">
            {messages.length === 0 && !loading && (
              <div className="text-center py-8 welcome-message-compact">
                <div className="mb-6">
                  <img 
                    src="/iconTransparent.png" 
                    alt="Oracle Symbol" 
                    className="oracle-symbol-mobile w-16 h-16 mx-auto opacity-60 mb-4"
                  />
                  <h3 className="text-xl font-mtg text-[var(--text-accent)] mb-4">Welcome, Human</h3>
                  <p className="text-[var(--text-secondary)] font-mtg-body text-lg leading-relaxed max-w-md mx-auto">
                    Ask me about cards, rules, strategies, or the lore of the multiverse. 
                    I am your arcane companion through the realms of Magic.
                  </p>
                </div>
              </div>
            )}
            {messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const isRoleChange = prevMessage && prevMessage.role !== message.role;
              const marginClass = index === 0 ? '' : isRoleChange ? 'mt-10 sm:mt-12' : 'mt-6 sm:mt-8';
              return (
                <div key={message.id}>
                  {isRoleChange && (
                    <div className="flex items-center justify-center my-8 sm:my-10">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border-secondary)] to-transparent opacity-30"></div>
                      <div className="mx-4">
                        <div className="w-2 h-2 rounded-full bg-[var(--border-accent)] opacity-40"></div>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border-secondary)] to-transparent opacity-30"></div>
                    </div>
                  )}
                  <div
                    className={`message-bubble text-lg mb-8 ${marginClass} ${
                      message.role === 'user' ? 'message-user' : 'message-assistant'
                    }`}
                    aria-label={message.role === 'user' ? 'User message' : 'Oracle response'}
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0"
                        style={{
                          background: message.role === 'user' 
                            ? 'linear-gradient(135deg, #3b82f6, #1e40af)' 
                            : 'linear-gradient(135deg, #10b981, #059669)',
                          color: 'white'
                        }}>
                        {message.role === 'user' ? (
                          <span className="text-xs"></span>
                        ) : null}
                      </div>
                      <div className="font-mtg text-sm text-[var(--text-accent)] font-semibold">
                        {message.role === 'user' ? 'Planeswalker' : 'Oracle of the Multiverse'}
                      </div>
                    </div>
                    <div className="ml-14 text-[var(--text-primary)]">
                      {/* New structured ruling format */}
                      {(() => {
                        // Debug logs can be removed for production
                        // console.log('message.content', message.content);
                        // console.log('isStructuredRuling', isStructuredRuling(message.content));
                        return isStructuredRuling(message.content) ? (
                          (() => {
                            const content = message.content;
                            const citations = content.citations ?? [];
                            return (
                              <div className="assistant-card-content rounded-xl shadow-md p-4 bg-white/5 backdrop-blur border border-white/10 flex flex-col space-y-6">
                                {/* Top summary */}
                                {content.overallExplanation && (
                                  <div className="bg-yellow-900/20 border-l-4 border-yellow-500 p-3 rounded mb-2 max-w-prose text-base font-mtg-body text-[var(--text-accent)]">
                                    {content.overallExplanation}
                                  </div>
                                )}
                                {/* Cards list */}
                                {content.cards.length > 0 && (
                                  <div className="flex flex-col gap-6">
                                    {content.cards.map((card, idx) => (
                                      <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                          <div className="font-bold text-xl font-mtg mb-1 break-words">{card.name}</div>
                                          <div className="text-sm italic text-[var(--text-muted)] mb-2 break-words">{card.type}</div>
                                          <div className="font-bold uppercase text-xs tracking-wider text-[var(--text-accent)] mb-1 mt-2">Oracle Text</div>
                                          <div className="border-l-4 border-orange-500 bg-[var(--bg-secondary)] px-3 py-1 font-mono text-sm whitespace-pre-line rounded-md mb-2">
                                            {card.oracleText}
                                          </div>
                                        </div>
                                        {card.imageUrl && (
                                          <div className="flex-shrink-0 w-full sm:w-48 flex flex-col items-center mt-2 sm:mt-0 ml-0 sm:ml-4">
                                            <img
                                              src={card.imageUrl}
                                              alt={card.name}
                                              className="rounded-lg shadow-md border border-[var(--border-primary)] max-w-full sm:max-w-[12rem] h-auto object-contain"
                                              style={{ background: 'rgba(0,0,0,0.03)' }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* Citations */}
                                {citations.length > 0 && (
                                  <div>
                                    <div className="font-bold uppercase text-xs tracking-wider text-[var(--text-accent)] mb-2 mt-2">Citations</div>
                                    <div className="flex flex-col gap-2">
                                      {(['rule', 'ruling'] as const).map(type => (
                                        <div key={type}>
                                          {citations.filter((c) => c.type === type).length > 0 && (
                                            <div className="mb-1 font-mtg-body text-xs text-[var(--text-muted)] uppercase tracking-wider">{type === 'rule' ? 'Rules' : 'Rulings'}</div>
                                          )}
                                          <ul className="list-disc pl-6">
                                            {citations.filter((c) => c.type === type).map((c, i) => (
                                              <li key={i} className="mb-1">
                                                <span className="font-semibold text-[var(--text-accent)]">
                                                  {c.id ? `#${c.id}` : c.source ? c.source : ''}
                                                </span>
                                                {c.id || c.source ? ': ' : ''}
                                                <span className="text-[var(--text-primary)]">{c.text}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          // Fallback: legacy markdown rendering
                          message.role === 'user' ? (
                            <div 
                              className="font-mtg-body leading-relaxed text-[1.05rem]"
                              dangerouslySetInnerHTML={{ 
                                __html: processManaSymbols(message.text || '') 
                              }} 
                            />
                          ) : (
                            <MarkdownRenderer content={message.response || ''} />
                          )
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className={`message-bubble message-assistant text-lg p-6 mb-8 relative ${
                messages.length > 0 ? 'mt-10 sm:mt-12' : ''
              }`}>
                {messages.length > 0 && (
                  <div className="flex items-center justify-center mb-8">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border-secondary)] to-transparent opacity-30"></div>
                    <div className="mx-4">
                      <div className="w-2 h-2 rounded-full bg-[var(--border-accent)] opacity-40"></div>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border-secondary)] to-transparent opacity-30"></div>
                  </div>
                )}
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white'
                    }}>
                    <span className="sr-only">Loading</span>
                    <span className="mana-spinner" aria-hidden="true"></span>
                  </div>
                  <div className="font-mtg text-sm text-[var(--text-accent)] font-semibold">
                    Oracle of the Multiverse
                  </div>
                </div>
                <div className="ml-14 flex items-center text-[var(--text-secondary)] italic">
                  <div className="mana-particle-trail"><span></span></div>
                  Consulting the ancient tomes...
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Mana symbol reference and powered by */}
        <div className="text-center mt-4 mb-2">
          <p className="text-xs text-[var(--text-muted)] font-mtg-body italic">
            You can reference mana symbols like {'{'}G{'}'}, {'{'}U{'}'}, {'{'}R{'}'}, {'{'}W{'}'}, {'{'}B{'}'} in your messages
          </p>
          <div className="flex justify-center items-center gap-2 mt-2 opacity-60">
            <span className="text-xs text-[var(--text-muted)]">Powered by Prodigy Partners</span>
          </div>
        </div>
      </div>
      {/* Input bar pinned to bottom */}
      <form onSubmit={handleSendMessage} className="chat-input-bar w-full max-w-4xl mx-auto" aria-label="Send a message to the Oracle">
        <div className="relative flex items-center p-2 bg-[var(--bg-primary)] rounded-t-lg border-t-2 border-[var(--border-primary)] shadow-lg">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about a Magic card, rule, or strategy..."
            className="flex-1 mtg-input font-mtg-body text-[1.05rem] bg-transparent border-0 focus:ring-0 focus:outline-none"
            disabled={loading}
            aria-label="Type your message"
          />
          <button
            type="submit"
            aria-label="Cast Spell"
            disabled={!inputMessage.trim() || loading}
            className={`flex-shrink-0 w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center border-2 border-[var(--border-primary)] cursor-pointer outline-none ml-4 ${
              loading 
                ? 'bg-[var(--border-secondary)] cursor-wait' 
                : 'mtg-send-button'
            }`}
            title="Cast your inquiry into the aether"
          >
            {loading && (
              <span className="mana-spinner" aria-hidden="true"></span>
            )}
          </button>
        </div>
      </form>
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
