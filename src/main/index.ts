import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import fs from 'fs/promises'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { AppSettings, store } from './config'
import { setupLauncherHandlers } from './launcher'
import { autoUpdater } from 'electron-updater'
import { writeLog } from './services/logger'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('get-settings', () => store.store as AppSettings)

  ipcMain.handle('set-settings', (_, settings: Partial<AppSettings>) => {
    for (const [key, value] of Object.entries(settings)) {
      store.set(key, value)
    }
    return store.store as AppSettings
  })

  ipcMain.handle('pick-background-image', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Выберите фоновое изображение',
      filters: [{ name: 'Изображения', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] }],
      properties: ['openFile'],
    })
    if (result.canceled || !result.filePaths[0]) return null

    const destDir = path.join(app.getPath('userData'), 'customization')
    await fs.mkdir(destDir, { recursive: true })
    const ext = path.extname(result.filePaths[0]) || '.png'
    const dest = path.join(destDir, `background${ext}`)
    await fs.copyFile(result.filePaths[0], dest)
    store.set('backgroundImage', dest)
    return dest
  })

  ipcMain.handle('clear-background-image', async () => {
    const current = store.get('backgroundImage') as string
    if (current) {
      await fs.unlink(current).catch(() => undefined)
    }
    store.set('backgroundImage', '')
    return store.store as AppSettings
  })

  setupLauncherHandlers()

  autoUpdater.autoDownload = false
  autoUpdater.on('error', (error) => { void writeLog('WARN', 'Updater unavailable', String(error)) })
  // A publish URL is configured by the release pipeline. Without one this is
  // safely logged and does not block the launcher.
  void autoUpdater.checkForUpdates().catch((error) => writeLog('WARN', 'Update check skipped', String(error)))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
