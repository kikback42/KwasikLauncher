import { create } from 'zustand';
import { fetchVersions, Version } from '../services/versionService';

export type View = 'home' | 'instances' | 'mods' | 'store' | 'settings';

interface DownloadProgress {
  percentage: number;
  speed: string;
  eta: string;
}

interface AppSettings {
  ram: number;
  theme: string;
  accentColor: string;
  language: string;
}

interface LauncherState {
  activeView: View;
  setActiveView: (view: View) => void;
  
  versions: Version[];
  isLoadingVersions: boolean;
  loadVersions: () => Promise<void>;
  
  downloadedVersions: string[];
  installedMods: string[];
  selectedVersion: string;
  username: string;
  setSelectedVersion: (version: string) => void;
  setUsername: (username: string) => void;
  addInstalledMod: (mod: string) => void;
  isDownloading: boolean;
  downloadProgress: DownloadProgress | null;
  
  settings: AppSettings;
  updateSetting: (newSettings: Partial<AppSettings>) => void;

  startDownload: (version: string) => void;
  finishDownload: (version: string) => void;
}

export const useLauncherStore = create<LauncherState>((set) => ({
  activeView: 'home',
  setActiveView: (activeView) => set({ activeView }),
  
  versions: [],
  isLoadingVersions: false,
  loadVersions: async () => {
    set({ isLoadingVersions: true });
    const versions = await fetchVersions();
    set({ versions, isLoadingVersions: false });
  },
  
  downloadedVersions: [],
  installedMods: [],
  selectedVersion: '1.21.5',
  username: 'Player',
  setSelectedVersion: (selectedVersion) => set({ selectedVersion }),
  setUsername: (username) => set({ username }),
  addInstalledMod: (mod) => set((state) => ({ installedMods: [...state.installedMods, mod] })),
  isDownloading: false,
  downloadProgress: null,
  
  settings: {
    ram: 4096,
    theme: 'dark-neon',
    accentColor: '#06b6d4',
    language: 'ru',
  },
  updateSetting: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),

  startDownload: (version) => {
    set({ isDownloading: true, downloadProgress: { percentage: 0, speed: '0 MB/s', eta: '--' } });
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progress >= 100) {
        clearInterval(interval);
        set((state) => ({
          isDownloading: false,
          downloadProgress: null,
          downloadedVersions: [...state.downloadedVersions, version],
        }));
      } else {
        set({
          downloadProgress: {
            percentage: progress,
            speed: '12.5 MB/s',
            eta: `${Math.round((100 - progress) / 5)}s`,
          },
        });
      }
    }, 300);
  },

  finishDownload: (version) => set((state) => ({
    isDownloading: false,
    downloadProgress: null,
    downloadedVersions: [...state.downloadedVersions, version],
  })),
}));
