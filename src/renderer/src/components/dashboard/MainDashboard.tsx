import { PlayButton } from './PlayButton';
import { DownloadManager } from './DownloadManager';
import { useLauncherStore } from '../../store/useLauncherStore';

export const MainDashboard = ({ onLaunch }: { onLaunch: () => void }) => {
  const { isDownloading } = useLauncherStore();

  return (
    <div className="flex-1 p-8 flex flex-col gap-6">
      {/* Top Cards Row */}
      <div className="flex gap-6 h-64">
        <div className="w-1/4 bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
          <h3 className="text-white font-bold mb-4">НОВОСТИ</h3>
          <p className="text-gray-400 text-sm">Добро пожаловать в KwasikLauncher!</p>
        </div>
        <div className="flex-1 bg-[#1a1a1a] rounded-xl p-8 border border-gray-800 flex flex-col justify-center items-center">
          <h1 className="text-4xl font-black text-white">KWASIKLAUNCHER</h1>
          <p className="text-[#00d4ff] mt-2">Версия: 1.21.5</p>
        </div>
      </div>
      
      {/* Play Button */}
      <PlayButton onClick={onLaunch} disabled={isDownloading} />
      
      {/* Progress Bar */}
      <DownloadManager />
    </div>
  );
};
