/// <reference types="vite/client" />
/// <reference types="react" />

interface AppSettings {
  theme: 'dark-neon' | 'cyberpunk' | 'minimal' | 'custom'
  accentColor: string
  secondaryColor: string
  ram: number
  language: string
  backgroundImage: string
  backgroundBlur: number
  backgroundOpacity: number
  customTitle: string
}

interface Window {
  api: {
    getSettings: () => Promise<AppSettings>
    setSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>
    getVersions: () => Promise<Array<{ id: string; type: 'release' | 'snapshot'; releaseTime: string; recommendedJava?: number }>>
    getInstalledVersions: () => Promise<string[]>
    downloadVersion: (versionId: string) => Promise<{ success: boolean; message?: string; error?: string }>
    getLoaderVersions: (data: { type: string; gameVersion: string }) => Promise<string[]>
    runDiagnostics: () => Promise<{ checkedAt: string; ready: boolean; checks: Array<{ id: string; title: string; state: 'ok' | 'warning' | 'error'; message: string; solution?: string }> }>
    getMinecraftPath: () => Promise<string>
    verifyGameFiles: () => Promise<{ success: boolean; message: string }>
    launchGame: (data: { version: string; username: string; loader?: { type: string; version: string } }) => Promise<{ success: boolean; error?: string }>
    searchMods: (query: string, version: string) => Promise<Array<{ projectId: string; version: string; title: string; description: string; downloads: number; iconUrl?: string }>>
    installMod: (mod: { projectId: string; version: string; title: string }) => Promise<{ success: boolean; message: string }>
    pickBackgroundImage: () => Promise<string | null>
    clearBackgroundImage: () => Promise<AppSettings>
    onLaunchStatus: (callback: (status: { type: 'info' | 'progress' | 'error' | 'success'; message: string; progress?: number; speed?: string; eta?: string }) => void) => () => void
  }
}
