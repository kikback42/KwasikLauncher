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
  isDownloading: boolean;
  downloadProgress: DownloadProgress | null;
  
  settings: AppSettings;
  updateSetting: (key: keyof AppSettings, value: any) => void;

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
  
  downloadedVersions: ['1.21.5'],
  installedMods: [],
  isDownloading: false,
  downloadProgress: null,
  
  settings: {
    ram: 4096,
    theme: 'dark-neon',
    language: 'ru',
  },
  updateSetting: (key, value) => set((state) => ({ settings: { ...state.settings, [key]: value } })),

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
