import { useLauncherStore } from '../../store/useLauncherStore';

export const DownloadManager = () => {
  const { isDownloading, downloadProgress } = useLauncherStore();

  if (!isDownloading || !downloadProgress) return null;

  return (
    <div className="bg-gray-950/80 p-6 rounded-2xl border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
      <h3 className="text-white font-bold mb-2">Downloading Version...</h3>
      <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
        <div 
          className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${downloadProgress.percentage}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-sm text-gray-400">
        <span>{downloadProgress.percentage}%</span>
        <span>{downloadProgress.speed} | ETA: {downloadProgress.eta}</span>
      </div>
    </div>
  );
};
