import { useEffect, useState } from 'react'
import { DownloadManager } from './DownloadManager'
import { PlayButton } from './PlayButton'
import { useLauncherStore } from '../../store/useLauncherStore'

export const MainDashboard = () => {
  const { isDownloading, selectedVersion, username, setUsername } = useLauncherStore()
  const [status, setStatus] = useState('Готов к запуску')
  useEffect(() => window.api.onLaunchStatus((event) => setStatus(event.message)), [])

  const onLaunch = async () => {
    setStatus('Подготовка запуска…')
    const result = await window.api.launchGame({ version: selectedVersion, username })
    if (!result.success) setStatus(result.error ?? 'Не удалось запустить игру.')
  }

  return <div className="flex-1 p-8 flex flex-col gap-6">
    <div className="flex gap-6 h-64">
      <div className="w-1/4 bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
        <h3 className="text-white font-bold mb-4">НОВОСТИ</h3>
        <p className="text-gray-400 text-sm">Добро пожаловать в KwasikLauncher!</p>
        <p className="text-gray-500 text-xs mt-4">Выберите версию в разделе «Версии», затем нажмите «Играть».</p>
      </div>
      <div className="flex-1 bg-[#1a1a1a] rounded-xl p-8 border border-gray-800 flex flex-col justify-center items-center">
        <h1 className="text-4xl font-black text-white">KWASIKLAUNCHER</h1>
        <p className="text-[#00d4ff] mt-2">Minecraft {selectedVersion}</p>
        <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Ник игрока" className="mt-5 w-64 rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm" />
      </div>
    </div>
    <PlayButton onClick={onLaunch} disabled={isDownloading} />
    <p className="text-sm text-gray-400 -mt-4 truncate">{status}</p>
    <DownloadManager />
  </div>
}
