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
   - The webhook URL is configured for production: `https://jordanb.app.n8n.cloud/webhook/a3624d40-af2a-40cd-8a8b-7e12054a16d1`
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
- **n8n Webhook**: `https://jordanb.app.n8n.cloud/webhook/a3624d40-af2a-40cd-8a8b-7e12054a16d1`
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
- Basic mana: `{W}` `{U}` `{B}` `{R}` `{G}` `{C}`
- Numbers: `{0}` through `{20}`
- Variables: `{X}` `{Y}` `{Z}`
- Hybrid: `{W/U}` `{U/B}` etc.
- Phyrexian: `{W/P}` `{U/P}` etc.
- Special: `{T}` `{Q}` `{S}` `{E}`

## Usage

1. **View Messages**: All messages from your MTG chatbot are displayed in the main chat area with mana symbols automatically rendered
2. **Send Messages**: Use the input box at the bottom to ask questions about MTG cards, rules, or deck building
3. **Message Roles**: User messages appear on the right with amber background, assistant messages on the left with white background
4. **Session Persistence**: Your conversation continues across browser refreshes and tabs
5. **Mana Symbols**: Include mana symbols in your messages using curly braces like `{G}{U}` for green and blue mana

## Deployment

### Vercel (Recommended) ✅ **DEPLOYED**

The app is currently deployed on Vercel at: **[mtg-llm-frontend.vercel.app](https://mtg-llm-frontend.vercel.app)**

To deploy your own version:
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically - no additional configuration needed!

### Other Platforms

The app works with any Node.js hosting platform:

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Tailwind + custom styles
│   ├── layout.tsx           # Root layout with metadata
│   └── page.tsx             # Main chat interface with session management
├── lib/
│   ├── fetchMessages.ts     # n8n webhook integration with sessions
│   └── manaSymbols.ts       # Mana symbol processing
tailwind.config.ts           # Custom font configuration
```

## API Reference

### fetchMessages(sessionId: string)
Fetches messages for a specific session from the n8n webhook.

**Parameters:**
- `sessionId`: Unique session identifier

**Returns:** `Promise<Message[]>`

### sendMessage(message: string, sessionId: string)
Sends a message to the n8n webhook for a specific session.

**Parameters:**
- `message`: The message text to send
- `sessionId`: Unique session identifier

**Returns:** `Promise<{ success: boolean; error?: string }>`

## Customization

### Fonts
The app uses Garamond for a fantasy feel. To change this:
1. Update `tailwind.config.ts`
2. Modify the `fontFamily.mtg` property

### Styling
- Main theme colors are in `src/app/globals.css`
- Parchment styling uses the `.parchment` class
- User messages: amber background, right-aligned
- Assistant messages: white background, left-aligned
- All spacing uses Tailwind utility classes

### Webhook URL
Update the `WEBHOOK_URL` constant in `src/lib/fetchMessages.ts` to connect to your n8n instance.

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Lint code
npm run lint
```

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first CSS
- **Scryfall API** - Mana symbol SVGs
- **UUID** - Session management
- **Vercel** - Deployment platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
