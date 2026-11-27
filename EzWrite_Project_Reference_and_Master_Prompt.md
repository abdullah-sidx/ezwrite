# EzWrite — Master Project Reference & Build Prompt

**Project name:** EzWrite  
**Tagline:** Speak Naturally. Type Instantly.  
**Document purpose:** This is the single source of truth for the EzWrite hackathon prototype. Give this file to any AI coding assistant before asking it to plan, write, review, or modify the project.

---

## 1. The project in one paragraph

EzWrite is a voice-first writing assistant for people who regularly write messages, emails, notes, search queries, assignments, and other everyday text. A user speaks naturally; EzWrite turns that speech into readable text, applies appropriate capitalization and punctuation, and helps the user produce a clear message without changing the intended meaning. It should be useful for Indian users, including people who speak with regional accents or mix English with Indian languages (Hinglish and other code-mixed speech). The long-term vision is a lightweight operating-system-level assistant that works across desktop applications. **The hackathon submission is only a working prototype that demonstrates the core experience in a browser.**

## 2. The problem

Typing can interrupt a person's thoughts and take time, especially on phones or when composing longer messages. Some users are also less comfortable typing in English, spelling unfamiliar words, or switching between languages and keyboards. Existing voice input can produce raw or poorly punctuated text and may not help the user turn a spoken explanation into a well-structured message.

## 3. The solution

EzWrite provides two connected writing experiences:

### A. Voice Typing

1. The user focuses a supported text field on a webpage.
2. The user activates EzWrite using the available microphone control or a supported shortcut.
3. EzWrite listens to the user's speech.
4. Speech is converted into text.
5. EzWrite applies safe text cleanup, such as capitalization, spacing, and punctuation.
6. The user reviews or edits the result.
7. The user inserts the text into the active field, or copies it if direct insertion is unavailable.

**Core rule:** Never silently send, submit, or publish the generated text. The user must remain in control.

### B. Smart Writing

1. The user describes what they want to communicate in ordinary language.
2. They may include the recipient, situation, purpose, important facts, dates, tone, and desired length.
3. EzWrite creates a structured draft such as an email or message.
4. The user can edit the draft.
5. The user inserts or copies it manually.

For the first prototype, Smart Writing may use a dependable local/template-based fallback. An optional AI provider can be added behind a clearly separated interface. Do not make the app unusable when an API key is absent.

## 4. Users and use cases

Initial user groups:
- Students writing messages, notes, and academic communications.
- Working professionals drafting emails and workplace messages.
- Small-business owners composing customer messages.
- Everyday users who want a quicker way to write.

Example use cases:
- Speak a short WhatsApp Web message and insert the cleaned-up text.
- Dictate an email and review the punctuation before inserting it in Gmail.
- Describe a leave request and generate a professional email draft.
- Speak a note or reminder and copy the cleaned-up text into another supported editor.

Do not claim that every language, accent, website, or text field is supported. State the tested combinations honestly.

## 5. Scope: prototype versus final product

### Round 2 prototype — build this now

**Target:** Google Chrome on Windows 11, with a browser extension and a small companion dashboard.

Must demonstrate:
- A usable EzWrite dashboard/main screen.
- Voice Typing on at least one supported webpage text field.
- Basic text cleanup that can be tested without a paid AI service.
- Smart Writing with an editable draft and a local fallback.
- Insert-to-field when supported and copy-to-clipboard fallback.
- Settings for the prototype's available preferences.
- Clear listening, processing, success, and error states.
- A public GitHub repository and a reproducible startup process.

Recommended demo targets: WhatsApp Web and Gmail, subject to testing. If one site blocks or changes the integration, demonstrate on a simple local test page rather than pretending it works.

### Finale / future product — do not pretend this is already built

The long-term product is a Windows desktop application that can run quietly in the background and work across desktop applications. The intended future capabilities include:
- Configurable system-wide keyboard shortcuts.
- Hold-to-talk and hands-free activation patterns.
- Text insertion into supported desktop applications.
- More robust multilingual and code-mixed speech support.
- More capable context-aware Smart Writing.
- User-controlled settings and optional AI provider configuration.

A browser extension cannot reliably provide true operating-system-wide shortcuts or universal insertion into every desktop app. Those are future desktop-app capabilities, not Round 2 promises.

## 6. Product principles

