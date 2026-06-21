# Chatbot Hacktiv8

A web-based chatbot powered by Google Gemini. The backend runs an Express server that proxies chat messages to the Gemini API under a custom persona: an Indonesian AI School Career & Major Advisor for students, parents, and school counselors.

## Features

- Static frontend served directly by Express (`public/`)
- Conversational API that forwards the full message history to Gemini
- Persona-locked responses via `systemInstruction` (career and education advisor)
- Client-side Markdown rendering for bot replies (headings, lists, inline code, bold/italic, links, code blocks)
- CORS enabled for cross-origin clients

## Tech Stack

- Node.js (ESM, `"type": "module"`)
- Express 5
- `@google/genai` (Gemini SDK)
- Vanilla HTML, CSS, and JavaScript (no frontend framework)

## Project Structure

```
.
├── index.js          # Express server + Gemini integration
├── public/
│   ├── index.html    # Chat UI
│   ├── style.css     # Chat UI styles
│   └── script.js     # Chat client + Markdown renderer
├── package.json
└── .env              # Local secrets (not committed)
```

## Prerequisites

- Node.js 18+
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here
```

The server reads this key on startup. Do not commit `.env`.

## Usage

```bash
node index.js
```

The server listens on `http://localhost:3000` and serves the chat UI at `/`. The API endpoint is:

```
POST /api/chat
Content-Type: application/json
```

Request body:

```json
{
  "conversation": [
    { "role": "user", "text": "Halo" },
    { "role": "model", "text": "Halo! Ada yang bisa kubantu?" }
  ]
}
```

Response:

```json
{
  "result": "..."
}
```

The client sends the entire `conversation` array each turn; the server maps it to Gemini's `contents` format and replies with a single model message.

### Persona

Responses are constrained by a `SYSTEM_INSTRUCTION` defined in `index.js`. The bot acts as a friendly Indonesian-language advisor for school majors, university programs, careers, and learning plans. Out-of-scope questions are redirected back to that persona.

To change the persona, edit the `SYSTEM_INSTRUCTION` constant in `index.js`.

## API Errors

| Status | Cause                              |
| ------ | ---------------------------------- |
| 400    | `conversation` is not an array     |
| 500    | Gemini request failed (see `error`)|

The frontend falls back to `"Failed to get response from server."` on non-OK responses and `"Sorry, no response received."` on empty payloads.

## Notes

- `package.json` declares `"main": "script.js"` but the actual entrypoint is `index.js`. Run with `node index.js` or update `main` if you prefer `npm start`.
- `package-lock.json` is committed; use `npm ci` for reproducible installs.
- The frontend stores the conversation in memory only. Refreshing the page clears the chat.

## License

ISC