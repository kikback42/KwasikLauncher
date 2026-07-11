import { User, Newspaper, Library, Server, Settings } from 'lucide-react';

const navItems = [
  { name: 'Profile', icon: User },
  { name: 'News', icon: Newspaper },
  { name: 'Library', icon: Library },
  { name: 'Servers', icon: Server },
  { name: 'Settings', icon: Settings },
];

export const Sidebar = () => (
  <nav className="w-20 bg-gray-900/80 backdrop-blur-md border-r border-cyan-900/50 flex flex-col items-center py-8 gap-8">
    {navItems.map((item) => (
      <button key={item.name} className="p-3 text-gray-400 hover:text-cyan-400 hover:bg-cyan-900/20 rounded-xl transition-all group">
        <item.icon size={24} />
      </button>
    ))}
  </nav>
);
