const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');

// Disable hardware acceleration to prevent GPU process crash in VM/RDP environments
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');

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

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Helper to locate wireguard.exe on Windows
function getWireGuardPath() {
  if (process.platform !== 'win32') return 'wg-quick';
  const defaultPath = 'C:\\Program Files\\WireGuard\\wireguard.exe';
  if (fs.existsSync(defaultPath)) return `"${defaultPath}"`;
  return 'wireguard.exe';
}

// IPC Handlers for WireGuard Control
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

ipcMain.handle('wg:start-tunnel', async (event, { interfaceName, configContent }) => {
  try {
    const configDir = 'C:\\WireGuard';
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    const configPath = path.join(configDir, `${interfaceName}.conf`);
    fs.writeFileSync(configPath, configContent, 'utf-8');

    const wgPath = getWireGuardPath();
    const cmd = process.platform === 'win32'
      ? `${wgPath} /installtunnelservice "${configPath}"`
      : `wg-quick up ${interfaceName}`;

    return new Promise((resolve) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: stderr || error.message });
        } else {
          resolve({ success: true, output: stdout || 'Tunnel started successfully' });
        }
      });
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('wg:stop-tunnel', async (event, { interfaceName }) => {
  try {
    const wgPath = getWireGuardPath();
    const cmd = process.platform === 'win32'
      ? `${wgPath} /uninstalltunnelservice ${interfaceName}`
      : `wg-quick down ${interfaceName}`;

    return new Promise((resolve) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: stderr || error.message });
        } else {
          resolve({ success: true, output: stdout || 'Tunnel stopped successfully' });
        }
      });
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
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
