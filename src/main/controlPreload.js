const { contextBridge, ipcRenderer } = require('electron');
const SpeechSDK = require('microsoft-cognitiveservices-speech-sdk');
const path = require('path');
let referenceParser = null;
try {
  referenceParser = require(path.join(__dirname, '..', 'referenceParser'));
} catch (e) {
  referenceParser = null;
}

contextBridge.exposeInMainWorld('electronAPI', {
  getSpeechConfig: () => ipcRenderer.invoke('speech:get-config'),
  showDisplay: () => {
    try {
      ipcRenderer.send('app:show-display');
    } catch (_) {}
    return Promise.resolve();
  },
  fetchVerse: (reference) => ipcRenderer.invoke('verse:fetch-and-show', reference),
  parseReference: (text) => {
    try {
      if (referenceParser && typeof referenceParser.parseReference === 'function') {
        return referenceParser.parseReference(text);
      }
    } catch (_e) {}
    return null;
  }
  ,
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (s) => ipcRenderer.invoke('settings:set', s),
  getDisplays: () => ipcRenderer.invoke('display:list'),
  moveDisplayTo: (id) => ipcRenderer.invoke('display:move-fullscreen', id)
  ,
  showVerse: (verse) => {
    try { ipcRenderer.send('display:show-verse', verse); } catch (_) {}
    return Promise.resolve();
  }
});

// Recognition is performed in the preload (renderer-isolated) context where
// the native Speech SDK is required. We expose a small, safe API to the
// renderer so it can start/stop recognition and receive transcript/errors.
let recognizer = null;
let transcriptCb = null;
let errorCb = null;

async function startRecognition() {
  if (recognizer) return;
  const config = await ipcRenderer.invoke('speech:get-config');
  if (!config || !config.key || !config.region) {
    if (errorCb) errorCb('Missing speech key or region');
    return;
  }

  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(config.key, config.region);
  speechConfig.speechRecognitionLanguage = 'en-US';

  const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
  recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

  recognizer.recognizing = (_s, evt) => {
    const text = evt.result && evt.result.text;
    if (text && transcriptCb) transcriptCb(text, false);
  };

  recognizer.recognized = (_s, evt) => {
    const text = evt.result && evt.result.text;
    if (text && transcriptCb) transcriptCb(text, true);
  };

  recognizer.canceled = (_s, evt) => {
    const msg = evt && (evt.errorDetails || evt.reason) ? (evt.errorDetails || evt.reason) : 'Speech recognition canceled';
    if (errorCb) errorCb(msg);
  };

  recognizer.sessionStopped = () => {
    if (errorCb) errorCb('Speech session stopped');
  };

  try {
    recognizer.startContinuousRecognitionAsync(() => {}, (err) => {
      if (errorCb) errorCb(err && err.message ? err.message : String(err));
    });
  } catch (e) {
    if (errorCb) errorCb(e && e.message ? e.message : String(e));
  }
}

function stopRecognition() {
  if (!recognizer) return;
  try {
    recognizer.stopContinuousRecognitionAsync(() => {
      try { recognizer.close(); } catch (_) {}
      recognizer = null;
    }, () => {
      try { recognizer.close(); } catch (_) {}
      recognizer = null;
    });
  } catch (e) {
    try { recognizer.close(); } catch (_) {}
    recognizer = null;
  }
}

contextBridge.exposeInMainWorld('azureSpeech', {
  start: () => startRecognition(),
  stop: () => stopRecognition(),
  onTranscript: (cb) => { transcriptCb = cb; },
  onError: (cb) => { errorCb = cb; }
});