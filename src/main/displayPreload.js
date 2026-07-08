const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('displayAPI', {
  onVerse: (cb) => {
    if (typeof cb !== 'function') return;
    ipcRenderer.on('display:verse', (_event, data) => {
      try { cb(data); } catch (_) {}
    });
  }
});
