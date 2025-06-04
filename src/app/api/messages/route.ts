import { NextRequest, NextResponse } from 'next/server';
import { addMessagesToStore } from '@/lib/fetchMessages';

export interface IncomingMessage {
  session_id: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    text: string;
  }>;
  timestamp?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the JSON body from n8n
    const body: IncomingMessage = await request.json();
    
    // Validate required fields
    if (!body.session_id || !body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: session_id, messages (array)' 
        },
        { status: 400 }
      );
    }

    // Validate messages array
    for (const message of body.messages) {
      if (!message.id || !message.role || !message.text) {
        return NextResponse.json(
          { 
            error: 'Invalid message format: each message must have id, role, and text' 
          },
          { status: 400 }
        );
      }
      if (message.role !== 'user' && message.role !== 'assistant') {
        return NextResponse.json(
          { 
            error: 'Invalid message role: must be "user" or "assistant"' 
          },
          { status: 400 }
        );
      }
    }

    // Store the messages in our message store
    addMessagesToStore(body.session_id, body.messages);

    // Log the received messages for debugging
    console.log('Received and stored messages from n8n:', {
      session_id: body.session_id,
      message_count: body.messages.length,
      messages: body.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        text: msg.text.substring(0, 100) + (msg.text.length > 100 ? '...' : '')
      })),
      timestamp: body.timestamp || new Date().toISOString()
    });

    // Return success response
    return NextResponse.json(
      { 
        success: true,
        message: 'Messages received and stored successfully',
        session_id: body.session_id,
        messages_processed: body.messages.length,
        received_at: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing message webhook:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 