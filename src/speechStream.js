// This module uses a small, safe bridge exposed by the preload script:
// `window.azureSpeech.start()`, `window.azureSpeech.stop()`,
// `window.azureSpeech.onTranscript(cb)`, and `window.azureSpeech.onError(cb)`.
// Recognition is executed in the preload context so the native SDK functions
// remain callable. The renderer registers callbacks and controls start/stop.

let active = false;

function ensureBridge() {
  if (!window.azureSpeech) {
    throw new Error('azureSpeech bridge is not available in the renderer.');
  }
}

async function startStreaming(onTranscript, onError) {
  ensureBridge();

  if (active) {
    // already active; replace callbacks
    window.azureSpeech.onTranscript(onTranscript);
    window.azureSpeech.onError(onError);
    return;
  }

  window.azureSpeech.onTranscript(onTranscript);
  window.azureSpeech.onError(onError);
  window.azureSpeech.start();
  active = true;
}

function stopStreaming() {
  if (!active) return;
  if (window.azureSpeech) {
    window.azureSpeech.stop();
  }
  active = false;
}

export { startStreaming, stopStreaming };