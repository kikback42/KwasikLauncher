import { Library, Package, Settings, Store as StoreIcon, User } from 'lucide-react'
import { useLauncherStore, View } from '../../store/useLauncherStore'

const navItems: { name: string; view: View; icon: typeof User }[] = [
  { name: 'Профиль', view: 'home', icon: User },
  { name: 'Версии', view: 'instances', icon: Library },
  { name: 'Мои моды', view: 'mods', icon: Package },
  { name: 'Каталог модов', view: 'store', icon: StoreIcon },
  { name: 'Настройки', view: 'settings', icon: Settings },
]

export const Sidebar = () => {
  const { activeView, setActiveView } = useLauncherStore()
  return (
    <nav className="w-64 bg-[#141414] border-r border-gray-800 flex flex-col p-5 gap-2">
      <div className="text-white text-xl font-bold mb-6 px-2">KwasikLauncher</div>
      {navItems.map((item) => {
        const Icon = item.icon
        return <button key={item.name} onClick={() => setActiveView(item.view)} className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${activeView === item.view ? 'bg-[#1a1a1a] text-[#00d4ff] border-l-4 border-[#00d4ff]' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'}`}>
          <Icon size={20} /><span className="font-semibold text-sm">{item.name.toUpperCase()}</span>
        </button>
      })}
    </nav>
  )
}
