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

interface ModCard {
  projectId: string
  slug: string
  version: string
  title: string
  description: string
  fullDescription: string
  downloads: number
  iconUrl: string
  bannerUrl: string
  gallery: string[]
  author: string
  categories: string[]
  recommended: boolean
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
    getRecommendedMods: (version: string) => Promise<ModCard[]>
    searchMods: (query: string, version: string) => Promise<ModCard[]>
    installMod: (mod: { projectId: string; version: string; title: string }) => Promise<{ success: boolean; message: string }>
    pickBackgroundImage: () => Promise<string | null>
    clearBackgroundImage: () => Promise<AppSettings>
    importSettingsCfg: () => Promise<{ success: boolean; message: string; settings?: AppSettings }>
    exportSettingsCfg: () => Promise<{ success: boolean; message: string }>
    onLaunchStatus: (callback: (status: { type: 'info' | 'progress' | 'error' | 'success'; message: string; progress?: number; speed?: string; eta?: string }) => void) => () => void
  }
}
