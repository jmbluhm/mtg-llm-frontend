export interface Message {
  id?: string;
  text: string;
  role: 'user' | 'assistant';
}

const WEBHOOK_URL = 'https://jordanb.app.n8n.cloud/webhook-test/message-from-user';

// Simple in-memory storage for messages by session
// In production, this would be a database or Redis
const messageStore: { [sessionId: string]: Message[] } = {};

export async function fetchMessages(sessionId: string): Promise<Message[]> {
  try {
    // Since the n8n webhook only accepts POST requests, we'll get messages from our local store
    // The messages will be populated when n8n sends them to our /api/messages endpoint
    const messages = messageStore[sessionId] || [];
    
    // If no messages exist for this session, return welcome message
    if (messages.length === 0) {
      return [
        { id: '1', text: 'Welcome to Magic Chat! How can I help you with your MTG questions?', role: 'assistant' },
        { id: '2', text: 'Ask me about card interactions, deck building, or rules. Try including mana symbols like {U}{R} in your questions!', role: 'assistant' },
      ];
    }
    
    return messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    // Return welcome messages on error
    return [
      { id: '1', text: 'Welcome to Magic Chat! How can I help you with your MTG questions?', role: 'assistant' },
      { id: '2', text: 'I can help you with card interactions, deck building, and rules questions. For example, {U}{R} mana costs are for Izzet spells.', role: 'assistant' },
    ];
  }
}

// Function to add messages to the store (called by our API route)
export function addMessagesToStore(sessionId: string, messages: Message[]): void {
  messageStore[sessionId] = messages;
}

// Function to get all messages for a session (for API route)
export function getMessagesFromStore(sessionId: string): Message[] {
  return messageStore[sessionId] || [];
}

export async function sendMessage(message: string, sessionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Attempting to send message to:', WEBHOOK_URL);
    console.log('Session ID:', sessionId);
    console.log('Message:', message);

    const requestBody = {
      message: message,
      session_id: sessionId
    };

    console.log('Request body:', requestBody);

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error text:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const responseData = await response.text();
    console.log('Response data:', responseData);

    // Add the user message to our local store immediately
    const currentMessages = getMessagesFromStore(sessionId);
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      text: message,
      role: 'user'
    };
    addMessagesToStore(sessionId, [...currentMessages, userMessage]);

    return { success: true };
  } catch (error) {
    console.error('Error sending message:', error);
    
    // More specific error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { 
        success: false, 
        error: 'Network error: Unable to connect to the webhook. This might be a CORS issue or network connectivity problem.' 
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send message' 
    };
  }
} 