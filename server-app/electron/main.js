const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0c0f17',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = process.env.VITE_DEV_SERVER_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startUrl);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('wg:execute-command', async (event, command) => {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: stderr || error.message });
      } else {
        resolve({ success: true, output: stdout });
      }
    });
  });
});

ipcMain.handle('wg:save-file', async (event, { filename, content }) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Save WireGuard Config',
    defaultPath: filename,
    filters: [{ name: 'WireGuard Config', extensions: ['conf'] }],
  });

  if (filePath) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, filePath };
  }
  return { success: false };
});
