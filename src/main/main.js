const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();

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
    show: false
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