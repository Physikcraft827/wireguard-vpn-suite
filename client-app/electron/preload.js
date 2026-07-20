const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clientAPI', {
  openFileDialog: () => ipcRenderer.invoke('vpn:open-file-dialog'),
  setAutostart: (enable) => ipcRenderer.invoke('vpn:set-autostart', enable),
  toggleConnection: (data) => ipcRenderer.invoke('vpn:toggle-connection', data),
  onTrayToggle: (callback) => ipcRenderer.on('tray-toggle-connect', callback),
});
