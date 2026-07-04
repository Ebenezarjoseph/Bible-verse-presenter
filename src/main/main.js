const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();

let controlWindow;
let displayWindow;

function createWindow(options) {
  const window = new BrowserWindow({
    width: options.width,
    height: options.height,
    show: options.show !== false,
    frame: options.frame,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  window.loadFile(options.file);
  return window;
}

function createWindows() {
  controlWindow = createWindow({
    width: 1000,
    height: 700,
    file: path.join(__dirname, '..', 'renderer', 'control.html'),
    frame: true
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