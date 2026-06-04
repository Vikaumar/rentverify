const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

// Resolve path to physical JSON database file inside application userData
const dataPath = path.join(app.getPath('userData'), 'database.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 840,
    minWidth: 380,
    minHeight: 600,
    maxWidth: 600,
    useContentSize: true,
    resizable: true,
    title: 'RentVerify - Standalone Guardian Application',
    icon: path.join(__dirname, 'public/crazy_app_icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Set sandbox to false to allow preload to load correctly
    },
  });

  // Remove the default system menu bar for a clean, app-like appearance
  mainWindow.setMenuBarVisibility(false);

  // Check if running in development mode
  const isDev = !app.isPackaged;

  if (isDev) {
    // Load local development server
    mainWindow.loadURL('http://localhost:5173');
    // Open Chrome DevTools for debug
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Load production static build files
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── Register IPC Database Handlers ────────────────────────────────
ipcMain.handle('load-data', async () => {
  try {
    if (fs.existsSync(dataPath)) {
      const data = await fs.promises.readFile(dataPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[Electron main] Failed to read database.json:', err);
  }
  return null;
});

ipcMain.handle('save-data', async (event, payload) => {
  try {
    // Format JSON with 2-spaces indent for readability on disk
    await fs.promises.writeFile(dataPath, JSON.stringify(payload, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[Electron main] Failed to write database.json:', err);
    return false;
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
