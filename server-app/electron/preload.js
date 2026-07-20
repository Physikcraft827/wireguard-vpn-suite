const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  executeCommand: (command) => ipcRenderer.invoke('wg:execute-command', command),
  saveFile: (data) => ipcRenderer.invoke('wg:save-file', data),
  startTunnel: (data) => ipcRenderer.invoke('wg:start-tunnel', data),
  stopTunnel: (data) => ipcRenderer.invoke('wg:stop-tunnel', data),
});
