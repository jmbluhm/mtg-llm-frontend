# Magic Chat - MTG AI Frontend

A beautiful, fantasy-themed Next.js frontend for a Magic: The Gathering AI chatbot. Features mana symbol rendering, parchment-style theming, session management, and seamless integration with n8n webhooks.

🚀 **Live Demo**: [mtg-llm-frontend.vercel.app](https://mtg-llm-frontend.vercel.app)

## Features

- 🎴 **Mana Symbol Rendering**: Automatically converts `{G}{U}{B}{R}{W}` text into beautiful mana symbols using Scryfall's API
- 📜 **Fantasy Theme**: Parchment-style background with Garamond font for an authentic Magic feel
- 💬 **Two-way Communication**: Send messages to your MTG chatbot and receive responses
- 🔐 **Session Management**: Persistent chat sessions with unique session IDs
- 👥 **Role-based Messages**: Visual distinction between user and assistant messages
- ⚡ **Real-time Updates**: Fetches messages from your n8n webhook endpoint
- 📱 **Responsive Design**: Works beautifully on desktop and mobile
- 🚀 **Production Ready**: Optimized for Vercel deployment

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your n8n webhook URL:
   - The webhook URL is configured for production: `https://jordanb.app.n8n.cloud/webhook/message-from-user`
   - To use your own webhook, update the `WEBHOOK_URL` in `src/lib/fetchMessages.ts`

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Live Production App

The app is deployed and running at: **[mtg-llm-frontend.vercel.app](https://mtg-llm-frontend.vercel.app)**

### Production Configuration

- **Frontend URL**: `https://mtg-llm-frontend.vercel.app`
- **n8n Webhook**: `https://jordanb.app.n8n.cloud/webhook/message-from-user`
- **Deployment Platform**: Vercel
- **Environment**: Production-ready with automatic HTTPS

## Configuration

### n8n Webhook Setup

#### Receiving Messages (GET)
The app expects your n8n webhook to return JSON with messages that include role information:

```json
// Option 1: Array of messages with roles
[
  { "id": "1", "text": "Welcome to Magic Chat!", "role": "assistant" },
  { "id": "2", "text": "What cards are you interested in?", "role": "user" }
]

// Option 2: Object with messages array
{
  "messages": [
    { "id": "1", "text": "Welcome to Magic Chat!", "role": "assistant" },
    { "id": "2", "text": "Tell me about {U}{R} cards!", "role": "user" }
  ]
}
```

**Session Management**: The GET request includes:
- Query parameter: `?session_id=<uuid>`
- Header: `X-Session-ID: <uuid>`

#### Sending Messages (POST)
When users send messages, the app POSTs JSON data in this format:

```json
{
  "message": "User's message text",
  "session_id": "unique-session-uuid"
}
```

**Session Management**: The POST request includes:
- Header: `X-Session-ID: <uuid>`
- Body: Contains `session_id` field

#### Receiving Processed Messages (API Route)
The app provides an API endpoint at `/api/messages` that n8n can POST to after processing messages:

**Endpoint**: `POST https://mtg-llm-frontend.vercel.app/api/messages`

**Expected payload from n8n**:
```json
{
  "session_id": "de609b2d-0254-4a56-9fbd-4d008ba77fe3",
  "messages": [
    {
      "id": "1749074394200-user",
      "role": "user",
      "text": "tell me about jeska's will"
    },
    {
      "id": "1749074394200-bot", 
      "role": "assistant",
      "text": "**Card Details: Jeska's Will**\n- **Type:** Sorcery\n- **Oracle Text:** Choose one. If you control a commander as you cast this spell, you may choose both instead.\n  - Add {R} for each card in target opponent's hand.\n  - Exile the top three cards of your library. You may play them this turn."
    }
  ],
  "timestamp": "2024-01-15T12:34:56.789Z"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Messages received successfully",
  "session_id": "de609b2d-0254-4a56-9fbd-4d008ba77fe3",
  "messages_processed": 2,
  "received_at": "2024-01-15T12:34:56.789Z"
}
```

This endpoint can be used by n8n to send back the processed conversation after the AI generates a response. It accepts multiple messages in a single request, allowing for complete conversation updates.

### Session Management

- **Automatic Session Creation**: A unique session ID is generated automatically
- **Persistent Sessions**: Session IDs are stored in localStorage
- **URL Override**: You can specify a session ID via `?session_id=<uuid>` in the URL
- **Cross-tab Support**: Sessions work across browser tabs

### Message Types

The `Message` interface supports:
```typescript
interface Message {
  id?: string;           // Optional unique identifier
  text: string;          // Message content with mana symbols
  role: 'user' | 'assistant';  // Message sender type
}
```

### Mana Symbol Support

The app automatically converts these mana symbols:
- Basic mana: `{W}` `{U}` `{B}` `{R}` `