1. **User control:** Never auto-send, auto-submit, or publish generated text.
2. **Meaning preservation:** Cleanup should improve readability without inventing facts or changing the user's intent.
3. **Honest capability claims:** Label experimental, unsupported, and future features clearly.
4. **Useful without secrets:** The project must start and show its main screen without an API key.
5. **Graceful fallback:** If speech recognition or direct insertion fails, explain why and offer a usable alternative such as typed input or copy.
6. **Privacy-aware design:** Do not record or store audio by default. Explain when a browser speech service or external AI provider may process user data.
7. **Simple experience:** Keep the main flow understandable to a first-time user.
8. **Modular code:** Keep speech capture, text cleanup, Smart Writing, and browser insertion separate so the core logic can later be reused in a desktop app.

## 7. Recommended technical approach

Use a JavaScript/React-based project.

### Main components

- **React + Vite dashboard:** Main screen, mode selection, settings, draft preview, and status messages.
- **Chrome Extension Manifest V3:** Browser integration.
- **Content script:** Detects supported editable fields and inserts approved text into the active field.
- **Extension service worker:** Coordinates extension messages and supported commands/shortcuts.
- **Shared JavaScript modules:** Text cleanup, Smart Writing logic, validation, and shared types/constants.
- **Browser SpeechRecognition API:** Candidate speech-to-text path for the prototype, after confirming support in the target Chrome version.
- **Docker Compose:** Starts the dashboard/main screen locally so reviewers can launch the visible app consistently.

### Important technical limitations to test early

- Browser speech recognition support and behavior vary by browser and environment. It may rely on a remote speech service; do not describe it as offline unless an offline engine is actually implemented and tested.
- Chrome extension shortcuts have browser-defined restrictions. A true press-and-hold keydown/keyup interaction may not be available through the extension commands API in the way a native desktop app can provide. Start with a microphone button and a supported shortcut; treat configurable hold-to-talk as experimental until proven.
- Content scripts cannot access every page, protected browser page, cross-origin frame, or custom editor. Direct insertion must be tested on each target website.
- Some editors require framework-compatible input events. If insertion fails, provide a copy button.
- Do not request broad permissions without a clear need. Explain each permission in the README.
- Never put API keys, passwords, or private tokens in source code, screenshots, commits, or the public repository.

### Suggested architecture

```text
User
 ├── EzWrite Dashboard (React)
 │    ├── Voice Typing controls
 │    ├── Smart Writing form
 │    ├── Draft preview/editor
 │    └── Settings and status
 │
 └── Chrome Browser
      └── EzWrite Extension (Manifest V3)
           ├── Popup / extension UI
           ├── Background service worker
           ├── Content script
           └── Shared core modules
                ├── speech adapter
                ├── text cleanup
                ├── smart writing provider
                └── insertion helpers
```

Keep the core writing logic independent of Chrome-specific APIs wherever practical.

## 8. Repository and folder structure

Use this as the target structure. It is a guide, not a reason to create empty files. Add files when they serve a real purpose.

```text
ezwrite/
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
├── docker-compose.yml
├── package.json                  # Root scripts/workspaces if using a monorepo
├── docs/
│   ├── PROJECT_REFERENCE.md      # This document
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   ├── TESTING.md
│   ├── PRIVACY.md
│   └── DEMO_SCRIPT.md
├── apps/
│   ├── dashboard/
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.jsx
│   │       ├── App.jsx
│   │       ├── components/
│   │       ├── pages/
│   │       ├── hooks/
│   │       ├── styles/
│   │       └── assets/
│   └── extension/
│       ├── package.json
│       ├── manifest.json
│       ├── public/
│       │   └── icons/
│       └── src/
│           ├── background/
│           ├── content/
│           ├── popup/
│           ├── options/
│           └── shared/
├── packages/
│   └── core/
│       ├── package.json
│       └── src/
│           ├── speech/
│           ├── cleanup/
│           ├── smart-writing/
│           ├── insertion/
│           ├── settings/
│           └── utils/
└── tests/
    ├── core/
    └── fixtures/
```

If a monorepo/workspace setup becomes too complicated for the time available, simplify it. A small, working, well-documented project is better than a complicated structure that does not run.

## 9. Main screens and user experience

### Dashboard
- EzWrite name and tagline.
- Two clear choices: Voice Typing and Smart Writing.
- A visible status indicator.
- Short explanation of what the prototype supports.
- A simple settings entry point.

### Voice Typing view
- Microphone start/stop control.
- Language selection only for languages actually supported by the implementation.
- Listening/processing/error states.
- Recognized text preview.
- Cleaned text preview or one editable result.
- Insert and Copy actions.
- Clear message if no supported text field is active.

