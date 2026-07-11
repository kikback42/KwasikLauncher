import { useLauncherStore } from '../../store/useLauncherStore';

export const VersionSelector = () => {
  const { startDownload, isDownloading, downloadedVersions } = useLauncherStore();
  const versions = ['1.21.5', '1.20.1', '1.19.4', '1.18.2'];

  return (
    <div className="bg-gray-950/50 p-6 rounded-2xl border border-cyan-900/30">
      <h3 className="text-white font-bold mb-4">Available Versions</h3>
      <div className="flex flex-col gap-2">
        {versions.map((v) => (
          <div key={v} className="flex justify-between items-center bg-gray-900 p-3 rounded-lg border border-cyan-900/20">
            <span className="text-gray-300">{v}</span>
            {downloadedVersions.includes(v) ? (
              <span className="text-cyan-500 text-sm">Installed</span>
            ) : (
              <button 
                className="px-3 py-1 bg-cyan-900 text-cyan-200 rounded text-sm hover:bg-cyan-800 disabled:opacity-50"
                disabled={isDownloading}
                onClick={() => startDownload(v)}
              >
                Download
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
