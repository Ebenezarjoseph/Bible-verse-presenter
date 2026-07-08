const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();
const { fetchVerse } = require(path.join(__dirname, '..', 'bibleApi'));
const settingsStore = require(path.join(__dirname, 'settingsStore'));
const { screen } = require('electron');

let controlWindow;
let displayWindow;

function createWindow(options) {
  const webPreferences = {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false
  };

  if (options.preload) {
    webPreferences.preload = options.preload;
  }

  const window = new BrowserWindow({
    width: options.width,
    height: options.height,
    show: options.show !== false,
    frame: options.frame,
    webPreferences
  });

  window.loadFile(options.file);
  return window;
}

function createWindows() {
  controlWindow = createWindow({
    width: 1000,
    height: 700,
    file: path.join(__dirname, '..', 'renderer', 'control.html'),
    frame: true,
    preload: path.join(__dirname, 'controlPreload.js')
  });

  displayWindow = createWindow({
    width: 1280,
    height: 720,
    file: path.join(__dirname, '..', 'renderer', 'display.html'),
    frame: false,
    show: false,
    preload: path.join(__dirname, 'displayPreload.js')
  });

  controlWindow.on('closed', () => {
    controlWindow = null;
  });

  displayWindow.on('closed', () => {
    displayWindow = null;
  });
}

ipcMain.handle('app:show-display', () => {
  if (displayWindow) {
    displayWindow.show();
    displayWindow.focus();
  }
});

ipcMain.on('app:show-display', () => {
  if (displayWindow) {
    try { displayWindow.show(); displayWindow.focus(); } catch (_) {}
  }
});

ipcMain.on('display:show-verse', (_event, verse) => {
  if (displayWindow) {
    try { displayWindow.webContents.send('display:verse', verse); } catch (_) {}
  }
});

ipcMain.handle('settings:get', () => {
  try {
    return settingsStore.readSettings();
  } catch (_) {
    return { translation: 'kjv', displayId: null };
  }
});

ipcMain.handle('settings:set', (_event, settings) => {
  try {
    return settingsStore.writeSettings(settings);
  } catch (_) {
    return settings || { translation: 'kjv', displayId: null };
  }
});

ipcMain.handle('display:list', () => {
  try {
    return screen.getAllDisplays().map(d => ({ id: d.id, bounds: d.bounds, name: d.id.toString() }));
  } catch (_) {
    return [];
  }
});

ipcMain.handle('display:move-fullscreen', (_event, displayId) => {
  try {
    const disp = screen.getAllDisplays().find(d => d.id === displayId);
    if (!disp || !displayWindow) return false;
    // move displayWindow to target bounds
    const bounds = disp.bounds;
    displayWindow.setBounds(bounds);
    displayWindow.show();
    displayWindow.setFullScreen(true);
    displayWindow.focus();
    return true;
  } catch (e) {
    return false;
  }
});

ipcMain.handle('speech:get-config', (event) => {
  if (!controlWindow || event.sender !== controlWindow.webContents) {
    return null;
  }

  const key = process.env.AZURE_SPEECH_KEY || '';
  const region = process.env.AZURE_SPEECH_REGION || '';

  if (!key || !region) {
    return null;
  }

  return { key, region };
});

app.whenReady().then(() => {
  createWindows();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindows();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('verse:fetch-and-show', async (event, reference) => {
  if (!displayWindow) {
    throw new Error('Display window is not available');
  }

  try {
    const verse = await fetchVerse(reference);
    try {
      displayWindow.webContents.send('display:verse', verse);
    } catch (_e) {
      // swallow send errors
    }

    return verse;
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }
});
