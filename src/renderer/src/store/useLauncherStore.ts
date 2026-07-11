import { create } from 'zustand';

export type View = 'home' | 'instances' | 'mods' | 'store' | 'settings';

interface DownloadProgress {
  percentage: number;
  speed: string;
  eta: string;
}

interface LauncherState {
  activeView: View;
  setActiveView: (view: View) => void;
  
  downloadedVersions: string[];
  isDownloading: boolean;
  downloadProgress: DownloadProgress | null;
  
  startDownload: (version: string) => void;
  finishDownload: (version: string) => void;
}

export const useLauncherStore = create<LauncherState>((set) => ({
  activeView: 'home',
  setActiveView: (activeView) => set({ activeView }),
  
  downloadedVersions: ['1.21.5'],
  isDownloading: false,
  downloadProgress: null,

  startDownload: (version) => {
    set({ isDownloading: true, downloadProgress: { percentage: 0, speed: '0 MB/s', eta: '--' } });
    
    // Simulate download
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
    }, 500);
  },

  finishDownload: (version) => set((state) => ({
    isDownloading: false,
    downloadProgress: null,
    downloadedVersions: [...state.downloadedVersions, version],
  })),
}));
