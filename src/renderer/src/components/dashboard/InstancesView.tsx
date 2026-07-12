import { useEffect } from 'react'
import { RefreshCw, CheckCircle } from 'lucide-react'
import { useLauncherStore } from '../../store/useLauncherStore'

export const InstancesView = () => {
  const { versions, isLoadingVersions, loadVersions, selectedVersion, setSelectedVersion } = useLauncherStore()
  useEffect(() => { loadVersions() }, [loadVersions])
  return <div className="flex-1 p-8 text-white overflow-y-auto">
    <div className="flex justify-between items-center mb-3"><div><h2 className="text-3xl font-bold text-cyan-400">Версии Minecraft</h2><p className="text-gray-400 mt-1">Официальный список Mojang. Файлы загрузятся при первом запуске.</p></div>
      <button onClick={loadVersions} className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700"><RefreshCw size={16} />Обновить</button></div>
    {isLoadingVersions ? <div className="text-center text-gray-500 mt-12">Загружаем версии…</div> : <div className="grid gap-3 mt-6">
      {versions.map((version) => <button key={version.id} onClick={() => setSelectedVersion(version.id)} className={`text-left p-4 rounded-xl border flex justify-between items-center ${selectedVersion === version.id ? 'border-cyan-400 bg-cyan-950/30' : 'border-gray-800 bg-gray-900 hover:border-gray-600'}`}>
        <div><h3 className="font-bold">Minecraft {version.id}</h3><p className="text-xs text-gray-400 mt-1">Release · Java {version.recommendedJava}</p></div>
        {selectedVersion === version.id && <span className="flex items-center gap-2 text-cyan-400"><CheckCircle size={16} />Выбрана</span>}
      </button>)}
    </div>}
  </div>
}
