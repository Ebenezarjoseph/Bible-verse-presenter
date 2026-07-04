const startListeningButton = document.getElementById('startListening');
const showDisplayButton = document.getElementById('showDisplay');
const transcriptLog = document.getElementById('transcriptLog');

startListeningButton.addEventListener('click', () => {
  const message = document.createElement('div');
  message.textContent = 'Listening started. Transcript events will appear here.';
  transcriptLog.appendChild(message);
});

showDisplayButton.addEventListener('click', async () => {
  if (window.vbv && typeof window.vbv.showDisplay === 'function') {
    await window.vbv.showDisplay();
  }
});