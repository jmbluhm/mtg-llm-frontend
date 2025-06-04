export interface Message {
  id?: string;
  text: string;
  role: 'user' | 'assistant';
}

const WEBHOOK_URL = 'https://jordanb.app.n8n.cloud/webhook-test/a3624d40-af2a-40cd-8a8b-7e12054a16d1';

export async function fetchMessages(sessionId: string): Promise<Message[]> {
  try {
    const url = new URL(WEBHOOK_URL);
    url.searchParams.append('session_id', sessionId);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Assuming the webhook returns an array of messages or an object with a messages array
    // Adjust this based on your actual n8n webhook response structure
    const messages = Array.isArray(data) ? data : data.messages || [];
    
    return messages.map((message: { id?: string; text?: string; content?: string; role?: string } | string, index: number): Message => {
      if (typeof message === 'string') {
        return {
          id: `msg-${index}`,
          text: message,
          role: 'assistant'
        };
      }
      
      return {
        id: message.id || `msg-${index}`,
        text: message.text || message.content || String(message),
        role: (message.role === 'user' || message.role === 'assistant') ? message.role : 'assistant'
      };
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    // Return mock data for development/testing
    return [
      { id: '1', text: 'Welcome to Magic Chat! How can I help you with your MTG questions?', role: 'assistant' },
      { id: '2', text: 'I can help you with card interactions, deck building, and rules questions. For example, {U}{R} mana costs are for Izzet spells.', role: 'assistant' },
      { id: '3', text: 'Try asking about specific cards or interactions with mana symbols like {G}{W}{U}{B}{R}!', role: 'assistant' },
    ];
  }
}

export async function sendMessage(message: string, sessionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
      },
      body: JSON.stringify({
        message: message,
        session_id: sessionId
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send message' 
    };
  }
} 