import { useEffect, useState } from 'react'
import { Search, Download } from 'lucide-react'
import { useLauncherStore } from '../../store/useLauncherStore'

type Mod = { projectId: string; version: string; title: string; description: string; downloads: number; iconUrl?: string }
export const ModStoreView = () => {
  const { selectedVersion, installedMods, addInstalledMod } = useLauncherStore()
  const [query, setQuery] = useState('sodium')
  const [mods, setMods] = useState<Mod[]>([])
  const [message, setMessage] = useState('')
  const search = async () => { setMessage('Ищем моды…'); try { setMods(await window.api.searchMods(query, selectedVersion)); setMessage('') } catch { setMessage('Не удалось получить каталог Modrinth.') } }
  useEffect(() => { search() }, [selectedVersion]) // eslint-disable-line react-hooks/exhaustive-deps
  const install = async (mod: Mod) => {
    setMessage(`Устанавливаем ${mod.title}…`)
    try {
      const result = await window.api.installMod(mod)
      setMessage(result.message)
      if (result.success) addInstalledMod(mod.projectId)
    } catch {
      setMessage('Не удалось установить мод.')
    }
  }
  return <div className="flex-1 p-8 text-white overflow-y-auto">
    <h2 className="text-3xl font-bold text-purple-400">Каталог модов</h2><p className="text-gray-400 mt-1">Modrinth · Minecraft {selectedVersion}</p>
    <div className="flex gap-2 mt-6"><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} className="flex-1 max-w-xl bg-gray-900 rounded-lg border border-gray-700 px-4" placeholder="Название мода" /><button onClick={search} className="bg-purple-600 px-4 py-3 rounded-lg"><Search size={18}/></button></div>
    {message && <p className="text-sm text-gray-400 mt-4">{message}</p>}
    <p className="text-xs text-amber-400 mt-4">Моды требуют установленный Fabric, Forge, Quilt или NeoForge. Лаунчер сохраняет файлы в .minecraft/mods.</p>
    <div className="grid grid-cols-2 gap-4 mt-5">{mods.map((mod) => <article key={mod.projectId} className="bg-gray-900 p-5 rounded-xl border border-purple-900/30"><div className="flex gap-3"><img className="w-11 h-11 rounded-lg bg-gray-800" src={mod.iconUrl} alt="" /><div><h3 className="font-bold">{mod.title}</h3><p className="text-xs text-gray-500">{mod.downloads.toLocaleString()} загрузок</p></div></div><p className="text-gray-400 text-sm h-10 overflow-hidden mt-3">{mod.description}</p><button disabled={installedMods.includes(mod.projectId)} onClick={() => install(mod)} className="mt-4 flex items-center gap-2 bg-purple-600 disabled:bg-gray-700 px-3 py-2 rounded-lg text-sm"><Download size={15}/>{installedMods.includes(mod.projectId) ? 'Установлен' : 'Установить'}</button></article>)}</div>
  </div>
}
