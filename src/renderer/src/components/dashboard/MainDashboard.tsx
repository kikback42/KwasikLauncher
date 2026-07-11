import { PlayButton } from './PlayButton';
import { VersionSelector } from './VersionSelector';
import { DownloadManager } from './DownloadManager';
import { useLauncherStore } from '../../store/useLauncherStore';

export const MainDashboard = ({ onLaunch }: { onLaunch: () => void }) => {
  const { isDownloading } = useLauncherStore();

  return (
    <div className="flex-1 flex gap-6 p-6">
      <div className="w-1/3 flex flex-col gap-6">
        <div className="bg-gray-950/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white">Launcher</h2>
          <div className="h-48 bg-gray-800 rounded-xl"></div>
          <p className="text-gray-400">Version: 1.21.5</p>
        </div>
        <VersionSelector />
      </div>
      
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex-1 bg-gradient-to-br from-purple-900/40 to-cyan-900/40 border border-cyan-500/30 rounded-2xl p-8 flex flex-col justify-end gap-6 relative overflow-hidden">
          <h1 className="text-6xl font-black text-white relative z-10">KwasikLauncher</h1>
          <PlayButton onClick={onLaunch} disabled={isDownloading} />
        </div>
        <DownloadManager />
      </div>
    </div>
  );
};
