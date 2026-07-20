const { app, BrowserWindow, ipcMain, Tray, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Disable hardware acceleration to prevent GPU process crash in VM/RDP environments
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');

let mainWindow;
let tray = null;
let isConnected = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 440,
    height: 720,
    resizable: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#070a12',
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

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  createTray();
}

function createTray() {
  if (tray) return;

  const iconPath = path.join(__dirname, 'icon.png');
  tray = new Tray(fs.existsSync(iconPath) ? iconPath : path.join(__dirname, '../public/shield.svg'));

  const contextMenu = Menu.buildFromTemplate([
    { label: 'WireGuard Client VPN', enabled: false },
    { type: 'separator' },
    { label: isConnected ? 'Status: Connected' : 'Status: Disconnected', enabled: false },
    {
      label: isConnected ? 'Disconnect' : 'Connect',
      click: () => {
        if (mainWindow) mainWindow.webContents.send('tray-toggle-connect');
      },
    },
    { type: 'separator' },
    { label: 'Open App Window', click: () => mainWindow.show() },
    { label: 'Quit WireGuard', click: () => { app.isQuitting = true; app.quit(); } },
  ]);

  tray.setToolTip('WireGuard VPN Client');
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(createWindow);

ipcMain.handle('vpn:open-file-dialog', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'WireGuard Config', extensions: ['conf'] }],
  });
  if (!canceled && filePaths.length > 0) {
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    return { fileName: path.basename(filePaths[0]), content };
  }
  return null;
});

ipcMain.handle('vpn:set-autostart', (event, enable) => {
  app.setLoginItemSettings({ openAtLogin: enable, path: app.getPath('exe') });
  return { success: true, autostart: enable };
});

ipcMain.handle('vpn:toggle-connection', async (event, { connect, configContent }) => {
  isConnected = connect;
  createTray();
  return { success: true, connected: connect };
});
