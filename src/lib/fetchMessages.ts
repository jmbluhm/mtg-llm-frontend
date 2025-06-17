export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  response?: string;
  content?: AssistantContent;
}

export interface AssistantContent {
  cardName: string;
  cardType: string;
  oracleText: string;
  imageUrl: string;
  explanation: string;
  citations: Array<{ type: 'rule' | 'ruling'; id?: string; source?: string; text: string }>;
}

export interface AssistantResponse {
  id: string;
  role: 'assistant';
  response?: string;
  content?: AssistantContent;
}

const WEBHOOK_URL =
  process.env.NODE_ENV === 'development'
    ? 'https://jordanb.app.n8n.cloud/webhook-test/message-from-user'
    : 'https://jordanb.app.n8n.cloud/webhook/message-from-user';

export async function sendMessage(message: string, sessionId: string): Promise<{ success: boolean; assistantMessages?: AssistantResponse[]; error?: string }> {
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

    const text = await response.text();
    if (!text) {
      throw new Error('Empty response from backend');
    }
    let responseData;
    try {
      responseData = JSON.parse(text);
    } catch {
      throw new Error('Invalid JSON response from backend');
    }

    // Expect an array of assistant messages
    if (Array.isArray(responseData)) {
      return {
        success: true,
        assistantMessages: responseData.map(msg => ({
          id: msg.id,
          role: msg.role,
          response: msg.response,
          content: msg.content
        }))
      };
    }

    return { success: true, assistantMessages: [] };
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