# Voice Bible Verse Presenter

A small Electron app to listen for spoken Bible references, fetch verses, and display them for projection.

## What this repo contains
- Electron app with two windows:
  - Control Window — start/stop live speech recognition, view transcripts, manual reference input, settings and history.
  - Display Window — projector-friendly, large verse rendering with auto-scaling and smooth transitions.
- Bible reference parser with book aliases and numeric parsing heuristics.
- Bible API client (`bible-api.com`) used to fetch verse text.
- Azure Speech SDK integration (renderer uses a safe preload bridge to the SDK running in preload).
- Simple settings persistence (translation and selected display) stored in the user's app data folder.

## Features implemented (so far)
- Live microphone streaming and interim/final transcripts.
- Automatic reference detection from final transcripts and fetch+display of verses.
- Manual reference input fallback (type and Go).
- Verse history (last 20) with click-to-redisplay.
- Display styling optimized for projectors (serif font, cream text, fade transitions, auto-scaling).
- Settings: translation selector and display selector; persist between launches.

## Quick start
1. Copy `.env.example` to `.env` and set `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`.
2. Install dependencies:

```bash
npm install
```

3. Run the app in development:

```bash
npm start
```

Notes:
- The Azure Speech key is required for live microphone recognition. The key is only used in the main/preload area and is not committed to git.
- The app uses `bible-api.com` which may impose rate limits.

## Tests
Unit tests for parser and API client exist and run with Node's built-in test runner:

```bash
npm test
```

## Screenshots / Progress
- Place screenshots under `docs/screenshots/` and name them like `stepX-description.png`.
- Current in-repo progress will be recorded in `PROGRESS.md` (update with new screenshots as you create them).

If you want, provide screenshots (e.g., a capture of the Display window showing a verse and the Control Window settings) and I'll add them to `docs/screenshots/` and update `PROGRESS.md` and commit.

## How to contribute / next steps
- Improve parser heuristics and add unit tests for new edge-cases.
- Add integration tests that mock the Speech SDK and the bible API.
- Polish display transitions and add configurable font sizing presets.

## Contact
Tell me which screenshots you'd like added and I'll update the repo accordingly.
# Voice Bible Verse presenter

Small Electron app to listen for spoken Bible references, fetch verses, and display them on a presentation screen.

Status (current)
- Electron control + display windows.
- Live speech recognition (Azure Cognitive Services Speech SDK) running from the Control window.
- Reference parser that recognizes spoken references (book + chapter + verse), including fuzzy aliases.
- `bible-api.com` client to fetch verse text (with timeout and error handling).
- Full pipeline: speech -> parse -> fetch -> send to Display window.
- Manual fallback: typed reference input + Go button.
- Verse history (last 20) with click-to-redisplay.
- Display window styled for projector use with auto-scaling and smooth transitions.
- Settings panel: translation selector, display selector, move+fullscreen to a monitor, persisted settings.

How to run (dev)
1. Install deps:
   - `npm install`
2. Create a `.env` file from `.env.example` and set:
   - `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` (for live speech)
3. Start Electron:
   - `npm start`

Notes
- The app uses `microsoft-cognitiveservices-speech-sdk` and requires a valid Azure Speech subscription key for live microphone streaming.
- Settings are persisted in a JSON file under the Electron `userData` path.

Important files
- `src/main/main.js` — app entry, window creation, IPC handlers.
- `src/main/controlPreload.js` — preload for Control window (exposes safe APIs).
- `src/renderer/control.html`, `src/renderer/control.js` — Control UI and logic.
- `src/renderer/display.html`, `src/renderer/display.js` — Display UI, styling, autoscale and transitions.
- `src/referenceParser.js` — spoken reference parser and book aliases.
- `src/bibleApi.js` — Bible API client.
- `src/main/settingsStore.js` — simple JSON-backed settings persistence.

Screenshots / Progress
- Screenshots are expected under `docs/screenshots/` (e.g. `step5-end-to-end.png`, `step6-display-styled.png`, `step7-settings.png`).
- If you want me to add screenshots to the repo and commit them, either:
  - attach images here and I will add/commit them, or
  - save them to `docs/screenshots/` and tell me to commit.

Next suggestions
- Verify end-to-end with a sample microphone input and a few reference phrases (e.g. "John 3:16", "Genesis 1:1").
- If you want automated tests for the parser and API pipeline, I can add them next.

If you'd like, tell me which screenshots to add and I will commit them and update `PROGRESS.md`.
