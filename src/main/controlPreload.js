const { contextBridge, ipcRenderer } = require('electron');
const SpeechSDK = require('microsoft-cognitiveservices-speech-sdk');

contextBridge.exposeInMainWorld('electronAPI', {
  getSpeechConfig: () => ipcRenderer.invoke('speech:get-config'),
  showDisplay: () => ipcRenderer.invoke('app:show-display')
});

contextBridge.exposeInMainWorld('azureSpeechSDK', {
  SpeechConfig: SpeechSDK.SpeechConfig,
  AudioConfig: SpeechSDK.AudioConfig,
  SpeechRecognizer: SpeechSDK.SpeechRecognizer
});