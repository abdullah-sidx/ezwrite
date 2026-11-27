# EzWrite — Speak Naturally. Type Instantly.

EzWrite is a voice-first writing assistant prototype designed to help people turn spoken thoughts and plain-language instructions into clear, editable text.

> **Current Build Status:** Step 3 — Conservative Text Cleanup Engine. Pure-JavaScript rule-based cleanup (`cleanText`, `cleanTextWithMeta`) is implemented in `@ezwrite/core`, covered by unit tests, and connected to the Voice Typing fallback editor. Local Smart Writing templates, browser speech recognition, and Chrome webpage insertion will be wired in upcoming steps.

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
│   ├── dashboard/          # React + Vite web dashboard (UI & navigation)
│   └── extension/          # Chrome Extension (Manifest V3 foundation)
├── packages/
│   └── core/               # Shared pure-JS modules (metadata & text cleanup)
└── tests/
    └── core/               # Node test suite for @ezwrite/core
```

---

## Prerequisites

- **Node.js** (v20 or newer) and **npm**
- **Docker Desktop** (for running the dashboard with Docker Compose)
- **Google Chrome** (for loading the unpacked Manifest V3 extension)

---

## Running the Dashboard

No `.env` file or API key is required.

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

---

## Running Tests

Run the core unit test suite (uses Node's built-in test runner):

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

## Known Limitations (Step 3)

- **Text cleanup is rule-based and conservative:** It normalizes whitespace, applies safe sentence capitalization, and adds clear basic punctuation while preserving URLs, emails, decimals, abbreviations, and code-mixed (Hinglish/regional) words. It is not full AI grammar correction.
- Speech-to-text (`SpeechRecognition`), local Smart Writing draft generation, and webpage text insertion are not wired yet.
- Copy to Clipboard works on text typed/edited in the Voice Typing or Smart Writing preview editors.
- Browser extensions cannot provide OS-wide shortcuts or insert text into native desktop apps.

---

## License

[MIT](LICENSE)