### Smart Writing view
- A large description box.
- Optional recipient, purpose, tone, and length fields if useful.
- Generate Draft action.
- Editable draft preview.
- Copy / Insert actions.
- A clear label indicating whether the draft came from local fallback or an AI provider.

### Settings
- Available language preference.
- Available shortcut preference, only if implemented and tested.
- Optional AI provider configuration, if added.
- Privacy and limitations explanation.
- Reset settings option.

Do not build every imagined feature. Prioritize the end-to-end flow.

## 10. Functional requirements and acceptance checklist

### Must work
- [ ] `docker compose up --build` starts the dashboard/main screen.
- [ ] README explains how to load the unpacked Chrome extension.
- [ ] Extension loads without build errors in the target Chrome version.
- [ ] Dashboard clearly explains the prototype.
- [ ] User can type or paste text into Voice Typing as a fallback.
- [ ] Speech capture works in the chosen test environment, or the UI clearly explains when it is unavailable.
- [ ] Text cleanup works on a small set of repeatable test cases.
- [ ] Smart Writing can produce a usable local/template draft without an API key.
- [ ] Draft is editable before insertion.
- [ ] Insert works on at least one tested editable field, or Copy works as a fallback.
- [ ] No generated text is sent automatically.
- [ ] No secrets are committed.
- [ ] Fresh-clone setup is tested.

### Nice to have, only after the must-work list
- [ ] WhatsApp Web integration.
- [ ] Gmail integration.
- [ ] Configurable shortcut that works reliably in the tested browser.
- [ ] Optional AI provider adapter.
- [ ] Additional language/code-mixed speech tests.
- [ ] Polished animations and visual refinements.

## 11. Text cleanup rules

The first version should be conservative and predictable:
- Trim unnecessary leading/trailing spaces.
- Normalize repeated spaces.
- Capitalize the beginning of a sentence where safe.
- Add basic punctuation only when the rule is clear.
- Preserve names, dates, numbers, abbreviations, URLs, and language-mixed words.
- Do not replace unfamiliar words with guesses.
- Do not change facts, intent, or tone.
- Let the user edit the final result.

Do not claim full grammar correction from simple string rules. If an AI model is later added, isolate it behind a provider interface and retain a fallback.

## 12. Smart Writing behavior

Smart Writing should transform a user's instructions into a draft, not invent missing information.

Example input:
> Write a polite email to my manager asking for leave because I have an urgent personal matter. I need leave from Monday to Wednesday. Keep it short and professional.

Expected behavior:
- Create a subject line and email body.
- Keep the tone polite and professional.
- Preserve the dates and reason as supplied.
- Do not invent a manager's name, company, or extra details.
- Use a neutral placeholder or ask for missing essential information when needed.
- Show the draft for review; never send it.

For the prototype, a local template-based generator can handle a few clear scenarios. Clearly identify it as a prototype fallback rather than pretending it is a fully capable AI model.

## 13. Dependencies, cost, and fallback plan

Document every external dependency and why it is used.

| Capability | Prototype option | Risk / limitation | Fallback |
|---|---|---|---|
| Dashboard | React + Vite | Build/runtime errors | Keep a minimal working dashboard |
| Browser integration | Chrome Manifest V3 | Site and permission limitations | Copy-to-clipboard |
| Speech-to-text | Browser SpeechRecognition where supported | Browser support, network/service dependency, recognition errors | Typed/pasted text demo and clear error state |
| Text cleanup | Local JavaScript rules | Not equivalent to advanced grammar AI | Conservative cleanup and user editing |
| Smart Writing | Local templates first; optional AI provider later | AI cost, availability, latency, privacy | Local templates and manual editing |
| Local launch | Docker Compose | Docker may not be installed by every reviewer | Also document a direct local run command |

Never make an API key mandatory for the project to start. If an optional AI integration is implemented, document provider, pricing assumptions, data handling, configuration, and failure behavior. Keep secrets out of Git.

## 14. Docker and browser-extension launch plan

The browser extension itself is not normally launched as a Docker service. Therefore:

1. Docker Compose should start the React dashboard/main screen at a documented local address.
2. The extension should have a separate build command that produces a loadable build folder.
3. README should explain how to open `chrome://extensions`, enable Developer mode, and choose “Load unpacked” for the built extension folder.
4. Provide one clear test route/page where a reviewer can verify text insertion.
5. If the extension requires the dashboard to be open, explain that relationship and handle the dashboard being closed gracefully.

Do not claim that Docker launches the extension automatically unless a real, tested mechanism has been built.

