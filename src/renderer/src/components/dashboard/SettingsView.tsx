import { useLauncherStore } from '../../store/useLauncherStore';

export const SettingsView = () => {
  const { settings, updateSetting } = useLauncherStore();
  
  return (
    <div className="flex-1 p-8 text-white">
      <h2 className="text-3xl font-bold mb-8 text-cyan-400">Настройки</h2>
      <div className="bg-gray-900 p-6 rounded-2xl border border-cyan-900/30 flex flex-col gap-6">
        <div>
          <label className="block mb-2 text-gray-400">Выделение RAM (MB)</label>
          <input 
            type="number" 
            value={settings.ram} 
            onChange={(e) => updateSetting({ ram: parseInt(e.target.value) })} 
            className="w-full bg-gray-800 p-3 rounded-lg border border-cyan-900/50" 
          />
        </div>
        <div>
          <label className="block mb-2 text-gray-400">Цвет акцента</label>
          <input 
            type="color" 
            value={settings.accentColor || '#06b6d4'} 
            onChange={(e) => updateSetting({ accentColor: e.target.value })} 
            className="w-full h-10 bg-gray-800 p-1 rounded-lg border border-cyan-900/50 cursor-pointer" 
          />
        </div>
        <div>
          <label className="block mb-2 text-gray-400">Тема</label>
          <select 
            value={settings.theme} 
            onChange={(e) => updateSetting({ theme: e.target.value })} 
            className="w-full bg-gray-800 p-3 rounded-lg border border-cyan-900/50"
          >
            <option value="dark-neon">Темная неоновая</option>
            <option value="cyberpunk">Киберпанк</option>
            <option value="minimal">Минималистичная</option>
          </select>
        </div>
      </div>
    </div>
  );
};
