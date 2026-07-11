import { useEffect } from 'react';
import { useLauncherStore } from '../../store/useLauncherStore';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

export const InstancesView = () => {
  const { versions, isLoadingVersions, loadVersions, startDownload, downloadedVersions } = useLauncherStore();

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  return (
    <div className="flex-1 p-8 text-white">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-cyan-400">Instances</h2>
        <button onClick={loadVersions} className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700">
          <RefreshCw size={16} /> Update List
        </button>
      </div>
      
      {isLoadingVersions ? (
        <div className="text-center text-gray-500">Loading versions...</div>
      ) : (
        <div className="grid gap-4">
          {versions.map(v => (
            <div key={v.id} className="bg-gray-900 p-4 rounded-xl border border-cyan-900/30 flex justify-between items-center">
              <div>
                <h3 className="font-bold">{v.id}</h3>
                <p className="text-xs text-gray-400">Source: {v.source.toUpperCase()} | Type: {v.type}</p>
                {v.recommendedJava && v.recommendedJava > 17 && (
                  <span className="flex items-center gap-1 text-xs text-amber-500 mt-1">
                    <AlertTriangle size={12} /> Requires Java {v.recommendedJava}
                  </span>
                )}
              </div>
              {downloadedVersions.includes(v.id) ? (
                <span className="flex items-center gap-2 text-green-500"><CheckCircle size={16} /> Installed</span>
              ) : (
                <button onClick={() => startDownload(v.id)} className="bg-cyan-600 px-4 py-2 rounded-lg">Download</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
