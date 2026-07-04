const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vbv', {
  showDisplay: () => ipcRenderer.invoke('app:show-display')
});