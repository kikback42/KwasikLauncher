import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: (settings: Record<string, unknown>) => ipcRenderer.invoke('set-settings', settings),
  getVersions: () => ipcRenderer.invoke('get-versions'),
  getInstalledVersions: () => ipcRenderer.invoke('get-installed-versions'),
  downloadVersion: (versionId: string) => ipcRenderer.invoke('download-version', versionId),
  getLoaderVersions: (data: { type: string; gameVersion: string }) => ipcRenderer.invoke('get-loader-versions', data),
  runDiagnostics: () => ipcRenderer.invoke('run-diagnostics'),
  getMinecraftPath: () => ipcRenderer.invoke('get-minecraft-path'),
  verifyGameFiles: () => ipcRenderer.invoke('verify-game-files'),
  launchGame: (data: { version: string; username: string; loader?: { type: string; version: string } }) =>
    ipcRenderer.invoke('launch-game', data),
  getRecommendedMods: (version: string) => ipcRenderer.invoke('get-recommended-mods', version),
  searchMods: (query: string, version: string) => ipcRenderer.invoke('search-mods', { query, version }),
  installMod: (mod: { projectId: string; version: string; title: string }) => ipcRenderer.invoke('install-mod', mod),
  pickBackgroundImage: () => ipcRenderer.invoke('pick-background-image'),
  clearBackgroundImage: () => ipcRenderer.invoke('clear-background-image'),
  importSettingsCfg: () => ipcRenderer.invoke('import-settings-cfg'),
  exportSettingsCfg: () => ipcRenderer.invoke('export-settings-cfg'),
  onLaunchStatus: (callback: (status: unknown) => void) => {
    const listener = (_: Electron.IpcRendererEvent, status: unknown) => callback(status)
    ipcRenderer.on('launcher-status', listener)
    return () => ipcRenderer.removeListener('launcher-status', listener)
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
