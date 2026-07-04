let recognizer = null;
let streamingActive = false;
let restartTimer = null;
let cachedConfig = null;
let startedToken = 0;

function getSpeechSDK() {
  if (!window.azureSpeechSDK) {
    throw new Error('Azure Speech SDK is not available in the renderer.');
  }

  return window.azureSpeechSDK;
}

async function loadSpeechConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  if (!window.electronAPI || typeof window.electronAPI.getSpeechConfig !== 'function') {
    throw new Error('Speech configuration bridge is unavailable.');
  }

  const config = await window.electronAPI.getSpeechConfig();

  if (!config || !config.key || !config.region) {
    throw new Error('Azure Speech key or region is missing.');
  }

  cachedConfig = config;
  return config;
}

function clearRestartTimer() {
  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }
}

function disposeRecognizer() {
  if (recognizer) {
    try {
      recognizer.stopContinuousRecognitionAsync(() => {
        recognizer.close();
      }, () => {
        recognizer.close();
      });
    } catch (_error) {
      recognizer.close();
    }
    recognizer = null;
  }
}

async function createRecognizer() {
  const SpeechSDK = getSpeechSDK();
  const { key, region } = await loadSpeechConfig();
  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
  speechConfig.speechRecognitionLanguage = 'en-US';

  const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
  const instance = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

  return instance;
}

async function startRecognition(onTranscript, onError, token) {
  try {
    recognizer = await createRecognizer();

    recognizer.recognizing = (_sender, event) => {
      const text = event.result && event.result.text;
      if (text) {
        onTranscript(text, false);
      }
    };

    recognizer.recognized = (_sender, event) => {
      const text = event.result && event.result.text;
      if (text) {
        onTranscript(text, true);
      }
    };

    recognizer.canceled = (_sender, event) => {
      onError(event.errorDetails || event.reason || 'Speech recognition canceled');
      if (streamingActive && token === startedToken) {
        scheduleRestart(onTranscript, onError, token);
      }
    };

    recognizer.sessionStopped = (_sender, event) => {
      onError(event && event.reason ? event.reason : 'Speech session stopped');
      if (streamingActive && token === startedToken) {
        scheduleRestart(onTranscript, onError, token);
      }
    };

    recognizer.startContinuousRecognitionAsync(
      () => {
        if (streamingActive && token === startedToken) {
          onTranscript('Speech recognition started.', true);
        }
      },
      (error) => {
        onError(error instanceof Error ? error.message : String(error));
        if (streamingActive && token === startedToken && cachedConfig) {
          scheduleRestart(onTranscript, onError, token);
        }
      }
    );
  } catch (error) {
    onError(error instanceof Error ? error.message : String(error));
    if (streamingActive && token === startedToken && cachedConfig) {
      scheduleRestart(onTranscript, onError, token);
    }
  }
}

function scheduleRestart(onTranscript, onError, token) {
  clearRestartTimer();
  disposeRecognizer();
  restartTimer = setTimeout(() => {
    if (streamingActive && token === startedToken) {
      void startRecognition(onTranscript, onError, token);
    }
  }, 1000);
}

async function startStreaming(onTranscript, onError) {
  stopStreaming();
  streamingActive = true;
  startedToken += 1;
  const token = startedToken;

  await startRecognition(onTranscript, onError, token);
}

function stopStreaming() {
  streamingActive = false;
  startedToken += 1;
  clearRestartTimer();
  disposeRecognizer();
}

module.exports = {
  startStreaming,
  stopStreaming
};