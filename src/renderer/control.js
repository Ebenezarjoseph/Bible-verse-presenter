import { startStreaming, stopStreaming } from '../speechStream.js';

const startListeningButton = document.getElementById('startListening');
const showDisplayButton = document.getElementById('showDisplay');
const transcriptLog = document.getElementById('transcriptLog');
const speechStatus = document.getElementById('speechStatus');
const manualRef = document.getElementById('manualRef');
const goRef = document.getElementById('goRef');
const verseHistoryEl = document.getElementById('verseHistory');
const translationSelect = document.getElementById('translationSelect');
const displaySelect = document.getElementById('displaySelect');
const moveFullscreen = document.getElementById('moveFullscreen');

let listening = false;

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

function appendTranscript(text, isFinal) {
  const message = document.createElement('div');
  message.style.padding = '6px 0';
  message.style.borderBottom = '1px solid rgba(255,255,255,0.02)';
  message.innerHTML = `<div style="font-size:12px;color:#93c5fd">${isFinal ? 'Final' : 'Interim'}</div><div style="font-weight:600">${escapeHtml(text)}</div>`;
  // prepend so most recent is at top
  transcriptLog.insertBefore(message, transcriptLog.firstChild);
  console.log(`${isFinal ? '[final]' : '[interim]'} ${text}`);
}

function showError(message, timeoutMs = 3000) {
  const messageLine = document.createElement('div');
  messageLine.style.color = '#fca5a5';
  messageLine.style.padding = '6px 0';
  messageLine.textContent = `Error: ${message}`;
  transcriptLog.insertBefore(messageLine, transcriptLog.firstChild);
  speechStatus.textContent = message;
  console.log(`[speech-error] ${message}`);
  if (timeoutMs > 0) {
    setTimeout(() => {
      if (speechStatus.textContent === message) speechStatus.textContent = '';
    }, timeoutMs);
  }
}

// in-memory history of verse objects (most recent first)
const verseHistory = [];

function addToHistory(verse) {
  if (!verse || !verse.reference) return;
  // remove duplicates
  const idx = verseHistory.findIndex(v => v.reference === verse.reference && v.text === verse.text);
  if (idx !== -1) verseHistory.splice(idx, 1);
  verseHistory.unshift(verse);
  if (verseHistory.length > 20) verseHistory.pop();
  renderHistory();
}

function renderHistory() {
  verseHistoryEl.innerHTML = '';
  for (const v of verseHistory) {
    const item = document.createElement('div');
    item.style.padding = '8px';
    item.style.borderBottom = '1px solid rgba(255,255,255,0.03)';
    item.style.cursor = 'pointer';
    item.innerHTML = `<div style="font-weight:700">${escapeHtml(v.reference)}</div><div style="font-size:12px;color:#cbd5e1;">${escapeHtml(v.text).slice(0,120)}${v.text.length>120?'...':''}</div>`;
    item.addEventListener('click', () => {
      if (window.electronAPI && typeof window.electronAPI.showVerse === 'function') {
        window.electronAPI.showVerse(v);
        if (window.electronAPI && typeof window.electronAPI.showDisplay === 'function') {
          void window.electronAPI.showDisplay();
        }
      }
    });
    verseHistoryEl.appendChild(item);
  }
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
    await startStreaming(async (text, isFinal) => {
      appendTranscript(text, isFinal);
      if (isFinal) {
        try {
          if (window.electronAPI && typeof window.electronAPI.parseReference === 'function') {
            const ref = await window.electronAPI.parseReference(text);
            if (ref) {
              if (window.electronAPI && typeof window.electronAPI.fetchVerse === 'function') {
                try {
                    const settings = currentSettings || { translation: 'kjv' };
                    const verse = await window.electronAPI.fetchVerse(Object.assign({}, ref, { translation: settings.translation }));
                  if (verse && verse.reference) {
                    addToHistory(verse);
                    if (window.electronAPI && typeof window.electronAPI.showDisplay === 'function') {
                      void window.electronAPI.showDisplay();
                    }
                  }
                } catch (err) {
                  showError('Verse not found, try again');
                }
              }
            }
          }
        } catch (e) {
          console.warn('parseReference error', e);
        }
      }
    }, (reason) => {
      showError(reason, 2000);
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

goRef.addEventListener('click', async () => {
  const text = manualRef.value && manualRef.value.trim();
  if (!text) return;
  try {
    const ref = window.electronAPI && typeof window.electronAPI.parseReference === 'function'
      ? window.electronAPI.parseReference(text)
      : null;

    if (!ref) {
      showError('Could not parse reference');
      return;
    }

    try {
      const settings = currentSettings || { translation: 'kjv' };
      const verse = await window.electronAPI.fetchVerse(Object.assign({}, ref, { translation: settings.translation }));
      if (verse) {
        addToHistory(verse);
        if (window.electronAPI && typeof window.electronAPI.showDisplay === 'function') {
          void window.electronAPI.showDisplay();
        }
      }
    } catch (err) {
      showError('Verse not found, try again');
    }
  } catch (e) {
    console.warn('manual parse error', e);
  }
});

setListeningState(false);

// Settings and Displays
const SUPPORTED_TRANSLATIONS = ['kjv','web','asv','esv','nasb','niv'];
let currentSettings = null;

function populateTranslations() {
  translationSelect.innerHTML = '';
  for (const t of SUPPORTED_TRANSLATIONS) {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t.toUpperCase();
    translationSelect.appendChild(opt);
  }
}

async function populateDisplays() {
  displaySelect.innerHTML = '';
  if (!window.electronAPI || typeof window.electronAPI.getDisplays !== 'function') return;
  try {
    const displays = await window.electronAPI.getDisplays();
    for (const d of displays) {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = `Display ${d.id}`;
      displaySelect.appendChild(opt);
    }
    if (currentSettings && currentSettings.displayId) {
      displaySelect.value = currentSettings.displayId;
    }
  } catch (e) {
    console.warn('could not list displays', e);
  }
}

async function loadSettings() {
  populateTranslations();
  if (window.electronAPI && typeof window.electronAPI.getSettings === 'function') {
    try {
      currentSettings = await window.electronAPI.getSettings();
    } catch (_) {
      currentSettings = { translation: 'kjv', displayId: null };
    }
  } else {
    currentSettings = { translation: 'kjv', displayId: null };
  }

  if (currentSettings && currentSettings.translation) {
    translationSelect.value = currentSettings.translation;
  }

  await populateDisplays();
}

translationSelect.addEventListener('change', async () => {
  const v = translationSelect.value;
  currentSettings = Object.assign({}, currentSettings || {}, { translation: v });
  if (window.electronAPI && typeof window.electronAPI.setSettings === 'function') {
    await window.electronAPI.setSettings(currentSettings);
  }
});

moveFullscreen.addEventListener('click', async () => {
  const id = Number(displaySelect.value);
  if (!id) return;
  if (window.electronAPI && typeof window.electronAPI.moveDisplayTo === 'function') {
    const ok = await window.electronAPI.moveDisplayTo(id);
    if (ok) {
      currentSettings = Object.assign({}, currentSettings || {}, { displayId: id });
      if (window.electronAPI && typeof window.electronAPI.setSettings === 'function') {
        await window.electronAPI.setSettings(currentSettings);
      }
    } else {
      showError('Could not move display');
    }
  }
});

// initial load
void loadSettings();