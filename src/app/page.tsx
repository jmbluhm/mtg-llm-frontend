'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchMessages, sendMessage, Message } from '@/lib/fetchMessages';
import { processManaSymbols } from '@/lib/manaSymbols';

function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const [sessionId] = useState(() => {
    const urlSession = searchParams.get('session_id');
    if (urlSession) return urlSession;
    const stored = typeof window !== 'undefined' ? localStorage.getItem('mtg_session_id') : null;
    if (stored) return stored;
    const newId = crypto.randomUUID();
    if (typeof window !== 'undefined') {
      localStorage.setItem('mtg_session_id', newId);
    }
    return newId;
  });

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedMessages = await fetchMessages(sessionId);
      setMessages(fetchedMessages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || sending) return;

    setSending(true);
    setSendError(null);

    try {
      const result = await sendMessage(inputMessage.trim(), sessionId);
      
      if (result.success) {
        setInputMessage('');
        // Refresh messages after sending
        await loadMessages();
      } else {
        setSendError(result.error || 'Failed to send message');
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-200 font-mtg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-2 tracking-wide">
            Magic Chat
          </h1>
          <p className="text-lg text-amber-800">
            Your AI companion for all things Magic: The Gathering
          </p>
        </div>

        {/* Main Chat Area */}
        <div className="max-w-4xl mx-auto">
          <div className="parchment rounded-lg shadow-lg p-6 min-h-[400px] mb-6">
            {loading && (
              <div className="flex items-center justify-center h-32">
                <div className="text-amber-700 text-lg">Loading messages...</div>
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <strong>Error:</strong> {error}
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-amber-700 py-8">
                    No messages found. Start a conversation below!
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={message.id || index}
                      className={`rounded-lg shadow-md p-4 border transition-shadow duration-200 ${
                        message.role === 'user'
                          ? 'bg-amber-50 border-amber-300 text-amber-900 text-right'
                          : 'bg-white bg-opacity-70 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div
                        className="leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: processManaSymbols(message.text)
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Message Input Box */}
          <div className="parchment rounded-lg shadow-lg p-4">
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about MTG cards, rules, or deck building..."
                  className="flex-1 px-4 py-3 rounded-lg border border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none bg-white bg-opacity-90 text-amber-900 placeholder-amber-600 font-mtg"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sending}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
              
              {sendError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
                  <strong>Send Error:</strong> {sendError}
                </div>
              )}
            </form>

            <div className="mt-3 text-xs text-amber-600 text-center">
              Use {'{G}'}, {'{U}'}, {'{B}'}, {'{R}'}, {'{W}'} for mana symbols in your messages
            </div>
          </div>

          {/* Footer Information */}
          <div className="mt-8 text-center text-sm text-amber-700">
            <p>
              Mana symbols are rendered using{' '}
              <a 
                href="https://scryfall.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-amber-900"
              >
                Scryfall&apos;s mana symbol API
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-stone-200 font-mtg flex items-center justify-center">
      <div className="text-amber-700 text-lg">Loading Magic Chat...</div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ChatInterface />
    </Suspense>
  );
}
