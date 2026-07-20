const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  executeCommand: (command) => ipcRenderer.invoke('wg:execute-command', command),
  saveFile: (data) => ipcRenderer.invoke('wg:save-file', data),
});
