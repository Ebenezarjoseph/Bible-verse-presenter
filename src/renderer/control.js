import { startStreaming, stopStreaming } from '../speechStream.js';

const startListeningButton = document.getElementById('startListening');
const showDisplayButton = document.getElementById('showDisplay');
const transcriptLog = document.getElementById('transcriptLog');
const speechStatus = document.getElementById('speechStatus');

let listening = false;

function appendTranscript(text, isFinal) {
  const message = document.createElement('div');
  message.textContent = `${isFinal ? 'Final' : 'Interim'}: ${text}`;
  transcriptLog.appendChild(message);
  transcriptLog.scrollTop = transcriptLog.scrollHeight;
  console.log(`${isFinal ? '[final]' : '[interim]'} ${text}`);
}

function showError(message) {
  const messageLine = document.createElement('div');
  messageLine.textContent = `Error: ${message}`;
  transcriptLog.appendChild(messageLine);
  transcriptLog.scrollTop = transcriptLog.scrollHeight;
  speechStatus.textContent = message;
  console.log(`[speech-error] ${message}`);
}

function setListeningState(nextListening) {
  listening = nextListening;
  startListeningButton.textContent = listening ? 'Stop Listening' : 'Start Listening';
  speechStatus.textContent = listening
    ? 'Speech recognition is active. Say a verse reference.'
    : 'Speech recognition is idle.';
}

startListeningButton.addEventListener('click', async () => {
  if (listening) {
    stopStreaming();
    setListeningState(false);
    return;
  }

  try {
    await startStreaming((text, isFinal) => {
      appendTranscript(text, isFinal);
    }, (reason) => {
      showError(reason);
    });
    setListeningState(true);
  } catch (error) {
    showError(error instanceof Error ? error.message : String(error));
    setListeningState(false);
  }
});

showDisplayButton.addEventListener('click', async () => {
  if (window.electronAPI && typeof window.electronAPI.showDisplay === 'function') {
    await window.electronAPI.showDisplay();
  }
});

setListeningState(false);