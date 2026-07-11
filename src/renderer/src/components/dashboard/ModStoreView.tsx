import { useLauncherStore } from '../../store/useLauncherStore';

const MOCK_MODS = [
  { id: 'sodium', name: 'Sodium', desc: 'Performance optimization' },
  { id: 'iris', name: 'Iris Shaders', desc: 'Shader support' },
  { id: 'lithium', name: 'Lithium', desc: 'Game logic optimization' },
];

export const ModStoreView = () => {
  const { installedMods } = useLauncherStore();
  return (
    <div className="flex-1 p-8 text-white">
      <h2 className="text-3xl font-bold mb-8 text-purple-400">Mod Store</h2>
      <div className="grid grid-cols-3 gap-6">
        {MOCK_MODS.map(mod => (
          <div key={mod.id} className="bg-gray-900 p-6 rounded-2xl border border-purple-900/30">
            <h3 className="font-bold text-xl">{mod.name}</h3>
            <p className="text-gray-400 mb-4">{mod.desc}</p>
            <button 
              className={`px-4 py-2 rounded-lg ${installedMods.includes(mod.id) ? 'bg-gray-700' : 'bg-purple-600 hover:bg-purple-500'}`}
              disabled={installedMods.includes(mod.id)}
            >
              {installedMods.includes(mod.id) ? 'Installed' : 'Install'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
