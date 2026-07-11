import { User, Library, Server, Settings, Store as StoreIcon, Package } from 'lucide-react';
import { useLauncherStore, View } from '../../store/useLauncherStore';

const navItems: { name: string, view: View, icon: any }[] = [
  { name: 'Profile', view: 'home', icon: User },
  { name: 'Instances', view: 'instances', icon: Library },
  { name: 'Mods', view: 'mods', icon: Package },
  { name: 'Store', view: 'store', icon: StoreIcon },
  { name: 'Servers', view: 'instances', icon: Server },
  { name: 'Settings', view: 'settings', icon: Settings },
];

export const Sidebar = () => {
  const { activeView, setActiveView } = useLauncherStore();
  
  return (
    <nav className="w-20 bg-gray-900/80 backdrop-blur-md border-r border-cyan-900/50 flex flex-col items-center py-8 gap-8">
      {navItems.map((item) => (
        <button 
          key={item.name} 
          onClick={() => setActiveView(item.view)}
          className={`p-3 rounded-xl transition-all ${activeView === item.view ? 'text-cyan-400 bg-cyan-900/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-900/20'}`}
        >
          <item.icon size={24} />
        </button>
      ))}
    </nav>
  );
};