## 15. Privacy and security requirements

- Do not store raw audio by default.
- Do not transmit audio or text to an external service without clearly explaining that behavior.
- Do not log sensitive dictated content in production code.
- Do not commit `.env`, API keys, tokens, or credentials.
- Include `.env.example` with placeholder names only.
- Validate messages between content scripts and extension background code.
- Limit host permissions to the pages needed for the demo where feasible.
- Do not auto-send messages, emails, or form submissions.
- Explain browser speech-recognition and optional AI-provider data handling in `docs/PRIVACY.md`.

## 16. Testing plan

Test each feature separately and then test the full flow.

### Text cleanup test cases
- `hello how are you` → sensible capitalization and punctuation.
- `please send me the notes tomorrow` → readable sentence without changing meaning.
- `My meeting is at 10:30 AM` → preserve time.
- `Email me at name@example.com` → preserve email address.
- `I use WhatsApp and Gmail` → preserve product names.
- A Hinglish/code-mixed sample → do not corrupt unfamiliar words.

### Smart Writing test cases
- Short leave request.
- Polite follow-up message.
- Meeting request.
- Customer reply.
- Missing date or recipient: do not invent it.

### Browser integration tests
- Normal `<textarea>`.
- Normal text `<input>`.
- `contenteditable` field.
- At least one real target site if available.
- No active field.
- Unsupported/protected page.
- Copy fallback.

### Reliability tests
- Microphone permission denied.
- Speech recognition unavailable.
- No speech detected.
- User stops listening.
- Extension reload.
- Dashboard closed.
- AI provider missing/unavailable (if implemented).

Record what was actually tested. Do not mark a test as passed because it is planned.

## 17. Hackathon deliverables

### A. Public GitHub repository
Must include:
- Working source code.
- `docker-compose.yml`.
- Clear README with prerequisites, startup steps, extension loading steps, features, limitations, and troubleshooting.
- No secrets.
- Enough original implementation to demonstrate a real prototype; do not inflate line count with generated filler or duplicated code.

### B. Demo video
Maximum length: 3 minutes. Suggested sequence:
1. 0:00–0:20 — Introduce the typing problem and EzWrite.
2. 0:20–1:10 — Show Voice Typing end to end on a supported text field.
3. 1:10–1:55 — Show Smart Writing, edit the draft, and insert/copy it.
4. 1:55–2:25 — Show fallback behavior or settings.
5. 2:25–3:00 — Explain what works today and what is planned for the OS-level finale.

Use a real recording of the working prototype. Do not show mockups as if they are functional.

### C. Pitch deck PDF
Cover:
- Problem and solution.
- Target users and potential scale.
- What the prototype currently does.
- Dependencies: speech tools, AI services/models, browser APIs, and cost/availability risks.
- Fallback plan if a dependency is unavailable or expensive.
- Launch plan: start with a small pilot of students, professionals, and small-business users; gather feedback; improve reliability and language coverage; then expand to desktop integration.
- Clearly separate measured results from targets or future ambitions.

### D. Optional live link
Only include a live link if it is deployed and tested. Do not sacrifice a working local build for an untested deployment.

## 18. Suggested build order

Work in this order. Finish and test each stage before moving forward.

1. **Project skeleton:** Create repository, package setup, dashboard, extension manifest, Docker Compose, and README.
2. **Launch reliability:** Confirm the dashboard starts from a fresh clone with the documented command.
3. **Dashboard UI:** Build the main screen and the two modes.
4. **Core text logic:** Implement and test conservative cleanup and local Smart Writing templates.
5. **Extension integration:** Load the extension and detect supported editable fields.
6. **Insertion:** Implement insert and copy fallback.
7. **Speech:** Add browser speech recognition and test it in the target environment.
8. **End-to-end flow:** Speak → preview/clean → edit → insert.
9. **Polish:** Add settings, error states, accessibility, and visual refinement.
10. **Submission:** Fresh-clone test, public GitHub check, video, PDF deck, final submission review.

If time becomes tight, protect the working end-to-end flow and launch reliability. Cut optional polish before cutting core functionality.

## 19. Definition of done

The prototype is ready when a person who has not seen the code can:
1. Follow the README on a fresh clone.
2. Start the dashboard using Docker Compose.
3. Load the extension using the documented steps.
4. Complete at least one Voice Typing flow on a supported field, with a clear fallback if speech recognition is unavailable.
5. Generate and edit a Smart Writing draft without needing an API key.
6. Insert or copy the result without it being sent automatically.
7. Understand which features are prototype capabilities and which belong to the future OS-level product.

