# EzWrite — Speak Naturally. Type Instantly.

EzWrite is a voice-first writing assistant prototype designed to help people turn spoken thoughts and plain-language instructions into clear, editable text.

> **Current Build Status:** Step 4 — Smart Writing Engine. Both the conservative text cleanup engine (Step 3) and the Smart Writing engine with local template fallback and optional server-side AI interface (Step 4) are active in `@ezwrite/core` and the React dashboard. Browser speech recognition and Chrome webpage field insertion will be added in upcoming steps.

---

## Scope: Round 2 Prototype vs. Future Product

- **Round 2 Prototype (being built here):** A Chrome browser extension (Manifest V3) and a React companion dashboard running on Windows 11. It starts and runs locally without paid APIs or API keys.
- **Future Product Vision (not yet built):** A lightweight Windows OS-level desktop assistant with system-wide shortcuts and universal desktop application insertion.

---

## Project Structure

```text
ezwrite/
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
├── docker-compose.yml
├── package.json
├── EzWrite_Project_Reference_and_Master_Prompt.md
├── apps/
│   ├── dashboard/          # React + Vite dashboard + optional Node AI proxy server
│   └── extension/          # Chrome Extension (Manifest V3 foundation)
├── packages/
│   └── core/               # Pure-JS shared modules (cleanup & Smart Writing)
└── tests/
    └── core/               # Node test suite for cleanup, Smart Writing, & server API
```

---

## Prerequisites

- **Node.js** (v20 or newer) and **npm**
- **Docker Desktop** (for running the dashboard with Docker Compose)
- **Google Chrome** (for loading the unpacked Manifest V3 extension)

---

## Running the Dashboard (No API Key Required)

No `.env` file or API key is required. Smart Writing defaults to local template generation.

### Option A: Using Docker Compose (Recommended for Reviewers)

From the repository root:

```powershell
docker compose up --build
```

Then open **http://localhost:5173** in your browser.

To stop the container:

```powershell
docker compose down
```

### Option B: Running Locally with Node.js

From the repository root:

```powershell
npm install
npm run dev:dashboard
```

Then open **http://localhost:5173** in your browser.

*(To test the built production SPA + `/api/health` + `/api/smart-writing/generate` server locally without Docker, run `npm run build:dashboard` followed by `npm run preview:dashboard`.)*

---

## Smart Writing: Modes, Fallback & Optional AI Configuration

### Supported Options
- **Modes:** Professional Email, Casual Message, Formal Message, Request, Apology, Follow-up, General Writing
- **Tones:** Professional, Friendly, Formal, Simple, Polite
- **Lengths:** Short, Medium, Detailed

### Local Fallback Behavior (Default)
- Runs completely offline inside `@ezwrite/core` with zero API keys.
- Preserves user-supplied names, dates, URLs, emails, and intent without inventing missing facts.
- Inserts clear placeholders (`[Recipient Name]`, `[Your Name]`) and warnings when key details are missing.
- Labels generated drafts honestly as **Local Template Fallback (No API Key)** — never claiming template output is AI-generated.

### Optional Server-Side AI Provider
- API keys are **never** placed in frontend JavaScript, browser storage, Chrome extension code, or Git.
- To optionally enable an OpenAI-compatible server-side endpoint in Docker/Node preview mode, copy [.env.example](.env.example) to `.env` (which is gitignored) and set server-only environment variables:
  - `EZWRITE_AI_PROVIDER=openai-compatible`
  - `EZWRITE_AI_API_KEY=<your-key>`
  - `EZWRITE_AI_BASE_URL=https://api.openai.com/v1` (optional override)
  - `EZWRITE_AI_MODEL=gpt-4o-mini` (optional override)
- Then switch **Smart Writing Mode** in the dashboard **Settings** view to **Optional Server-Side AI Provider**. If the provider is unconfigured, unreachable, or returns an error, EzWrite automatically falls back to local template generation.

---

## Running Tests

Run the automated test suite (uses Node's built-in `node:test` runner):

```powershell
npm test
```

---

## Building and Loading the Chrome Extension

Chrome extensions are loaded directly in Chrome rather than inside Docker.

1. Build the extension bundle from the repository root:
   ```powershell
   npm install
   npm run build:extension
   ```
   This outputs the loadable extension files into `apps/extension/dist/`.

2. Open Google Chrome and navigate to `chrome://extensions`.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select `apps/extension/dist`.
5. Click the EzWrite icon in the Chrome toolbar to open the extension popup.

---

## Chrome Extension Permissions (Current)

- `storage`: Stores local user preferences (such as selected language or UI settings) in Chrome extension storage.

Additional permissions will only be added and documented as webpage insertion features are implemented and tested.

---

## Known Limitations (Step 4)

- **Local Smart Writing is template/rule-based:** It structures clear drafts from your instructions without inventing facts, but it is not a full generative LLM when running without an optional AI provider.
- **Optional external AI endpoint:** Tested against local mock HTTP servers; live external API calls require user-supplied server credentials and have not been tested against a live paid endpoint here.
- **Text cleanup is rule-based and conservative:** Not full AI grammar correction.
- Speech-to-text (`SpeechRecognition`) and Chrome webpage field insertion are not wired yet.
- EzWrite never auto-sends emails or messages; browser extensions cannot provide OS-wide shortcuts or insert text into native desktop apps.

---

## License

[MIT](LICENSE)