---

# 20. Master prompt for any AI coding assistant

Copy the prompt below and provide this entire project reference file as context.

> You are the senior software engineer and practical hackathon mentor for **EzWrite**, a voice-first writing assistant. Treat the attached `PROJECT_REFERENCE.md` as the authoritative source of truth. Read it fully before making recommendations or changing code.
>
> ## Your mission
> Help build a reliable, demonstrable **Round 2 browser prototype**, not the complete future product. The prototype should demonstrate Voice Typing, conservative text cleanup, Smart Writing with an editable draft, and safe insertion/copying on supported browser text fields. The long-term vision is a Windows OS-level assistant, but do not claim those future capabilities are already implemented.
>
> ## How you must work
> 1. Work in small, ordered steps. Do not dump the entire application or many unrelated tasks at once.
> 2. Before coding, inspect the existing repository and report what is already present. Do not overwrite working code blindly.
> 3. State the current step, its goal, the files to create/change, and how we will verify it.
> 4. Make the smallest complete change that advances the working prototype.
> 5. Use JavaScript/React and the architecture in the reference unless there is a strong technical reason to adjust it. Explain any proposed architecture change before applying it.
> 6. Prefer understandable, maintainable code over unnecessary abstraction or complexity. Do not add dependencies without explaining why they are needed.
> 7. Provide complete file contents or precise patches, with exact file paths. Never give partial snippets that leave out required imports, setup, or wiring.
> 8. After each step, give exact Windows PowerShell commands to run and the expected result.
> 9. Help diagnose actual errors from their full terminal output. Do not guess that a command succeeded.
> 10. Do not move to the next major step until the current one has been tested or the remaining limitation is clearly recorded.
>
> ## Non-negotiable requirements
> - `docker compose up --build` must start the dashboard/main screen.
> - Document the separate Chrome extension build and “Load unpacked” steps.
> - The app must start without API keys or paid services.
> - Smart Writing must have a usable local fallback.
> - Speech recognition must have a clear unsupported/permission-denied fallback.
> - Direct insertion must have a copy fallback.
> - Never auto-send or auto-submit generated text.
> - Never hardcode secrets or ask the user to paste private API keys into chat.
> - Keep external-service dependencies and data handling transparent.
> - Do not claim universal website support, offline speech recognition, perfect accuracy, or OS-wide shortcuts unless implemented and tested.
> - Keep the project modular so the shared writing logic can later be reused in a Windows desktop application.
>
> ## Quality expectations
> - Use clear component names, sensible folder structure, reusable functions where justified, and readable comments for non-obvious logic.
> - Handle loading, empty, success, permission, and error states.
> - Validate extension messages and avoid unnecessary browser permissions.
> - Test text cleanup with names, dates, numbers, URLs, and code-mixed language.
> - Keep README, setup instructions, architecture notes, and test results synchronized with the actual implementation.
> - Do not fake test results, demo behavior, performance metrics, or completed features.
>
> ## Collaboration style
> Explain technical concepts in simple English. Assume the user is learning while building. Be direct and encouraging, but point out technical risks early. Ask only one essential clarification at a time. When a choice is reversible, choose a sensible default and explain it instead of stopping the work.
>
> ## First task
> Start by checking the current project files and the available development environment. Then guide the user through **Step 1: creating the repository/project skeleton**. Before creating files, show the proposed structure and explain how Docker Compose, the React dashboard, and the Chrome extension fit together. Do not jump ahead to implementing every feature.

---

## 21. Working agreement and status log

Keep this section updated as the project progresses.

| Area | Status | Notes |
|---|---|---|
| Product name and goal | Defined | EzWrite — Speak Naturally. Type Instantly. |
| Prototype platform | Planned | Chrome extension + React dashboard on Windows 11 |
| Future platform | Planned | Windows OS-level desktop application |
| Repository created | Not started | |
| Dashboard starts with Docker | Not started | |
| Extension loads in Chrome | Not started | |
| Text cleanup tested | Not started | |
| Smart Writing fallback tested | Not started | |
| Voice Typing tested | Not started | |
| Insert/copy tested | Not started | |
| README and privacy notes | Not started | |
| Demo video | Not started | |
| Pitch deck PDF | Not started | |
| Fresh-clone test | Not started | |
| Final submission | Not started | Deadline: 30 November 2026, 11:59 pm |

**Update rule:** Change a status to “Done” only after the feature has actually been run and verified. Add known bugs and limitations rather than hiding them.
